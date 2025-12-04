import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PaywallModal } from '../src/components/PaywallModal';
import { COLORS, SPACING } from '../src/constants/theme';
import { useRadar } from '../src/hooks/useRadar';

export default function SettingsScreen() {
    const router = useRouter();
    const { distanceUnit, updateDistanceUnit } = useRadar();
    const [showPaywall, setShowPaywall] = useState(false);
    const [isPro, setIsPro] = useState(false); // Mock pro status

    const handlePurchase = () => {
        setIsPro(true);
        setShowPaywall(false);
    };

    const handleRateUs = () => {
        // Placeholder for store review
        Linking.openURL('https://apps.apple.com/app/id123456789'); // Replace with actual ID
    };

    const handleContactUs = () => {
        Linking.openURL('mailto:support@aura.app');
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Settings</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Pro Banner */}
                {!isPro && (
                    <TouchableOpacity style={styles.proBanner} onPress={() => setShowPaywall(true)}>
                        <View style={styles.proContent}>
                            <Ionicons name="diamond" size={24} color="#FFD700" />
                            <View style={styles.proTextContainer}>
                                <Text style={styles.proTitle}>Upgrade to Aura Pro</Text>
                                <Text style={styles.proSubtitle}>Unlock background tracking & more</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#FFF" />
                    </TouchableOpacity>
                )}

                {/* Preferences */}
                <Text style={styles.sectionTitle}>Preferences</Text>
                <View style={styles.section}>
                    <View style={styles.row}>
                        <Text style={styles.label}>Distance Unit</Text>
                        <View style={styles.toggleGroup}>
                            {(['auto', 'meters', 'feet'] as const).map((unit) => (
                                <TouchableOpacity
                                    key={unit}
                                    style={[
                                        styles.toggleButton,
                                        distanceUnit === unit && styles.toggleButtonActive
                                    ]}
                                    onPress={() => updateDistanceUnit(unit)}
                                >
                                    <Text style={[
                                        styles.toggleText,
                                        distanceUnit === unit && styles.toggleTextActive
                                    ]}>
                                        {unit.charAt(0).toUpperCase() + unit.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>

                {/* Support */}
                <Text style={styles.sectionTitle}>Support</Text>
                <View style={styles.section}>
                    <TouchableOpacity style={styles.row} onPress={handleRateUs}>
                        <Text style={styles.label}>Rate Us</Text>
                        <Ionicons name="star-outline" size={20} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                    <View style={styles.separator} />
                    <TouchableOpacity style={styles.row} onPress={handleContactUs}>
                        <Text style={styles.label}>Contact Us</Text>
                        <Ionicons name="mail-outline" size={20} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                </View>

                <Text style={styles.version}>Version 1.0.0</Text>
            </ScrollView>

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
        paddingBottom: SPACING.l,
    },
    backButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFF',
    },
    content: {
        padding: SPACING.m,
    },
    proBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255, 215, 0, 0.15)',
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
        color: '#FFD700',
    },
    proSubtitle: {
        fontSize: 12,
        color: '#FFF',
        opacity: 0.8,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textSecondary,
        marginBottom: SPACING.s,
        marginLeft: SPACING.s,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    section: {
        backgroundColor: 'rgba(255,255,255,0.05)',
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
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginLeft: SPACING.m,
    },
    label: {
        fontSize: 16,
        color: '#FFF',
    },
    toggleGroup: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 8,
        padding: 2,
    },
    toggleButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
    },
    toggleButtonActive: {
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    toggleText: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    toggleTextActive: {
        color: '#FFF',
        fontWeight: '600',
    },
    version: {
        textAlign: 'center',
        color: COLORS.textSecondary,
        fontSize: 12,
        marginTop: SPACING.xl,
    },
});
