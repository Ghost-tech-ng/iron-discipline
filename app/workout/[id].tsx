import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import type { Stretch } from '../../types';
import { useLocalSearchParams, router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ExerciseCard } from '../../components/workouts/ExerciseCard';
import { RestTimer } from '../../components/workouts/RestTimer';
import { Button } from '../../components/ui/Button';
import { WEEKLY_SPLIT, SESSION_COLORS } from '../../constants/workouts';
import { getExtraCompoundSets } from '../../constants/plan';
import { useWorkoutStore } from '../../store/workoutStore';
import { useDisciplineStore } from '../../store/disciplineStore';
import { saveWorkoutLog, getLastSessionByType } from '../../services/workoutService';
import { useColors } from '../../hooks/useColors';
import { Spacing, Typography } from '../../constants/theme';
import type { SessionType, SetLog, WorkoutLog } from '../../types';

type RouteParams = { id: SessionType; makeupDate?: string };

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const ALL_DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'] as const;

function StretchSection({
  title,
  stretches,
  accentColor,
}: {
  title: string;
  stretches: Stretch[];
  accentColor: string;
}) {
  const Colors = useColors();
  const [expanded, setExpanded] = useState(false);

  const stretchStyles = React.useMemo(() => StyleSheet.create({
    container: {
      backgroundColor: Colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: Colors.border,
      borderLeftWidth: 3,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      paddingVertical: 12,
      gap: 8,
    },
    title: {
      ...Typography.label,
      letterSpacing: 1.5,
      flex: 1,
    },
    count: {
      ...Typography.caption,
      color: Colors.muted,
    },
    toggle: {
      ...Typography.caption,
      color: Colors.muted,
    },
    list: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: Colors.border,
    },
    item: {
      padding: Spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: Colors.surface2,
      gap: 4,
    },
    itemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 8,
    },
    name: {
      ...Typography.small,
      color: Colors.primary,
      fontWeight: '600',
      flex: 1,
    },
    duration: {
      ...Typography.caption,
      color: Colors.accent,
      fontWeight: '600',
      textAlign: 'right',
      flexShrink: 0,
    },
    description: {
      ...Typography.caption,
      color: Colors.secondary,
      lineHeight: 18,
    },
  }), [Colors]);

  return (
    <View style={[stretchStyles.container, { borderLeftColor: accentColor }]}>
      <Pressable style={stretchStyles.header} onPress={() => setExpanded((e) => !e)}>
        <Text style={[stretchStyles.title, { color: accentColor }]}>{title}</Text>
        <Text style={stretchStyles.count}>{stretches.length} stretches</Text>
        <Text style={stretchStyles.toggle}>{expanded ? '▲' : '▼'}</Text>
      </Pressable>

      {expanded && (
        <View style={stretchStyles.list}>
          {stretches.map((s, i) => (
            <View key={i} style={stretchStyles.item}>
              <View style={stretchStyles.itemHeader}>
                <Text style={stretchStyles.name}>{s.name}</Text>
                <Text style={stretchStyles.duration}>{s.duration}</Text>
              </View>
              <Text style={stretchStyles.description}>{s.description}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export default function WorkoutScreen() {
  const Colors = useColors();
  const { id, makeupDate } = useLocalSearchParams<RouteParams>();
  const session = id
    ? WEEKLY_SPLIT[ALL_DAYS.find((d) => WEEKLY_SPLIT[d]?.type === id) ?? 'monday']
    : null;

  const extraSets = getExtraCompoundSets();
  const adjustedExercises = session?.exercises.map((ex) => ({
    ...ex,
    sets: ex.sets >= 4 ? ex.sets + extraSets : ex.sets,
  })) ?? [];

  const { completeWorkout, activeSession, startSession, updateSessionLog, clearActiveSession } = useWorkoutStore();
  const { setWorkoutDone } = useDisciplineStore();

  // Resolved early so styles useMemo can consume it
  const accentColor = SESSION_COLORS[id as string] ?? Colors.accent;

  const isResume = activeSession?.sessionType === id;

  const [exerciseLogs, setExerciseLogs] = useState<Map<string, SetLog[]>>(() =>
    isResume ? new Map(Object.entries(activeSession!.exerciseLogs)) : new Map()
  );
  const [restTimerSecs, setRestTimerSecs] = useState<number | null>(null);
  const [restExerciseName, setRestExerciseName] = useState<string | undefined>();
  const [elapsed, setElapsed] = useState(() =>
    isResume ? Math.floor((Date.now() - activeSession!.startedAt) / 1000) : 0
  );
  const [previousSession, setPreviousSession] = useState<WorkoutLog | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionStartRef = useRef<number>(
    isResume ? activeSession!.startedAt : Date.now()
  );

  const styles = React.useMemo(() => StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: Colors.base,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.md,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: Colors.border,
      backgroundColor: accentColor + '0c',
    },
    cancelBtn: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelText: {
      ...Typography.body,
      color: Colors.muted,
      fontSize: 22,
    },
    minimizeBtn: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    topCenter: {
      alignItems: 'center',
      gap: 4,
    },
    typePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
    },
    typeDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    typeText: {
      ...Typography.caption,
      fontWeight: '700',
      letterSpacing: 1,
    },
    elapsed: {
      ...Typography.small,
      color: Colors.muted,
      fontVariant: ['tabular-nums'],
    },
    finishBtn: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      backgroundColor: Colors.primary,
      borderRadius: 20,
    },
    finishText: {
      ...Typography.small,
      color: Colors.base,
      fontWeight: '700',
    },
    progressTrack: {
      height: 3,
      backgroundColor: Colors.surface2,
    },
    progressFill: {
      height: '100%',
      borderRadius: 1,
    },
    sessionHeader: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      paddingLeft: Spacing.md + 4,
      gap: 3,
      borderLeftWidth: 3,
      borderLeftColor: accentColor,
      backgroundColor: accentColor + '08',
    },
    sessionTitle: {
      ...Typography.h2,
      color: Colors.primary,
      fontWeight: '700',
      letterSpacing: -0.8,
    },
    sessionSub: {
      ...Typography.small,
      color: Colors.muted,
    },
    scroll: { flex: 1 },
    scrollContent: {
      paddingHorizontal: Spacing.md,
      gap: Spacing.md,
      paddingBottom: 20,
    },
    prevBanner: {
      backgroundColor: Colors.surface2,
      borderRadius: 10,
      padding: 12,
      borderLeftWidth: 3,
      borderLeftColor: Colors.accent,
    },
    prevBannerText: {
      ...Typography.small,
      color: Colors.secondary,
      lineHeight: 18,
    },
    finishSection: {
      gap: 10,
      marginTop: 8,
    },
    finishNote: {
      ...Typography.caption,
      color: Colors.muted,
      textAlign: 'center',
    },
    errorContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
    },
    errorText: {
      ...Typography.body,
      color: Colors.secondary,
    },
  }), [Colors, accentColor]);

  useEffect(() => {
    if (id) {
      startSession(id);
      if (!isResume) sessionStartRef.current = Date.now();
    }
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - sessionStartRef.current) / 1000));
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  useEffect(() => {
    if (!id) return;
    getLastSessionByType(id).then((log) => setPreviousSession(log));
  }, [id]);

  const progressAnim = useSharedValue(0);
  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progressAnim.value * 100}%` as `${number}%`,
  }));

  const pillPulse = useSharedValue(1);
  useEffect(() => {
    pillPulse.value = withRepeat(
      withSequence(
        withTiming(1.5, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        withTiming(1.0, { duration: 900, easing: Easing.inOut(Easing.quad) })
      ),
      -1
    );
  }, []);
  const pillDotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pillPulse.value }],
    opacity: 0.85,
  }));

  const completedExerciseCount = [...exerciseLogs.values()].filter(
    (sets) => {
      const exercise = adjustedExercises.find((e) =>
        [...exerciseLogs.entries()].find(([k, v]) => v === sets)?.[0] === e.id
      );
      return exercise && sets.length >= exercise.sets;
    }
  ).length;

  const totalExercises = adjustedExercises.length;
  const progressPct = totalExercises > 0 ? completedExerciseCount / totalExercises : 0;

  useEffect(() => {
    progressAnim.value = withTiming(progressPct, { duration: 600, easing: Easing.out(Easing.quad) });
  }, [progressPct]);

  if (!session) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No session found.</Text>
          <Button label="Go Back" onPress={() => router.back()} variant="secondary" />
        </View>
      </SafeAreaView>
    );
  }

  function handleSetsUpdate(exerciseId: string, sets: SetLog[]) {
    setExerciseLogs((prev) => new Map(prev).set(exerciseId, sets));
    updateSessionLog(exerciseId, sets);
  }

  function handleMinimize() {
    router.back();
  }

  function handleFinish() {
    Alert.alert(
      'Finish Workout?',
      `${formatElapsed(elapsed)} elapsed. Mark this session complete?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Finish',
          style: 'default',
          onPress: async () => {
            if (!session) return;
            const durationMinutes = Math.round(elapsed / 60);
            const log: WorkoutLog = {
              id: `workout_${Date.now()}`,
              date: makeupDate ?? new Date().toISOString().split('T')[0],
              sessionType: session.type,
              sessionLabel: session.label,
              durationMinutes,
              completed: true,
              exerciseLogs: adjustedExercises.map((ex) => ({
                exerciseId: ex.id,
                exerciseName: ex.name,
                sets: exerciseLogs.get(ex.id) ?? [],
              })),
            };

            await saveWorkoutLog(log);
            completeWorkout(durationMinutes);
            clearActiveSession();
            setWorkoutDone(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.back();
          },
        },
      ]
    );
  }

  function handleCancel() {
    Alert.alert('Workout Options', undefined, [
      { text: 'Keep Going', style: 'cancel' },
      { text: 'Minimize — return to app', onPress: () => router.back() },
      {
        text: 'Cancel Workout',
        style: 'destructive',
        onPress: () => { clearActiveSession(); router.back(); },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Rest timer overlay */}
      {restTimerSecs !== null && (
        <RestTimer
          seconds={restTimerSecs}
          exerciseName={restExerciseName}
          onComplete={() => setRestTimerSecs(null)}
          onDismiss={() => setRestTimerSecs(null)}
        />
      )}

      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable onPress={handleMinimize} style={styles.cancelBtn}>
          <Ionicons name="chevron-down" size={24} color={Colors.muted} />
        </Pressable>

        <View style={styles.topCenter}>
          <View style={[styles.typePill, { backgroundColor: accentColor + '20' }]}>
            <Animated.View style={[styles.typeDot, pillDotStyle, { backgroundColor: accentColor }]} />
            <Text style={[styles.typeText, { color: accentColor }]}>
              {session.type.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.elapsed}>{formatElapsed(elapsed)}</Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Pressable onPress={handleCancel} style={styles.minimizeBtn}>
            <Ionicons name="ellipsis-horizontal" size={20} color={Colors.muted} />
          </Pressable>
          <Pressable onPress={handleFinish} style={styles.finishBtn}>
            <Text style={styles.finishText}>Done</Text>
          </Pressable>
        </View>
      </View>

      {/* Progress bar — animated */}
      <View style={styles.progressTrack}>
        <Animated.View
          style={[styles.progressFill, progressBarStyle, { backgroundColor: accentColor }]}
        />
      </View>

      {/* Session title */}
      <View style={styles.sessionHeader}>
        <Text style={styles.sessionTitle}>{session.label}</Text>
        <Text style={styles.sessionSub}>
          {totalExercises} exercises
          {previousSession ? '  ·  PR data loaded' : '  ·  First session'}
        </Text>
      </View>

      {/* Exercise list */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Previous session callout */}
        {previousSession && (
          <View style={styles.prevBanner}>
            <Text style={styles.prevBannerText}>
              Previous: {previousSession.date} · {previousSession.durationMinutes}min
              {' '}— beat these numbers.
            </Text>
          </View>
        )}

        {/* Warm-up stretches */}
        {session.warmUp.length > 0 && (
          <StretchSection title="WARM-UP" stretches={session.warmUp} accentColor={accentColor} />
        )}

        {adjustedExercises.map((exercise, idx) => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            previousLog={previousSession?.exerciseLogs.find((el) => el.exerciseId === exercise.id)}
            initialSets={exerciseLogs.get(exercise.id)}
            onSetsUpdate={handleSetsUpdate}
            onRestStart={(secs) => { setRestTimerSecs(secs); setRestExerciseName(exercise.name); }}
            isActive={true}
            enterDelay={idx * 60}
          />
        ))}

        {/* Cool-down stretches */}
        {session.coolDown.length > 0 && (
          <StretchSection title="COOL-DOWN" stretches={session.coolDown} accentColor={Colors.accentGreen} />
        )}

        {/* Finish button at bottom */}
        <View style={styles.finishSection}>
          <Button
            label="Finish Workout"
            variant="primary"
            fullWidth
            onPress={handleFinish}
          />
          <Text style={styles.finishNote}>
            Partial workouts still count toward your streak.
          </Text>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
