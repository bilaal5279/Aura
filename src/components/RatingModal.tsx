import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, SPACING } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

interface RatingModalProps {
    visible: boolean;
    onRate: (rating: number) => void;
    onClose: () => void;
    onDontAskAgain: () => void;
}

const { width } = Dimensions.get('window');

export const RatingModal: React.FC<RatingModalProps> = ({ visible, onRate, onClose, onDontAskAgain }) => {
    const { colors, isDark } = useTheme();
    const [rating, setRating] = useState(0);
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            setRating(0);
            // Reset values before animating
            scaleAnim.setValue(0.8);
            opacityAnim.setValue(0);

            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    useNativeDriver: true,
                    damping: 15,
                    stiffness: 120,
                    mass: 0.8
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                    easing: Easing.out(Easing.cubic)
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

    const handleStarPress = (star: number) => {
        setRating(star);
        // triggered for all ratings so parent can handle logic
        setTimeout(() => {
            onRate(star);
        }, 500);
    };

    if (!visible) return null;

    return (
        <Modal
            transparent
            visible={visible}
            animationType="none"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <Animated.View style={[styles.backdrop, { opacity: opacityAnim }]} />

                <Animated.View style={[
                    styles.container,
                    {
                        backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
                        transform: [{ scale: scaleAnim }],
                        opacity: opacityAnim
                    }
                ]}>
                    {/* Decorative Top Icon */}
                    <View style={styles.iconContainer}>
                        <Ionicons name="heart" size={32} color={COLORS.primary} />
                    </View>

                    <Text style={[styles.title, { color: colors.text }]}>Enjoying Find My Device?</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        Your feedback helps us build a better experience for everyone.
                    </Text>

                    <View style={styles.starsContainer}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <TouchableOpacity
                                key={star}
                                onPress={() => handleStarPress(star)}
                                activeOpacity={0.7}
                            >
                                <Ionicons
                                    name={rating >= star ? "star" : "star-outline"}
                                    size={36}
                                    color={rating >= star ? "#FFD700" : colors.border}
                                    style={{ marginHorizontal: 4 }}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>

                    {rating > 0 && rating < 4 && (
                        <Text style={[styles.feedbackText, { color: colors.textSecondary }]}>
                            Thanks for your feedback!
                        </Text>
                    )}

                    <View style={styles.buttonsContainer}>
                        <TouchableOpacity onPress={onClose} style={styles.button}>
                            <Text style={[styles.buttonText, { color: colors.textSecondary }]}>Maybe Later</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={onDontAskAgain} style={styles.button}>
                            <Text style={[styles.buttonText, { color: colors.textSecondary, opacity: 0.6 }]}>Don't Ask Again</Text>
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
        backgroundColor: 'rgba(0,0,0,0.6)',
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
        backgroundColor: 'rgba(0, 122, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.l,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: SPACING.s,
    },
    subtitle: {
        fontSize: 15,
        textAlign: 'center',
        marginBottom: SPACING.xl,
        lineHeight: 22,
        opacity: 0.8,
    },
    starsContainer: {
        flexDirection: 'row',
        marginBottom: SPACING.xl,
    },
    feedbackText: {
        marginBottom: SPACING.l,
        fontSize: 14,
    },
    buttonsContainer: {
        width: '100%',
        gap: 12,
    },
    button: {
        paddingVertical: 10,
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 15,
        fontWeight: '600',
    }
});
