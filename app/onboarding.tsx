import { Ionicons } from '@expo/vector-icons';
import { Blur, Canvas, Circle, Group, LinearGradient, Paint, RadialGradient, Rect, vec } from '@shopify/react-native-skia';
import * as Linking from 'expo-linking';
import { Stack, useRouter } from 'expo-router';
import * as StoreReview from 'expo-store-review';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, SPACING } from '../src/constants/theme';
import { useTheme } from '../src/context/ThemeContext';
import { useRadar } from '../src/hooks/useRadar';

const { width, height } = Dimensions.get('window');
const IS_SMALL_DEVICE = width < 380 || height < 700;
const IS_VERY_SHORT = height < 600;

const VISUAL_SIZE = IS_VERY_SHORT ? 120 : IS_SMALL_DEVICE ? 160 : 220;
const NOTIF_WIDTH = IS_SMALL_DEVICE ? 220 : 280;

// --- Components (Same as before) ---

const RadarAnimation = ({ color }: { color: string }) => {
    const size = VISUAL_SIZE;
    const center = size / 2;
    const rBase = size / 6;
    const [t, setT] = useState(0);
    useEffect(() => {
        let animationFrameId: number;
        const animate = () => {
            setT(prev => (prev + 0.01) % 2);
            animationFrameId = requestAnimationFrame(animate);
        };
        animate();
        return () => cancelAnimationFrame(animationFrameId);
    }, []);

    return (
        <Canvas style={{ width: size, height: size }}>
            <Group opacity={(2 - t) / 2}>
                <Circle cx={center} cy={center} r={rBase + t * rBase} color={color} style="stroke" strokeWidth={2} />
            </Group>
            <Group opacity={(2 - ((t + 1) % 2)) / 2}>
                <Circle cx={center} cy={center} r={rBase + ((t + 1) % 2) * rBase} color={color} style="stroke" strokeWidth={2} />
            </Group>
            <Circle cx={center} cy={center} r={size * 0.05} color={color}>
                <Paint style="fill" />
                <Blur blur={2} />
            </Circle>
            <Group origin={{ x: center, y: center }} transform={[{ rotate: t * Math.PI * 2 }]}>
                <Circle cx={center} cy={center} r={size * 0.33} color={color} opacity={0.1}>
                    <React.Fragment>
                        <RadialGradient
                            c={vec(center, center)}
                            r={size * 0.33}
                            colors={['transparent', color]}
                            positions={[0.8, 1]}
                        />
                    </React.Fragment>
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
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, { toValue: 1.15, duration: 1500, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
                Animated.timing(pulse, { toValue: 1, duration: 1500, useNativeDriver: true, easing: Easing.inOut(Easing.ease) })
            ])
        ).start();
    }, []);

    return (
        <View style={{ width: VISUAL_SIZE, height: VISUAL_SIZE, justifyContent: 'center', alignItems: 'center' }}>
            <Animated.View style={[styles.premiumShield, {
                backgroundColor: color,
                width: VISUAL_SIZE * 0.5,
                height: VISUAL_SIZE * 0.5,
                borderRadius: (VISUAL_SIZE * 0.5) / 2.5,
                transform: [{ scale: pulse }]
            }]}>
                <Ionicons name="shield-checkmark" size={VISUAL_SIZE * 0.25} color="#FFF" />
            </Animated.View>
            <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
                <Circle cx={VISUAL_SIZE / 2} cy={VISUAL_SIZE / 2} r={VISUAL_SIZE * 0.4} opacity={0.3} color={color}>
                    <Blur blur={20} />
                </Circle>
            </Canvas>
        </View>
    );
};

