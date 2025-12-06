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
    private isForegroundScanActive = false;

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

    async requestBackgroundLocationPermission(): Promise<boolean> {
        if (Platform.OS === 'android') {
            try {
                // For Android 10+ (API 29+), we need to request ACCESS_BACKGROUND_LOCATION
                // This usually requires taking the user to settings on Android 11+
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
                    {
                        title: 'Background Location Permission',
                        message: 'Find My Device needs to access your location in the background to detect when you leave devices behind.',
                        buttonNeutral: 'Ask Me Later',
                        buttonNegative: 'Cancel',
                        buttonPositive: 'OK',
                    }
                );
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            } catch (err) {
                console.warn(err);
                return false;
            }
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

    async startScan(onDeviceFound: (device: Device) => void, onError?: (error: any) => void) {
        this.isForegroundScanActive = true;
        const state = await this.manager.state();
        if (state === 'PoweredOn') {
            this.scan(onDeviceFound, onError);
            return;
        }

        const subscription = this.manager.onStateChange((state) => {
            if (state === 'PoweredOn') {
                this.scan(onDeviceFound, onError);
                subscription.remove();
            }
        }, true);
    }

    private scan(onDeviceFound: (device: Device) => void, onError?: (error: any) => void) {
        console.log('[BleService] Starting main scan (allowDuplicates: true)...');
        this.manager.startDeviceScan(null, { scanMode: ScanMode.LowLatency, allowDuplicates: true }, (error, device) => {
            if (error) {
                console.error('[BleService] Scan Error:', error);
                if (onError) onError(error);
                return;
            }
            if (device) {
                // console.log(`[BleService] Scanned: ${device.id} (${device.name}) RSSI: ${device.rssi}`);
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
        this.isForegroundScanActive = false;
        this.manager.stopDeviceScan();
    }

    async startBackgroundTracking() {
        console.log('Background tracking active...');
        await backgroundTracker.start(async () => {
            // This task runs in the background
            await this.performBackgroundScan();
        });
    }

    async stopBackgroundTracking() {
        console.log('Stopping background tracking...');
        await backgroundTracker.stop();
    }

    async performBackgroundScan() {
        if (this.isForegroundScanActive) {
            console.log('[Android Background Debug] Foreground scan active. Skipping background scan to avoid conflict.');
            return;
        }

        console.log('[Android Background Debug] Starting background scan cycle...');

        // Ensure strictly no other scan is running
        try {
            await this.manager.stopDeviceScan();
        } catch (e) { }

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
            console.log('[Android Background Debug] No tracked devices found in storage. Aborting.');
            return;
        }

        // Filter for devices that actually need notifications
        const devicesToScan = Array.from(trackedDevices.entries())
            .filter(([_, settings]) => settings.notifyOnFound || settings.notifyOnLost);

        if (devicesToScan.length === 0) {
            console.log('[BleService] No devices with notifications enabled, skipping scan.');
            return;
        }

        console.log(`[Android Background Debug] Scanning for ${devicesToScan.length} devices involved in background tracking:`);
        devicesToScan.forEach(([id, settings]) => {
            console.log(`[Android Background Debug]  - Target: "${settings.name || 'Unknown'}" (ID: ${id}) | NotifyOnFound: ${settings.notifyOnFound} | NotifyOnLost: ${settings.notifyOnLost}`);
        });

        // Collect Service UUIDs for targeted scanning (Required for iOS Background)
        const serviceUUIDs = new Set<string>();
        let hasSpecificUUIDs = false;

        // Add specific UUIDs from tracked devices
        devicesToScan.forEach(([_, settings]) => {
            if (settings.serviceUUIDs && settings.serviceUUIDs.length > 0) {
                settings.serviceUUIDs.forEach(uuid => serviceUUIDs.add(uuid));
                hasSpecificUUIDs = true;
            }
        });

        // Only add common services if we DON'T have specific ones, 
        // or if we want to be safe (but user suggests it might hurt).
        // Let's try to be strict: If we have specific UUIDs, use ONLY those.
        // If we have a device with NO UUIDs, we might need the common ones for that device.

        const devicesWithoutUUIDs = devicesToScan.filter(([_, s]) => !s.serviceUUIDs || s.serviceUUIDs.length === 0);

        if (devicesWithoutUUIDs.length > 0) {
            console.log(`[BleService] ${devicesWithoutUUIDs.length} devices have no specific UUIDs. Adding common ones.`);
            serviceUUIDs.add('180F'); // Battery Service
            serviceUUIDs.add('180A'); // Device Information
            serviceUUIDs.add('1800'); // Generic Access
            serviceUUIDs.add('1801'); // Generic Attribute
            serviceUUIDs.add('1812'); // HID (Keyboards, Mice)
        }

        const scanUUIDs = Array.from(serviceUUIDs);
        console.log(`[BleService] Using Service UUIDs for filter: ${scanUUIDs.join(', ')}`);

        // 2. Start a short scan
        const foundDeviceIds = new Set<string>();

        // CRITICAL FIX: Check for System Connected devices first!
        // Devices like headphones (Audeze) stop advertising when connected.

        // 1. Direct Connection Check (If app is already connected)
        for (const [id, settings] of devicesToScan) {
            try {
                const isConnected = await this.manager.isDeviceConnected(id);
                if (isConnected) {
                    console.log(`[Android Background Debug] Device "${settings.name}" (${id}) verified as CONNECTED via isDeviceConnected().`);
                    foundDeviceIds.add(id);

                    // Check if we should notify on found
                    if (settings.notifyOnFound) {
                        const lastNotifiedKey = `last_notified_found_${id}`;
                        const lastNotified = await AsyncStorage.getItem(lastNotifiedKey);
                        const now = Date.now();

                        // 5 minute cooldown to prevent spam
                        if (!lastNotified || (now - parseInt(lastNotified) > 5 * 60 * 1000)) {
                            console.log(`[BleService] Sending FOUND notification for "${settings.name || 'Device'}" (${id})`);
                            notificationService.sendNotification(
                                'Device Found!',
                                `${settings.name || 'Device'} is nearby.`
                            );
                            await AsyncStorage.setItem(lastNotifiedKey, now.toString());
                        }
                    }
                    // RESET Lost Notification Flag since it's found
                    await AsyncStorage.removeItem(`has_notified_lost_${id}`);
                }
            } catch (e) {
                // Ignore errors
            }
        }

        try {
            const commonUUIDs = ['180F', '180A', '1800', '1801', '1812'];
            const checkUUIDs = [...scanUUIDs, ...commonUUIDs];

            const connectedSystemDevices = await this.manager.connectedDevices(checkUUIDs);
            connectedSystemDevices.forEach(async (device) => {
                if (trackedDevices.has(device.id)) {
                    console.log(`[Android Background Debug] Device "${device.name}" (${device.id}) found via SYSTEM CONNECTION.`);
                    foundDeviceIds.add(device.id);

                    // Check if we should notify on found
                    const settings = trackedDevices.get(device.id);
                    if (settings && settings.notifyOnFound) {
                        const lastNotifiedKey = `last_notified_found_${device.id}`;
                        const lastNotified = await AsyncStorage.getItem(lastNotifiedKey);
                        const now = Date.now();

                        // 5 minute cooldown to prevent spam
                        if (!lastNotified || (now - parseInt(lastNotified) > 5 * 60 * 1000)) {
                            console.log(`[BleService] Sending FOUND notification for "${settings.name || device.name || 'Device'}" (${device.id})`);
                            notificationService.sendNotification(
                                'Device Found!',
                                `${settings.name || device.name || device.localName || 'Device'} is nearby.`
                            );
                            await AsyncStorage.setItem(lastNotifiedKey, now.toString());
                        }
                    }
                    // RESET Lost Notification Flag since it's found
                    await AsyncStorage.removeItem(`has_notified_lost_${device.id}`);
                }
            });
        } catch (e) {
            console.warn('[BleService] Failed to check connected devices:', e);
        }

        this.manager.startDeviceScan(
            Platform.OS === 'ios' ? scanUUIDs : null, // Target specific services on iOS
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
                        console.log(`[Android Background Debug] Discovered tracked device: ${device.name} (${device.id}) via RSSI: ${device.rssi}`);
                        foundDeviceIds.add(device.id);

                        // Check if we should notify on found
                        if (settings.notifyOnFound) {
                            const lastNotifiedKey = `last_notified_found_${device.id}`;
                            const lastNotified = await AsyncStorage.getItem(lastNotifiedKey);
                            const now = Date.now();

                            // 5 minute cooldown to prevent spam
                            if (!lastNotified || (now - parseInt(lastNotified) > 5 * 60 * 1000)) {
                                console.log(`[BleService] Sending FOUND notification for "${settings.name || device.name || 'Device'}" (${device.id})`);
                                notificationService.sendNotification(
                                    'Device Found!',
                                    `${settings.name || device.name || device.localName || 'Device'} is nearby.`
                                );
                                await AsyncStorage.setItem(lastNotifiedKey, now.toString());
                            }
                        }
                        // RESET Lost Notification Flag since it's found
                        await AsyncStorage.removeItem(`has_notified_lost_${device.id}`);
                    }
                }
            }
        );

        // 3. Wait for 10 seconds (Scan Duration)
        await new Promise(resolve => setTimeout(resolve, 10000));

        console.log(`[Android Background Debug] Scan cycle complete. Total unique devices found: ${foundDeviceIds.size}`);

        // Only stop scan if we are NOT in foreground mode. 
        // If foreground mode was activated during our sleep, we must NOT stop the scan (as it belongs to UI now).
        if (!this.isForegroundScanActive) {
            try { await this.manager.stopDeviceScan(); } catch (e) { }
        } else {
            console.log('[Android Background Debug] Foreground scan became active during cycle. Leaving scanner ON.');
        }

        // Check for lost devices
        // We iterate over devices that we WANTED to scan (devicesToScan)
        for (const [id, settings] of devicesToScan) {
            if (foundDeviceIds.has(id)) {
                // Device found
                // console.log(`[BleService] Device "${settings.name}" was found.`);
            } else {
                // Device NOT found
                if (settings.notifyOnLost) {
                    const notifiedKey = `has_notified_lost_${id}`;
                    const hasNotified = await AsyncStorage.getItem(notifiedKey);
                    const deviceName = settings.name || 'Unknown Device';

                    if (!hasNotified) {
                        console.log(`[Android Background Debug] LOST ALERT: "${deviceName}" (${id}) is not among found devices. Sending notification.`);
                        notificationService.sendNotification(
                            'Device Lost!',
                            `${deviceName} has gone out of range.`
                        );
                        await AsyncStorage.setItem(notifiedKey, 'true');
                    } else {
                        console.log(`[Android Background Debug] "${deviceName}" is missing, but LOST notification was already sent recently.`);
                    }
                } else {
                    console.log(`[BleService] "${settings.name}" missing, but notifyOnLost is disabled.`);
                }
            }
        }
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

    /**
     * Connects to a device, discovers all services, and returns their UUIDs.
     * This is useful for devices that don't advertise their Service UUIDs in the scan packet.
     */
    async discoverServices(deviceId: string): Promise<string[]> {
        console.log(`[BleService] Discovering services for ${deviceId}...`);
        try {
            // 1. Connect
            const device = await this.manager.connectToDevice(deviceId, { autoConnect: false, timeout: 5000 });

            // 2. Discover Services
            await device.discoverAllServicesAndCharacteristics();
            const services = await device.services();

            // 3. Extract UUIDs
            const uuids = services.map(s => s.uuid);
            console.log(`[BleService] Discovered ${uuids.length} services:`, uuids);

            // 4. Disconnect (we don't need to stay connected)
            await this.manager.cancelDeviceConnection(deviceId);

            return uuids;
        } catch (e) {
            console.warn(`[BleService] Failed to discover services for ${deviceId}`, e);
            // Try to disconnect just in case
            try { await this.manager.cancelDeviceConnection(deviceId); } catch (_) { }
            return [];
        }
    }
    /**
     * Connection Leash Strategy:
     * Maintains a persistent connection to the device.
     * Triggers callback when disconnected.
     */
    async connectToTrackedDevice(deviceId: string, onDisconnected: () => void) {
        console.log(`[BleService] Connecting to tracked device ${deviceId} for monitoring...`);
        try {
            // Check if already connected
            const isConnected = await this.manager.isDeviceConnected(deviceId);
            if (isConnected) {
                console.log(`[BleService] Already connected to ${deviceId}. Registering listener.`);
                this.registerDisconnectionListener(deviceId, onDisconnected);
                return;
            }

            // Connect
            await this.manager.connectToDevice(deviceId, { autoConnect: true }); // autoConnect: true helps with reconnection
            console.log(`[BleService] Connected to ${deviceId}. Registering listener.`);
            this.registerDisconnectionListener(deviceId, onDisconnected);

        } catch (e) {
            console.warn(`[BleService] Failed to connect to ${deviceId} for monitoring`, e);
        }
    }

    private registerDisconnectionListener(deviceId: string, callback: () => void) {
        this.manager.onDeviceDisconnected(deviceId, (error, device) => {
            console.log(`[BleService] Device ${deviceId} disconnected! Error:`, error);
            callback();
        });
    }

    async disconnectTrackedDevice(deviceId: string) {
        console.log(`[BleService] Disconnecting from tracked device ${deviceId}...`);
        try {
            await this.manager.cancelDeviceConnection(deviceId);
        } catch (e) {
            console.warn(`[BleService] Failed to disconnect ${deviceId}`, e);
        }
    }
}

export const bleService = new BleService();
