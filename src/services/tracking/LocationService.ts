import * as Location from 'expo-location';
import { database, LocationHistory } from '../../db';

class LocationService {
    async requestPermissions() {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            return status === 'granted';
        } catch (error) {
            console.error('Error requesting location permissions:', error);
            return false;
        }
    }

    getCurrentLocation(): Promise<Location.LocationObject> {
        return Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
        });
    }

    private lastSaved: Map<string, number> = new Map();

    async saveLocation(deviceId: string) {
        const now = Date.now();
        const last = this.lastSaved.get(deviceId) || 0;

        // Throttle: Save max once every 5 minutes (300000 ms)
        if (now - last < 300000) {
            return;
        }

        try {
            const position = await this.getCurrentLocation();
            const { latitude, longitude } = position.coords;

            await database.write(async () => {
                await database.get<LocationHistory>('location_history').create((entry) => {
                    entry.deviceId = deviceId;
                    entry.latitude = latitude;
                    entry.longitude = longitude;
                    entry.timestamp = new Date();
                });
            });

            this.lastSaved.set(deviceId, now);
            console.log('Location saved for device:', deviceId);
        } catch (error) {
            console.error('Error saving location:', error);
        }
    }
}

export const locationService = new LocationService();
