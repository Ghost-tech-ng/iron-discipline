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
import type { Stretch } from '../../types';
import { useLocalSearchParams, router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ExerciseCard } from '../../components/workouts/ExerciseCard';
import { RestTimer } from '../../components/workouts/RestTimer';
import { Button } from '../../components/ui/Button';
import { WEEKLY_SPLIT, SESSION_COLORS } from '../../constants/workouts';
import { useWorkoutStore } from '../../store/workoutStore';
import { useDisciplineStore } from '../../store/disciplineStore';
import { saveWorkoutLog, getLastSessionByType } from '../../services/workoutService';
import { useColors } from '../../hooks/useColors';
import { Spacing, Typography } from '../../constants/theme';
import type { SessionType, SetLog, WorkoutLog } from '../../types';

type RouteParams = { id: SessionType };

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
  const { id } = useLocalSearchParams<RouteParams>();
  const session = id
    ? WEEKLY_SPLIT[ALL_DAYS.find((d) => WEEKLY_SPLIT[d]?.type === id) ?? 'monday']
    : null;

  const { completeWorkout } = useWorkoutStore();
  const { setWorkoutDone } = useDisciplineStore();

  const [exerciseLogs, setExerciseLogs] = useState<Map<string, SetLog[]>>(new Map());
  const [restTimerSecs, setRestTimerSecs] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [previousSession, setPreviousSession] = useState<WorkoutLog | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
      fontSize: 18,
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
      height: 2,
      backgroundColor: Colors.surface2,
    },
    progressFill: {
      height: '100%',
      borderRadius: 1,
    },
    sessionHeader: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      gap: 3,
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
  }), [Colors]);

  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  useEffect(() => {
    if (!id) return;
    getLastSessionByType(id).then((log) => setPreviousSession(log));
  }, [id]);

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

  const accentColor = SESSION_COLORS[session.type] ?? Colors.accent;
  const completedExerciseCount = [...exerciseLogs.values()].filter(
    (sets) => {
      const exercise = session.exercises.find((e) =>
        [...exerciseLogs.entries()].find(([k, v]) => v === sets)?.[0] === e.id
      );
      return exercise && sets.length >= exercise.sets;
    }
  ).length;

  const totalExercises = session.exercises.length;
  const progressPct = totalExercises > 0 ? completedExerciseCount / totalExercises : 0;

  function handleSetsUpdate(exerciseId: string, sets: SetLog[]) {
    setExerciseLogs((prev) => new Map(prev).set(exerciseId, sets));
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
              date: new Date().toISOString().split('T')[0],
              sessionType: session.type,
              sessionLabel: session.label,
              durationMinutes,
              completed: true,
              exerciseLogs: session.exercises.map((ex) => ({
                exerciseId: ex.id,
                exerciseName: ex.name,
                sets: exerciseLogs.get(ex.id) ?? [],
              })),
            };

            await saveWorkoutLog(log);
            completeWorkout(durationMinutes);
            setWorkoutDone(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.back();
          },
        },
      ]
    );
  }

  function handleCancel() {
    Alert.alert('Cancel Workout?', 'Progress will not be saved.', [
      { text: 'Keep Going', style: 'cancel' },
      { text: 'Cancel Workout', style: 'destructive', onPress: () => router.back() },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Rest timer overlay */}
      {restTimerSecs !== null && (
        <RestTimer
          seconds={restTimerSecs}
          onComplete={() => setRestTimerSecs(null)}
          onDismiss={() => setRestTimerSecs(null)}
        />
      )}

      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable onPress={handleCancel} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>✕</Text>
        </Pressable>

        <View style={styles.topCenter}>
          <View style={[styles.typePill, { backgroundColor: accentColor + '20' }]}>
            <View style={[styles.typeDot, { backgroundColor: accentColor }]} />
            <Text style={[styles.typeText, { color: accentColor }]}>
              {session.type.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.elapsed}>{formatElapsed(elapsed)}</Text>
        </View>

        <Pressable onPress={handleFinish} style={styles.finishBtn}>
          <Text style={styles.finishText}>Done</Text>
        </Pressable>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${progressPct * 100}%`, backgroundColor: accentColor },
          ]}
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

        {session.exercises.map((exercise) => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            previousLog={previousSession?.exerciseLogs.find((el) => el.exerciseId === exercise.id)}
            onSetsUpdate={handleSetsUpdate}
            onRestStart={(secs) => setRestTimerSecs(secs)}
            isActive={true}
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
