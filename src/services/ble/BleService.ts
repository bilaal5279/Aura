import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking, PermissionsAndroid, Platform } from 'react-native';
import { BleManager, Device, ScanMode } from 'react-native-ble-plx';
import { DeviceSettings } from '../../context/RadarContext';
import { notificationService } from '../notifications/NotificationService';
import { backgroundTracker } from '../tracking/BackgroundTracker';

class BleService {
    manager: BleManager;
    // Map to track last seen time and RSSI for devices (Hybrid approach)
    private lastSeenDevices: Map<string, { timestamp: number; rssi: number }> = new Map();
    // Map to track last seen time by Name (for Dual-Mode devices with different MACs)
    private lastSeenNames: Map<string, number> = new Map();

    constructor() {
        this.manager = new BleManager({
            restoreStateIdentifier: 'DeviceFinderBackground',
            restoreStateFunction: (restoredState) => {
                if (restoredState == null) {
                    // BleManager was constructed for the first time.
                } else {
                    // BleManager was restored. Check `restoredState.connectedPeripherals` to get connected devices.
                    // console.log('Restored state:', restoredState);
                }
            },
        });
    }

    async requestPermissions(): Promise<boolean> {
        if (Platform.OS === 'android') {
            const granted = await PermissionsAndroid.requestMultiple([
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
                PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
                PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
            ]);
            return (
                granted['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED &&
                granted['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED &&
                granted['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED
            );
        }
        return true;
    }

    async enableBluetooth() {
        if (Platform.OS === 'android') {
            try {
                await this.manager.enable();
            } catch (e) {
                console.warn('Failed to enable Bluetooth directly, opening settings...', e);
                // Fallback to opening settings
                try {
                    // Try to open specific Bluetooth settings first
                    await Linking.sendIntent('android.settings.BLUETOOTH_SETTINGS');
                } catch (linkingError) {
                    console.warn('Failed to open Bluetooth settings via intent, trying generic settings', linkingError);
                    await Linking.openSettings();
                }
            }
        }
    }

    async startScan(onDeviceFound: (device: Device) => void) {
        const state = await this.manager.state();
        if (state === 'PoweredOn') {
            this.scan(onDeviceFound);
            return;
        }

        const subscription = this.manager.onStateChange((state) => {
            if (state === 'PoweredOn') {
                this.scan(onDeviceFound);
                subscription.remove();
            }
        }, true);
    }

    private scan(onDeviceFound: (device: Device) => void) {
        this.manager.startDeviceScan(null, { scanMode: ScanMode.LowLatency }, (error, device) => {
            if (error) {
                console.error('BLE Scan Error:', error);
                return;
            }
            if (device) {
                // Update last seen map
                if (device.id) {
                    this.lastSeenDevices.set(device.id, {
                        timestamp: Date.now(),
                        rssi: device.rssi || -100
                    });
                }
                // Update last seen by Name
                if (device.name) {
                    this.lastSeenNames.set(device.name, Date.now());
                }
                onDeviceFound(device);
            }
        });
    }

    /**
     * Starts a targeted scan for a specific device to get real-time RSSI
     * This is crucial for the "Hot/Cold" game feature
     */
    startDeviceSpecificScan(targetDeviceId: string, targetDeviceName: string | null, onUpdate: (rssi: number) => void) {
        // Stop any existing scan first to avoid conflicts
        this.manager.stopDeviceScan();

        // console.log(`Starting specific scan for ${targetDeviceId} / ${targetDeviceName}`);

        this.manager.startDeviceScan(null, { scanMode: ScanMode.LowLatency }, (error, device) => {
            if (error) {
                console.warn('Specific Scan Error:', error);
                return;
            }

            if (device) {
                const matchesId = device.id === targetDeviceId;
                const matchesName = targetDeviceName && (device.name === targetDeviceName || device.localName === targetDeviceName);

                if (matchesId || matchesName) {
                    const rssi = device.rssi || -100;

                    // Update maps
                    this.lastSeenDevices.set(targetDeviceId, { // Store under the requested ID for consistency
                        timestamp: Date.now(),
                        rssi: rssi
                    });
                    if (device.name) {
                        this.lastSeenNames.set(device.name, Date.now());
                    }

                    onUpdate(rssi);
                }
            }
        });
    }

    stopScan() {
        this.manager.stopDeviceScan();
    }

    async startBackgroundTracking() {
        console.log('Background tracking active...');
        await backgroundTracker.start(async () => {
            // This task runs in the background
            // We don't need to do anything specific here as the interval in RadarContext
            // will keep running as long as the app is alive.
        });
    }

    async stopBackgroundTracking() {
        console.log('Stopping background tracking...');
        await backgroundTracker.stop();
    }

    async performBackgroundScan() {
        console.log('[BleService] Performing background scan...');

        // 1. Get tracked devices from storage (since we are in background/headless)
        let trackedDevices = new Map<string, DeviceSettings>();
        try {
            const json = await AsyncStorage.getItem('trackedDevices');
            if (json) {
                const raw = JSON.parse(json);
                if (Array.isArray(raw)) {
                    // Old format
                } else {
                    trackedDevices = new Map<string, DeviceSettings>(Object.entries(raw));
                }
            }
        } catch (e) {
            console.warn('[BleService] Failed to load tracked devices in background', e);
            return;
        }

        if (trackedDevices.size === 0) {
            console.log('[BleService] No tracked devices, skipping scan.');
            return;
        }

        // Filter for devices that actually need notifications
        const devicesToScan = Array.from(trackedDevices.entries())
            .filter(([_, settings]) => settings.notifyOnFound || settings.notifyOnLost);

        if (devicesToScan.length === 0) {
            console.log('[BleService] No devices with notifications enabled, skipping scan.');
            return;
        }

        console.log(`[BleService] Scanning for ${devicesToScan.length} devices with notifications enabled.`);

        // 2. Start a short scan
        this.manager.startDeviceScan(
            null, // Scan for all, or use specific service UUIDs if needed for iOS: ['180F', '180A', ...]
            { scanMode: ScanMode.LowLatency, allowDuplicates: true },
            async (error, device) => {
                if (error) {
                    console.warn('[BleService] Background Scan Error:', error);
                    return;
                }

                if (device && device.id) {
                    const settings = trackedDevices.get(device.id);

                    // Only care if we are tracking this device
                    if (settings) {
                        // console.log(`[BleService] Discovered tracked device: ${device.id} (${device.name})`);

                        // Check if we should notify on found
                        if (settings.notifyOnFound) {
                            const lastNotifiedKey = `last_notified_found_${device.id}`;
                            const lastNotified = await AsyncStorage.getItem(lastNotifiedKey);
                            const now = Date.now();

                            // 5 minute cooldown to prevent spam
                            if (!lastNotified || (now - parseInt(lastNotified) > 5 * 60 * 1000)) {
                                console.log(`[BleService] Sending FOUND notification for ${device.id}`);
                                notificationService.sendNotification(
                                    'Device Found!',
                                    `${device.name || device.localName || 'Device'} is nearby.`
                                );
                                await AsyncStorage.setItem(lastNotifiedKey, now.toString());
                            } else {
                                // console.log(`[BleService] Found ${device.id} but notification is on cooldown.`);
                            }
                        }
                    }
                }
            }
        );

        // 3. Stop scan after 10 seconds
        setTimeout(() => {
            console.log('[BleService] Stopping background scan.');
            this.manager.stopDeviceScan();
        }, 10000);
    }

    onStateChange(listener: (state: string) => void) {
        return this.manager.onStateChange(listener, true);
    }

    async getBluetoothState() {
        return this.manager.state();
    }

    async isDeviceConnected(deviceId: string): Promise<boolean> {
        // Method 1: Check BLE System Connected Devices (Common Services)
        try {
            const connectedPeripherals = await this.manager.connectedDevices([
                '1800', // Generic Access
                '1801', // Generic Attribute
                '180A', // Device Information
                '180F', // Battery Service
                '1812', // HID
            ]);

            const isSystemConnected = connectedPeripherals.some(d => d.id === deviceId);
            if (isSystemConnected) {
                // console.log(`BLE System Connection Found for ${deviceId} (via connectedDevices)`);
                return true;
            }
        } catch (e) {
            console.warn('Failed to check connectedDevices', e);
        }

        // Method 2: Check "Last Seen" (Hybrid Approach)
        // If we saw it in a BLE scan recently (e.g., last 15 seconds), it's effectively "Connected" or at least "Nearby"
        const lastSeen = this.lastSeenDevices.get(deviceId);
        if (lastSeen) {
            const timeSinceLastSeen = Date.now() - lastSeen.timestamp;
            if (timeSinceLastSeen < 15000) { // 15 seconds threshold
                // console.log(`Device ${deviceId} seen ${timeSinceLastSeen}ms ago via BLE scan. Considering connected.`);
                return true;
            }
        }

        // Method 3: Direct BLE check
        try {
            return await this.manager.isDeviceConnected(deviceId);
        } catch (e) {
            return false;
        }
    }

    async readRSSI(deviceId: string): Promise<number | null> {
        try {
            const device = await this.manager.readRSSIForDevice(deviceId);
            return device.rssi;
        } catch (e) {
            // console.warn(`Failed to read RSSI for ${deviceId}`, e);
            return null;
        }
    }
}

export const bleService = new BleService();
