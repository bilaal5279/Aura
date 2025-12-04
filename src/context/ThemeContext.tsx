import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { THEME } from '../constants/theme';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
    themeMode: ThemeMode;
    setThemeMode: (mode: ThemeMode) => void;
    colors: typeof THEME.dark;
    isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
    themeMode: 'system',
    setThemeMode: () => { },
    colors: THEME.dark,
    isDark: true,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const systemScheme = useColorScheme();
    const [themeMode, setThemeModeState] = useState<ThemeMode>('system');

    useEffect(() => {
        const loadTheme = async () => {
            try {
                const savedTheme = await AsyncStorage.getItem('themeMode');
                if (savedTheme) {
                    setThemeModeState(savedTheme as ThemeMode);
                }
            } catch (e) {
                console.warn('Failed to load theme', e);
            }
        };
        loadTheme();
    }, []);

    const setThemeMode = async (mode: ThemeMode) => {
        setThemeModeState(mode);
        try {
            await AsyncStorage.setItem('themeMode', mode);
        } catch (e) {
            console.warn('Failed to save theme', e);
        }
    };

    const isDark = themeMode === 'system' ? systemScheme === 'dark' : themeMode === 'dark';
    const colors = isDark ? THEME.dark : THEME.light;

    // Merge with legacy COLORS for backward compatibility if needed, 
    // but ideally components should use `colors` from context.
    // For now, we return the structured theme colors.

    return (
        <ThemeContext.Provider value={{ themeMode, setThemeMode, colors, isDark }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
