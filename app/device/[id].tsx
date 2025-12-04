import { Ionicons } from '@expo/vector-icons';
import { Blur, Canvas, Circle, vec } from '@shopify/react-native-skia';
import { Audio } from 'expo-av';

import * as Haptics from 'expo-haptics';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { Easing, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { COLORS, SPACING } from '../../src/constants/theme';
import { useRadar } from '../../src/hooks/useRadar';

const { width, height } = Dimensions.get('window');
const CENTER = vec(width / 2, height / 3);

import { Confetti } from '../../src/components/Confetti';
import { bleService } from '../../src/services/ble/BleService';
import { RssiSmoother } from '../../src/services/tracking/KalmanFilter';

import { Modal } from 'react-native'; // Import Modal
import { PaywallModal } from '../../src/components/PaywallModal';
import { DeviceSettings } from '../../src/context/RadarContext';

export default function DeviceDetailScreen() {
    const { id, name } = useLocalSearchParams();
    const router = useRouter();
    const { devices } = useRadar();

    // Persist last known device data to prevent UI flickering/crash
    const lastKnownDevice = useRef<any>(null);
    const deviceData = devices.find((d: any) => d.device.id === id);

    if (deviceData) {
        lastKnownDevice.current = deviceData;
    }

    // Use live data or fallback to last known
    const activeDevice = deviceData || lastKnownDevice.current;
    const deviceName = activeDevice?.device.name || activeDevice?.device.localName || (name as string) || 'Unknown Device';

    const [liveRssi, setLiveRssi] = useState<number | null>(null);
    const smoother = useRef(new RssiSmoother()).current;

    useEffect(() => {
        if (id) {
            // Start specific scan for this device
            bleService.startDeviceSpecificScan(id as string, deviceName, (rssi: number) => {
                const smoothedRssi = smoother.filter(rssi);
                setLiveRssi(smoothedRssi);
            });

            return () => {
                bleService.stopScan();
            };
        }
    }, [id, deviceName]);

    const rssi = liveRssi !== null ? liveRssi : (activeDevice?.rssi || -100);

    // Calibration: -100 (Far) to -50 (Near)
    // Normalized 0 to 1
    const signalStrength = Math.max(0, Math.min(1, (rssi + 100) / 50));

    const { trackedDevices, toggleTracking, updateDeviceSettings, distanceUnit } = useRadar();
    const deviceSettings = trackedDevices.get(id as string);
    const isTracked = !!deviceSettings;

    // Distance Calculation
    const calculateDistance = (rssi: number) => {
        const txPower = -60;
        const n = 2.5;
        const exponent = (txPower - rssi) / (10 * n);
        const meters = Math.pow(10, exponent);

        if (distanceUnit === 'feet') return `${(meters * 3.28084).toFixed(1)} ft`;
        if (distanceUnit === 'meters') return `${meters.toFixed(1)} m`;

        // Auto: Use feet if US locale (mocked here as simple toggle for now, or just default meters)
        // For simplicity in this context, let's default to meters for auto unless we have locale info.
        // Or we can just show meters.
        return `${meters.toFixed(1)} m`;
    };

    const distanceText = calculateDistance(rssi);

    const [soundEnabled, setSoundEnabled] = useState(false);
    const [vibrationEnabled, setVibrationEnabled] = useState(true);
    const [backgroundTrackingEnabled, setBackgroundTrackingEnabled] = useState(false);
    const [showPaywall, setShowPaywall] = useState(false);
    const [isPro, setIsPro] = useState(false); // Mock Pro status
    const [sound, setSound] = useState<Audio.Sound>();
    const [showSettings, setShowSettings] = useState(false);
    const [isFound, setIsFound] = useState(false);

    const handleFound = () => {
        setIsFound(true);
        setSoundEnabled(false);
        setVibrationEnabled(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    const handleToggleSetting = (setting: keyof DeviceSettings) => {
        if (!isPro) {
            setShowPaywall(true);
            return;
        }
        if (!isTracked) {
            // If not tracked, enable tracking with default + this setting
            toggleTracking(id as string, { [setting]: true });
        } else {
            updateDeviceSettings(id as string, { [setting]: !deviceSettings[setting] });
        }
    };

    // Animation Values
    const pulse = useSharedValue(0);

    useEffect(() => {
        pulse.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 1000 - (signalStrength * 800), easing: Easing.inOut(Easing.ease) }),
                withTiming(0, { duration: 1000 - (signalStrength * 800), easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );
    }, [signalStrength]);

    // Load Sound
    useEffect(() => {
        async function loadSound() {
            try {
                const { sound } = await Audio.Sound.createAsync(
                    // Using a generic beep sound from a reliable source or asset
                    // For now, we'll use a placeholder. In a real app, require('./assets/beep.mp3')
                    require('../../assets/geiger.wav')
                );
                setSound(sound);
            } catch (error) {
                console.log('Error loading sound', error);
            }
        }
        loadSound();

        return () => {
            if (sound) {
                sound.unloadAsync();
            }
        };
    }, []);

    // Feedback Loop (Haptic + Sound)
    useEffect(() => {
        const intervalMs = 1000 - (signalStrength * 950); // 1000ms (Far) to 50ms (Near)

        const interval = setInterval(async () => {
            // Haptics
            if (vibrationEnabled) {
                if (signalStrength > 0.8) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                } else if (signalStrength > 0.4) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                } else if (signalStrength > 0.1) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
            }

            // Sound (Geiger Counter)
            if (soundEnabled && sound && signalStrength > 0.1) {
                try {
                    await sound.setPositionAsync(0);
                    await sound.playAsync();
                } catch (error) {
                    console.log('Error playing sound', error);
                }
            }
        }, Math.max(50, intervalMs));

        return () => clearInterval(interval);
    }, [signalStrength, vibrationEnabled, soundEnabled, sound]);

    // Dynamic Color
    const getOrbColor = (strength: number) => {
        if (strength > 0.8) return '#00FF9D'; // Neon Green (Near)
        if (strength > 0.5) return '#00E0FF'; // Cyan (Mid)
        return '#FF0055'; // Neon Red (Far)
    };

    const orbColor = getOrbColor(signalStrength);

    const handlePurchase = () => {
        setIsPro(true);
        setShowPaywall(false);
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>
                    {deviceName}
                </Text>
                <TouchableOpacity onPress={() => setShowSettings(true)} style={styles.settingsButton}>
                    <Ionicons name="settings-sharp" size={24} color="#FFF" />
                </TouchableOpacity>
            </View>

            {/* Proximity Orb Visualization */}
            <View style={styles.visualizerContainer}>
                <Canvas style={{ width: width, height: width }}>
                    {/* Core Orb */}
                    <Circle cx={width / 2} cy={width / 2} r={80 + (signalStrength * 40)} color={orbColor} opacity={0.8}>
                        <Blur blur={20} />
                    </Circle>

                    {/* Inner Core */}
                    <Circle cx={width / 2} cy={width / 2} r={40} color="#FFF" opacity={0.9} />

                    {/* Pulse Ring 1 */}
                    <Circle cx={width / 2} cy={width / 2} r={120} style="stroke" strokeWidth={2} color={orbColor} opacity={0.3 * signalStrength} />

                    {/* Pulse Ring 2 */}
                    <Circle cx={width / 2} cy={width / 2} r={180} style="stroke" strokeWidth={1} color={orbColor} opacity={0.1 * signalStrength} />
                </Canvas>
            </View>

            {/* Signal Text Below Orb */}
            <View style={styles.signalContainer}>
                {/* Percentage Score */}
                <Text style={styles.signalValue}>
                    {Math.max(0, Math.min(100, Math.round((rssi + 100) * 1.66)))}%
                </Text>

                {/* Conversational Status */}
                <Text style={[styles.signalLabel, { color: orbColor }]}>
                    {signalStrength > 0.9 ? "IT'S RIGHT HERE!" :
                        signalStrength > 0.7 ? "VERY CLOSE" :
                            signalStrength > 0.5 ? "GETTING WARMER" :
                                signalStrength > 0.3 ? "COLD" : "SEARCHING..."}
                </Text>

                {/* Visual Bar */}
                <View style={styles.barContainer}>
                    <View style={[styles.barFill, {
                        width: `${Math.max(0, Math.min(100, (rssi + 100) * 1.66))}%`,
                        backgroundColor: orbColor
                    }]} />
                </View>

                {/* Technical Detail */}
                <Text style={styles.dbmText}>Signal Strength: {Math.round(rssi)} dBm • {distanceText}</Text>
            </View>

            {/* Controls */}
            <View style={styles.controlsContainer}>
                <View style={styles.controlRow}>
                    <View style={styles.controlText}>
                        <Text style={styles.controlTitle}>Haptic Guidance</Text>
                        <Text style={styles.controlSubtitle}>Vibrate faster as you get closer</Text>
                    </View>
                    <Switch
                        value={vibrationEnabled}
                        onValueChange={setVibrationEnabled}
                        trackColor={{ false: '#333', true: orbColor }}
                        thumbColor="#FFF"
                    />
                </View>

                <View style={styles.controlRow}>
                    <View style={styles.controlText}>
                        <Text style={styles.controlTitle}>Sound Indicator</Text>
                        <Text style={styles.controlSubtitle}>Play Geiger-counter sound on phone</Text>
                    </View>
                    <Switch
                        value={soundEnabled}
                        onValueChange={setSoundEnabled}
                        trackColor={{ false: '#333', true: orbColor }}
                        thumbColor="#FFF"
                    />
                </View>


                {/* I Found It Button */}
                <TouchableOpacity
                    style={styles.foundButton}
                    onPress={handleFound}
                >
                    <Ionicons name="checkmark-circle" size={24} color="#000" />
                    <Text style={styles.foundButtonText}>I Found It!</Text>
                </TouchableOpacity>
            </View>

            {/* Confetti Overlay */}
            {isFound && <Confetti />}

            {/* Settings Modal */}
            <Modal
                visible={showSettings}
                transparent
                animationType="slide"
                onRequestClose={() => setShowSettings(false)}
            >
                <View style={styles.modalOverlay}>

                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Device Settings</Text>
                            <TouchableOpacity onPress={() => setShowSettings(false)}>
                                <Ionicons name="close" size={24} color="#FFF" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.settingRow}>
                            <View>
                                <Text style={styles.settingLabel}>Notify on Lost</Text>
                                <Text style={styles.settingDesc}>Alert when device signal is lost</Text>
                            </View>
                            <Switch
                                value={deviceSettings?.notifyOnLost || false}
                                onValueChange={() => handleToggleSetting('notifyOnLost')}
                                trackColor={{ false: '#333', true: COLORS.primary }}
                                thumbColor="#FFF"
                            />
                        </View>

                        <Text style={styles.modalNote}>
                            More settings available in the main app settings.
                        </Text>
                    </View>
                </View>
            </Modal>

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
        backgroundColor: '#000',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 60,
        paddingHorizontal: SPACING.m,
        zIndex: 10,
    },
    backButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFF',
        maxWidth: '70%',
        letterSpacing: 1,
    },
    visualizerContainer: {
        height: height * 0.45,
        width: width,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -40, // Pull up slightly
    },
    signalContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.xl,
        height: 100, // Fixed height to prevent layout shifts
    },
    signalValue: {
        fontSize: 48, // Reduced from 64 to prevent cutoff
        fontWeight: 'bold',
        color: '#FFF',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowRadius: 10,
        fontVariant: ['tabular-nums'],
        marginBottom: 8,
    },
    signalLabel: {
        fontSize: 16, // Reduced slightly
        fontWeight: '900',
        letterSpacing: 2,
        marginTop: 4,
        marginBottom: 16,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    barContainer: {
        width: 200,
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 8,
    },
    barFill: {
        height: '100%',
        borderRadius: 3,
    },
    dbmText: {
        fontSize: 12,
        color: '#666',
        fontFamily: 'monospace',
    },
    controlsContainer: {
        flex: 1,
        paddingHorizontal: SPACING.l,
        justifyContent: 'flex-start',
        gap: SPACING.m, // Reduced gap slightly
        paddingBottom: 40,
    },
    controlRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: SPACING.m,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    controlText: {
        flex: 1,
    },
    controlTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
        marginBottom: 4,
    },
    controlSubtitle: {
        fontSize: 12,
        color: '#888',
    },
    settingsButton: {
        padding: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#1A1A1A',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: SPACING.l,
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.l,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFF',
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.l,
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: SPACING.m,
        borderRadius: 12,
    },
    settingLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
        marginBottom: 4,
    },
    settingDesc: {
        fontSize: 12,
        color: '#888',
    },
    historyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: SPACING.m,
        borderRadius: 12,
        gap: 8,
        marginTop: SPACING.s,
    },
    historyButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        padding: SPACING.m,
        borderRadius: 12,
        gap: 8,
        marginTop: SPACING.s,
    },
    actionButtonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalNote: {
        color: COLORS.textSecondary,
        fontSize: 12,
        textAlign: 'center',
        marginTop: SPACING.l,
    },
    foundButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#00FF9D', // Neon Green
        padding: SPACING.l,
        borderRadius: 16,
        gap: 8,
        marginTop: SPACING.m,
        shadowColor: '#00FF9D',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 5,
    },
    foundButtonText: {
        color: '#000',
        fontSize: 18,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
});