const HowItWorksDemo = ({ color, textColor }: { color: string, textColor: string }) => {
    const [simulatedStrength, setSimulatedStrength] = useState(0);
    const ORB_BASE_RADIUS = VISUAL_SIZE * 0.2;

    useEffect(() => {
        let start = Date.now();
        const duration = 4000;
        const animate = () => {
            // ... logic same as before ... 
            const now = Date.now();
            const elapsed = (now - start) % duration;
            const progress = elapsed / duration;
            setSimulatedStrength(progress < 0.75 ? progress / 0.75 : 1);
            requestAnimationFrame(animate);
        };
        const frame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frame);
    }, []);

    const getOrbColor = (strength: number) => {
        if (strength > 0.8) return '#00FF9D';
        if (strength > 0.5) return '#00E0FF';
        return '#FF0055';
    };
    const orbColor = getOrbColor(simulatedStrength);
    const percentage = Math.round(simulatedStrength * 100);

    return (
        <View style={{ width: VISUAL_SIZE, height: VISUAL_SIZE * 1.2, justifyContent: 'center', alignItems: 'center' }}>
            {/* ... Canvas code ... */}
            <Canvas style={{ width: VISUAL_SIZE, height: VISUAL_SIZE }}>
                <Circle cx={VISUAL_SIZE / 2} cy={VISUAL_SIZE / 2} r={ORB_BASE_RADIUS + (simulatedStrength * (ORB_BASE_RADIUS * 0.3))} color={orbColor} opacity={0.8}><Blur blur={10} /></Circle>
                <Circle cx={VISUAL_SIZE / 2} cy={VISUAL_SIZE / 2} r={ORB_BASE_RADIUS * 0.5} color="#FFF" opacity={0.9} />
                {/* Simplified for brevity in this replace, fully implementing though */}
            </Canvas>
            <View style={{ alignItems: 'center', marginTop: -30 }}>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: textColor, fontVariant: ['tabular-nums'] }}>{percentage}%</Text>
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
        title: 'How It\nWorks',
        description: 'Walk around and watch the signal strength rise as you get closer to your lost item.',
        type: 'demo',
        trialText: 'Simple & Effective'
    },
    {
        id: '4',
        title: 'Start your\nFree Trial',
        description: '', // Desc empty for Paywall, handled in custom view
        type: 'hard_paywall',
        trialText: ''
    }
];

