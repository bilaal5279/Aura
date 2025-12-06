import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import BackgroundService from 'react-native-background-actions';
import { bleService } from '../ble/BleService';

const sleep = (time: number) => new Promise((resolve) => setTimeout(() => resolve(true), time));

const LOCATION_TASK_NAME = 'background-location-task';

// Define the background task for iOS
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
    console.log('[BackgroundTracker] Task Triggered!');
    if (error) {
        console.error('Background location task error:', error);
        return;
    }
    if (data) {
        // const { locations } = data;
        // console.log('Background location update received');

        // Trigger a brief BLE scan when location updates
        await bleService.performBackgroundScan();
    }
});

class BackgroundTracker {
    isRunning = false;

    async start(task: () => Promise<void>) {
        if (this.isRunning) return;

        const options = {
            taskName: 'AuraTracker',
            taskTitle: 'Find my device is protecting your devices',
            taskDesc: 'Scanning for separation alerts...',
            taskIcon: {
                name: 'ic_launcher',
                type: 'mipmap',
            },
            color: '#00FF9D',
            linkingURI: 'aura://',
            parameters: {
                delay: 5000,
            },
        };

        if (Platform.OS === 'android') {
            await BackgroundService.start(async (taskDataArguments) => {
                this.isRunning = true;
                await new Promise(async (resolve) => {
                    while (BackgroundService.isRunning()) {
                        await task();
                        await sleep(taskDataArguments?.delay || 5000);
                    }
                });
                this.isRunning = false;
            }, options);
        } else if (Platform.OS === 'ios') {
            // iOS Implementation using Location Updates
            const { status } = await Location.requestBackgroundPermissionsAsync();
            if (status === 'granted') {
                await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
                    accuracy: Location.Accuracy.Balanced,
                    distanceInterval: 15, // Update every 15 meters (Balanced for leaving house)
                    deferredUpdatesInterval: 5000, // Minimum 5 seconds between updates
                    pausesUpdatesAutomatically: false,
                    showsBackgroundLocationIndicator: true, // Required for background execution
                    foregroundService: {
                        notificationTitle: "Find my device",
                        notificationBody: "Monitoring devices in background"
                    }
                });
                this.isRunning = true;
                console.log('iOS Background Location Tracking Started');
            } else {
                console.warn('Background location permission denied');
            }
        }
    }

    async stop() {
        if (Platform.OS === 'android') {
            await BackgroundService.stop();
            this.isRunning = false;
        } else if (Platform.OS === 'ios') {
            const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
            if (isRegistered) {
                await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
            }
            this.isRunning = false;
        }
    }
}

export const backgroundTracker = new BackgroundTracker();
