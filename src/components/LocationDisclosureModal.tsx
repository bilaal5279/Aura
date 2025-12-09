import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, SPACING } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

interface LocationDisclosureModalProps {
    visible: boolean;
    onAccept: () => void;
    onDecline: () => void;
}

const { width } = Dimensions.get('window');

export const LocationDisclosureModal: React.FC<LocationDisclosureModalProps> = ({ visible, onAccept, onDecline }) => {
    const { colors, isDark } = useTheme();
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    useNativeDriver: true,
                    damping: 20,
                    stiffness: 90
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true
                })
            ]).start();
        } else {
            Animated.timing(opacityAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true
            }).start();
        }
    }, [visible]);

    return (
        <Modal
            transparent
            visible={visible}
            animationType="none"
            onRequestClose={onDecline}
        >
            <View style={styles.overlay}>
                <Animated.View style={[styles.backdrop, { opacity: opacityAnim, backgroundColor: 'rgba(0,0,0,0.6)' }]} />

                <Animated.View style={[
                    styles.container,
                    {
                        backgroundColor: colors.surface,
                        transform: [{ scale: scaleAnim }],
                        opacity: opacityAnim
                    }
                ]}>
                    <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(74, 222, 128, 0.15)' : 'rgba(74, 222, 128, 0.1)' }]}>
                        <Ionicons name="location" size={32} color={COLORS.primary} />
                        <View style={[styles.badge, { backgroundColor: COLORS.primary, borderColor: colors.surface }]}>
                            <Ionicons name="bluetooth" size={12} color={isDark ? '#000' : '#FFF'} />
                        </View>
                    </View>

                    <Text style={[styles.title, { color: colors.text }]}>Location Permission</Text>

                    <Text style={[styles.description, { color: colors.textSecondary }]}>
                        To scan for nearby Bluetooth devices (like your lost items), Android requires Location access.
                    </Text>

                    <View style={[styles.featureContainer, { backgroundColor: colors.surfaceVariant }]}>
                        <Text style={[styles.featureText, { color: colors.text, textAlign: 'center' }]}>
                            This app does not collect, store, or share your personal location data. It is only used locally to detect devices.
                        </Text>
                    </View>

                    <View style={styles.buttonsContainer}>
                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: COLORS.primary }]}
                            onPress={onAccept}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.buttonText, { color: isDark ? '#064E3B' : '#FFF' }]}>OK, I Understand</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.textButton}
                            onPress={onDecline}
                            activeOpacity={0.6}
                        >
                            <Text style={[styles.textButtonText, { color: colors.textSecondary }]}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    container: {
        width: width * 0.85,
        borderRadius: 24,
        padding: SPACING.xl,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    modalContent: {
        width: '85%',
        maxWidth: 340,
        borderRadius: 28,
        padding: 24,
        alignItems: 'center',
        elevation: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.58,
        shadowRadius: 16.00,
    },
    iconContainer: {
        marginBottom: 16,
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    badge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        borderRadius: 10,
        padding: 4,
        borderWidth: 2,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 12,
    },
    description: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 4,
    },
    featureContainer: {
        width: '100%',
        borderRadius: 16,
        padding: 16,
        marginBottom: SPACING.l,
        gap: 12,
    },
    featureText: {
        fontSize: 14,
        lineHeight: 20,
    },
    buttonsContainer: {
        width: '100%',
        gap: 12,
    },
    button: {
        width: '100%',
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '700',
    },
    textButton: {
        width: '100%',
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    textButtonText: {
        fontSize: 15,
        fontWeight: '600',
    }
});
