import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
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
  const pulseScale = useSharedValue(1);
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    progress.value = withTiming(score / 100, {
      duration: 1400,
      easing: Easing.out(Easing.cubic),
    });

    // Count-up: match easing curve of the ring
    let elapsed = 0;
    const duration = 1400;
    const tickMs = 33; // ~30fps
    const timer = setInterval(() => {
      elapsed += tickMs;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3); // cubic ease-out
      setDisplayScore(Math.round(eased * score));
      if (t >= 1) clearInterval(timer);
    }, tickMs);

    // Pulse when locked in at 80+
    if (score >= 80) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.09, { duration: 750, easing: Easing.inOut(Easing.quad) }),
          withTiming(1.0, { duration: 750, easing: Easing.inOut(Easing.quad) })
        ),
        -1
      );
    } else {
      pulseScale.value = withTiming(1.0, { duration: 300 });
    }

    return () => clearInterval(timer);
  }, [score]);

  const arcAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  // Tip glow dot — tracks the leading edge of the arc
  const tipAnimatedProps = useAnimatedProps(() => {
    const angle = -Math.PI / 2 + progress.value * 2 * Math.PI;
    return {
      cx: size / 2 + radius * Math.cos(angle),
      cy: size / 2 + radius * Math.sin(angle),
      opacity: progress.value > 0.01 ? 1 : 0,
    };
  });

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const scoreColor =
    score >= 80 ? Colors.accentGreen : score >= 50 ? Colors.accent : Colors.accentAmber;

  const tipColor =
    score >= 80 ? Colors.accentGreen : Colors.accent;

  const styles = React.useMemo(() => StyleSheet.create({
    container: {
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
          animatedProps={arcAnimatedProps}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />

        {/* Arc tip glow dot */}
        <AnimatedCircle
          r={strokeWidth * 0.6}
          fill={tipColor}
          animatedProps={tipAnimatedProps}
        />
      </Svg>

      {/* Score number — pulses at 80+ */}
      <Animated.View style={[styles.center, pulseStyle]}>
        <Text style={[styles.score, { color: scoreColor }]}>{displayScore}</Text>
        <Text style={styles.label}>DISCIPLINE</Text>
      </Animated.View>
    </View>
  );
}
