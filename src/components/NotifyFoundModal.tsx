import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, SPACING } from '../constants/theme';
import { GlassCard } from './GlassCard';

interface NotifyFoundModalProps {
    visible: boolean;
    deviceName: string;
    onClose: () => void;
    onConfirm: () => void;
}

export const NotifyFoundModal: React.FC<NotifyFoundModalProps> = ({ visible, deviceName, onClose, onConfirm }) => {
    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.container}>
                <GlassCard width={320} height={350} intensity={40} style={styles.card}>
                    <View style={styles.content}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="notifications-outline" size={48} color={COLORS.primary} />
                        </View>

                        <Text style={styles.title}>Device Lost</Text>
                        <Text style={styles.message}>
                            "{deviceName}" is currently out of range. Would you like to be notified when it is found?
                        </Text>

                        <View style={styles.buttonContainer}>
                            <TouchableOpacity onPress={onConfirm} style={styles.confirmButton}>
                                <Text style={styles.confirmButtonText}>Notify Me</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
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
        backgroundColor: 'rgba(0,0,0,0.85)', // Much darker overlay
    },
    card: {
        borderRadius: 24,
        backgroundColor: 'rgba(20, 20, 20, 0.95)', // Solid dark background for the card itself
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    content: {
        flex: 1,
        padding: SPACING.l,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainer: {
        marginBottom: SPACING.m,
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(0, 255, 157, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0, 255, 157, 0.3)',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: SPACING.s,
        textAlign: 'center',
    },
    message: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: SPACING.xl,
        lineHeight: 20,
    },
    buttonContainer: {
        width: '100%',
        gap: SPACING.m,
    },
    confirmButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    confirmButtonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: 'bold',
    },
    cancelButton: {
        paddingVertical: 10,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: COLORS.textSecondary,
        fontSize: 14,
    },
});
