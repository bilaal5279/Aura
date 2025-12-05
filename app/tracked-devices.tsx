import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, SPACING } from '../src/constants/theme';
import { useTheme } from '../src/context/ThemeContext';
import { useRadar } from '../src/hooks/useRadar';

export default function TrackedDevicesScreen() {
    const router = useRouter();
    const { colors } = useTheme();
    const { trackedDevices, toggleTracking, updateDeviceSettings } = useRadar();

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={[styles.header, { backgroundColor: colors.background }]}>
                <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.card }]}>
                    <Ionicons name="chevron-back" size={28} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Tracked Devices</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={[styles.section, { backgroundColor: colors.card }]}>
                    {trackedDevices.size === 0 ? (
                        <View style={styles.row}>
                            <Text style={[styles.label, { color: colors.textSecondary, fontStyle: 'italic' }]}>No devices tracked</Text>
                        </View>
                    ) : (
                        Array.from(trackedDevices.entries()).map(([id, settings], index) => (
                            <View key={id}>
                                <View style={[styles.deviceRow, { borderBottomWidth: index < trackedDevices.size - 1 ? 1 : 0, borderBottomColor: colors.border }]}>
                                    <View style={styles.deviceHeader}>
                                        <Text style={[styles.deviceTitle, { color: colors.text }]}>{settings.name || 'Unknown Device'}</Text>
                                        <TouchableOpacity onPress={() => toggleTracking(id)} style={styles.deleteButton}>
                                            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                                        </TouchableOpacity>
                                    </View>

                                    <View style={styles.settingToggleRow}>
                                        <Text style={[styles.settingToggleLabel, { color: colors.textSecondary }]}>Notify Found</Text>
                                        <Switch
                                            value={settings.notifyOnFound}
                                            onValueChange={(val) => updateDeviceSettings(id, { notifyOnFound: val })}
                                            trackColor={{ false: colors.border, true: COLORS.primary }}
                                            thumbColor={'#fff'}
                                            style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                                        />
                                    </View>
                                    <View style={styles.settingToggleRow}>
                                        <Text style={[styles.settingToggleLabel, { color: colors.textSecondary }]}>Notify Lost</Text>
                                        <Switch
                                            value={settings.notifyOnLost}
                                            onValueChange={(val) => updateDeviceSettings(id, { notifyOnLost: val })}
                                            trackColor={{ false: colors.border, true: COLORS.primary }}
                                            thumbColor={'#fff'}
                                            style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                                        />
                                    </View>
                                </View>
                            </View>
                        ))
                    )}
                </View>
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
        paddingBottom: SPACING.l,
    },
    backButton: {
        padding: 8,
        borderRadius: 20,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    content: {
        padding: SPACING.m,
    },
    section: {
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
    label: {
        fontSize: 16,
    },
    deviceRow: {
        padding: SPACING.m,
    },
    deviceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.s,
    },
    deviceTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    deleteButton: {
        padding: 4,
    },
    settingToggleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 4,
    },
    settingToggleLabel: {
        fontSize: 14,
    },
});
