import { Platform } from 'react-native';
import BackgroundService from 'react-native-background-actions';

const sleep = (time: number) => new Promise((resolve) => setTimeout(() => resolve(true), time));

class BackgroundTracker {
    isRunning = false;

    async start(task: () => Promise<void>) {
        if (this.isRunning) return;

        const options = {
            taskName: 'DeviceFinderTracker',
            taskTitle: 'Device Finder',
            taskDesc: 'Background scanning active',
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
        }
    }

    async stop() {
        if (Platform.OS === 'android') {
            await BackgroundService.stop();
            this.isRunning = false;
        }
    }
}

export const backgroundTracker = new BackgroundTracker();
