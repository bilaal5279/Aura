import React, { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withTiming
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
const NUM_PARTICLES = 50;
const COLORS = ['#FFD700', '#FF3B30', '#007AFF', '#4CD964', '#FF9500', '#5856D6', '#FF2D55'];

interface ParticleProps {
    index: number;
}

const Particle = ({ index }: ParticleProps) => {
    const x = Math.random() * width;
    const y = -50; // Start above screen
    const size = Math.random() * 8 + 6;
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const rotation = Math.random() * 360;
    const duration = Math.random() * 2000 + 1500;
    const delay = Math.random() * 500;

    const translateY = useSharedValue(y);
    const rotate = useSharedValue(rotation);
    const opacity = useSharedValue(1);

    useEffect(() => {
        translateY.value = withDelay(
            delay,
            withTiming(height + 100, { duration, easing: Easing.out(Easing.quad) })
        );
        rotate.value = withDelay(
            delay,
            withRepeat(withTiming(rotation + 360 * 2, { duration: duration }), -1)
        );
        opacity.value = withDelay(
            delay + duration - 500,
            withTiming(0, { duration: 500 })
        );
    }, []);

    const style = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: x },
                { translateY: translateY.value },
                { rotate: `${rotate.value}deg` },
            ],
            opacity: opacity.value,
            width: size,
            height: size,
            backgroundColor: color,
            position: 'absolute',
            top: 0,
            left: 0,
            borderRadius: Math.random() > 0.5 ? size / 2 : 2,
        };
    });

    return <Animated.View style={style} />;
};

export const Confetti = () => {
    const [particles, setParticles] = useState<number[]>([]);

    useEffect(() => {
        setParticles(Array.from({ length: NUM_PARTICLES }, (_, i) => i));
    }, []);

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {particles.map((i) => (
                <Particle key={i} index={i} />
            ))}
        </View>
    );
};
