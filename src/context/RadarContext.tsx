import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Device } from 'react-native-ble-plx';
import { bleService } from '../services/ble/BleService';
import { RssiSmoother } from '../services/tracking/KalmanFilter';
import { locationService } from '../services/tracking/LocationService';

export interface ScannedDevice {
    device: Device;
    rssi: number;
    lastSeen: number;
}

interface RadarContextType {
    isScanning: boolean;
    devices: ScannedDevice[];
    startScan: () => void;
    stopScan: () => void;
    bluetoothState: string;
}

const RadarContext = createContext<RadarContextType>({
    isScanning: false,
    devices: [],
    startScan: () => { },
    stopScan: () => { },
    bluetoothState: 'Unknown',
});

export const RadarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isScanning, setIsScanning] = useState(false);
    const [devicesMap, setDevicesMap] = useState<Map<string, ScannedDevice>>(new Map());
    const smoothers = useRef<Map<string, RssiSmoother>>(new Map()).current;

    const [bluetoothState, setBluetoothState] = useState('Unknown');

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
        if (!hasPerms) {
            console.warn('Permissions denied');
            return;
        }

        setIsScanning(true);
        bleService.startScan((device) => {
            if ((device.rssi) && (device.name || device.localName)) {
                // Save location history (throttled internally)
                locationService.saveLocation(device.id);

                const now = Date.now();
                setDevicesMap((prev) => {
                    const newMap = new Map(prev);

                    let smoother = smoothers.get(device.id);
                    if (!smoother) {
                        smoother = new RssiSmoother();
                        smoothers.set(device.id, smoother);
                    }

                    const smoothedRssi = smoother.filter(device.rssi!);

                    newMap.set(device.id, {
                        device,
                        rssi: smoothedRssi,
                        lastSeen: now,
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

        const interval = setInterval(() => {
            const now = Date.now();
            setDevicesMap((prev) => {
                const newMap = new Map(prev);
                let changed = false;
                for (const [id, data] of newMap.entries()) {
                    if (now - data.lastSeen > 15000) {
                        newMap.delete(id);
                        changed = true;
                    }
                }
                return changed ? newMap : prev;
            });
        }, 1000);

        return () => {
            subscription.remove();
            stopScan();
            clearInterval(interval);
        };
    }, []);

    const devices = Array.from(devicesMap.values()).sort((a, b) => b.rssi - a.rssi);

    return (
        <RadarContext.Provider value={{ isScanning, devices, startScan, stopScan, bluetoothState }}>
            {children}
        </RadarContext.Provider>
    );
};

export const useRadar = () => useContext(RadarContext);
