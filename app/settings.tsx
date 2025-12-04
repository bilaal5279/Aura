import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, SPACING } from '../src/constants/theme';
import { useTheme } from '../src/context/ThemeContext';
import { useRadar } from '../src/hooks/useRadar';

export default function SettingsScreen() {
    const router = useRouter();
    const { themeMode, setThemeMode, colors, isDark } = useTheme();
    const { distanceUnit, updateDistanceUnit, backgroundTrackingEnabled, toggleBackgroundTracking, trackedDevices, isPro, showPaywall } = useRadar();

    const handleToggleBackground = (enabled: boolean) => {
        if (!enabled && trackedDevices.size > 0) {
            Alert.alert(
                'Disable Background Tracking?',
                'You have devices currently being tracked. If you disable background tracking, you will NOT receive notifications when they are found or lost.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Turn Off',
                        style: 'destructive',
                        onPress: () => toggleBackgroundTracking(false)
                    }
                ]
            );
        } else {
            toggleBackgroundTracking(enabled);
        }
    };

    const handleRateUs = () => {
        // Placeholder for store review
        Linking.openURL('https://apps.apple.com/app/id123456789'); // Replace with actual ID
    };

    const handleContactUs = () => {
        Linking.openURL('mailto:support@findmydevice.app');
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={[styles.header, { backgroundColor: colors.background }]}>
                <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.card }]}>
                    <Ionicons name="chevron-back" size={28} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Pro Banner */}
                {!isPro && (
                    <TouchableOpacity style={[styles.proBanner, { backgroundColor: isDark ? 'rgba(255, 215, 0, 0.15)' : 'rgba(0, 200, 83, 0.1)' }]} onPress={() => showPaywall()}>
                        <View style={styles.proContent}>
                            <Ionicons name="diamond" size={24} color={isDark ? '#FFD700' : '#00C853'} />
                            <View style={styles.proTextContainer}>
                                <Text style={[styles.proTitle, { color: isDark ? '#FFD700' : '#00C853' }]}>Upgrade to Find My Device Pro</Text>
                                <Text style={[styles.proSubtitle, { color: isDark ? '#FFF' : '#666' }]}>Unlock background tracking & more</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={isDark ? '#FFF' : '#666'} />
                    </TouchableOpacity>
                )}

                {/* Appearance */}
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Appearance</Text>
                <View style={[styles.section, { backgroundColor: colors.card }]}>
                    <View style={styles.row}>
                        <Text style={[styles.label, { color: colors.text }]}>Theme</Text>
                        <View style={[styles.toggleGroup, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)' }]}>
                            {(['light', 'dark', 'system'] as const).map((mode) => (
                                <TouchableOpacity
                                    key={mode}
                                    style={[
                                        styles.toggleButton,
                                        themeMode === mode && { backgroundColor: colors.background } // Use background color for active state
                                    ]}
                                    onPress={() => setThemeMode(mode)}
                                >
                                    <Text style={[
                                        styles.toggleText,
                                        themeMode === mode && { color: colors.text, fontWeight: 'bold' }
                                    ]}>
                                        {mode.charAt(0).toUpperCase() + mode.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>

                {/* Preferences */}
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Preferences</Text>
                <View style={[styles.section, { backgroundColor: colors.card }]}>
                    <View style={styles.row}>
                        <Text style={[styles.label, { color: colors.text }]}>Distance Unit</Text>
                        <View style={[styles.toggleGroup, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)' }]}>
                            {(['auto', 'meters', 'feet'] as const).map((unit) => (
                                <TouchableOpacity
                                    key={unit}
                                    style={[
                                        styles.toggleButton,
                                        distanceUnit === unit && { backgroundColor: colors.background }
                                    ]}
                                    onPress={() => updateDistanceUnit(unit)}
                                >
                                    <Text style={[
                                        styles.toggleText,
                                        distanceUnit === unit && { color: colors.text, fontWeight: 'bold' }
                                    ]}>
                                        {unit.charAt(0).toUpperCase() + unit.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>

                {/* Background Tracking */}
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Background</Text>
                <View style={[styles.section, { backgroundColor: colors.card }]}>
                    <View style={styles.row}>
                        <View style={{ flex: 1, paddingRight: 16 }}>
                            <Text style={[styles.label, { color: colors.text }]}>Background Tracking</Text>
                            <Text style={[styles.description, { color: colors.textSecondary }]}>
                                Allow scanning for devices while the app is in the background. Required for notifications.
                            </Text>
                        </View>
                        <Switch
                            value={backgroundTrackingEnabled}
                            onValueChange={handleToggleBackground}
                            trackColor={{ false: colors.border, true: COLORS.primary }}
                            thumbColor={backgroundTrackingEnabled ? '#fff' : '#f4f3f4'}
                        />
                    </View>
                </View>

                {/* Support */}
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Support</Text>
                <View style={[styles.section, { backgroundColor: colors.card }]}>
                    <TouchableOpacity style={styles.row} onPress={handleRateUs}>
                        <Text style={[styles.label, { color: colors.text }]}>Rate Us</Text>
                        <Ionicons name="star-outline" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                    <View style={[styles.separator, { backgroundColor: colors.border }]} />
                    <TouchableOpacity style={styles.row} onPress={handleContactUs}>
                        <Text style={[styles.label, { color: colors.text }]}>Contact Us</Text>
                        <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                <Text style={[styles.version, { color: colors.textSecondary }]}>Version 1.0.0</Text>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 60,
        paddingHorizontal: SPACING.m,
        paddingBottom: SPACING.l,
    },
    backButton: {
        padding: 8,
        borderRadius: 20,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    content: {
        padding: SPACING.m,
    },
    proBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: SPACING.m,
        borderRadius: 16,
        marginBottom: SPACING.xl,
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.3)',
    },
    proContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.m,
    },
    proTextContainer: {
        gap: 2,
    },
    proTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    proSubtitle: {
        fontSize: 12,
        opacity: 0.8,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: SPACING.s,
        marginLeft: SPACING.s,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    section: {
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: SPACING.xl,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.m,
    },
    separator: {
        height: 1,
        marginLeft: SPACING.m,
    },
    label: {
        fontSize: 16,
    },
    description: {
        fontSize: 12,
        marginTop: 4,
    },
    toggleGroup: {
        flexDirection: 'row',
        borderRadius: 8,
        padding: 2,
    },
    toggleButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
    },
    toggleText: {
        fontSize: 12,
        color: '#A0A0A0',
    },
    version: {
        textAlign: 'center',
        fontSize: 12,
        marginTop: SPACING.xl,
    },
});
