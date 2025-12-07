import { Ionicons } from '@expo/vector-icons';
import { Blur, Canvas, Circle, Group, Paint, RadialGradient, vec } from '@shopify/react-native-skia';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, SPACING } from '../src/constants/theme';
import { useTheme } from '../src/context/ThemeContext';
import { useRadar } from '../src/hooks/useRadar';

const { width, height } = Dimensions.get('window');
const IS_SMALL_DEVICE = width < 380 || height < 700;
const IS_VERY_SHORT = height < 600;

// Aggressively reduced sizes to prevent overlap on small screens
const VISUAL_SIZE = IS_VERY_SHORT ? 140 : IS_SMALL_DEVICE ? 180 : 300;
const NOTIF_WIDTH = IS_SMALL_DEVICE ? 220 : 280;
const SPACING_DYNAMIC = IS_SMALL_DEVICE ? 12 : 32;

// --- Components ---

const RadarAnimation = ({ color }: { color: string }) => {
    const size = VISUAL_SIZE;
    const center = size / 2;
    const rBase = size / 6; // Proportional radius
    const [t, setT] = useState(0);
    useEffect(() => {
        let animationFrameId: number;
        const animate = () => {
            setT(prev => (prev + 0.01) % 2); // Cycle 0 to 2
            animationFrameId = requestAnimationFrame(animate);
        };
        animate();
        return () => cancelAnimationFrame(animationFrameId);
    }, []);

    return (
        <Canvas style={{ width: size, height: size }}>
            {/* Ring 1 */}
            <Group opacity={(2 - t) / 2}>
                <Circle cx={center} cy={center} r={rBase + t * rBase} color={color} style="stroke" strokeWidth={2} />
            </Group>
            {/* Ring 2 (Offset) */}
            <Group opacity={(2 - ((t + 1) % 2)) / 2}>
                <Circle cx={center} cy={center} r={rBase + ((t + 1) % 2) * rBase} color={color} style="stroke" strokeWidth={2} />
            </Group>
            {/* Center Dot */}
            <Circle cx={center} cy={center} r={size * 0.05} color={color}>
                <Paint style="fill" />
                <Blur blur={2} />
            </Circle>
            {/* Scanning Line Effect */}
            <Group origin={{ x: center, y: center }} transform={[{ rotate: t * Math.PI * 2 }]}>
                <Circle cx={center} cy={center} r={size * 0.33} color={color} opacity={0.1}>
                    <RadialGradient
                        c={vec(center, center)}
                        r={size * 0.33}
                        colors={['transparent', color]}
                        positions={[0.8, 1]}
                    />
                </Circle>
            </Group>
        </Canvas>
    );
};

const MockNotification = ({ isDark }: { isDark: boolean }) => {
    const translateY = useRef(new Animated.Value(-50)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.parallel([
                    Animated.timing(translateY, { toValue: 0, duration: 600, useNativeDriver: true, easing: Easing.out(Easing.back(1.5)) }),
                    Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true })
                ]),
                Animated.delay(2000),
                Animated.parallel([
                    Animated.timing(translateY, { toValue: -50, duration: 500, useNativeDriver: true, easing: Easing.in(Easing.cubic) }),
                    Animated.timing(opacity, { toValue: 0, duration: 500, useNativeDriver: true })
                ]),
                Animated.delay(500)
            ])
        ).start();
    }, []);

    return (
        <Animated.View style={[styles.notificationCard, {
            transform: [{ translateY }],
            opacity,
            backgroundColor: isDark ? 'rgba(30,30,30,0.95)' : 'rgba(255,255,255,0.95)',
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
        }]}>
            <View style={styles.notifHeader}>
                <View style={[styles.notifIcon, { backgroundColor: COLORS.primary }]}>
                    <Ionicons name="bluetooth" size={12} color="#FFF" />
                </View>
                <Text style={[styles.notifAppName, { color: isDark ? '#FFF' : '#000' }]}>Find My Device</Text>
                <Text style={styles.notifTime}>now</Text>
            </View>
            <Text style={[styles.notifTitle, { color: isDark ? '#FFF' : '#000' }]}>Device Left Behind</Text>
            <Text style={[styles.notifBody, { color: isDark ? '#CCC' : '#333' }]}>Your Keys were left behind.</Text>
        </Animated.View>
    );
};

