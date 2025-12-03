import { PermissionsAndroid, Platform } from 'react-native';
import { BleManager, Device, ScanMode } from 'react-native-ble-plx';
import RNBluetoothClassic from 'react-native-bluetooth-classic';
import { backgroundTracker } from '../tracking/BackgroundTracker';

class BleService {
    manager: BleManager;

    constructor() {
        this.manager = new BleManager({
            restoreStateIdentifier: 'AuraBackground',
            restoreStateFunction: (restoredState) => {
                if (restoredState == null) {
                    // BleManager was constructed for the first time.
                } else {
                    // BleManager was restored. Check `restoredState.connectedPeripherals` to get connected devices.
                    console.log('Restored state:', restoredState);
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
                console.warn('Failed to enable Bluetooth', e);
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
                onDeviceFound(device);
            }
        });
    }

    stopScan() {
        this.manager.stopDeviceScan();
    }

    async startBackgroundTracking() {
        await backgroundTracker.start(async () => {
            // In background, we might want to do a low-latency scan or check connection status
            // For now, we just log. In a real app, this would check for lost devices.
            console.log('Background tracking active...');
        });
    }
    onStateChange(listener: (state: string) => void) {
        return this.manager.onStateChange(listener, true);
    }

    async getBluetoothState() {
        return this.manager.state();
    }

    private mapClassicDevice(d: any): Device {
        // Log connection status if present
        if (d.connected !== undefined) {
            console.log(`Classic Device ${d.name} (${d.address}) connected property: ${d.connected}`);
        }

        return {
            id: d.address,
            name: d.name,
            localName: d.name,
            rssi: null,
            mtu: 23,
            manufacturerData: null,
            serviceData: null,
            serviceUUIDs: null,
            solicitedServiceUUIDs: null,
            overflowServiceUUIDs: null,
            txPowerLevel: null,
            isConnectable: null,
            rawScanRecord: null,
            // Custom property passed through
            isConnected: d.connected,
        } as unknown as Device;
    }

    async getBondedDevices(): Promise<Device[]> {
        if (Platform.OS === 'android') {
            try {
                const enabled = await RNBluetoothClassic.isBluetoothEnabled();
                if (!enabled) return [];

                const bonded = await RNBluetoothClassic.getBondedDevices();
                if (bonded.length > 0) {
                    console.log('Raw Bonded Device 0:', JSON.stringify(bonded[0]));
                }
                return bonded.map(d => this.mapClassicDevice(d));
            } catch (e) {
                console.warn('Failed to get bonded devices via Classic', e);
                return [];
            }
        }
        return [];
    }

    async getSystemConnectedDevices(): Promise<Device[]> {
        if (Platform.OS === 'android') {
            try {
                const enabled = await RNBluetoothClassic.isBluetoothEnabled();
                if (!enabled) return [];

                const connected = await RNBluetoothClassic.getConnectedDevices();
                console.log('System Connected Devices:', connected.length, connected.map(d => d.name));
                return connected.map(d => this.mapClassicDevice(d));
            } catch (e) {
                console.warn('Failed to get system connected devices', e);
                return [];
            }
        }
        return [];
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
                console.log(`BLE System Connection Found for ${deviceId} (via connectedDevices)`);
                return true;
            }
        } catch (e) {
            console.warn('Failed to check connectedDevices', e);
        }

        if (Platform.OS === 'android') {
            try {
                const enabled = await RNBluetoothClassic.isBluetoothEnabled();
                if (enabled) {
                    // Method 2: Check getConnectedDevice (Specific)
                    try {
                        const connectedDevice = await RNBluetoothClassic.getConnectedDevice(deviceId);
                        if (connectedDevice) {
                            console.log(`Classic Connection Confirmed for ${deviceId} (getConnectedDevice)`);
                            return true;
                        }
                    } catch (e) {
                        // This throws if not connected or error
                    }

                    // Method 3: Check list (Fallback)
                    const connected = await RNBluetoothClassic.getConnectedDevices();
                    if (connected.some(d => d.address === deviceId)) {
                        console.log(`Classic Connection Found in List for ${deviceId}`);
                        return true;
                    }

                    // Method 4: Check instance .isConnected() on Bonded Device
                    try {
                        const bonded = await RNBluetoothClassic.getBondedDevices();
                        const device = bonded.find(d => d.address === deviceId);
                        if (device) {
                            // Check if isConnected is a function
                            if (typeof device.isConnected === 'function') {
                                const isInstanceConnected = await device.isConnected();
                                console.log(`device.isConnected() for ${deviceId}: ${isInstanceConnected}`);
                                if (isInstanceConnected) return true;
                            } else {
                                console.log(`device.isConnected is not a function on ${deviceId}`);
                            }
                        }
                    } catch (e) {
                        console.warn(`Failed instance check for ${deviceId}`, e);
                    }
                }

                // Fallback to BLE check
                const isBleConnected = await this.manager.isDeviceConnected(deviceId);
                console.log(`Checking connection for ${deviceId}: Classic=False, BLE=${isBleConnected}`);
                return isBleConnected;
            } catch (e) {
                return false;
            }
        }

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
