import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useColors } from '../../hooks/useColors';
import { Typography } from '../../constants/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface GlowRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
}

export function GlowRing({ score, size = 180, strokeWidth = 12 }: GlowRingProps) {
  const Colors = useColors();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(score / 100, {
      duration: 1400,
      easing: Easing.out(Easing.cubic),
    });
  }, [score]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  const scoreColor =
    score >= 80 ? Colors.accentGreen : score >= 50 ? Colors.accent : Colors.accentAmber;

  const styles = React.useMemo(() => StyleSheet.create({
    container: {
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
    },
    center: {
      position: 'absolute',
      alignItems: 'center',
    },
    score: {
      ...Typography.hero,
      fontWeight: '700',
      letterSpacing: -2,
    },
    label: {
      ...Typography.label,
      color: Colors.muted,
      letterSpacing: 2,
      marginTop: 2,
    },
  }), [Colors]);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={Colors.accent} />
            <Stop offset="100%" stopColor={Colors.accent2} />
          </LinearGradient>
        </Defs>

        {/* Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={Colors.surface2}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Progress arc */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#ringGradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>

      {/* Center content */}
      <View style={styles.center}>
        <Text style={[styles.score, { color: scoreColor }]}>{score}</Text>
        <Text style={styles.label}>DISCIPLINE</Text>
      </View>
    </View>
  );
}
