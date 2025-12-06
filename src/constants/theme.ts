export const PALETTE = {
    primary: '#00FF9D', // Electric Green
    secondary: '#00D1FF', // Electric Blue
    danger: '#FF3B30',
    success: '#34C759',
    white: '#FFFFFF',
    black: '#000000',
    gray: '#A0A0A0',
    darkGray: '#1A1A1A',
    lightGray: '#F2F2F7',
};

export const THEME = {
    dark: {
        background: '#000000',
        text: '#FFFFFF',
        textSecondary: '#A0A0A0',
        card: 'rgba(255, 255, 255, 0.05)',
        border: 'rgba(255, 255, 255, 0.1)',
        icon: '#FFFFFF',
        surface: '#1C1C1E', // Solid card color
        surfaceVariant: '#2C2C2E', // Lighter surface for nested elements
    },
    light: {
        background: '#F2F2F7',
        text: '#000000',
        textSecondary: '#666666',
        card: '#FFFFFF',
        border: 'rgba(0, 0, 0, 0.1)',
        icon: '#000000',
        surface: '#FFFFFF',
        surfaceVariant: '#F3F4F6', // Slightly darker surface
    }
};

export const COLORS = {
    ...PALETTE,
    // Legacy support (defaulting to dark for now until migration complete)
    background: '#000000',
    text: '#FFFFFF',
    textSecondary: '#A0A0A0',
    glass: {
        background: 'rgba(255, 255, 255, 0.05)',
        border: 'rgba(255, 255, 255, 0.1)',
        highlight: 'rgba(255, 255, 255, 0.2)',
    },
};

export const SPACING = {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
};

export const FONTS = {
    regular: 'System',
    bold: 'System',
    // You can add custom fonts here later
};
