import { Ionicons } from '@expo/vector-icons';
import { Blur, Canvas, Circle, vec } from '@shopify/react-native-skia';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { Easing, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { SPACING } from '../../src/constants/theme';
import { useRadar } from '../../src/hooks/useRadar';

const { width, height } = Dimensions.get('window');
const CENTER = vec(width / 2, height / 3);

export default function DeviceDetailScreen() {
    const { id, name } = useLocalSearchParams();
    const router = useRouter();
    const { devices } = useRadar();

    // Persist last known device data to prevent UI flickering/crash
    const lastKnownDevice = useRef<any>(null);
    const deviceData = devices.find(d => d.device.id === id);

    if (deviceData) {
        lastKnownDevice.current = deviceData;
    }

    // Use live data or fallback to last known
    const activeDevice = deviceData || lastKnownDevice.current;

    const rssi = activeDevice?.rssi || -100;
    const deviceName = activeDevice?.device.name || activeDevice?.device.localName || (name as string) || 'Unknown Device';

    // Calibration: -100 (Far) to -50 (Near)
    // Normalized 0 to 1
    const signalStrength = Math.max(0, Math.min(1, (rssi + 100) / 50));

    const [soundEnabled, setSoundEnabled] = useState(false);
    const [vibrationEnabled, setVibrationEnabled] = useState(true);
    const [sound, setSound] = useState<Audio.Sound>();

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
                    { uri: 'https://cdn.freesound.org/previews/352/352651_4019029-lq.mp3' }
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
        const intervalMs = 2000 - (signalStrength * 1800); // 2000ms (Far) to 200ms (Near)

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
        }, Math.max(200, intervalMs));

        return () => clearInterval(interval);
    }, [signalStrength, vibrationEnabled, soundEnabled, sound]);

    // Dynamic Color
    const getOrbColor = (strength: number) => {
        if (strength > 0.8) return '#00FF9D'; // Neon Green (Near)
        if (strength > 0.5) return '#00E0FF'; // Cyan (Mid)
        return '#FF0055'; // Neon Red (Far)
    };

    const orbColor = getOrbColor(signalStrength);

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
                <View style={{ width: 28 }} />
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
                <Text style={styles.dbmText}>Signal Strength: {Math.round(rssi)} dBm</Text>
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
                        <Text style={styles.controlSubtitle}>Geiger-counter style audio feedback</Text>
                    </View>
                    <Switch
                        value={soundEnabled}
                        onValueChange={setSoundEnabled}
                        trackColor={{ false: '#333', true: orbColor }}
                        thumbColor="#FFF"
                    />
                </View>
            </View>
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
        height: height * 0.5,
        width: width,
        alignItems: 'center',
        justifyContent: 'center',
    },
    signalContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.xl,
        height: 80,
    },
    signalValue: {
        fontSize: 64,
        fontWeight: 'bold',
        color: '#FFF',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowRadius: 10,
        fontVariant: ['tabular-nums'],
    },
    signalLabel: {
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: 3,
        marginTop: 4,
        marginBottom: 16,
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
        gap: SPACING.l,
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
});
