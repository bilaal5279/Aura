import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, SPACING } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { GlassCard } from './GlassCard';

interface NotifyFoundModalProps {
    visible: boolean;
    deviceName: string;
    onClose: () => void;
    onConfirm: () => void;
}

export const NotifyFoundModal: React.FC<NotifyFoundModalProps> = ({ visible, deviceName, onClose, onConfirm }) => {
    const { colors, isDark } = useTheme();

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={[styles.container, { backgroundColor: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.5)' }]}>
                <GlassCard width={320} height={350} intensity={40} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.content}>
                        <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(0, 255, 157, 0.1)' : 'rgba(0, 200, 83, 0.1)', borderColor: isDark ? 'rgba(0, 255, 157, 0.3)' : 'rgba(0, 200, 83, 0.3)' }]}>
                            <Ionicons name="notifications-outline" size={48} color={isDark ? COLORS.primary : '#00C853'} />
                        </View>

                        <Text style={[styles.title, { color: colors.text }]}>Device Lost</Text>
                        <Text style={[styles.message, { color: colors.textSecondary }]}>
                            "{deviceName}" is currently out of range. Would you like to be notified when it is found?
                        </Text>

                        <View style={styles.buttonContainer}>
                            <TouchableOpacity onPress={onConfirm} style={[styles.confirmButton, { backgroundColor: isDark ? COLORS.primary : '#00C853' }]}>
                                <Text style={[styles.confirmButtonText, { color: isDark ? '#000' : '#FFF' }]}>Notify Me</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
                                <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Cancel</Text>
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
    },
    card: {
        borderRadius: 24,
        borderWidth: 1,
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
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: SPACING.s,
        textAlign: 'center',
    },
    message: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: SPACING.xl,
        lineHeight: 20,
    },
    buttonContainer: {
        width: '100%',
        gap: SPACING.m,
    },
    confirmButton: {
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    confirmButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    cancelButton: {
        paddingVertical: 10,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 14,
    },
});
