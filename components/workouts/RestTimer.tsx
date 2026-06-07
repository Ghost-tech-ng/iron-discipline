import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, AppState } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
import { sendImmediateNotification } from '../../services/notificationService';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface RestTimerProps {
  seconds: number;
  exerciseName?: string;
  onComplete: () => void;
  onDismiss: () => void;
}

export function RestTimer({ seconds, exerciseName, onComplete, onDismiss }: RestTimerProps) {
  const Colors = useColors();
  const [remaining, setRemaining] = useState(seconds);
  const [done, setDone] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const endTimeRef = useRef(Date.now() + seconds * 1000);
  const completedRef = useRef(false);
  const progress = useSharedValue(1);
  const SIZE = 200;
  const STROKE = 10;
  const radius = (SIZE - STROKE) / 2;
  const circumference = 2 * Math.PI * radius;

  const triggerComplete = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    setDone(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    sendImmediateNotification(
      'Rest complete',
      exerciseName ? `Time to hit your next set of ${exerciseName}.` : 'Rest is over — next set.'
    );
    onComplete();
  }, [onComplete, exerciseName]);

  function restartAnimation(remSeconds: number) {
    const fraction = remSeconds / seconds;
    progress.value = fraction;
    progress.value = withTiming(0, {
      duration: remSeconds * 1000,
      easing: Easing.linear,
    });
  }

  useEffect(() => {
    // Start ring animation
    progress.value = withTiming(0, {
      duration: seconds * 1000,
      easing: Easing.linear,
    });

    // Interval checks remaining time from wall clock
    intervalRef.current = setInterval(() => {
      const rem = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
      setRemaining(rem);
      if (rem <= 0) {
        clearInterval(intervalRef.current!);
        runOnJS(triggerComplete)();
      }
    }, 500);

    // When app comes back to foreground (screen unlock), re-check immediately
    const appStateSub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        const rem = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
        setRemaining(rem);
        if (rem <= 0) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          runOnJS(triggerComplete)();
        } else {
          // Re-sync the ring animation to actual remaining time
          restartAnimation(rem);
        }
      }
    });

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      appStateSub.remove();
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
    exerciseHint: {
      ...Typography.caption,
      color: Colors.muted,
      textAlign: 'center',
      paddingHorizontal: 8,
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
            {done ? (
              <Ionicons name="checkmark" size={40} color={Colors.accentGreen} />
            ) : (
              <Text style={[styles.time, { color: Colors.primary }]}>{timeStr}</Text>
            )}
            {!done && <Text style={styles.sub}>rest</Text>}
          </View>
        </View>

        {exerciseName && !done && (
          <Text style={styles.exerciseHint}>Next: {exerciseName}</Text>
        )}

        <Pressable onPress={onDismiss} style={styles.skipBtn}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={styles.skipText}>{done ? 'Continue' : 'Skip rest'}</Text>
            {done && <Ionicons name="arrow-forward" size={14} color={Colors.accent} />}
          </View>
        </Pressable>
      </View>
    </View>
  );
}
