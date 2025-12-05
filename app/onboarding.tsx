import { Ionicons } from '@expo/vector-icons';
import { Blur, Canvas, Circle, Group, Paint, RadialGradient, vec } from '@shopify/react-native-skia';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, SPACING } from '../src/constants/theme';
import { useTheme } from '../src/context/ThemeContext';
import { useRadar } from '../src/hooks/useRadar';

const { width, height } = Dimensions.get('window');

// --- Components ---

const RadarAnimation = ({ color }: { color: string }) => {
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
        <Canvas style={{ width: 300, height: 300 }}>
            {/* Ring 1 */}
            <Group opacity={(2 - t) / 2}>
                <Circle cx={150} cy={150} r={50 + t * 50} color={color} style="stroke" strokeWidth={2} />
            </Group>
            {/* Ring 2 (Offset) */}
            <Group opacity={(2 - ((t + 1) % 2)) / 2}>
                <Circle cx={150} cy={150} r={50 + ((t + 1) % 2) * 50} color={color} style="stroke" strokeWidth={2} />
            </Group>
            {/* Center Dot */}
            <Circle cx={150} cy={150} r={15} color={color}>
                <Paint style="fill" />
                <Blur blur={2} />
            </Circle>
            {/* Scanning Line Effect */}
            <Group origin={{ x: 150, y: 150 }} transform={[{ rotate: t * Math.PI * 2 }]}>
                <Circle cx={150} cy={150} r={100} color={color} opacity={0.1}>
                    <RadialGradient
                        c={vec(150, 150)}
                        r={100}
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
        <View style={{ width: 200, height: 200, justifyContent: 'center', alignItems: 'center' }}>
            <Animated.View style={{ transform: [{ scale }] }}>
                <Ionicons name="shield-checkmark" size={140} color={color} />
            </Animated.View>
            {/* Floating particles */}
            <Canvas style={StyleSheet.absoluteFill}>
                <Circle cx={180} cy={40} r={4} color={color} opacity={0.6} />
                <Circle cx={20} cy={160} r={6} color={color} opacity={0.4} />
                <Circle cx={160} cy={180} r={3} color={color} opacity={0.8} />
            </Canvas>
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
        title: 'Total\nProtection',
        description: 'Enjoy peace of mind knowing your valuables are always monitored and secure.',
        type: 'shield',
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
            default: return null;
        }
    };

    const renderItem = ({ item, index }: { item: typeof SLIDES[0], index: number }) => {
        return (
            <View style={[styles.slide, { width }]}>
                <View style={styles.visualContainer}>
                    {renderVisual(item.type)}
                </View>

                <View style={styles.textContainer}>
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
        marginTop: 40,
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
        paddingBottom: 40,
    },
    visualContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        // backgroundColor: 'rgba(255,0,0,0.1)', // Debug
    },
    textContainer: {
        width: '100%',
        paddingHorizontal: SPACING.xl,
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    title: {
        fontSize: 36,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: SPACING.m,
        letterSpacing: -1,
        lineHeight: 42,
    },
    description: {
        fontSize: 17,
        textAlign: 'center',
        lineHeight: 26,
        marginBottom: SPACING.l,
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
        paddingBottom: 50,
        alignItems: 'center',
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: SPACING.xl,
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
        width: 280,
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
    }
});
