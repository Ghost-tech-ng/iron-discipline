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
import { Fonts, Radius } from '../../constants/theme';
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
      'Quench over',
      exerciseName ? `Strike your next set of ${exerciseName}.` : 'Steel is set. Next set.'
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
  const timeStr = mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}`;
  // The last few seconds re-heat the ring: steel while cooling, red when it's time to strike.
  const hot = done || remaining <= 5;
  const ringColor = hot ? Colors.accent : Colors.accent2;

  const styles = React.useMemo(() => StyleSheet.create({
    container: { ...StyleSheet.absoluteFill, justifyContent: 'center', alignItems: 'center', zIndex: 100 },
    backdrop: { ...StyleSheet.absoluteFill, backgroundColor: Colors.base + 'E6' },
    card: {
      backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: 28, alignItems: 'center', gap: 20,
      borderWidth: 1, borderColor: Colors.border, width: 288,
    },
    title: { fontFamily: Fonts.display, fontSize: 22, letterSpacing: 5, color: Colors.primary },
    titleSub: { fontFamily: Fonts.bodyBold, fontSize: 9.5, letterSpacing: 2.4, color: Colors.muted, marginTop: 2, textAlign: 'center' },
    ringWrap: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
    center: { position: 'absolute', alignItems: 'center' },
    time: { fontFamily: Fonts.displayBlack, fontSize: 68, lineHeight: 70, color: Colors.primary, fontVariant: ['tabular-nums'] },
    sub: { fontFamily: Fonts.bodyHeavy, fontSize: 10, letterSpacing: 2.6, color: Colors.muted },
    subHot: { color: Colors.accent },
    exerciseHint: { fontFamily: Fonts.bodySemi, fontSize: 12, color: Colors.secondary, textAlign: 'center', paddingHorizontal: 8 },
    skipBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 11, paddingHorizontal: 24,
      borderRadius: 999, borderWidth: 1, borderColor: Colors.borderLight,
    },
    skipBtnHot: { backgroundColor: Colors.accent, borderColor: Colors.accent },
    skipText: { fontFamily: Fonts.display, fontSize: 15, letterSpacing: 1.4, color: Colors.secondary },
    skipTextHot: { color: Colors.onAccent },
  }), [Colors]);

  return (
    <View style={styles.container}>
      <Pressable style={styles.backdrop} onPress={onDismiss} />
      <View style={styles.card}>
        <View>
          <Text style={styles.title}>QUENCH</Text>
          <Text style={styles.titleSub}>LET THE STEEL SET</Text>
        </View>

        <View style={styles.ringWrap}>
          <Svg width={SIZE} height={SIZE}>
            <Circle
              cx={SIZE / 2} cy={SIZE / 2} r={radius}
              stroke={Colors.surface2} strokeWidth={STROKE} fill="none"
            />
            <AnimatedCircle
              cx={SIZE / 2} cy={SIZE / 2} r={radius}
              stroke={ringColor}
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
              <Ionicons name="hammer" size={44} color={Colors.accent} />
            ) : (
              <Text style={styles.time}>{timeStr}</Text>
            )}
            <Text style={[styles.sub, hot && styles.subHot]}>{hot ? 'STRIKE' : mins > 0 ? 'COOLING' : 'SECONDS'}</Text>
          </View>
        </View>

        {exerciseName && !done && (
          <Text style={styles.exerciseHint}>Next: {exerciseName}</Text>
        )}

        <Pressable onPress={onDismiss} style={[styles.skipBtn, hot && styles.skipBtnHot]}>
          <Text style={[styles.skipText, hot && styles.skipTextHot]}>{hot ? 'STRIKE' : 'SKIP QUENCH'}</Text>
          {hot && <Ionicons name="arrow-forward" size={14} color={Colors.onAccent} />}
        </Pressable>
      </View>
    </View>
  );
}
