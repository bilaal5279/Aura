import { Blur, Canvas, Circle, RadialGradient, vec } from '@shopify/react-native-skia';
import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import {
    Easing,
    useDerivedValue,
    useSharedValue,
    withRepeat,
    withTiming
} from 'react-native-reanimated';
import { COLORS } from '../../constants/theme';

const { width } = Dimensions.get('window');
const CENTER = vec(width / 2, width / 2);

interface ForensicRadarProps {
    rssi: number; // -100 (far) to -30 (close)
}

export const ForensicRadar: React.FC<ForensicRadarProps> = ({ rssi }) => {
    // Normalize RSSI to 0-1 range (0 = far, 1 = close)
    // Assuming usable range is -90 to -40
    const normalizedSignal = useDerivedValue(() => {
        const clamped = Math.max(-90, Math.min(-40, rssi));
        return (clamped + 90) / 50; // 0 to 1
    }, [rssi]);

    // Animation values
    const pulse = useSharedValue(0);

    useEffect(() => {
        pulse.value = withRepeat(
            withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
            -1,
            true
        );
    }, []);

    // Derived visual properties
    const radius = useDerivedValue(() => {
        // Base radius + pulse effect + signal strength expansion
        const base = width * 0.2;
        const expansion = normalizedSignal.value * (width * 0.15);
        const breathing = pulse.value * 10;
        return base + expansion + breathing;
    });

    const color = useDerivedValue(() => {
        // Interpolate color based on signal
        // Low signal: Blue, High signal: Green/White
        if (normalizedSignal.value < 0.5) {
            return COLORS.secondary; // Blue
        }
        return COLORS.primary; // Green
    });

    const opacity = useDerivedValue(() => {
        return 0.3 + (normalizedSignal.value * 0.5);
    });

    return (
        <View style={styles.container}>
            <Canvas style={{ width: width, height: width }}>
                {/* Outer Glow */}
                <Circle c={CENTER} r={radius}>
                    <RadialGradient
                        c={CENTER}
                        r={radius}
                        colors={[color.value, 'transparent']}
                        positions={[0, 1]}
                    />
                    <Blur blur={20} />
                </Circle>

                {/* Core */}
                <Circle c={CENTER} r={width * 0.1} color={color} opacity={opacity} />

                {/* Rings */}
                <Circle
                    c={CENTER}
                    r={width * 0.3}
                    style="stroke"
                    strokeWidth={2}
                    color={COLORS.glass.border}
                    opacity={0.5}
                />
                <Circle
                    c={CENTER}
                    r={width * 0.2}
                    style="stroke"
                    strokeWidth={1}
                    color={COLORS.glass.border}
                    opacity={0.3}
                />
            </Canvas>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
});