const ShieldAnimation = ({ color }: { color: string }) => {
    const scale = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(scale, { toValue: 1.1, duration: 1500, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
                Animated.timing(scale, { toValue: 0.8, duration: 1500, useNativeDriver: true, easing: Easing.inOut(Easing.ease) })
            ])
        ).start();
    }, []);

    return (
        <View style={{ width: VISUAL_SIZE * 0.66, height: VISUAL_SIZE * 0.66, justifyContent: 'center', alignItems: 'center' }}>
            <Animated.View style={{ transform: [{ scale }] }}>
                <Ionicons name="shield-checkmark" size={VISUAL_SIZE * 0.46} color={color} />
            </Animated.View>
            {/* Floating particles */}
            <Canvas style={StyleSheet.absoluteFill}>
                <Circle cx={VISUAL_SIZE * 0.6} cy={VISUAL_SIZE * 0.13} r={4} color={color} opacity={0.6} />
                <Circle cx={VISUAL_SIZE * 0.06} cy={VISUAL_SIZE * 0.53} r={6} color={color} opacity={0.4} />
                <Circle cx={VISUAL_SIZE * 0.53} cy={VISUAL_SIZE * 0.6} r={3} color={color} opacity={0.8} />
            </Canvas>
        </View>
    );
};

const PremiumUnlock = ({ color }: { color: string }) => {
    const pulse = useRef(new Animated.Value(1)).current;
    const rotate = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, { toValue: 1.2, duration: 1500, useNativeDriver: true }),
                Animated.timing(pulse, { toValue: 1, duration: 1500, useNativeDriver: true })
            ])
        ).start();

        Animated.loop(
            Animated.timing(rotate, { toValue: 1, duration: 10000, easing: Easing.linear, useNativeDriver: true })
        ).start();
    }, []);

    const spin = rotate.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
    });

    const size = VISUAL_SIZE;
    const iconOffset = size * 0.35; // How far icons orbit from center

    return (
        <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
            {/* Glowing background */}
            <Animated.View style={{
                position: 'absolute',
                width: size * 0.66,
                height: size * 0.66,
                borderRadius: size * 0.33,
                backgroundColor: color,
                opacity: 0.2,
                transform: [{ scale: pulse }]
            }} />

            {/* Orbiting Icons */}
            <Animated.View style={{
                position: 'absolute',
                width: size * 0.86,
                height: size * 0.86,
                transform: [{ rotate: spin }]
            }}>
                <View style={[styles.orbitIcon, { top: 0, alignSelf: 'center', backgroundColor: color }]}>
                    <Ionicons name="key" size={16} color="#FFF" />
                </View>
                <View style={[styles.orbitIcon, { bottom: size * 0.2, left: size * 0.03, backgroundColor: color }]}>
                    <Ionicons name="wallet" size={16} color="#FFF" />
                </View>
                <View style={[styles.orbitIcon, { bottom: size * 0.2, right: size * 0.03, backgroundColor: color }]}>
                    <Ionicons name="headset" size={16} color="#FFF" />
                </View>
            </Animated.View>

            {/* Central Shield */}
            <View style={[styles.premiumShield, { backgroundColor: color }]}>
                <Ionicons name="shield-checkmark" size={size * 0.2} color="#FFF" />
            </View>
        </View>
    );
};

// --- Main Screen ---

const SLIDES = [
    {
        id: '1',
        title: 'Find Anything\nInstantly',
        description: 'Pinpoint your lost items in seconds with our precision radar technology.',
        type: 'radar',
        trialText: 'Start your 3-day free journey'
    },
    {
        id: '2',
        title: 'Smart\nAlerts',
        description: 'Get notified the moment you leave something behind. We watch your back.',
        type: 'notification',
        trialText: 'Zero payment today'
    },
    {
        id: '3',
        title: 'Total Peace\nof Mind',
        description: 'Unlock full access to history, smart alerts, and background tracking.',
        type: 'premium',
        benefits: ['Limitless History', 'Background Scan', 'Smart Alerts'],
        trialText: '3 Days Free, Cancel Anytime'
    }
];

