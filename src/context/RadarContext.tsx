import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { Device } from 'react-native-ble-plx';
import Purchases, { CustomerInfo, PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import { bleService } from '../services/ble/BleService';
import { notificationService } from '../services/notifications/NotificationService';
import { RssiSmoother } from '../services/tracking/KalmanFilter';
import { getManufacturerFromMac } from '../utils/ouiLookup';

export interface ScannedDevice {
    device: Device;
    rssi: number | null;
    lastSeen: number;
    isBonded?: boolean; // Added to track bonded status
    customName?: string; // Added for identified devices (e.g. Apple)
}

export interface DeviceSettings {
    notifyOnLost: boolean;
    notifyOnFound: boolean;
}

interface RadarContextType {
    isScanning: boolean;
    devices: ScannedDevice[];
    startScan: () => void;
    stopScan: () => void;
    bluetoothState: string;
    connectedIds: Set<string>;
    trackedDevices: Map<string, DeviceSettings>;
    toggleTracking: (deviceId: string, settings?: Partial<DeviceSettings>) => void;
    updateDeviceSettings: (deviceId: string, settings: Partial<DeviceSettings>) => void;
    distanceUnit: 'meters' | 'feet' | 'auto';
    updateDistanceUnit: (unit: 'meters' | 'feet' | 'auto') => void;
    backgroundTrackingEnabled: boolean;
    toggleBackgroundTracking: (enabled: boolean) => void;
    // RevenueCat
    isPro: boolean;
    currentOffering: PurchasesOffering | null;
    purchasePackage: (pack: PurchasesPackage) => Promise<void>;
    restorePro: () => Promise<void>;
}

const RadarContext = createContext<RadarContextType>({
    isScanning: false,
    devices: [],
    startScan: () => { },
    stopScan: () => { },
    bluetoothState: 'Unknown',
    connectedIds: new Set(),
    trackedDevices: new Map(),
    toggleTracking: () => { },
    updateDeviceSettings: () => { },
    distanceUnit: 'auto',
    updateDistanceUnit: () => { },
    backgroundTrackingEnabled: true,
    toggleBackgroundTracking: () => { },
    // RevenueCat
    isPro: false,
    currentOffering: null,
    purchasePackage: async () => { },
    restorePro: async () => { },
});

export const RadarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isScanning, setIsScanning] = useState(false);
    const [devicesMap, setDevicesMap] = useState<Map<string, ScannedDevice>>(new Map());

    // Use a mutable Map ref as the source of truth to ensure background updates work
    // even if React state updates are batched or delayed.
    const devicesRef = useRef<Map<string, ScannedDevice>>(new Map());

    // Sync state for UI
    const syncState = () => {
        setDevicesMap(new Map(devicesRef.current));
    };

    const smoothers = useRef<Map<string, RssiSmoother>>(new Map()).current;

    const [bluetoothState, setBluetoothState] = useState('Unknown');
    const [connectedIds, setConnectedIds] = useState<Set<string>>(new Set());
    const [trackedDevices, setTrackedDevices] = useState<Map<string, DeviceSettings>>(new Map());
    const trackedDevicesRef = useRef(trackedDevices);

    // RevenueCat State
    const [isPro, setIsPro] = useState(false);
    const [currentOffering, setCurrentOffering] = useState<PurchasesOffering | null>(null);

    // Initialize RevenueCat
    useEffect(() => {
        const initRevenueCat = async () => {
            if (Platform.OS === 'android') {
                Purchases.configure({ apiKey: 'test_ARCJxvSrEaJThOsDVOnaBWAuWmp' });
            } else {
                Purchases.configure({ apiKey: 'test_ARCJxvSrEaJThOsDVOnaBWAuWmp' });
            }

            // Purchases.setLogLevel(LOG_LEVEL.VERBOSE);

            try {
                const customerInfo = await Purchases.getCustomerInfo();
                updateProStatus(customerInfo);

                const offerings = await Purchases.getOfferings();
                if (offerings.current !== null) {
                    setCurrentOffering(offerings.current);
                }
            } catch (e) {
                console.warn('RevenueCat Init Error:', e);
            }
        };

        initRevenueCat();

        const listener = (info: CustomerInfo) => {
            updateProStatus(info);
        };

        Purchases.addCustomerInfoUpdateListener(listener);

        return () => {
            Purchases.removeCustomerInfoUpdateListener(listener);
        };
    }, []);

    const updateProStatus = (info: CustomerInfo) => {
        const isProActive = typeof info.entitlements.active['Device Finder Pro'] !== 'undefined';
        setIsPro(isProActive);
        // If they lose Pro, ensure background tracking is disabled if it was enabled
        if (!isProActive && backgroundTrackingEnabled) {
            // We might want to disable it, but for now let's just update the state
            // toggleBackgroundTracking(false); // Optional: force disable
        }
    };

    const purchasePackage = async (pack: PurchasesPackage) => {
        try {
            const { customerInfo } = await Purchases.purchasePackage(pack);
            updateProStatus(customerInfo);
        } catch (e: any) {
            if (!e.userCancelled) {
                console.warn('Purchase Error:', e);
                throw e;
            }
        }
    };

    const restorePro = async () => {
        try {
            const customerInfo = await Purchases.restorePurchases();
            updateProStatus(customerInfo);
        } catch (e) {
            console.warn('Restore Error:', e);
            throw e;
        }
    };

    useEffect(() => {
        trackedDevicesRef.current = trackedDevices;
    }, [trackedDevices]);

    // Load tracked devices
    useEffect(() => {
        const loadTracked = async () => {
            try {
                const json = await AsyncStorage.getItem('trackedDevices');
                if (json) {
                    const raw = JSON.parse(json);
                    // Handle migration from Set (array of strings) to Map
                    if (Array.isArray(raw)) {
                        // Old format: just IDs
                        const map = new Map<string, DeviceSettings>();
                        raw.forEach((id: string) => {
                            map.set(id, { notifyOnLost: true, notifyOnFound: false });
                        });
                        setTrackedDevices(map);
                    } else {
                        // New format: object/map
                        const map = new Map<string, DeviceSettings>(Object.entries(raw));
                        setTrackedDevices(map);
                    }
                }
            } catch (e) {
                console.warn('Failed to load tracked devices', e);
            }
        };
        loadTracked();
    }, []);

    const saveTrackedDevices = async (map: Map<string, DeviceSettings>) => {
        try {
            const obj = Object.fromEntries(map);
            await AsyncStorage.setItem('trackedDevices', JSON.stringify(obj));
        } catch (e) {
            console.warn('Failed to save tracked devices', e);
        }
    };

    const toggleTracking = async (deviceId: string, settings: Partial<DeviceSettings> = { notifyOnLost: true, notifyOnFound: false }) => {
        console.log(`[Radar] Toggling tracking for ${deviceId}`, settings);
        setTrackedDevices(prev => {
            const next = new Map(prev);
            if (next.has(deviceId)) {
                next.delete(deviceId);
            } else {
                next.set(deviceId, { notifyOnLost: true, notifyOnFound: false, ...settings });
            }
            saveTrackedDevices(next);
            return next;
        });
    };

    const updateDeviceSettings = async (deviceId: string, settings: Partial<DeviceSettings>) => {
        console.log(`[Radar] Updating settings for ${deviceId}`, settings);
        setTrackedDevices(prev => {
            const next = new Map(prev);
            const current = next.get(deviceId);
            if (current) {
                next.set(deviceId, { ...current, ...settings });
                saveTrackedDevices(next);
            }
            return next;
        });
    };

    const startScan = async () => {
        if (isScanning) return;

        const state = await bleService.getBluetoothState();
        setBluetoothState(state);

        if (state !== 'PoweredOn') {
            // Try to enable it if on Android
            await bleService.enableBluetooth();
            return;
        }

        const hasPerms = await bleService.requestPermissions();
        // console.log('Permissions granted:', hasPerms);
        if (!hasPerms) {
            console.warn('Permissions denied');
            return;
        }

        // Start background service to keep app alive
        try {
            if (backgroundTrackingEnabled) {
                await bleService.startBackgroundTracking();
            }
        } catch (e) {
            console.warn('Failed to start background tracking', e);
        }

        setIsScanning(true);
        // console.log('Starting scan...');
        bleService.startScan((device) => {
            // console.log('Device found:', device.id, device.name, device.rssi); // Uncomment for verbose logging
            if (device.rssi) {
                const now = Date.now();
                const currentMap = devicesRef.current;

                let smoother = smoothers.get(device.id);
                if (!smoother) {
                    smoother = new RssiSmoother();
                    smoothers.set(device.id, smoother);
                }

                const smoothedRssi = smoother.filter(device.rssi!);

                // Check if we already know this device is bonded
                const existing = currentMap.get(device.id);
                const isBonded = existing?.isBonded || false;
                let customName = existing?.customName;

                // Apple Device Identification
                if (!device.name && !device.localName && device.manufacturerData) {
                    try {
                        if (device.manufacturerData.startsWith('TA')) {
                            customName = 'Apple Device';
                        }
                    } catch (e) {
                        // Ignore decode errors
                    }
                }

                // OUI Lookup (Android only usually)
                if (!customName && device.id.includes(':')) {
                    const manufacturer = getManufacturerFromMac(device.id);
                    if (manufacturer) {
                        if (manufacturer === 'Apple') {
                            customName = 'iPhone / iPad';
                        } else {
                            customName = `${manufacturer} Device`;
                        }
                    }
                }

                // Check Notify on Found (if it was previously lost/null)
                if (existing && existing.rssi === null) {
                    const settings = trackedDevicesRef.current.get(device.id);
                    if (settings?.notifyOnFound) {
                        console.log(`[Radar] Triggering Found Notification for ${device.id}`);
                        notificationService.sendNotification(
                            'Device Found!',
                            `${existing.device.name || existing.customName || 'Device'} is back in range.`
                        );
                    }
                }

                // Update the Ref directly
                currentMap.set(device.id, {
                    device,
                    rssi: smoothedRssi,
                    lastSeen: now,
                    isBonded,
                    customName,
                });

                // Sync to State for UI
                syncState();
            }
        });
    };

    const stopScan = () => {
        bleService.stopScan();
        setIsScanning(false);
    };

    useEffect(() => {
        const init = async () => {
            const state = await bleService.getBluetoothState();
            setBluetoothState(state);
            if (state === 'PoweredOn') {
                startScan();
            }
            // Request notification permissions
            await notificationService.requestPermissions();
        };
        init();

        const subscription = bleService.onStateChange((state) => {
            setBluetoothState(state);
            if (state === 'PoweredOn') {
                startScan();
            } else {
                stopScan();
            }
        });

        const interval = setInterval(async () => {
            const now = Date.now();

            // 1. Get connected devices (BLE)
            const newConnectedIds = new Set<string>();

            // Check connection status for all currently tracked devices
            // READ FROM REF
            const currentDevices = Array.from(devicesRef.current.values());

            for (const d of currentDevices) {
                const isConnected = await bleService.isDeviceConnected(d.device.id);
                if (isConnected) {
                    newConnectedIds.add(d.device.id);
                }
            }

            // 2. Poll RSSI for connected devices to show distance
            const connectedRssiMap = new Map<string, number>();
            for (const id of newConnectedIds) {
                const rssi = await bleService.readRSSI(id);
                if (rssi !== null) {
                    connectedRssiMap.set(id, rssi);
                }
            }

            setConnectedIds(newConnectedIds);

            // 3. Update Devices Map (REF)
            const currentMap = devicesRef.current;
            let changed = false;

            // Update RSSI for connected devices if we have it
            for (const [id, rssi] of connectedRssiMap.entries()) {
                const existing = currentMap.get(id);
                if (existing && existing.rssi !== rssi) {
                    // Update Ref
                    currentMap.set(id, { ...existing, rssi, lastSeen: now });
                    changed = true;

                    // Check Notify on Found (if it was previously lost/null)
                    if (existing.rssi === null && rssi !== null) {
                        const settings = trackedDevicesRef.current.get(id);
                        if (settings?.notifyOnFound) {
                            console.log(`[Radar] Triggering Found Notification for ${id}`);
                            notificationService.sendNotification(
                                'Device Found!',
                                `${existing.device.name || existing.customName || 'Device'} is back in range.`
                            );
                        }
                    }
                }
            }

            // Cleanup old devices
            for (const [id, data] of currentMap.entries()) {
                // If connected, keep it alive
                if (newConnectedIds.has(id)) {
                    continue;
                }

                if (now - data.lastSeen > 15000) {
                    // If it has a name or is Apple, keep it but mark as lost (rssi = null)
                    const hasName = data.device.name || data.device.localName || data.customName;
                    if (hasName) {
                        if (data.rssi !== null) {
                            // Update Ref
                            currentMap.set(id, { ...data, rssi: null });
                            changed = true;

                            // Check Notify on Lost
                            const settings = trackedDevicesRef.current.get(id);
                            if (settings?.notifyOnLost) {
                                console.log(`[Radar] Triggering Lost Notification for ${id}`);
                                notificationService.sendNotification(
                                    'Device Lost!',
                                    `${data.device.name || data.customName || 'Device'} has gone out of range.`
                                );
                            }
                        }
                    } else {
                        // Unknown devices still get deleted
                        currentMap.delete(id);
                        changed = true;
                    }
                }
            }

            if (changed) {
                syncState();
            }
        }, 2000); // Check every 2 seconds

        return () => {
            subscription.remove();
            stopScan();
            clearInterval(interval);
        };
    }, []);

    const devices = Array.from(devicesMap.values()).sort((a, b) => {
        // 1. Connected devices first
        const aConnected = connectedIds.has(a.device.id);
        const bConnected = connectedIds.has(b.device.id);
        if (aConnected && !bConnected) return -1;
        if (!aConnected && bConnected) return 1;

        // 2. Bonded devices second
        if (a.isBonded && !b.isBonded) return -1;
        if (!a.isBonded && b.isBonded) return 1;

        // 3. Then by Signal Strength (RSSI)
        const rssiA = a.rssi ?? -999;
        const rssiB = b.rssi ?? -999;
        return rssiB - rssiA;
    });

    const [distanceUnit, setDistanceUnit] = useState<'meters' | 'feet' | 'auto'>('auto');

    // Load settings
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const unit = await AsyncStorage.getItem('distanceUnit');
                if (unit) setDistanceUnit(unit as any);
            } catch (e) {
                console.warn('Failed to load settings', e);
            }
        };
        loadSettings();
    }, []);

    const updateDistanceUnit = async (unit: 'meters' | 'feet' | 'auto') => {
        setDistanceUnit(unit);
        await AsyncStorage.setItem('distanceUnit', unit);
    };

    const [backgroundTrackingEnabled, setBackgroundTrackingEnabled] = useState(true);

    useEffect(() => {
        const loadBgSettings = async () => {
            try {
                const bg = await AsyncStorage.getItem('backgroundTrackingEnabled');
                if (bg !== null) {
                    setBackgroundTrackingEnabled(JSON.parse(bg));
                }
            } catch (e) {
                console.warn('Failed to load bg settings', e);
            }
        };
        loadBgSettings();
    }, []);

    const toggleBackgroundTracking = async (enabled: boolean) => {
        setBackgroundTrackingEnabled(enabled);
        await AsyncStorage.setItem('backgroundTrackingEnabled', JSON.stringify(enabled));
        if (enabled) {
            if (isScanning) {
                try {
                    await bleService.startBackgroundTracking();
                } catch (e) {
                    console.warn('Failed to start background tracking', e);
                }
            }
        } else {
            try {
                await bleService.stopBackgroundTracking();
            } catch (e) {
                console.warn('Failed to stop background tracking', e);
            }

            // Disable notifications for all tracked devices
            setTrackedDevices(prev => {
                const next = new Map(prev);
                let changed = false;
                for (const [id, settings] of next.entries()) {
                    if (settings.notifyOnLost || settings.notifyOnFound) {
                        next.set(id, { ...settings, notifyOnLost: false, notifyOnFound: false });
                        changed = true;
                    }
                }
                if (changed) {
                    saveTrackedDevices(next);
                }
                return next;
            });
        }
    };

    return (
        <RadarContext.Provider value={{
            isScanning,
            devices,
            startScan,
            stopScan,
            bluetoothState,
            connectedIds,
            trackedDevices,
            toggleTracking,
            updateDeviceSettings,
            distanceUnit,
            updateDistanceUnit,
            backgroundTrackingEnabled,
            toggleBackgroundTracking,
            // RevenueCat
            isPro,
            currentOffering,
            purchasePackage,
            restorePro
        }}>
            {children}
        </RadarContext.Provider>
    );
};


export const useRadar = () => React.useContext(RadarContext);
