import { Ionicons } from '@expo/vector-icons';
import { Blur, Canvas, Circle, RadialGradient, vec } from '@shopify/react-native-skia';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, SectionList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GlassCard } from '../src/components/GlassCard';
import { NotifyFoundModal } from '../src/components/NotifyFoundModal';
import { ScanningAnimation } from '../src/components/ScanningAnimation';
import { COLORS, SPACING } from '../src/constants/theme';
import { useTheme } from '../src/context/ThemeContext';
import { ScannedDevice, useRadar } from '../src/hooks/useRadar';
import { bleService } from '../src/services/ble/BleService';

const calculateDistance = (rssi: number | null) => {
    if (!rssi || rssi === 0) return null;

    const txPower = -60; // Reference RSSI at 1 meter
    const n = 2.5; // Path loss exponent (2.0-4.0 for indoors)

    // Log-Distance Path Loss Model
    // Distance = 10 ^ ((TxPower - RSSI) / (10 * n))
    const exponent = (txPower - rssi) / (10 * n);
    return Math.pow(10, exponent);
};

const DeviceItem = ({ item, isPro, onPress }: { item: ScannedDevice, isPro: boolean, onPress: () => void }) => {
    const { colors, isDark } = useTheme();
    // Simple icon logic
    let icon = 'bluetooth';
    const name = (item.device.name || '').toLowerCase();
    if (name.includes('phone') || name.includes('iphone')) icon = 'phone-portrait';
    else if (name.includes('mac') || name.includes('laptop')) icon = 'laptop';
    else if (name.includes('tv')) icon = 'tv';
    else if (name.includes('headphone') || name.includes('bud') || name.includes('pod')) icon = 'headset';
    else if (name.includes('watch')) icon = 'watch';

    const isLost = item.rssi === null;
    const distance = calculateDistance(item.rssi);
    const { distanceUnit } = useRadar();

    const getDistanceText = (dist: number | null) => {
        if (!dist) return 'Signal Detected';
        if (distanceUnit === 'feet') return `${(dist * 3.28084).toFixed(1)}ft away`;
        if (distanceUnit === 'meters') return `${dist.toFixed(1)}m away`;
        return `${dist.toFixed(1)}m away`; // Default/Auto
    };

    return (
        <TouchableOpacity onPress={onPress}>
            <View style={styles.itemContainer}>
                <GlassCard width={350} height={90} intensity={15} style={[styles.itemCard, isLost && { opacity: 0.6 }]}>
                    <View style={styles.itemContent}>
                        <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                            <Ionicons name={icon as any} size={24} color={isLost ? colors.textSecondary : colors.text} />
                        </View>
                        <View style={styles.textContainer}>
                            <Text style={[styles.deviceName, { color: isLost ? colors.textSecondary : colors.text }]} numberOfLines={1}>
                                {item.device.name || item.device.localName || item.customName || 'Unknown Device'}
                            </Text>
                            <Text style={[styles.deviceId, { color: colors.textSecondary }]}>{item.device.id}</Text>
                            <View style={styles.statusRow}>
                                <Text style={[styles.distanceText, { color: isLost ? COLORS.danger : colors.textSecondary }]}>
                                    {isLost ? 'Signal Lost' : getDistanceText(distance)}
                                </Text>
                            </View>
                            {!isLost && distance && (
                                <View style={[styles.distanceBarContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>
                                    <View
                                        style={[
                                            styles.distanceBarFill,
                                            {
                                                width: `${Math.min(100, Math.max(0, (1 - distance / 10) * 100))}%`,
                                                backgroundColor: distance < 2 ? COLORS.success : distance < 5 ? '#FFC107' : '#2196F3'
                                            }
                                        ]}
                                    />
                                </View>
                            )}
                        </View>
                    </View>
                </GlassCard>
            </View>
        </TouchableOpacity>
    );
};

export default function Dashboard() {
    const router = useRouter();
    const { colors, isDark } = useTheme();
    const { isScanning, devices, bluetoothState, connectedIds, trackedDevices, toggleTracking, updateDeviceSettings, backgroundTrackingEnabled, isPro, showPaywall } = useRadar();
    const [selectedDevice, setSelectedDevice] = useState<ScannedDevice | null>(null);
    const [showNotifyModal, setShowNotifyModal] = useState(false);

    // Stable sort order for unknown devices
    const [stableUnknownIds, setStableUnknownIds] = React.useState<string[]>([]);
    const devicesRef = React.useRef(devices);
    devicesRef.current = devices;

    React.useEffect(() => {
        let currentInterval: any;

        const updateOrder = () => {
            const currentUnknown = devicesRef.current.filter((d: ScannedDevice) => !d.isBonded && !d.device.name && !d.device.localName);
            setStableUnknownIds(currentUnknown.map(d => d.device.id));
        };

        // Initial update
        updateOrder();

        // Warm-up: Update frequently for the first 5 seconds to show devices immediately
        currentInterval = setInterval(updateOrder, 500);

        // After 5 seconds, switch to stable 4-second updates
        const timeout = setTimeout(() => {
            clearInterval(currentInterval);
            currentInterval = setInterval(updateOrder, 4000);
        }, 5000);

        return () => {
            clearInterval(currentInterval);
            clearTimeout(timeout);
        };
    }, []);

    const unknownSectionData = React.useMemo(() => {
        return stableUnknownIds
            .map(id => devices.find(d => d.device.id === id))
            .filter((d): d is ScannedDevice => !!d);
    }, [devices, stableUnknownIds]);

    const handleDevicePress = (device: ScannedDevice) => {
        if (device.rssi === null) {
            // Device is lost
            setSelectedDevice(device);
            setShowNotifyModal(true);
        } else {
            // Device is live
            if (!isPro) {
                setSelectedDevice(device);
                showPaywall();
            } else {
                router.push({
                    pathname: `/device/${device.device.id}` as any,
                    params: { name: device.device.name || 'Unknown Device' }
                });
            }
        }
    };

    const handleNotifyConfirm = () => {
        if (!isPro) {
            setShowNotifyModal(false);
            setTimeout(() => showPaywall(), 300); // Small delay for smooth transition
        } else {
            if (!backgroundTrackingEnabled) {
                Alert.alert(
                    'Background Tracking Disabled',
                    'You need to enable background tracking to receive notifications when the app is minimized.',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Settings', onPress: () => router.push('/settings') }
                    ]
                );
                setShowNotifyModal(false);
                return;
            }

            if (selectedDevice) {
                const id = selectedDevice.device.id;
                if (trackedDevices.has(id)) {
                    updateDeviceSettings(id, { notifyOnFound: true });
                } else {
                    toggleTracking(id, { notifyOnFound: true });
                }
                Alert.alert('Notification Set', `We'll let you know when ${selectedDevice.device.name || 'this device'} is found.`);
            }
            setShowNotifyModal(false);
        }
    };

    const enableBluetooth = async () => {
        await bleService.enableBluetooth();
    };

    // Grouping Logic
    const sections = [
        {
            title: 'My Devices',
            data: devices.filter((d: ScannedDevice) => d.isBonded)
        },
        {
            title: 'Found Devices',
            data: devices.filter((d: ScannedDevice) => !d.isBonded && (d.device.name || d.device.localName))
        },
        {
            title: 'Unknown Signals',
            data: unknownSectionData
        }
    ].filter(section => section.data.length > 0);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />
            {/* Ambient Background Pulse */}
            <View style={StyleSheet.absoluteFill}>
                <Canvas style={{ flex: 1 }}>
                    <Circle cx={200} cy={200} r={150} opacity={isDark ? 0.1 : 0.05}>
                        <RadialGradient
                            c={vec(200, 200)}
                            r={150}
                            colors={[COLORS.primary, 'transparent']}
                        />
                        <Blur blur={50} />
                    </Circle>
                </Canvas>
            </View>

            <View style={styles.header}>
                <View>
                    <Text style={[
                        styles.title,
                        {
                            color: isDark ? COLORS.primary : '#000',
                            textShadowColor: isDark ? COLORS.primary : 'transparent',
                            textShadowRadius: isDark ? 15 : 0
                        }
                    ]}>Find My Device</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        {bluetoothState === 'PoweredOn'
                            ? (isScanning ? 'Scanning Environment...' : 'Ready to Scan')
                            : (bluetoothState === 'Unknown' ? 'Initializing...' : 'Bluetooth Off / Offline')}
                    </Text>
                </View>
                <TouchableOpacity
                    onPress={() => showPaywall()}
                    style={[
                        styles.upgradeButton,
                        {
                            borderColor: isDark ? COLORS.primary : '#E0E0E0',
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#FFF',
                            shadowColor: "#000",
                            shadowOffset: {
                                width: 0,
                                height: 2,
                            },
                            shadowOpacity: isDark ? 0 : 0.1,
                            shadowRadius: 3.84,
                            elevation: isDark ? 0 : 5,
                        }
                    ]}
                >
                    <Ionicons name="diamond-outline" size={24} color={isDark ? COLORS.primary : '#000'} />
                </TouchableOpacity>
            </View>

            {bluetoothState !== 'PoweredOn' && bluetoothState !== 'Unknown' && (
                <View style={styles.bluetoothWarning}>
                    <Text style={styles.warningText}>Bluetooth is required to scan devices.</Text>
                    <TouchableOpacity onPress={enableBluetooth} style={styles.enableButton}>
                        <Text style={styles.enableButtonText}>Turn On Bluetooth</Text>
                    </TouchableOpacity>
                </View>
            )}

            <SectionList
                sections={sections}
                keyExtractor={(item) => item.device.id}
                renderItem={({ item }) => (
                    <DeviceItem
                        item={item}
                        isPro={isPro}
                        onPress={() => handleDevicePress(item)}
                    />
                )}
                renderSectionHeader={({ section: { title } }) => (
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionHeaderText, { color: colors.textSecondary }]}>{title}</Text>
                    </View>
                )}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    bluetoothState === 'PoweredOn' ? (
                        <View style={styles.emptyContainer}>
                            <ScanningAnimation />
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Searching for signals...</Text>
                        </View>
                    ) : null
                }
                stickySectionHeadersEnabled={false}
            />

            <View style={styles.navContainer}>
                <TouchableOpacity onPress={() => router.push('/faq' as any)} style={[styles.button, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255,255,255,0.9)', borderColor: colors.border }]}>
                    <Text style={[styles.buttonText, { color: colors.text }]}>FAQ</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/settings')} style={[styles.button, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255,255,255,0.9)', borderColor: colors.border }]}>
                    <Text style={[styles.buttonText, { color: colors.text }]}>Settings</Text>
                </TouchableOpacity>
            </View>

            <NotifyFoundModal
                visible={showNotifyModal}
                deviceName={selectedDevice?.device.name || selectedDevice?.device.localName || selectedDevice?.customName || 'Device'}
                onClose={() => setShowNotifyModal(false)}
                onConfirm={handleNotifyConfirm}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: SPACING.l,
        paddingBottom: SPACING.m,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: 42,
        fontWeight: 'bold',
        letterSpacing: 1,
        // Removed fixed textShadowColor to allow dynamic styling if needed, 
        // or we can keep it if it looks good. 
        // For now, let's keep the shadow but maybe adjust it for light mode if needed.
        textShadowColor: COLORS.primary,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 15,
    },
    subtitle: {
        fontSize: 14,
        marginTop: SPACING.xs,
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    upgradeButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    listContent: {
        paddingHorizontal: SPACING.m,
        paddingBottom: 120, // Increased padding to avoid overlap with nav buttons
    },
    sectionHeader: {
        paddingVertical: SPACING.s,
        paddingHorizontal: SPACING.s,
        marginBottom: SPACING.s,
        marginTop: SPACING.m,
    },
    sectionHeaderText: {
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
        fontWeight: '600',
    },
    itemContainer: {
        marginBottom: SPACING.m,
        alignItems: 'center',
    },
    itemCard: {
        borderRadius: 16,
    },
    itemContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.m,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.m,
    },
    textContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    deviceName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    deviceId: {
        fontSize: 10,
        fontFamily: 'monospace',
        marginBottom: 4,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    distanceText: {
        fontSize: 12,
        fontWeight: '600',
    },
    emptyContainer: {
        marginTop: 100,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
    },
    navContainer: {
        position: 'absolute',
        bottom: 40,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: SPACING.m,
    },
    button: {
        paddingVertical: SPACING.m,
        paddingHorizontal: SPACING.l,
        borderRadius: 25,
        borderWidth: 1,
    },
    buttonText: {
        fontSize: 14,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    bluetoothWarning: {
        marginHorizontal: SPACING.l,
        marginBottom: SPACING.m,
        padding: SPACING.m,
        backgroundColor: 'rgba(255, 59, 48, 0.1)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 59, 48, 0.3)',
        alignItems: 'center',
    },
    warningText: {
        color: '#FF3B30',
        marginBottom: SPACING.s,
        textAlign: 'center',
    },
    enableButton: {
        backgroundColor: '#FF3B30',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
    },
    enableButtonText: {
        color: '#FFF',
        fontWeight: '600',
    },
    distanceBarContainer: {
        height: 4,
        borderRadius: 2,
        marginTop: 6,
        width: '100%',
        overflow: 'hidden',
    },
    distanceBarFill: {
        height: '100%',
        borderRadius: 2,
    },
});