export default function OnboardingScreen() {
    const router = useRouter();
    const { colors, isDark } = useTheme();
    const { completeOnboarding, currentOffering, purchasePackage, restorePro } = useRadar();
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);
    const scrollX = useRef(new Animated.Value(0)).current;

    // Prevent multiple modal triggers & Back Navigation on Paywall
    const hasGuidedToReview = useRef(false);

    // Paywall State
    const isPaywall = currentIndex === SLIDES.length - 1;

    // Disable scrolling when on Paywall to prevent going back
    const isScrollEnabled = currentIndex !== SLIDES.length - 1;

    const handleNext = async () => {
        if (currentIndex < SLIDES.length - 1) {
            flatListRef.current?.scrollToIndex({
                index: currentIndex + 1,
                animated: true
            });
        } else {
            handlePurchase();
        }
    };

    const handlePurchase = async () => {
        const pkg = currentOffering?.availablePackages?.find(p => p.identifier === '$rc_weekly') || currentOffering?.availablePackages?.[0];
        if (pkg) {
            try {
                await purchasePackage(pkg);
                await completeOnboarding();
                router.replace('/');
            } catch (e) {
                console.log(e);
            }
        }
    };

    const handleRestore = async () => {
        try {
            await restorePro();
            await completeOnboarding(); // CRITICAL: Mark onboarding as done!
            alert("Restored successfully!");
            router.replace('/');
        } catch (e) {
            alert("No purchases to restore or failed.");
        }
    };

    const renderItem = ({ item }: { item: typeof SLIDES[0] & { benefits?: string[] } }) => {
        const isItemPaywall = item.type === 'hard_paywall';

        if (isItemPaywall) {
            return (
                <View style={[styles.slide, { width }]}>
                    <View style={[styles.paywallContainer]}>
                        <View style={{ alignItems: 'center', marginBottom: IS_SMALL_DEVICE ? 16 : SPACING.l }}>
                            <PremiumUnlock color={COLORS.primary} />
                            <Text style={[styles.paywallTitle, { color: colors.text }]}>
                                Start your free 3 day trial
                            </Text>
                        </View>

                        <View style={styles.featuresList}>
                            {[
                                'Identify Devices Instantly',
                                'Unlimited Tracking',
                                'Smart Background Alerts',
                                'Distance Indicators'
                            ].map((feature, i) => (
                                <View key={i} style={styles.featureItem}>
                                    <View style={styles.checkCircle}>
                                        <Ionicons name="checkmark" size={14} color="#000" />
                                    </View>
                                    <Text style={[styles.featureText, { color: colors.text }]}>{feature}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Spacer to clear footer */}
                    <View style={{ height: 260 }} />
                </View>
            );
        }

        return (
            <View style={[styles.slide, { width }]}>
                <View style={styles.visualContainer}>
                    {item.type === 'radar' && <RadarAnimation color={COLORS.primary} />}
                    {item.type === 'notification' && <MockNotification isDark={isDark} />}
                    {item.type === 'shield' && <ShieldAnimation color={COLORS.success} />}
                    {item.type === 'demo' && <HowItWorksDemo color={COLORS.primary} textColor={colors.text} />}
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

                {/* Spacer for Shared Footer */}
                <View style={{ height: 200 }} />
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={StyleSheet.absoluteFill}>
                <Canvas style={{ flex: 1 }}>
                    <Circle cx={width * 0.5} cy={height * 0.4} r={width * 0.8} opacity={0.08}>
                        <React.Fragment>
                            <RadialGradient
                                c={vec(width * 0.5, height * 0.4)}
                                r={width * 0.8}
                                colors={[COLORS.primary, 'transparent']}
                            />
                        </React.Fragment>
                        <Blur blur={80} />
                    </Circle>
                </Canvas>
            </View>

            {/* No Header */}
            <View style={{ height: IS_SMALL_DEVICE ? 20 : 60, marginTop: IS_SMALL_DEVICE ? 10 : 40 }} />

            <Animated.FlatList
                ref={flatListRef}
                data={SLIDES}
                renderItem={renderItem}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                scrollEnabled={isScrollEnabled} // CRITICAL: Disable scroll on last slide
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                    { useNativeDriver: false }
                )}
                onMomentumScrollEnd={async (event) => {
                    const index = Math.round(event.nativeEvent.contentOffset.x / width);
                    setCurrentIndex(index);

                    // Logic: Only fire review once per session
                    if (index === 1 && !hasGuidedToReview.current) {
                        hasGuidedToReview.current = true;
                        try { if (await StoreReview.hasAction()) await StoreReview.requestReview(); } catch (e) { }
                    }
                }}
                keyExtractor={item => item.id}
                initialNumToRender={1}
                windowSize={3}
            />

            {/* UNIFIED FOOTER - Always visible */}
            <View style={[styles.footer, { position: 'absolute', bottom: 0, width: '100%' }]}>

                {isPaywall && (
                    <Text style={[styles.smallPricingText, { color: colors.textSecondary }]}>
                        Start Device Finder with unlimited limits for just $4.99 a week
                    </Text>
                )}

                <View style={styles.pagination}>
                    {SLIDES.map((_, index) => {
                        const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
                        const dotWidth = scrollX.interpolate({ inputRange, outputRange: [8, 24, 8], extrapolate: 'clamp' });
                        const dotColor = scrollX.interpolate({ inputRange, outputRange: [colors.border, COLORS.primary, colors.border], extrapolate: 'clamp' });
                        return <Animated.View key={index} style={[styles.dot, { width: dotWidth, backgroundColor: dotColor }]} />;
                    })}
                </View>

                <TouchableOpacity
                    style={[styles.premiumButton, {
                        shadowColor: COLORS.primary,
                        backgroundColor: isPaywall ? 'transparent' : COLORS.primary,
                        overflow: 'hidden'
                    }]}
                    onPress={handleNext}
                    activeOpacity={0.9}
                >
                    {isPaywall && (
                        <Canvas style={StyleSheet.absoluteFill}>
                            <Rect x={0} y={0} width={width} height={60}>
                                <LinearGradient
                                    start={vec(0, 0)}
                                    end={vec(width, 0)}
                                    colors={[COLORS.primary, COLORS.secondary]}
                                />
                            </Rect>
                        </Canvas>
                    )}
                    <Text style={styles.premiumButtonText}>
                        {isPaywall ? 'Start 3-Day Free Trial' : 'Continue'}
                    </Text>
                </TouchableOpacity>

                {isPaywall ? (
                    <View style={styles.linksRow}>
                        <TouchableOpacity onPress={() => Linking.openURL('https://digitalsprout.org/findmydevice/terms-of-service')}>
                            <Text style={[styles.linkTextPremium, { color: colors.textSecondary }]}>Terms of Use</Text>
                        </TouchableOpacity>
                        <Text style={{ color: colors.textSecondary, marginHorizontal: 8 }}>•</Text>
                        <TouchableOpacity onPress={handleRestore}>
                            <Text style={[styles.linkTextPremium, { color: colors.textSecondary }]}>Restore</Text>
                        </TouchableOpacity>
                        <Text style={{ color: colors.textSecondary, marginHorizontal: 8 }}>•</Text>
                        <TouchableOpacity onPress={() => Linking.openURL('https://digitalsprout.org/findmydevice/privacy-policy')}>
                            <Text style={[styles.linkTextPremium, { color: colors.textSecondary }]}>Privacy Policy</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <Text style={[styles.disclaimer, { color: colors.textSecondary }]}>No payment due today</Text>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    slide: { flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingBottom: 0 },
    visualContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%', marginTop: -40 },
    textContainer: { width: '100%', paddingHorizontal: SPACING.xl, alignItems: 'center', marginBottom: IS_SMALL_DEVICE ? 10 : SPACING.xl },
    title: { fontSize: IS_SMALL_DEVICE ? 24 : 36, fontWeight: '800', textAlign: 'center', marginBottom: IS_SMALL_DEVICE ? 8 : SPACING.m, letterSpacing: -1, lineHeight: IS_SMALL_DEVICE ? 32 : 42 },
    description: { fontSize: IS_SMALL_DEVICE ? 15 : 17, textAlign: 'center', lineHeight: IS_SMALL_DEVICE ? 22 : 26, marginBottom: IS_SMALL_DEVICE ? 16 : SPACING.l, opacity: 0.8, maxWidth: '90%' },
    trialBadge: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1 },
    trialText: { fontSize: 14, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
    footer: { padding: SPACING.xl, paddingBottom: IS_SMALL_DEVICE ? 20 : 50, alignItems: 'center' },
    pagination: { flexDirection: 'row', justifyContent: 'center', marginBottom: 16, gap: 8, height: 10, alignItems: 'center' },
    dot: { height: 8, borderRadius: 4 },
    premiumButton: { width: '100%', height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 10, marginBottom: 8 },
    premiumButtonText: { color: '#FFF', fontSize: 18, fontWeight: '800', letterSpacing: 0.5, zIndex: 2 },
    disclaimer: { fontSize: 12, opacity: 0.6, marginTop: 8 },
    linksRow: { flexDirection: 'row', alignItems: 'center', opacity: 0.8, marginTop: 8 },
    linkTextPremium: { fontSize: 12, fontWeight: '500' },
    notificationCard: { width: NOTIF_WIDTH, padding: 12, borderRadius: 16, borderWidth: 1, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 5 },
    notifHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    notifIcon: { width: 20, height: 20, borderRadius: 5, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
    notifAppName: { fontSize: 13, fontWeight: '600', flex: 1, textTransform: 'uppercase', opacity: 0.7 },
    notifTime: { fontSize: 12, opacity: 0.5 },
    notifTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
    notifBody: { fontSize: 14, lineHeight: 18 },
    premiumShield: { justifyContent: 'center', alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 10 },
    paywallContainer: { width: '100%', alignItems: 'center', flex: 1, paddingHorizontal: 20, paddingTop: IS_SMALL_DEVICE ? 20 : 60, justifyContent: 'flex-start' },
    paywallTitle: { fontSize: 34, fontWeight: '900', textAlign: 'center', letterSpacing: -0.5, lineHeight: 40, maxWidth: 300, marginTop: 16 },
    featuresList: { width: '100%', paddingHorizontal: 20, gap: 16, marginTop: 24 },
    featureItem: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    checkCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
    featureText: { fontSize: 17, fontWeight: '600', letterSpacing: 0.3 },
    smallPricingText: { fontSize: 13, fontWeight: '500', textAlign: 'center', maxWidth: '85%', letterSpacing: 0.2, marginBottom: 12 },
});
