import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Colors, Typography } from '../../constants/theme';

interface GradientBarProps {
  value: number;
  max: number;
  label: string;
  unit?: string;
  color?: string;
  colorEnd?: string;
  showNumbers?: boolean;
}

export function GradientBar({
  value,
  max,
  label,
  unit = 'g',
  color = Colors.accent,
  showNumbers = true,
}: GradientBarProps) {
  const progress = useSharedValue(0);
  const pct = Math.min(value / max, 1);
  const overTarget = value > max;

  useEffect(() => {
    progress.value = withTiming(pct, {
      duration: 900,
      easing: Easing.out(Easing.quad),
    });
  }, [pct]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const displayColor = overTarget ? Colors.accentGreen : color;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        {showNumbers && (
          <Text style={styles.values}>
            <Text style={[styles.current, { color: displayColor }]}>
              {Math.round(value)}
            </Text>
            <Text style={styles.separator}> / </Text>
            <Text style={styles.target}>
              {max}
              {unit}
            </Text>
          </Text>
        )}
      </View>

      <View style={styles.track}>
        <Animated.View
          style={[styles.fill, barStyle, { backgroundColor: displayColor }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    ...Typography.small,
    color: Colors.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  values: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  current: {
    ...Typography.small,
    fontWeight: '600',
  },
  separator: {
    ...Typography.small,
    color: Colors.muted,
  },
  target: {
    ...Typography.small,
    color: Colors.muted,
  },
  track: {
    height: 4,
    backgroundColor: Colors.surface2,
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },
});
