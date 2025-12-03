import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Device } from 'react-native-ble-plx';
import { bleService } from '../services/ble/BleService';
import { RssiSmoother } from '../services/tracking/KalmanFilter';

export interface ScannedDevice {
    device: Device;
    rssi: number | null;
    lastSeen: number;
    isBonded?: boolean; // Added to track bonded status
    customName?: string; // Added for identified devices (e.g. Apple)
}

interface RadarContextType {
    isScanning: boolean;
    devices: ScannedDevice[];
    startScan: () => void;
    stopScan: () => void;
    bluetoothState: string;
    connectedIds: Set<string>;
}

const RadarContext = createContext<RadarContextType>({
    isScanning: false,
    devices: [],
    startScan: () => { },
    stopScan: () => { },
    bluetoothState: 'Unknown',
    connectedIds: new Set(),
});

export const RadarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isScanning, setIsScanning] = useState(false);
    const [devicesMap, setDevicesMap] = useState<Map<string, ScannedDevice>>(new Map());
    const devicesMapRef = useRef(devicesMap); // Ref to access latest devices in interval

    // Keep ref in sync
    useEffect(() => {
        devicesMapRef.current = devicesMap;
    }, [devicesMap]);

    const smoothers = useRef<Map<string, RssiSmoother>>(new Map()).current;

    const [bluetoothState, setBluetoothState] = useState('Unknown');
    const [connectedIds, setConnectedIds] = useState<Set<string>>(new Set());

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
        console.log('Permissions granted:', hasPerms);
        if (!hasPerms) {
            console.warn('Permissions denied');
            return;
        }

        setIsScanning(true);
        console.log('Starting scan...');
        bleService.startScan((device) => {
            // console.log('Device found:', device.id, device.name, device.rssi); // Uncomment for verbose logging
            if (device.rssi) {
                const now = Date.now();
                setDevicesMap((prev) => {
                    const newMap = new Map(prev);

                    let smoother = smoothers.get(device.id);
                    if (!smoother) {
                        smoother = new RssiSmoother();
                        smoothers.set(device.id, smoother);
                    }

                    const smoothedRssi = smoother.filter(device.rssi!);

                    // Check if we already know this device is bonded
                    const existing = newMap.get(device.id);
                    const isBonded = existing?.isBonded || false;
                    let customName = existing?.customName;

                    // Apple Device Identification
                    // Apple Company ID is 0x004C. In Little Endian (BLE standard), it's 4C 00.
                    // Manufacturer Data is Base64 encoded.
                    if (!device.name && !device.localName && device.manufacturerData) {
                        try {
                            // Simple Base64 decode to check first few bytes
                            // We don't need a full library, just need to check the header.
                            // 0x4C = 'T', 0x00 = 0.
                            // Base64 for 4C 00 is "TA==" or similar depending on following bytes.
                            // Better to use a buffer approach if possible, but for now we can try to match the raw string
                            // or use a lightweight decode.
                            // Actually, let's use the Buffer polyfill if available, or just check the raw base64 if it's consistent.
                            // "TAA" is 4C 00 00. "TAB" is 4C 00 01.
                            // The most robust way without Buffer is to just check if it looks like Apple data.
                            // But let's try to be cleaner.
                            // Since we can't easily import Buffer in Expo Go without setup, let's use a simple check.
                            // Apple data usually starts with "TA" (which decodes to 4C...)
                            if (device.manufacturerData.startsWith('TA')) {
                                customName = 'Apple Device';
                            }
                        } catch (e) {
                            // Ignore decode errors
                        }
                    }

                    newMap.set(device.id, {
                        device,
                        rssi: smoothedRssi,
                        lastSeen: now,
                        isBonded,
                        customName,
                    });
                    return newMap;
                });
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
            const currentDevices = Array.from(devicesMapRef.current.values());

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

            // 3. Update Devices Map
            setDevicesMap((prev) => {
                const newMap = new Map(prev);
                let changed = false;

                // Update RSSI for connected devices if we have it
                for (const [id, rssi] of connectedRssiMap.entries()) {
                    const existing = newMap.get(id);
                    if (existing && existing.rssi !== rssi) {
                        newMap.set(id, { ...existing, rssi, lastSeen: now });
                        changed = true;
                    }
                }

                // Cleanup old devices
                for (const [id, data] of newMap.entries()) {
                    // If connected, keep it alive
                    if (newConnectedIds.has(id)) {
                        continue;
                    }

                    if (now - data.lastSeen > 15000) {
                        newMap.delete(id);
                        changed = true;
                    }
                }
                return changed ? newMap : prev;
            });
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

    return (
        <RadarContext.Provider value={{ isScanning, devices, startScan, stopScan, bluetoothState, connectedIds }}>
            {children}
        </RadarContext.Provider>
    );
};

export const useRadar = () => useContext(RadarContext);
