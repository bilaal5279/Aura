import { Ionicons } from '@expo/vector-icons';
import { Blur, Canvas, Circle, RadialGradient, vec } from '@shopify/react-native-skia';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { SectionList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GlassCard } from '../src/components/GlassCard';
import { PaywallModal } from '../src/components/PaywallModal';
import { ScanningAnimation } from '../src/components/ScanningAnimation';
import { COLORS, SPACING } from '../src/constants/theme';
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

const SignalIndicator = ({ isConnected }: { isConnected: boolean }) => {
    return (
        <View style={{ width: 40, height: 40, justifyContent: 'center', alignItems: 'center' }}>
            <Canvas style={{ width: 40, height: 40 }}>
                <Circle cx={20} cy={20} r={15} style="stroke" strokeWidth={2} color={COLORS.glass.border} />
                {isConnected && (
                    <Circle cx={20} cy={20} r={10} color="#00FF9D" opacity={0.8}>
                        <Blur blur={4} />
                    </Circle>
                )}
            </Canvas>
        </View>
    );
};

const DeviceItem = ({ item, isPro, isConnected, onPress }: { item: ScannedDevice, isPro: boolean, isConnected: boolean, onPress: () => void }) => {
    // Simple icon logic
    let icon = 'bluetooth';
    const name = (item.device.name || '').toLowerCase();
    if (name.includes('phone') || name.includes('iphone')) icon = 'phone-portrait';
    else if (name.includes('mac') || name.includes('laptop')) icon = 'laptop';
    else if (name.includes('tv')) icon = 'tv';
    else if (name.includes('headphone') || name.includes('bud') || name.includes('pod')) icon = 'headset';
    else if (name.includes('watch')) icon = 'watch';

    const distance = calculateDistance(item.rssi);

    return (
        <TouchableOpacity onPress={onPress}>
            <View style={styles.itemContainer}>
                <GlassCard width={350} height={90} intensity={15} style={styles.itemCard}>
                    <View style={styles.itemContent}>
                        <View style={styles.iconContainer}>
                            <Ionicons name={icon as any} size={24} color={COLORS.text} />
                        </View>
                        <View style={styles.textContainer}>
                            <Text style={[styles.deviceName, { color: '#FFFFFF' }]} numberOfLines={1}>
                                {item.device.name || item.device.localName || 'Unknown Device'}
                            </Text>
                            <Text style={[styles.deviceId, { color: '#AAAAAA' }]}>{item.device.id}</Text>
                            <View style={styles.statusRow}>
                                <View style={[styles.statusDot, { backgroundColor: isConnected ? '#00FF9D' : COLORS.textSecondary }]} />
                                <Text style={[styles.statusText, { color: isConnected ? '#00FF9D' : COLORS.textSecondary }]}>
                                    {isConnected ? 'Connected' : 'Disconnected'}
                                </Text>
                                <Text style={styles.distanceText}>
                                    • {distance ? `${distance.toFixed(1)}m away` : 'Paired'}
                                </Text>
                            </View>
                        </View>
                        <SignalIndicator isConnected={isConnected} />
                    </View>
                </GlassCard>
            </View>
        </TouchableOpacity>
    );
};

