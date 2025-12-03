import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Device } from 'react-native-ble-plx';
import { bleService } from '../services/ble/BleService';
import { RssiSmoother } from '../services/tracking/KalmanFilter';

export interface ScannedDevice {
    device: Device;
    rssi: number | null;
    lastSeen: number;
    isBonded?: boolean; // Added to track bonded status
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

                    newMap.set(device.id, {
                        device,
                        rssi: smoothedRssi,
                        lastSeen: now,
                        isBonded,
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

            // 1. Get bonded (paired) devices
            const bondedDevices = await bleService.getBondedDevices();

            // 1b. Get system connected devices (Classic) - This fixes the "Connected" status
            const systemConnected = await bleService.getSystemConnectedDevices();
            const newConnectedIds = new Set<string>();

            for (const d of systemConnected) {
                newConnectedIds.add(d.id);
            }

            // 2. Check connection status for bonded devices
            for (const d of bondedDevices) {
                // Method A: Check if it was in the "System Connected" list (Socket)
                if (newConnectedIds.has(d.id)) continue;

                // Method B: Check if the device object itself says it's connected (Property)
                if ((d as any).isConnected) {
                    console.log(`Device ${d.name} has isConnected=true property`);
                    newConnectedIds.add(d.id);
                    continue;
                }

                // Method C: Active Check (BLE fallback)
                // We skip the heavy Classic check here since we already checked the list and property
                const isConnected = await bleService.isDeviceConnected(d.id);
                if (isConnected) {
                    newConnectedIds.add(d.id);
                }
            }

            // 2b. Poll RSSI for connected devices to show distance
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

                // Ensure all bonded devices are in the map
                for (const d of bondedDevices) {
                    const polledRssi = connectedRssiMap.get(d.id);

                    if (!newMap.has(d.id)) {
                        newMap.set(d.id, {
                            device: d,
                            rssi: polledRssi ?? null, // Use polled RSSI if available
                            lastSeen: now,
                            isBonded: true,
                        });
                        changed = true;
                    } else {
                        const existing = newMap.get(d.id)!;
                        let newRssi = existing.rssi;

                        // If we have a fresh polled RSSI, use it
                        if (polledRssi !== undefined) {
                            newRssi = polledRssi;
                        }

                        if (!existing.isBonded || existing.rssi !== newRssi) {
                            newMap.set(d.id, { ...existing, isBonded: true, rssi: newRssi });
                            changed = true;
                        }

                        // If connected, update lastSeen to keep it alive
                        if (newConnectedIds.has(d.id)) {
                            newMap.set(d.id, { ...existing, lastSeen: now, isBonded: true, rssi: newRssi });
                            changed = true;
                        }
                    }
                }

                // Cleanup old devices
                for (const [id, data] of newMap.entries()) {
                    // If connected OR bonded, keep it alive
                    // (User wants to see paired devices even if not connected)
                    if (newConnectedIds.has(id) || data.isBonded) {
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
