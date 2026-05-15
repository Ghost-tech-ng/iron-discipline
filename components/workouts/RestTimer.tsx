import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useColors } from '../../hooks/useColors';
import { Typography } from '../../constants/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface RestTimerProps {
  seconds: number;
  onComplete: () => void;
  onDismiss: () => void;
}

export function RestTimer({ seconds, onComplete, onDismiss }: RestTimerProps) {
  const Colors = useColors();
  const [remaining, setRemaining] = useState(seconds);
  const [done, setDone] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progress = useSharedValue(1);
  const SIZE = 200;
  const STROKE = 10;
  const radius = (SIZE - STROKE) / 2;
  const circumference = 2 * Math.PI * radius;

  const handleComplete = useCallback(() => {
    setDone(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    progress.value = withTiming(0, {
      duration: seconds * 1000,
      easing: Easing.linear,
    });

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          runOnJS(handleComplete)();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const timeStr = mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;

  const styles = React.useMemo(() => StyleSheet.create({
    container: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 100,
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: '#000000cc',
    },
    card: {
      backgroundColor: Colors.surface,
      borderRadius: 24,
      padding: 32,
      alignItems: 'center',
      gap: 24,
      borderWidth: 1,
      borderColor: Colors.border,
      width: 280,
    },
    title: {
      ...Typography.label,
      color: Colors.muted,
      letterSpacing: 3,
    },
    ringWrap: {
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
    },
    center: {
      position: 'absolute',
      alignItems: 'center',
    },
    time: {
      fontSize: 48,
      fontWeight: '700',
      letterSpacing: -2,
      lineHeight: 52,
    },
    sub: {
      ...Typography.caption,
      color: Colors.muted,
      letterSpacing: 1.5,
      textTransform: 'uppercase',
    },
    skipBtn: {
      paddingVertical: 10,
      paddingHorizontal: 24,
    },
    skipText: {
      ...Typography.body,
      color: Colors.secondary,
      fontWeight: '500',
    },
  }), [Colors]);

  return (
    <View style={styles.container}>
      <Pressable style={styles.backdrop} onPress={onDismiss} />
      <View style={styles.card}>
        <Text style={styles.title}>REST</Text>

        <View style={styles.ringWrap}>
          <Svg width={SIZE} height={SIZE}>
            <Circle
              cx={SIZE / 2} cy={SIZE / 2} r={radius}
              stroke={Colors.surface2} strokeWidth={STROKE} fill="none"
            />
            <AnimatedCircle
              cx={SIZE / 2} cy={SIZE / 2} r={radius}
              stroke={done ? Colors.accentGreen : Colors.accent}
              strokeWidth={STROKE} fill="none"
              strokeDasharray={circumference}
              animatedProps={animatedProps}
              strokeLinecap="round"
              rotation="-90"
              origin={`${SIZE / 2}, ${SIZE / 2}`}
            />
          </Svg>
          <View style={styles.center}>
            <Text style={[styles.time, { color: done ? Colors.accentGreen : Colors.primary }]}>
              {done ? '✓' : timeStr}
            </Text>
            {!done && <Text style={styles.sub}>rest</Text>}
          </View>
        </View>

        <Pressable onPress={onDismiss} style={styles.skipBtn}>
          <Text style={styles.skipText}>{done ? 'Continue →' : 'Skip rest'}</Text>
        </Pressable>
      </View>
    </View>
  );
}
