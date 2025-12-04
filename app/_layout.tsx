import { Stack } from 'expo-router';
import { RadarProvider } from '../src/context/RadarContext';
import { ThemeProvider } from '../src/context/ThemeContext'; // Assuming ThemeProvider is imported

export default function Layout() {
  return (
    <RadarProvider>
      <ThemeProvider>
        <Stack />
      </ThemeProvider>
    </RadarProvider>
  );
}
