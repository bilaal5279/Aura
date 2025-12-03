import React, { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { PaywallModal } from '../src/components/PaywallModal';
import { COLORS, SPACING } from '../src/constants/theme';
import { bleService } from '../src/services/ble/BleService';

export default function SettingsScreen() {
    const [isEnabled, setIsEnabled] = useState(false);
    const [showPaywall, setShowPaywall] = useState(false);
    const [isPro, setIsPro] = useState(true); // Mock pro status

    const toggleSwitch = async () => {
        if (!isEnabled) {
            if (!isPro) {
                setShowPaywall(true);
                return;
            }
            await bleService.startBackgroundTracking();
        }
        setIsEnabled(previousState => !previousState);
    };

    const handlePurchase = () => {
        // Mock purchase
        setIsPro(true);
        setShowPaywall(false);
        setIsEnabled(true);
        bleService.startBackgroundTracking();
    };

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Preferences</Text>

            <View style={styles.row}>
                <Text style={styles.label}>Background Tracking</Text>
                <Switch
                    trackColor={{ false: '#767577', true: COLORS.primary }}
                    thumbColor={isEnabled ? '#f4f3f4' : '#f4f3f4'}
                    ios_backgroundColor="#3e3e3e"
                    onValueChange={toggleSwitch}
                    value={isEnabled}
                />
            </View>

            <Text style={styles.description}>
                Enable to receive alerts when you leave your devices behind.
            </Text>

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
        padding: SPACING.m,
    },
    header: {
        fontSize: 24,
        color: COLORS.text,
        fontWeight: 'bold',
        marginBottom: SPACING.l,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.s,
        paddingVertical: SPACING.s,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.glass.border,
    },
    label: {
        fontSize: 18,
        color: COLORS.text,
    },
    description: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
});