export default function OnboardingScreen() {
    const router = useRouter();
    const { colors, isDark } = useTheme();
    const { completeOnboarding, showPaywall } = useRadar();
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);
    const scrollX = useRef(new Animated.Value(0)).current;

    const handleNext = async () => {
        if (currentIndex < SLIDES.length - 1) {
            flatListRef.current?.scrollToIndex({
                index: currentIndex + 1,
                animated: true
            });
        } else {
            await showPaywall();
            await completeOnboarding();
            router.replace('/');
        }
    };

    const handleSkip = async () => {
        await completeOnboarding();
        router.replace('/');
    };

    const renderVisual = (type: string) => {
        switch (type) {
            case 'radar': return <RadarAnimation color={COLORS.primary} />;
            case 'notification': return <MockNotification isDark={isDark} />;
            case 'shield': return <ShieldAnimation color={COLORS.success} />;
            case 'premium': return <PremiumUnlock color={COLORS.primary} />; // No text prop needed
            default: return null;
        }
    };

    const renderItem = ({ item, index }: { item: typeof SLIDES[0] & { benefits?: string[] }, index: number }) => {
        return (
            <View style={[styles.slide, { width }]}>
                <View style={styles.visualContainer}>
                    {renderVisual(item.type)}
                </View>

                <View style={styles.textContainer}>
                    {item.benefits && (
                        <View style={{ marginBottom: IS_SMALL_DEVICE ? 4 : 10, alignItems: 'center' }}>
                            {item.benefits.map((benefit, i) => (
                                <Text key={i} style={[styles.benefitText, {
                                    color: colors.text,
                                    fontSize: IS_SMALL_DEVICE ? 14 : 16,
                                    marginVertical: IS_SMALL_DEVICE ? 2 : 4
                                }]}>✓ {benefit}</Text>
                            ))}
                        </View>
                    )}

                    <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
                    <Text style={[styles.description, { color: colors.textSecondary }]}>{item.description}</Text>

                    <View style={[styles.trialBadge, {
                        backgroundColor: isDark ? 'rgba(0, 200, 83, 0.15)' : 'rgba(0, 126, 51, 0.1)',
                        borderColor: isDark ? 'rgba(0, 200, 83, 0.3)' : 'rgba(0, 126, 51, 0.2)'
                    }]}>
                        <Text style={[styles.trialText, { color: isDark ? COLORS.success : '#007E33' }]}>
                            {item.trialText}
                        </Text>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Subtle Ambient Background */}
            <View style={StyleSheet.absoluteFill}>
                <Canvas style={{ flex: 1 }}>
                    <Circle cx={width * 0.5} cy={height * 0.4} r={width * 0.8} opacity={0.08}>
                        <RadialGradient
                            c={vec(width * 0.5, height * 0.4)}
                            r={width * 0.8}
                            colors={[COLORS.primary, 'transparent']}
                        />
                        <Blur blur={80} />
                    </Circle>
                </Canvas>
            </View>

            <View style={styles.header}>
                <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
                    <Text style={[styles.skipText, { color: colors.textSecondary }]}>Skip</Text>
                </TouchableOpacity>
            </View>

            <Animated.FlatList
                ref={flatListRef}
                data={SLIDES}
                renderItem={renderItem}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                    { useNativeDriver: false }
                )}
                onMomentumScrollEnd={(event) => {
                    const index = Math.round(event.nativeEvent.contentOffset.x / width);
                    setCurrentIndex(index);
                }}
                keyExtractor={(item) => item.id}
            />

            <View style={styles.footer}>
                <View style={styles.pagination}>
                    {SLIDES.map((_, index) => {
                        const inputRange = [
                            (index - 1) * width,
                            index * width,
                            (index + 1) * width,
                        ];
                        const dotWidth = scrollX.interpolate({
                            inputRange,
                            outputRange: [8, 24, 8],
                            extrapolate: 'clamp',
                        });
                        const dotColor = scrollX.interpolate({
                            inputRange,
                            outputRange: [colors.border, COLORS.primary, colors.border],
                            extrapolate: 'clamp',
                        });
                        return (
                            <Animated.View
                                key={index}
                                style={[styles.dot, { width: dotWidth, backgroundColor: dotColor }]}
                            />
                        );
                    })}
                </View>

                <TouchableOpacity
                    style={[styles.button, { backgroundColor: COLORS.primary }]}
                    onPress={handleNext}
                >
                    <Text style={styles.buttonText}>
                        {currentIndex === SLIDES.length - 1 ? 'Start 3-Day Free Trial' : 'Continue'}
                    </Text>
                </TouchableOpacity>

                <Text style={[styles.disclaimer, { color: colors.textSecondary }]}>
                    No payment due today
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        height: 60,
        justifyContent: 'center',
        alignItems: 'flex-end',
        paddingHorizontal: SPACING.l,
        marginTop: IS_SMALL_DEVICE ? 10 : 40,
        zIndex: 10,
    },
    skipButton: {
        padding: 8,
    },
    skipText: {
        fontSize: 16,
        fontWeight: '600',
        opacity: 0.6,
    },
    slide: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: IS_SMALL_DEVICE ? 20 : 40,
    },
    visualContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    textContainer: {
        width: '100%',
        paddingHorizontal: SPACING.xl,
        alignItems: 'center',
        marginBottom: IS_SMALL_DEVICE ? 10 : SPACING.xl,
    },
    title: {
        fontSize: IS_SMALL_DEVICE ? 28 : 36,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: IS_SMALL_DEVICE ? 8 : SPACING.m,
        letterSpacing: -1,
        lineHeight: IS_SMALL_DEVICE ? 32 : 42,
    },
    description: {
        fontSize: IS_SMALL_DEVICE ? 15 : 17,
        textAlign: 'center',
        lineHeight: IS_SMALL_DEVICE ? 22 : 26,
        marginBottom: IS_SMALL_DEVICE ? 16 : SPACING.l,
        opacity: 0.8,
        maxWidth: '90%',
    },
    trialBadge: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
    },
    trialText: {
        fontSize: 14,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    footer: {
        padding: SPACING.xl,
        paddingBottom: IS_SMALL_DEVICE ? 20 : 50,
        alignItems: 'center',
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: IS_SMALL_DEVICE ? 16 : SPACING.xl,
        gap: 8,
        height: 10,
        alignItems: 'center',
    },
    dot: {
        height: 8,
        borderRadius: 4,
    },
    button: {
        width: '100%',
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        marginBottom: SPACING.s,
    },
    buttonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    disclaimer: {
        fontSize: 12,
        opacity: 0.6,
        marginTop: 8,
    },
    // Notification Styles
    notificationCard: {
        width: NOTIF_WIDTH,
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 5,
    },
    notifHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    notifIcon: {
        width: 20,
        height: 20,
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    notifAppName: {
        fontSize: 13,
        fontWeight: '600',
        flex: 1,
        textTransform: 'uppercase',
        opacity: 0.7,
    },
    notifTime: {
        fontSize: 12,
        opacity: 0.5,
    },
    notifTitle: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 4,
    },
    notifBody: {
        fontSize: 14,
        lineHeight: 18,
    },
    // Premium Unlock Styles
    orbitIcon: {
        position: 'absolute',
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 6,
    },
    premiumShield: {
        width: VISUAL_SIZE * 0.33,
        height: VISUAL_SIZE * 0.33,
        borderRadius: (VISUAL_SIZE * 0.33) / 5,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 10,
    },
    benefitText: {
        fontSize: 16,
        fontWeight: '600',
        marginVertical: 4,
        opacity: 0.9,
    }
});