export default function Dashboard() {
    const router = useRouter();
    const { isScanning, devices, bluetoothState, connectedIds } = useRadar();
    const [showPaywall, setShowPaywall] = useState(false);
    const [isPro, setIsPro] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState<ScannedDevice | null>(null);

    const handleDevicePress = (device: ScannedDevice) => {
        if (!isPro) {
            setSelectedDevice(device);
            setShowPaywall(true);
        } else {
            router.push({
                pathname: `/device/${device.device.id}` as any,
                params: { name: device.device.name || 'Unknown Device' }
            });
        }
    };

    const handlePurchase = () => {
        setIsPro(true);
        setShowPaywall(false);
        if (selectedDevice) {
            router.push({
                pathname: `/device/${selectedDevice.device.id}` as any,
                params: { name: selectedDevice.device.name || 'Unknown Device' }
            });
        }
    };

    const enableBluetooth = async () => {
        await bleService.enableBluetooth();
    };

    // Grouping Logic
    const sections = [
        {
            title: 'Connected Devices',
            data: devices.filter(d => connectedIds.has(d.device.id))
        },
        {
            title: 'My Devices',
            data: devices.filter(d => d.isBonded && !connectedIds.has(d.device.id))
        },
        {
            title: 'Found Devices',
            data: devices.filter(d => !d.isBonded && !connectedIds.has(d.device.id) && (d.device.name || d.device.localName))
        },
        {
            title: 'Unknown Signals',
            data: devices.filter(d => !d.isBonded && !connectedIds.has(d.device.id) && !d.device.name && !d.device.localName)
        }
    ].filter(section => section.data.length > 0);

    return (
        <View style={styles.container}>
            {/* Ambient Background Pulse */}
            <View style={StyleSheet.absoluteFill}>
                <Canvas style={{ flex: 1 }}>
                    <Circle cx={200} cy={200} r={150} opacity={0.1}>
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
                    <Text style={styles.title}>Aura</Text>
                    <Text style={styles.subtitle}>
                        {bluetoothState === 'PoweredOn'
                            ? (isScanning ? 'Scanning Environment...' : 'Ready to Scan')
                            : (bluetoothState === 'Unknown' ? 'Initializing...' : 'Bluetooth Off / Offline')}
                    </Text>
                </View>
                <TouchableOpacity onPress={() => setShowPaywall(true)} style={styles.upgradeButton}>
                    <Ionicons name="diamond-outline" size={24} color={COLORS.primary} />
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
                        isConnected={connectedIds.has(item.device.id)}
                        onPress={() => handleDevicePress(item)}
                    />
                )}
                renderSectionHeader={({ section: { title } }) => (
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionHeaderText}>{title}</Text>
                    </View>
                )}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    bluetoothState === 'PoweredOn' ? (
                        <View style={styles.emptyContainer}>
                            <ScanningAnimation />
                            <Text style={styles.emptyText}>Searching for signals...</Text>
                        </View>
                    ) : null
                }
                stickySectionHeadersEnabled={false}
            />

            <View style={styles.navContainer}>
                <TouchableOpacity onPress={() => router.push('/settings')} style={styles.button}>
                    <Text style={styles.buttonText}>Settings</Text>
                </TouchableOpacity>
            </View>

            <PaywallModal
                visible={showPaywall}
                onClose={() => setShowPaywall(false)}
                onPurchase={handlePurchase}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
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
        color: COLORS.primary,
        fontWeight: 'bold',
        letterSpacing: 1,
        textShadowColor: COLORS.primary,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 15,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginTop: SPACING.xs,
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    upgradeButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    listContent: {
        paddingHorizontal: SPACING.m,
        paddingBottom: 100,
    },
    sectionHeader: {
        paddingVertical: SPACING.s,
        paddingHorizontal: SPACING.s,
        marginBottom: SPACING.s,
        marginTop: SPACING.m,
    },
    sectionHeaderText: {
        color: COLORS.textSecondary,
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
        backgroundColor: 'rgba(255,255,255,0.1)',
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
        color: COLORS.text,
        fontWeight: '600',
        marginBottom: 2,
    },
    deviceId: {
        fontSize: 10,
        color: COLORS.textSecondary,
        fontFamily: 'monospace',
        marginBottom: 4,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },
    statusText: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginRight: 8,
    },
    distanceText: {
        fontSize: 12,
        color: COLORS.textSecondary,
        fontWeight: '600',
    },
    emptyContainer: {
        marginTop: 100,
        alignItems: 'center',
    },
    emptyText: {
        color: COLORS.textSecondary,
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
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        paddingVertical: SPACING.m,
        paddingHorizontal: SPACING.l,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: COLORS.glass.border,
    },
    buttonText: {
        color: COLORS.text,
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
});
