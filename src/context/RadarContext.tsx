import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import * as StoreReview from 'expo-store-review';
import React, { createContext, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { Device } from 'react-native-ble-plx';
import Purchases, { CustomerInfo, PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import RevenueCatUI from 'react-native-purchases-ui';
import { LocationDisclosureModal } from '../components/LocationDisclosureModal';
import { bleService } from '../services/ble/BleService';
import { notificationService } from '../services/notifications/NotificationService';
import { RssiSmoother } from '../services/tracking/KalmanFilter';
import { getManufacturerFromMac } from '../utils/ouiLookup';

export interface ScannedDevice {
    device: Device;
    rssi: number | null;
    lastSeen: number;
    isBonded?: boolean;
    customName?: string;
}

export interface DeviceSettings {
    notifyOnLost: boolean;
    notifyOnFound: boolean;
    serviceUUIDs?: string[];
    name?: string;
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
    isPro: boolean;
    currentOffering: PurchasesOffering | null;
    purchasePackage: (pack: PurchasesPackage) => Promise<void>;
    restorePro: () => Promise<void>;
    showPaywall: () => Promise<void>;
    hasSeenOnboarding: boolean;
    completeOnboarding: () => Promise<void>;
    resetOnboarding: () => Promise<void>;
    appLaunchCount: number;
    hasRated: boolean;
    rateApp: () => Promise<void>;
    resetRating: () => Promise<void>;
    triggerRating: () => Promise<void>;
    freeScanUsed: boolean;
    useFreeScan: () => Promise<void>;
    resetFreeScan: () => Promise<void>;
    resetLocationDisclosure: () => Promise<void>;
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
    isPro: false,
    currentOffering: null,
    purchasePackage: async () => { },
    restorePro: async () => { },
    showPaywall: async () => { },
    hasSeenOnboarding: true,
    completeOnboarding: async () => { },
    resetOnboarding: async () => { },
    appLaunchCount: 0,
    hasRated: false,
    rateApp: async () => { },
    resetRating: async () => { },
    triggerRating: async () => { },
    freeScanUsed: false,
    useFreeScan: async () => { },
    resetFreeScan: async () => { },
    resetLocationDisclosure: async () => { },
});

export const RadarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [showLocationDisclosure, setShowLocationDisclosure] = useState(false);
    const [pendingBackgroundToggle, setPendingBackgroundToggle] = useState<boolean | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const isScanningRef = useRef(false);
    const lastScanUpdateRef = useRef(Date.now());
    const [devicesMap, setDevicesMap] = useState<Map<string, ScannedDevice>>(new Map());
    const devicesRef = useRef<Map<string, ScannedDevice>>(new Map());
    const syncState = () => { setDevicesMap(new Map(devicesRef.current)); };
    const smoothers = useRef<Map<string, RssiSmoother>>(new Map()).current;
    const [bluetoothState, setBluetoothState] = useState('Unknown');
    const [connectedIds, setConnectedIds] = useState<Set<string>>(new Set());
    const [trackedDevices, setTrackedDevices] = useState<Map<string, DeviceSettings>>(new Map());
    const trackedDevicesRef = useRef(trackedDevices);
    const [isPro, setIsPro] = useState(false);
    const [currentOffering, setCurrentOffering] = useState<PurchasesOffering | null>(null);
    const [hasSeenOnboarding, setHasSeenOnboarding] = useState(true);
    const [isOnboardingLoaded, setIsOnboardingLoaded] = useState(false);

    useEffect(() => {
        const loadOnboarding = async () => {
            try {
                const value = await AsyncStorage.getItem('hasSeenOnboarding');
                if (value === null) setHasSeenOnboarding(false);
                else setHasSeenOnboarding(JSON.parse(value));
            } catch (e) { console.warn('Failed to load onboarding status', e); }
            finally { setIsOnboardingLoaded(true); }
        };
        loadOnboarding();
    }, []);

    const [appLaunchCount, setAppLaunchCount] = useState(0);
    const [hasRated, setHasRated] = useState(false);
    const [freeScanUsed, setFreeScanUsed] = useState(false);

    useEffect(() => {
        const loadRatingState = async () => {
            try {
                const count = await AsyncStorage.getItem('appLaunchCount');
                const rated = await AsyncStorage.getItem('hasRated');
                const scanUsed = await AsyncStorage.getItem('freeScanUsed');
                const currentCount = count ? parseInt(count) : 0;
                setAppLaunchCount(currentCount + 1);
                await AsyncStorage.setItem('appLaunchCount', (currentCount + 1).toString());
                if (rated) setHasRated(JSON.parse(rated));
                if (scanUsed) setFreeScanUsed(JSON.parse(scanUsed));
            } catch (e) { console.warn('Failed to load rating state', e); }
        };
        loadRatingState();
    }, []);

    const rateApp = async () => {
        setHasRated(true);
        await AsyncStorage.setItem('hasRated', 'true');

        try {
            if (await StoreReview.hasAction()) {
                await StoreReview.requestReview();
            } else {
                // Fallback to store links
                if (Platform.OS === 'ios') {
                    Linking.openURL('https://apps.apple.com/app/id123456789'); // Replace with actual App ID
                } else {
                    Linking.openURL('market://details?id=com.findmydevice.app'); // Replace with actual Package Name
                }
            }
        } catch (error) {
            console.warn('Error requesting review:', error);
            // Fallback if native review fails
            if (Platform.OS === 'ios') {
                Linking.openURL('https://apps.apple.com/app/id123456789');
            } else {
                Linking.openURL('market://details?id=com.findmydevice.app');
            }
        }
    };

    const resetRating = async () => {
        setAppLaunchCount(0);
        setHasRated(false);
        await AsyncStorage.setItem('appLaunchCount', '0');
        await AsyncStorage.removeItem('hasRated');
    };

    const triggerRating = async () => {
        setAppLaunchCount(3);
        setHasRated(false);
        await AsyncStorage.setItem('appLaunchCount', '3');
        await AsyncStorage.removeItem('hasRated');
    };

    const useFreeScan = async () => {
        setFreeScanUsed(true);
        await AsyncStorage.setItem('freeScanUsed', 'true');
    };

    const resetFreeScan = async () => {
        setFreeScanUsed(false);
        await AsyncStorage.removeItem('freeScanUsed');
    };

    const completeOnboarding = async () => {
        setHasSeenOnboarding(true);
        await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    };

    const resetOnboarding = async () => {
        setHasSeenOnboarding(false);
        await AsyncStorage.removeItem('hasSeenOnboarding');
    };

    // RevenueCat
    useEffect(() => {
        const initRevenueCat = async () => {
            if (Platform.OS === 'android') {
                Purchases.configure({ apiKey: 'goog_JBBkgIRgeDVKmqtotkskdDmNshx' });
            } else {
                Purchases.configure({ apiKey: 'appl_XwIGaPdrCGvfrOgXNpEjjCSwHKq' });
            }
            try {
                const customerInfo = await Purchases.getCustomerInfo();
                updateProStatus(customerInfo);
                const offerings = await Purchases.getOfferings();
                if (offerings.current !== null) setCurrentOffering(offerings.current);
            } catch (e) { console.warn('RevenueCat Init Error:', e); }
        };
        initRevenueCat();
        const listener = (info: CustomerInfo) => updateProStatus(info);
        Purchases.addCustomerInfoUpdateListener(listener);
        return () => { Purchases.removeCustomerInfoUpdateListener(listener); };
    }, []);

    const updateProStatus = (info: CustomerInfo) => {
        const isProActive = typeof info.entitlements.active['Device Finder Pro'] !== 'undefined';
        setIsPro(isProActive);
    };

    const purchasePackage = async (pack: PurchasesPackage) => {
        try {
            const { customerInfo } = await Purchases.purchasePackage(pack);
            updateProStatus(customerInfo);
        } catch (e: any) {
            if (!e.userCancelled) throw e;
        }
    };

    const restorePro = async () => {
        try {
            const customerInfo = await Purchases.restorePurchases();
            updateProStatus(customerInfo);
        } catch (e) { throw e; }
    };

    const showPaywall = async () => {
        try {
            await RevenueCatUI.presentPaywall({ displayCloseButton: true });
        } catch (e) { console.warn('Failed to present paywall:', e); }
    };

    useEffect(() => { trackedDevicesRef.current = trackedDevices; }, [trackedDevices]);

    const startMonitoring = (deviceId: string, settings: DeviceSettings) => {
        const name = settings.name || 'Unknown Device';
        bleService.connectToTrackedDevice(deviceId, async () => {
            if (AppState.currentState !== 'active') {
                if (settings.notifyOnLost) {
                    const notifiedKey = `has_notified_lost_${deviceId}`;
                    const hasNotified = await AsyncStorage.getItem(notifiedKey);
                    if (!hasNotified) {
                        notificationService.sendNotification('Device Lost!', `${name} has gone out of range.`);
                        await AsyncStorage.setItem(notifiedKey, 'true');
                    }
                }
            }
        });
    };

    useEffect(() => {
        const loadTracked = async () => {
            try {
                const json = await AsyncStorage.getItem('trackedDevices');
                if (json) {
                    const raw = JSON.parse(json);
                    let map = new Map<string, DeviceSettings>();
                    if (Array.isArray(raw)) {
                        raw.forEach((id: string) => map.set(id, { notifyOnLost: true, notifyOnFound: false, name: 'Device' }));
                    } else {
                        map = new Map<string, DeviceSettings>(Object.entries(raw));
                    }
                    setTrackedDevices(map);
                    map.forEach((settings, id) => startMonitoring(id, settings));
                }
            } catch (e) { console.warn('Failed to load tracked devices', e); }
        };
        loadTracked();
    }, []);

    const saveTrackedDevices = async (map: Map<string, DeviceSettings>) => {
        try {
            const obj = Object.fromEntries(map);
            await AsyncStorage.setItem('trackedDevices', JSON.stringify(obj));
        } catch (e) { console.warn('Failed to save tracked devices', e); }
    };

    const toggleTracking = async (deviceId: string, settings: Partial<DeviceSettings> = { notifyOnLost: true, notifyOnFound: false }) => {
        setTrackedDevices(prev => {
            const next = new Map(prev);
            if (next.has(deviceId)) {
                next.delete(deviceId);
            } else {
                const deviceData = devicesRef.current.get(deviceId);
                const name = deviceData?.customName || deviceData?.device.name || deviceData?.device.localName || 'Unknown Device';
                const serviceUUIDs = deviceData?.device.serviceUUIDs || [];
                next.set(deviceId, { notifyOnLost: true, notifyOnFound: false, serviceUUIDs, name, ...settings });
            }
            saveTrackedDevices(next);
            return next;
        });

        (async () => {
            try {
                const wasTracking = trackedDevicesRef.current.has(deviceId);
                if (wasTracking) {
                    await bleService.disconnectTrackedDevice(deviceId);
                } else {
                    const deviceData = devicesRef.current.get(deviceId);
                    let serviceUUIDs = deviceData?.device.serviceUUIDs || [];
                    const name = deviceData?.customName || deviceData?.device.name || deviceData?.device.localName || 'Unknown Device';

                    if (!serviceUUIDs || serviceUUIDs.length === 0) {
                        const discovered = await bleService.discoverServices(deviceId);
                        if (discovered.length > 0) {
                            serviceUUIDs = discovered;
                            setTrackedDevices(prev => {
                                const next = new Map(prev);
                                const current = next.get(deviceId);
                                if (current) {
                                    next.set(deviceId, { ...current, serviceUUIDs });
                                    saveTrackedDevices(next);
                                }
                                return next;
                            });
                        }
                    }
                    startMonitoring(deviceId, { notifyOnLost: true, notifyOnFound: false, serviceUUIDs, name, ...settings });
                }
            } catch (e) { console.warn(`[Radar] Background toggle error for ${deviceId}`, e); }
        })();
    };

    const updateDeviceSettings = async (deviceId: string, settings: Partial<DeviceSettings>) => {
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
        if (isScanningRef.current) return;
        const state = await bleService.getBluetoothState();
        setBluetoothState(state);
        if (state !== 'PoweredOn') { await bleService.enableBluetooth(); return; }
        const hasPerms = await bleService.requestPermissions();
        if (!hasPerms) return;

        try { if (backgroundTrackingEnabled) await bleService.startBackgroundTracking(); }
        catch (e) { console.warn('Failed to start background tracking', e); }

        setIsScanning(true);
        isScanningRef.current = true;
        lastScanUpdateRef.current = Date.now();

        bleService.startScan(
            (device) => {
                lastScanUpdateRef.current = Date.now();
                if (device.rssi) {
                    const now = Date.now();
                    const currentMap = devicesRef.current;
                    let smoother = smoothers.get(device.id);
                    if (!smoother) { smoother = new RssiSmoother(); smoothers.set(device.id, smoother); }
                    const smoothedRssi = smoother.filter(device.rssi!);
                    const existing = currentMap.get(device.id);
                    const isBonded = existing?.isBonded || false;
                    let customName = existing?.customName;

                    if (!device.name && !device.localName && device.manufacturerData) {
                        try { if (device.manufacturerData.startsWith('TA')) customName = 'Apple Device'; } catch (e) { }
                    }
                    if (!customName && device.id.includes(':')) {
                        const manufacturer = getManufacturerFromMac(device.id);
                        if (manufacturer) customName = manufacturer === 'Apple' ? 'iPhone / iPad' : `${manufacturer} Device`;
                    }

                    currentMap.set(device.id, { device, rssi: smoothedRssi, lastSeen: now, isBonded, customName });
                    syncState();
                    AsyncStorage.removeItem(`has_notified_lost_${device.id}`).catch(console.warn);
                }
            },
            (error) => {
                setIsScanning(false);
                isScanningRef.current = false;
                setTimeout(() => startScan(), 2000);
            }
        );

        // DEV ONLY: Mock Device
        if (__DEV__) {
            const mockInterval = setInterval(() => {
                if (!isScanningRef.current) {
                    clearInterval(mockInterval);
                    return;
                }
                const now = Date.now();
                const mockId = 'mock-device-01';
                const mockRssi = -Math.floor(Math.random() * 40 + 40); // -40 to -80

                const currentMap = devicesRef.current;
                currentMap.set(mockId, {
                    device: { id: mockId, name: 'Test Device Simulator', localName: 'Test Device Simulator', rssi: mockRssi } as any,
                    rssi: mockRssi,
                    lastSeen: now,
                    isBonded: false,
                    customName: 'Test Device Simulator'
                });
                syncState();
            }, 1000);
        }
    };

    const stopScan = () => {
        bleService.stopScan();
        setIsScanning(false);
        isScanningRef.current = false;
    };

    useEffect(() => {
        const init = async () => {
            await notificationService.requestPermissions();
            const state = await bleService.getBluetoothState();
            setBluetoothState(state);
            if (state === 'PoweredOn') startScan();
        };
        init();

        const subscription = AppState.addEventListener('change', nextAppState => {
            if (nextAppState === 'active') {
                startScan();
                trackedDevicesRef.current.forEach((settings, id) => startMonitoring(id, settings));
            } else if (nextAppState === 'background') {
                stopScan();
            }
        });

        const bleSubscription = bleService.onStateChange((state) => {
            setBluetoothState(state);
            if (state === 'PoweredOn') startScan(); else stopScan();
        });

        const interval = setInterval(async () => {
            const now = Date.now();
            if (isScanningRef.current) {
                if (now - lastScanUpdateRef.current > 30000) {
                    bleService.stopScan();
                    setTimeout(() => { isScanningRef.current = false; startScan(); }, 500);
                }
            }

            const newConnectedIds = new Set<string>();
            const currentDevices = Array.from(devicesRef.current.values());
            for (const d of currentDevices) {
                const isConnected = await bleService.isDeviceConnected(d.device.id);
                if (isConnected) newConnectedIds.add(d.device.id);
            }

            const connectedRssiMap = new Map<string, number>();
            for (const id of newConnectedIds) {
                const rssi = await bleService.readRSSI(id);
                if (rssi !== null) connectedRssiMap.set(id, rssi);
            }
            setConnectedIds(newConnectedIds);

            const currentMap = devicesRef.current;
            let changed = false;

            // CRITICAL FIX: Ensure connected devices stay in the list (refresh lastSeen)
            for (const id of newConnectedIds) {
                const existing = currentMap.get(id);
                if (existing) {
                    // Update lastSeen so it isn't removed by the cleanup loop
                    currentMap.set(id, { ...existing, lastSeen: now });
                    changed = true;
                    // Also clear any lost notification flag if we see it connected
                    AsyncStorage.removeItem(`has_notified_lost_${id}`).catch(console.warn);
                } else {
                    // If it's connected but NOT in the list, we should add it!
                    // This happens if we connect in background and then open app.
                    const tracked = trackedDevicesRef.current.get(id);
                    if (tracked) {
                        // We have a tracked device that is connected but missing from list.
                        // create a placeholder device
                        currentMap.set(id, {
                            device: { id, name: tracked.name, localName: tracked.name, rssi: connectedRssiMap.get(id) || -50 } as any, // Mock device object path
                            rssi: connectedRssiMap.get(id) || -50,
                            lastSeen: now,
                            isBonded: true,
                            customName: tracked.name
                        });
                        changed = true;
                    }
                }
            }
            for (const [id, rssi] of connectedRssiMap.entries()) {
                const existing = currentMap.get(id);
                if (existing && existing.rssi !== rssi) {
                    currentMap.set(id, { ...existing, rssi, lastSeen: now });
                    changed = true;
                    AsyncStorage.removeItem(`has_notified_lost_${id}`).catch(console.warn);
                }
            }

            for (const [id, data] of currentMap.entries()) {
                if (newConnectedIds.has(id)) continue;
                if (AppState.currentState === 'active' && now - data.lastSeen > 15000) {
                    const hasName = data.device.name || data.device.localName || data.customName;
                    if (hasName) {
                        if (data.rssi !== null) {
                            currentMap.set(id, { ...data, rssi: null });
                            changed = true;
                        }
                    } else {
                        currentMap.delete(id);
                        changed = true;
                    }
                }
            }
            if (changed) syncState();
        }, 2000);

        return () => {
            subscription.remove();
            stopScan();
            clearInterval(interval);
        };
    }, []);

    const devices = Array.from(devicesMap.values()).sort((a, b) => {
        const aConnected = connectedIds.has(a.device.id);
        const bConnected = connectedIds.has(b.device.id);
        if (aConnected && !bConnected) return -1;
        if (!aConnected && bConnected) return 1;
        if (a.isBonded && !b.isBonded) return -1;
        if (!a.isBonded && b.isBonded) return 1;
        const rssiA = a.rssi ?? -999;
        const rssiB = b.rssi ?? -999;
        return rssiB - rssiA;
    });

    const [distanceUnit, setDistanceUnit] = useState<'meters' | 'feet' | 'auto'>('auto');
    useEffect(() => {
        const loadSettings = async () => {
            const unit = await AsyncStorage.getItem('distanceUnit');
            if (unit) setDistanceUnit(unit as any);
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
            const bg = await AsyncStorage.getItem('backgroundTrackingEnabled');
            if (bg !== null) setBackgroundTrackingEnabled(JSON.parse(bg));
        };
        loadBgSettings();
    }, []);
    const toggleBackgroundTracking = async (enabled: boolean) => {
        setBackgroundTrackingEnabled(enabled);
        await AsyncStorage.setItem('backgroundTrackingEnabled', JSON.stringify(enabled));
        if (enabled) {
            if (isScanning) await bleService.startBackgroundTracking();
        } else {
            await bleService.stopBackgroundTracking();
            setTrackedDevices(prev => {
                const next = new Map(prev);
                let changed = false;
                for (const [id, settings] of next.entries()) {
                    if (settings.notifyOnLost || settings.notifyOnFound) {
                        next.set(id, { ...settings, notifyOnLost: false, notifyOnFound: false });
                        changed = true;
                    }
                }
                if (changed) saveTrackedDevices(next);
                return next;
            });
        }
    };

    const handleDisclosureAccept = async () => {
        setShowLocationDisclosure(false);
        // Request the actual permission
        const granted = await bleService.requestBackgroundLocationPermission();
        if (granted) {
            // Proceed with enabling logic
            setBackgroundTrackingEnabled(true);
            await AsyncStorage.setItem('backgroundTrackingEnabled', JSON.stringify(true));
            if (isScanning) await bleService.startBackgroundTracking();
        } else {
            console.log('User accepted disclosure but denied system permission');
        }
    };

    const handleDisclosureDecline = () => {
        setShowLocationDisclosure(false);
        setPendingBackgroundToggle(null); // Clear intent
    };

    const safeToggleBackgroundTracking = async (enabled: boolean) => {
        if (enabled) {
            setShowLocationDisclosure(true);
        } else {
            toggleBackgroundTracking(false);
        }
    };

    const resetLocationDisclosure = async () => {
        setShowLocationDisclosure(true);
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
            toggleBackgroundTracking: safeToggleBackgroundTracking,
            isPro,
            currentOffering,
            purchasePackage,
            restorePro,
            showPaywall,
            hasSeenOnboarding,
            completeOnboarding,
            resetOnboarding,
            appLaunchCount,
            hasRated,
            rateApp,
            resetRating,
            triggerRating,
            freeScanUsed,
            useFreeScan,
            resetFreeScan,
            resetLocationDisclosure
        }}>
            {children}
            <LocationDisclosureModal
                visible={showLocationDisclosure}
                onAccept={handleDisclosureAccept}
                onDecline={handleDisclosureDecline}
            />
        </RadarContext.Provider>
    );
};

export const useRadar = () => React.useContext(RadarContext);
