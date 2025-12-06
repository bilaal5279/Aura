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
                            <Ionicons name="shield-checkmark" size={12} color={isDark ? '#000' : '#FFF'} />
                        </View>
                    </View>

                    <Text style={[styles.title, { color: colors.text }]}>Enable Background Tracking</Text>

                    <Text style={[styles.description, { color: colors.textSecondary }]}>
                        To alert you when you leave a device behind, Find My Device needs to access your location even when the app is closed or not in use.
                    </Text>

                    <View style={[styles.featureContainer, { backgroundColor: colors.surfaceVariant }]}>
                        <View style={styles.featureRow}>
                            <Ionicons name="notifications" size={20} color={colors.textSecondary} />
                            <Text style={[styles.featureText, { color: colors.text }]}>
                                Detects when you walk away from your items
                            </Text>
                        </View>
                        <View style={styles.featureRow}>
                            <Ionicons name="shield" size={20} color={colors.textSecondary} />
                            <Text style={[styles.featureText, { color: colors.text }]}>
                                Runs efficiently in the background
                            </Text>
                        </View>
                    </View>

                    <Text style={[styles.disclaimer, { color: colors.textSecondary }]}>
                        Your location is never shared with third parties.
                    </Text>

                    <View style={styles.buttonsContainer}>
                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: COLORS.primary }]}
                            onPress={onAccept}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.buttonText, { color: isDark ? '#064E3B' : '#FFF' }]}>Enable & Continue</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.textButton}
                            onPress={onDecline}
                            activeOpacity={0.6}
                        >
                            <Text style={[styles.textButtonText, { color: colors.textSecondary }]}>No, thanks</Text>
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
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.l,
        position: 'relative',
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
        marginBottom: SPACING.s,
    },
    description: {
        fontSize: 15,
        textAlign: 'center',
        marginBottom: SPACING.l,
        lineHeight: 22,
        opacity: 0.9,
    },
    featureContainer: {
        width: '100%',
        borderRadius: 16,
        padding: 16,
        marginBottom: SPACING.l,
        gap: 12,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    featureText: {
        fontSize: 14,
        flex: 1,
    },
    disclaimer: {
        fontSize: 12,
        textAlign: 'center',
        marginBottom: SPACING.xl,
        opacity: 0.7,
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
