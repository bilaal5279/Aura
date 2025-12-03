import { Ionicons } from '@expo/vector-icons';
import { Blur, Canvas, Circle, RadialGradient, vec } from '@shopify/react-native-skia';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GlassCard } from '../src/components/GlassCard';
import { PaywallModal } from '../src/components/PaywallModal';
import { ScanningAnimation } from '../src/components/ScanningAnimation';
import { COLORS, SPACING } from '../src/constants/theme';
import { ScannedDevice, useRadar } from '../src/hooks/useRadar';

const SignalIndicator = ({ rssi }: { rssi: number }) => {
    // Normalize RSSI (-90 to -40) to 0-1
    const strength = Math.max(0, Math.min(1, (rssi + 90) / 50));
    const color = strength > 0.7 ? COLORS.primary : strength > 0.4 ? COLORS.secondary : COLORS.textSecondary;

    return (
        <View style={{ width: 40, height: 40, justifyContent: 'center', alignItems: 'center' }}>
            <Canvas style={{ width: 40, height: 40 }}>
                <Circle cx={20} cy={20} r={15} style="stroke" strokeWidth={2} color={COLORS.glass.border} />
                <Circle cx={20} cy={20} r={15 * strength} color={color} opacity={0.8} />
            </Canvas>
        </View>
    );
};

const DeviceItem = ({ item }: { item: ScannedDevice }) => {
    const router = useRouter();
    // Simple icon logic
    let icon = 'bluetooth';
    const name = (item.device.name || '').toLowerCase();
    if (name.includes('phone') || name.includes('iphone')) icon = 'phone-portrait';
    else if (name.includes('mac') || name.includes('laptop')) icon = 'laptop';
    else if (name.includes('tv')) icon = 'tv';
    else if (name.includes('headphone') || name.includes('bud') || name.includes('pod')) icon = 'headset';
    else if (name.includes('watch')) icon = 'watch';

    return (
        <TouchableOpacity onPress={() => router.push({
            pathname: `/device/${item.device.id}` as any,
            params: { name: item.device.name || 'Unknown Device' }
        })}>
            <View style={styles.itemContainer}>
                <GlassCard width={350} height={80} intensity={15} style={styles.itemCard}>
                    <View style={styles.itemContent}>
                        <View style={styles.iconContainer}>
                            <Ionicons name={icon as any} size={24} color={COLORS.text} />
                        </View>
                        <View style={styles.textContainer}>
                            <Text style={[styles.deviceName, { color: '#FFFFFF' }]} numberOfLines={1}>
                                {item.device.name || item.device.localName || 'Unknown Device'}
                            </Text>
                            <Text style={[styles.deviceId, { color: '#AAAAAA' }]}>{item.device.id}</Text>
                        </View>
                        <SignalIndicator rssi={item.rssi} />
                    </View>
                </GlassCard>
            </View>
        </TouchableOpacity>
    );
};

export default function Dashboard() {
    const router = useRouter();
    const { isScanning, devices, bluetoothState } = useRadar();
    const [showPaywall, setShowPaywall] = useState(false);
    const [isPro, setIsPro] = useState(true);

    useEffect(() => {
        // Show paywall on first mount if not pro
        // In a real app, check AsyncStorage or RevenueCat first
        const timer = setTimeout(() => {
            if (!isPro) {
                setShowPaywall(true);
            }
        }, 1000); // Slight delay for effect
        return () => clearTimeout(timer);
    }, []);

    const handlePurchase = () => {
        setIsPro(true);
        setShowPaywall(false);
    };

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

            <FlatList
                data={devices}
                keyExtractor={(item) => item.device.id}
                renderItem={({ item }) => <DeviceItem item={item} />}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <ScanningAnimation />
                        <Text style={styles.emptyText}>Searching for signals...</Text>
                    </View>

                }
            />

            <View style={styles.navContainer}>
                <TouchableOpacity onPress={() => router.push('/map')} style={styles.button}>
                    <Text style={styles.buttonText}>Time Machine</Text>
                </TouchableOpacity>
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
        alignItems: 'center',
    },
    itemContainer: {
        marginBottom: SPACING.m,
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
    iconText: {
        fontSize: 20,
    },
    textContainer: {
        flex: 1,
    },
    deviceName: {
        fontSize: 16,
        color: COLORS.text,
        fontWeight: '600',
    },
    deviceId: {
        fontSize: 12,
        color: COLORS.textSecondary,
        fontFamily: 'monospace',
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
});
