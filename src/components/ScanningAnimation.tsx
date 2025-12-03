import { Blur, Canvas, Circle, Group, SweepGradient, vec } from '@shopify/react-native-skia';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Easing, useDerivedValue, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { COLORS } from '../constants/theme';

export const ScanningAnimation = () => {
    const rotation = useSharedValue(0);
    const pulse = useSharedValue(0);

    useEffect(() => {
        rotation.value = withRepeat(
            withTiming(2 * Math.PI, { duration: 2000, easing: Easing.linear }),
            -1,
            false
        );
        pulse.value = withRepeat(
            withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
            -1,
            true
        );
    }, []);

    const center = vec(100, 100);

    const transform = useDerivedValue(() => {
        return [{ rotate: rotation.value }];
    });

    return (
        <View style={styles.container}>
            <Canvas style={styles.canvas}>
                {/* Background Glow */}
                <Circle c={center} r={60} color={COLORS.primary} opacity={0.1}>
                    <Blur blur={20} />
                </Circle>

                {/* Pulsing Core */}
                <Circle c={center} r={10} color={COLORS.primary} opacity={0.8} />
                <Circle c={center} r={30} style="stroke" strokeWidth={2} color={COLORS.primary} opacity={0.3} />

                {/* Radar Sweep */}
                <Group origin={center} transform={transform}>
                    <Circle c={center} r={80}>
                        <SweepGradient
                            c={center}
                            colors={['transparent', COLORS.primary, 'transparent']}
                            start={0}
                            end={360}
                        />
                    </Circle>
                </Group>

                {/* Outer Rings */}
                <Circle c={center} r={80} style="stroke" strokeWidth={1} color={COLORS.glass.border} opacity={0.5} />
            </Canvas>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: 200,
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
    },
    canvas: {
        width: 200,
        height: 200,
    },
});
