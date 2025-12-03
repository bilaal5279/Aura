import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import { database, LocationHistory } from '../../db';

class LocationService {
    async requestPermissions() {
        if (Platform.OS === 'ios') {
            const auth = await Geolocation.requestAuthorization('whenInUse');
            return auth === 'granted';
        }

        if (Platform.OS === 'android') {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            );
            return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
        return false;
    }

    getCurrentLocation(): Promise<Geolocation.GeoPosition> {
        return new Promise((resolve, reject) => {
            Geolocation.getCurrentPosition(
                (position) => resolve(position),
                (error) => reject(error),
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
            );
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
