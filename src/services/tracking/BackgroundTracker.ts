import { Platform } from 'react-native';
import BackgroundService from 'react-native-background-actions';

const sleep = (time: number) => new Promise((resolve) => setTimeout(() => resolve(true), time));

const LOCATION_TASK_NAME = 'background-location-task';

// Define the background task for iOS - NO-OP for now as we removed Location mode
// If we need background processing on iOS, it must be triggered by BLE events (State Restoration)
// which is handled by BleService, not this TaskManager.
/*
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
    // ...
});
*/

class BackgroundTracker {
    isRunning = false;

    async start(task: () => Promise<void>) {
        if (this.isRunning) return;

        const options = {
            taskName: 'AuraTracker',
            taskTitle: 'Find My Device is scanning',
            taskDesc: 'Searching for your devices in the background...',
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
            // iOS Background execution is handled by CoreBluetooth State Restoration.
            // We do NOT start a Keep-Alive Location loop here anymore to satisfy Apple Guidelines.
            console.log('iOS Background Tracking: Relying on BLE State Restoration.');
            this.isRunning = true;
        }
    }

    async stop() {
        if (Platform.OS === 'android') {
            await BackgroundService.stop();
            this.isRunning = false;
        } else if (Platform.OS === 'ios') {
            // No-op
            this.isRunning = false;
        }
    }
}

export const backgroundTracker = new BackgroundTracker();
