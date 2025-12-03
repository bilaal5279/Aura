import { BackdropFilter, Blur, Canvas, Fill, RoundedRect, rect, rrect } from '@shopify/react-native-skia';
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { COLORS } from '../constants/theme';

interface GlassCardProps {
    width: number;
    height?: number;
    borderRadius?: number;
    intensity?: number;
    style?: ViewStyle;
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

    const handleLayout = (event: any) => {
        if (!height) {
            setLayoutHeight(event.nativeEvent.layout.height);
        }
    };

    const activeHeight = height || layoutHeight;

    return (
        <View
            style={[{ width, height, overflow: 'hidden', borderRadius }, style]}
            onLayout={handleLayout}
        >
            <Canvas style={StyleSheet.absoluteFill}>
                <RoundedRect x={0} y={0} width={width} height={activeHeight} r={borderRadius} color={COLORS.glass.background}>
                </RoundedRect>
                <BackdropFilter
                    filter={<Blur blur={intensity} />}
                    clip={rrect(rect(0, 0, width, activeHeight), borderRadius, borderRadius)}
                >
                    <Fill color={COLORS.glass.background} />
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
                    color={COLORS.glass.border}
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
