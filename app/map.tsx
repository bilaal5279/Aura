import { withObservables } from '@nozbe/watermelondb/react';
import React, { useMemo, useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { COLORS, SPACING } from '../src/constants/theme';
import { useTheme } from '../src/context/ThemeContext';
import { database, LocationHistory } from '../src/db';

const { width, height } = Dimensions.get('window');

// Dark Map Style
const DARK_MAP_STYLE = [
    {
        "elementType": "geometry",
        "stylers": [{ "color": "#212121" }]
    },
    {
        "elementType": "labels.icon",
        "stylers": [{ "visibility": "off" }]
    },
    {
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#757575" }]
    },
    {
        "elementType": "labels.text.stroke",
        "stylers": [{ "color": "#212121" }]
    },
    {
        "featureType": "administrative",
        "elementType": "geometry",
        "stylers": [{ "color": "#757575" }]
    },
    {
        "featureType": "administrative.country",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#9e9e9e" }]
    },
    {
        "featureType": "administrative.land_parcel",
        "stylers": [{ "visibility": "off" }]
    },
    {
        "featureType": "administrative.locality",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#bdbdbd" }]
    },
    {
        "featureType": "poi",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#757575" }]
    },
    {
        "featureType": "poi.park",
        "elementType": "geometry",
        "stylers": [{ "color": "#181818" }]
    },
    {
        "featureType": "poi.park",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#616161" }]
    },
    {
        "featureType": "poi.park",
        "elementType": "labels.text.stroke",
        "stylers": [{ "color": "#1b1b1b" }]
    },
    {
        "featureType": "road",
        "elementType": "geometry.fill",
        "stylers": [{ "color": "#2c2c2c" }]
    },
    {
        "featureType": "road",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#8a8a8a" }]
    },
    {
        "featureType": "road.arterial",
        "elementType": "geometry",
        "stylers": [{ "color": "#373737" }]
    },
    {
        "featureType": "road.highway",
        "elementType": "geometry",
        "stylers": [{ "color": "#3c3c3c" }]
    },
    {
        "featureType": "road.highway.controlled_access",
        "elementType": "geometry",
        "stylers": [{ "color": "#4e4e4e" }]
    },
    {
        "featureType": "road.local",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#616161" }]
    },
    {
        "featureType": "transit",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#757575" }]
    },
    {
        "featureType": "water",
        "elementType": "geometry",
        "stylers": [{ "color": "#000000" }]
    },
    {
        "featureType": "water",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#3d3d3d" }]
    }
];

interface MapScreenProps {
    history: LocationHistory[];
}

const TimeMachineMap: React.FC<MapScreenProps> = ({ history }) => {
    const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d'>('24h');
    const { colors, isDark } = useTheme();

    const filteredHistory = useMemo(() => {
        const now = Date.now();
        const cutoff = timeRange === '1h' ? 3600000 : timeRange === '24h' ? 86400000 : 604800000;
        return history.filter(h => now - h.timestamp.getTime() < cutoff);
    }, [history, timeRange]);

    // Calculate initial region
    const initialRegion = useMemo(() => {
        if (history.length === 0) return null;
        const last = history[history.length - 1];
        return {
            latitude: last.latitude,
            longitude: last.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
        };
    }, [history]);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <MapView
                style={styles.map}
                customMapStyle={isDark ? DARK_MAP_STYLE : []}
                provider={PROVIDER_GOOGLE}
                initialRegion={initialRegion || {
                    latitude: 37.78825,
                    longitude: -122.4324,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                }}
                showsUserLocation
                showsMyLocationButton
            >
                {filteredHistory.map((entry) => (
                    <Marker
                        key={entry.id}
                        coordinate={{ latitude: entry.latitude, longitude: entry.longitude }}
                        title={entry.deviceId}
                        description={new Date(entry.timestamp).toLocaleString()}
                        pinColor={COLORS.primary}
                    />
                ))}
            </MapView>

            <View style={styles.overlay}>
                <View style={styles.header}>
                    <Text style={[styles.title, { color: COLORS.primary, textShadowColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)' }]}>TIME MACHINE</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary, textShadowColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)' }]}>{filteredHistory.length} SIGHTINGS</Text>
                </View>

                <View style={styles.controls}>
                    {(['1h', '24h', '7d'] as const).map((range) => (
                        <TouchableOpacity
                            key={range}
                            onPress={() => setTimeRange(range)}
                            style={[
                                styles.filterButton,
                                { backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.8)', borderColor: colors.border },
                                timeRange === range && { backgroundColor: COLORS.primary, borderColor: COLORS.primary }
                            ]}
                        >
                            <Text style={[
                                styles.filterText,
                                { color: colors.textSecondary },
                                timeRange === range && styles.filterTextActive
                            ]}>
                                {range.toUpperCase()}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </View>
    );
};

const enhance = withObservables([], () => ({
    history: database.get<LocationHistory>('location_history').query(),
}));

export default enhance(TimeMachineMap);

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        width: '100%',
        height: '100%',
    },
    overlay: {
        position: 'absolute',
        top: 60,
        left: 20,
        right: 20,
    },
    header: {
        marginBottom: SPACING.m,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        letterSpacing: 2,
        textShadowRadius: 10,
    },
    subtitle: {
        fontSize: 12,
        marginTop: 4,
        letterSpacing: 1,
        fontWeight: '600',
        textShadowRadius: 5,
    },
    controls: {
        flexDirection: 'row',
        gap: SPACING.s,
    },
    filterButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
    },
    filterButtonActive: {
        // Handled inline
    },
    filterText: {
        fontSize: 12,
        fontWeight: '600',
    },
    filterTextActive: {
        color: '#000',
    },
});
