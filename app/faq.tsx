import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GlassCard } from '../src/components/GlassCard';
import { COLORS, SPACING } from '../src/constants/theme';
import { useTheme } from '../src/context/ThemeContext';

export default function FAQScreen() {
    const router = useRouter();
    const { colors, isDark } = useTheme();

    const faqs = [
        {
            question: "How do I find my device?",
            answer: "Tap on a device in the list to open the Radar. Move around and watch the signal strength percentage. As it gets higher (closer to 100%), you are getting closer to your device. Use the 'Hot & Cold' indicators to guide you."
        },
        {
            question: "Why can't I see my device?",
            answer: "Find My Device uses Bluetooth Low Energy (BLE) to detect devices. If your device is a classic Bluetooth device (like some older headphones) or is currently connected to another phone, it might not be advertising its presence. Ensure your device is powered on and not in 'sleep' mode."
        },
        {
            question: "What is Background Tracking?",
            answer: "Background Tracking allows Find My Device to monitor your devices even when the app is closed. If you leave a tracked device behind, Find My Device will send you a notification. This is a Pro feature."
        },
        {
            question: "Why does the signal fluctuate?",
            answer: "Bluetooth signals bounce off walls, people, and objects. This causes natural fluctuations. We use advanced smoothing algorithms to stabilize the reading, but some jumping is normal. Try moving slowly for the best results."
        }
    ];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.card }]}>
                    <Ionicons name="chevron-back" size={28} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>FAQ</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {faqs.map((faq, index) => (
                    <GlassCard key={index} width={350} intensity={20} style={styles.card}>
                        <View style={styles.cardContent}>
                            <Text style={[styles.question, { color: isDark ? COLORS.primary : '#00C853' }]}>{faq.question}</Text>
                            <Text style={[styles.answer, { color: colors.text }]}>{faq.answer}</Text>
                        </View>
                    </GlassCard>
                ))}
                <View style={{ height: 40 }} />
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
        paddingBottom: SPACING.m,
        zIndex: 10,
    },
    backButton: {
        padding: 8,
        borderRadius: 20,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        letterSpacing: 1,
    },
    content: {
        paddingHorizontal: SPACING.m,
        paddingTop: SPACING.s,
        alignItems: 'center',
    },
    card: {
        marginBottom: SPACING.m,
        borderRadius: 16,
    },
    cardContent: {
        padding: SPACING.m,
    },
    question: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: SPACING.s,
    },
    answer: {
        fontSize: 14,
        lineHeight: 22,
    },
});
