import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true, // Keep for backward compatibility if type requires it, but rely on banner/list
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

class NotificationService {
    async requestPermissions() {
        console.log('[NotificationService] Requesting permissions...');
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        return finalStatus === 'granted';
    }

    async sendNotification(title: string, body: string) {
        console.log(`[NotificationService] Sending notification: ${title} - ${body}`);
        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                sound: true,
            },
            trigger: null, // Immediate
        });
    }
}

export const notificationService = new NotificationService();
