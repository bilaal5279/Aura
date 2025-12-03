import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { COLORS } from '../src/constants/theme';
import { RadarProvider } from '../src/context/RadarContext';

export default function Layout() {
  return (
    <RadarProvider>
      <View style={{ flex: 1, backgroundColor: COLORS.background }}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: COLORS.background,
            },
            headerTintColor: COLORS.text,
            headerTitleStyle: {
              fontWeight: 'bold',
            },
            contentStyle: {
              backgroundColor: COLORS.background,
            },
          }}
        >
          <Stack.Screen name="index" options={{ title: 'Aura Radar', headerShown: false }} />
          <Stack.Screen name="map" options={{ title: 'Time Machine' }} />
          <Stack.Screen name="settings" options={{ title: 'Settings' }} />
          <Stack.Screen name="device/[id]" options={{ headerShown: false }} />
        </Stack>
      </View>
    </RadarProvider>
  );
}
