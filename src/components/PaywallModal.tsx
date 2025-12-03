import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, SPACING } from '../constants/theme';
import { GlassCard } from './GlassCard';

interface PaywallModalProps {
    visible: boolean;
    onClose: () => void;
    onPurchase: () => void;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({ visible, onClose, onPurchase }) => {
    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.container}>
                <GlassCard width={350} height={500} intensity={30} style={styles.card}>
                    <View style={styles.content}>
                        <Text style={styles.title}>Aura Prime</Text>
                        <Text style={styles.subtitle}>Unlock Invisible Intelligence</Text>

                        <View style={styles.features}>
                            <Text style={styles.feature}>• Background Separation Alerts</Text>
                            <Text style={styles.feature}>• Time Machine Location History</Text>
                            <Text style={styles.feature}>• Precision Radar Distance</Text>
                        </View>

                        <TouchableOpacity onPress={onPurchase} style={styles.button}>
                            <Text style={styles.buttonText}>Upgrade for $4.99/mo</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Text style={styles.closeText}>Maybe Later</Text>
                        </TouchableOpacity>
                    </View>
                </GlassCard>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.8)',
    },
    card: {
        borderRadius: 30,
    },
    content: {
        flex: 1,
        padding: SPACING.xl,
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    title: {
        fontSize: 32,
        color: COLORS.primary,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 18,
        color: COLORS.textSecondary,
        marginBottom: SPACING.l,
        textAlign: 'center',
    },
    features: {
        alignSelf: 'flex-start',
        marginBottom: SPACING.xl,
    },
    feature: {
        fontSize: 16,
        color: COLORS.text,
        marginBottom: SPACING.s,
    },
    button: {
        backgroundColor: COLORS.primary,
        paddingVertical: SPACING.m,
        paddingHorizontal: SPACING.xl,
        borderRadius: 15,
        width: '100%',
        alignItems: 'center',
    },
    buttonText: {
        color: '#000',
        fontSize: 18,
        fontWeight: 'bold',
    },
    closeButton: {
        marginTop: SPACING.m,
    },
    closeText: {
        color: COLORS.textSecondary,
        fontSize: 16,
    },
});
