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

    async getBondedDevices(): Promise<Device[]> {
        if (Platform.OS === 'android') {
            try {
                if (!RNBluetoothClassic) {
                    console.warn('RNBluetoothClassic is null. Make sure to rebuild the app.');
                    return [];
                }
                const bonded = await RNBluetoothClassic.getBondedDevices();
                return bonded.map(d => ({
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
                } as unknown as Device));
            } catch (e) {
                console.warn('Failed to get bonded devices via Classic', e);
                return [];
            }
        }
        return [];
    }

    async isDeviceConnected(deviceId: string): Promise<boolean> {
        try {
            return await this.manager.isDeviceConnected(deviceId);
        } catch (e) {
            return false;
        }
    }
}

export const bleService = new BleService();
