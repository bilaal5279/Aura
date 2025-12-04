import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PurchasesPackage } from 'react-native-purchases';
import { COLORS, SPACING } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useRadar } from '../hooks/useRadar';

interface PaywallModalProps {
    visible: boolean;
    onClose: () => void;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({ visible, onClose }) => {
    const { colors, isDark } = useTheme();
    const { currentOffering, purchasePackage, restorePro, isPro } = useRadar();
    const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (currentOffering && currentOffering.availablePackages.length > 0) {
            // Default to annual or monthly if available
            const annual = currentOffering.availablePackages.find(p => p.packageType === 'ANNUAL');
            const monthly = currentOffering.availablePackages.find(p => p.packageType === 'MONTHLY');
            setSelectedPackage(annual || monthly || currentOffering.availablePackages[0]);
        }
    }, [currentOffering]);

    const handlePurchase = async () => {
        if (!selectedPackage) return;
        setIsLoading(true);
        try {
            await purchasePackage(selectedPackage);
            onClose();
        } catch (e: any) {
            if (!e.userCancelled) {
                Alert.alert('Purchase Failed', e.message);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleRestore = async () => {
        setIsLoading(true);
        try {
            await restorePro();
            Alert.alert('Restore Successful', 'Your purchases have been restored.');
            onClose();
        } catch (e: any) {
            Alert.alert('Restore Failed', e.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (!currentOffering) {
        return (
            <Modal visible={visible} transparent animationType="slide">
                <View style={[styles.container, { backgroundColor: isDark ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.9)' }]}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            </Modal>
        );
    }

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={28} color={colors.text} />
                    </TouchableOpacity>
                </View>

                <View style={styles.content}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="diamond" size={64} color="#FFD700" />
                    </View>
                    <Text style={[styles.title, { color: colors.text }]}>Unlock Device Finder Pro</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        Get unlimited access to all features
                    </Text>

                    <View style={styles.features}>
                        <FeatureRow text="Background Tracking & Notifications" icon="notifications-outline" colors={colors} />
                        <FeatureRow text="Unlimited Device Tracking" icon="bluetooth-outline" colors={colors} />
                        <FeatureRow text="No Ads" icon="ban-outline" colors={colors} />
                    </View>

                    <View style={styles.packages}>
                        {currentOffering.availablePackages.map((pack) => {
                            const isSelected = selectedPackage?.identifier === pack.identifier;
                            return (
                                <TouchableOpacity
                                    key={pack.identifier}
                                    style={[
                                        styles.packageCard,
                                        {
                                            borderColor: isSelected ? COLORS.primary : colors.border,
                                            backgroundColor: isSelected ? (isDark ? 'rgba(0, 255, 157, 0.1)' : 'rgba(0, 200, 83, 0.1)') : colors.card
                                        }
                                    ]}
                                    onPress={() => setSelectedPackage(pack)}
                                >
                                    <View>
                                        <Text style={[styles.packageTitle, { color: colors.text }]}>{pack.product.title}</Text>
                                        <Text style={[styles.packagePrice, { color: isSelected ? COLORS.primary : colors.textSecondary }]}>
                                            {pack.product.priceString}
                                        </Text>
                                    </View>
                                    {isSelected && (
                                        <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    <TouchableOpacity
                        style={[styles.purchaseButton, { opacity: isLoading ? 0.7 : 1 }]}
                        onPress={handlePurchase}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#000" />
                        ) : (
                            <Text style={styles.purchaseButtonText}>Start Subscription</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={handleRestore} style={styles.restoreButton}>
                        <Text style={[styles.restoreText, { color: colors.textSecondary }]}>Restore Purchases</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const FeatureRow = ({ text, icon, colors }: { text: string, icon: any, colors: any }) => (
    <View style={styles.featureRow}>
        <Ionicons name={icon} size={24} color={COLORS.primary} />
        <Text style={[styles.featureText, { color: colors.text }]}>{text}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: SPACING.m,
        alignItems: 'flex-end',
    },
    closeButton: {
        padding: 8,
    },
    content: {
        flex: 1,
        padding: SPACING.l,
        alignItems: 'center',
    },
    iconContainer: {
        marginBottom: SPACING.l,
        shadowColor: "#FFD700",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: SPACING.s,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        marginBottom: SPACING.xl,
        textAlign: 'center',
    },
    features: {
        width: '100%',
        marginBottom: SPACING.xl,
        gap: SPACING.m,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.m,
    },
    featureText: {
        fontSize: 16,
        fontWeight: '500',
    },
    packages: {
        width: '100%',
        gap: SPACING.m,
        marginBottom: SPACING.xl,
    },
    packageCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: SPACING.m,
        borderRadius: 16,
        borderWidth: 2,
    },
    packageTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    packagePrice: {
        fontSize: 14,
        marginTop: 4,
    },
    purchaseButton: {
        width: '100%',
        backgroundColor: COLORS.primary,
        padding: SPACING.l,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: SPACING.m,
    },
    purchaseButtonText: {
        color: '#000',
        fontSize: 18,
        fontWeight: 'bold',
    },
    restoreButton: {
        padding: SPACING.s,
    },
    restoreText: {
        fontSize: 14,
        textDecorationLine: 'underline',
    },
});
