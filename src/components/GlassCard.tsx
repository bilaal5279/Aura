import { BackdropFilter, Blur, Canvas, Fill, RoundedRect, rect, rrect } from '@shopify/react-native-skia';
import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface GlassCardProps {
    width: number;
    height?: number;
    borderRadius?: number;
    intensity?: number;
    style?: StyleProp<ViewStyle>;
    children?: React.ReactNode;
}

export const GlassCard: React.FC<GlassCardProps> = ({
    width,
    height,
    borderRadius = 20,
    intensity = 10,
    style,
    children,
}) => {
    const [layoutHeight, setLayoutHeight] = React.useState(height || 0);
    const { colors, isDark } = useTheme();

    const handleLayout = (event: any) => {
        if (!height) {
            setLayoutHeight(event.nativeEvent.layout.height);
        }
    };

    const activeHeight = height || layoutHeight;

    // Adjust opacity based on theme
    const bgOpacity = isDark ? 0.05 : 0.6;
    const borderOpacity = isDark ? 0.1 : 0.2;

    return (
        <View
            style={[{ width, height, overflow: 'hidden', borderRadius }, style]}
            onLayout={handleLayout}
        >
            <Canvas style={StyleSheet.absoluteFill}>
                <RoundedRect x={0} y={0} width={width} height={activeHeight} r={borderRadius} color={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.6)'}>
                </RoundedRect>
                <BackdropFilter
                    filter={<Blur blur={intensity} />}
                    clip={rrect(rect(0, 0, width, activeHeight), borderRadius, borderRadius)}
                >
                    <Fill color={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.4)'} />
                </BackdropFilter>
                {/* Border */}
                <RoundedRect
                    x={0}
                    y={0}
                    width={width}
                    height={activeHeight}
                    r={borderRadius}
                    style="stroke"
                    strokeWidth={1}
                    color={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
                />
            </Canvas>
            <View style={{ flex: 1 }}>
                {children}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
    }
});
