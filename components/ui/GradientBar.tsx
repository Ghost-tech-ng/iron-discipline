import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { useColors } from '../../hooks/useColors';
import { Typography } from '../../constants/theme';

const TRACK_H = 6;
const TIP_SIZE = 12;

interface GradientBarProps {
  value: number;
  max: number;
  label: string;
  unit?: string;
  color?: string;
  showNumbers?: boolean;
}

export function GradientBar({
  value,
  max,
  label,
  unit = 'g',
  color,
  showNumbers = true,
}: GradientBarProps) {
  const Colors = useColors();
  const resolvedColor = color ?? Colors.accent;
  const progress = useSharedValue(0);
  const shimmerX = useSharedValue(-200);
  const [trackWidth, setTrackWidth] = useState(0);

  const pct = Math.min(value / max, 1);
  const overTarget = value > max;
  const displayColor = overTarget ? Colors.accentGreen : resolvedColor;

  useEffect(() => {
    progress.value = withTiming(pct, {
      duration: 900,
      easing: Easing.out(Easing.quad),
    });
  }, [pct]);

  useEffect(() => {
    if (overTarget && trackWidth > 0) {
      shimmerX.value = -trackWidth * 0.4;
      shimmerX.value = withRepeat(
        withTiming(trackWidth * 1.2, {
          duration: 1100,
          easing: Easing.linear,
        }),
        -1
      );
    } else {
      shimmerX.value = -200;
    }
  }, [overTarget, trackWidth]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const tipStyle = useAnimatedStyle(() => ({
    left: progress.value * trackWidth - TIP_SIZE / 2,
    opacity: progress.value > 0.02 ? 1 : 0,
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value }],
  }));

  const styles = React.useMemo(() => StyleSheet.create({
    container: { gap: 6 },
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
    current: { ...Typography.small, fontWeight: '600' },
    separator: { ...Typography.small, color: Colors.muted },
    target: { ...Typography.small, color: Colors.muted },
    trackWrapper: {
      height: TRACK_H,
      position: 'relative',
      justifyContent: 'center',
    },
    trackBg: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      backgroundColor: Colors.surface2,
      borderRadius: TRACK_H / 2,
      overflow: 'hidden',
    },
    fill: {
      height: '100%',
      borderRadius: TRACK_H / 2,
    },
    shimmer: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      width: 60,
      backgroundColor: 'rgba(255,255,255,0.28)',
      borderRadius: TRACK_H / 2,
    },
    tipDot: {
      position: 'absolute',
      width: TIP_SIZE,
      height: TIP_SIZE,
      borderRadius: TIP_SIZE / 2,
      top: -(TIP_SIZE - TRACK_H) / 2,
    },
  }), [Colors]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        {showNumbers && (
          <Text>
            <Text style={[styles.current, { color: displayColor }]}>
              {Math.round(value)}
            </Text>
            <Text style={styles.separator}> / </Text>
            <Text style={styles.target}>{max}{unit}</Text>
          </Text>
        )}
      </View>

      <View
        style={styles.trackWrapper}
        onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
      >
        {/* Clipped background + fill + shimmer */}
        <View style={styles.trackBg}>
          <Animated.View
            style={[styles.fill, fillStyle, { backgroundColor: displayColor }]}
          />
          {overTarget && (
            <Animated.View style={[styles.shimmer, shimmerStyle]} />
          )}
        </View>

        {/* Glow tip dot — outside overflow clip so shadow shows */}
        <Animated.View
          style={[
            styles.tipDot,
            tipStyle,
            {
              backgroundColor: displayColor,
              shadowColor: displayColor,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.95,
              shadowRadius: 6,
              elevation: 6,
            },
          ]}
        />
      </View>
    </View>
  );
}
