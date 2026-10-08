import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ExerciseCard } from '../../components/workouts/ExerciseCard';
import { RestTimer } from '../../components/workouts/RestTimer';
import { StretchSection } from '../../components/workouts/StretchSection';
import { WorkoutTopBar } from '../../components/forge/WorkoutTopBar';
import { Button } from '../../components/ui/Button';
import { WEEKLY_SPLIT } from '../../constants/workouts';
import { getVolumeModifier } from '../../constants/plan';
import { useWorkoutStore } from '../../store/workoutStore';
import { useDisciplineStore, WEIGHTS } from '../../store/disciplineStore';
import { useSwapStore } from '../../store/swapStore';
import { saveWorkoutLog, getLastSessionByType } from '../../services/workoutService';
import { useColors } from '../../hooks/useColors';
import { Fonts, Radius, Spacing, sessionColor } from '../../constants/theme';
import type { Exercise, ExerciseLog, SessionType, SetLog, WorkoutLog } from '../../types';
import { localIso } from '../../utils/date';
import { cancelTodayWorkoutReminder } from '../../services/notificationService';
import { markWorkoutDoneOn } from '../../services/disciplineService';

type RouteParams = { id: SessionType; makeupDate?: string };

/** Last session's log for this slot, but only if it was the same variant — a Smith squat
 *  weight is a meaningless target for a back squat and vice versa. */
function matchingPreviousLog(
  previous: WorkoutLog | null,
  exercise: Exercise,
  activeSwap: string | undefined
): ExerciseLog | undefined {
  const log = previous?.exerciseLogs.find((el) => el.exerciseId === exercise.id);
  if (!log) return undefined;
  if (activeSwap) return log.exerciseName === activeSwap ? log : undefined;
  return exercise.swaps?.includes(log.exerciseName) ? undefined : log;
}

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const ALL_DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'] as const;

export default function WorkoutScreen() {
  const Colors = useColors();
  const { id, makeupDate } = useLocalSearchParams<RouteParams>();
  const session = id
    ? WEEKLY_SPLIT[ALL_DAYS.find((d) => WEEKLY_SPLIT[d]?.type === id) ?? 'monday']
    : null;

  // Volume rides the phase: sets creep up through a block, then get cut to 60%
  // on the deload week so the accumulated fatigue can drain and the adaptation show.
  const volume = getVolumeModifier();
  const adjustedExercises = session?.exercises.map((ex) => {
    const withProgression = ex.compound ? ex.sets + volume.extraSets : ex.sets;
    const sets = volume.isDeload
      ? Math.max(2, Math.round(withProgression * volume.setMultiplier))
      : withProgression;
    return { ...ex, sets };
  }) ?? [];

  const { completeWorkout, activeSession, startSession, updateSessionLog, clearActiveSession } = useWorkoutStore();
  const { setWorkoutDone } = useDisciplineStore();

  const accentColor = sessionColor(Colors, id) ?? Colors.accent;

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
  const swaps = useSwapStore((s) => s.swaps);
  const loadSwaps = useSwapStore((s) => s.load);
  const setSwap = useSwapStore((s) => s.setSwap);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionStartRef = useRef<number>(
    isResume ? activeSession!.startedAt : Date.now()
  );

  const styles = React.useMemo(() => StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.base },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md, gap: Spacing.md, paddingBottom: 20 },
    prevBanner: {
      backgroundColor: Colors.surface, borderRadius: Radius.md, padding: 12,
      borderWidth: 1, borderColor: Colors.border, borderLeftWidth: 3, borderLeftColor: Colors.accent,
    },
    prevBannerText: { fontFamily: Fonts.body, fontSize: 12, color: Colors.secondary, lineHeight: 18 },
    prevBannerHot: { fontFamily: Fonts.bodyBold, color: Colors.primary },
    finishSection: { gap: 10, marginTop: 8 },
    finishNote: { fontFamily: Fonts.body, fontSize: 11, color: Colors.muted, textAlign: 'center' },
    errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
    errorText: { fontFamily: Fonts.body, fontSize: 15, color: Colors.secondary },
  }), [Colors]);

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

  useEffect(() => { loadSwaps(); }, []);

  function handleSwap(exerciseId: string, swapName: string | null) {
    setSwap(exerciseId, swapName).catch(() =>
      Alert.alert('Swap not saved', 'Could not save that substitution. Try again.')
    );
  }

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

  const setsTotal = adjustedExercises.reduce((n, ex) => n + ex.sets, 0);
  const setsDone = adjustedExercises.reduce(
    (n, ex) => n + Math.min(exerciseLogs.get(ex.id)?.length ?? 0, ex.sets),
    0
  );
  const meta = [
    `${adjustedExercises.length} EXERCISES`,
    volume.isDeload
      ? 'DELOAD · 60% SETS'
      : volume.extraSets > 0
        ? `+${volume.extraSets} SET${volume.extraSets > 1 ? 'S' : ''} ON COMPOUNDS`
        : null,
    previousSession ? 'PR DATA LOADED' : 'FIRST SESSION',
  ].filter(Boolean).join('  ·  ');

  function handleSetsUpdate(exerciseId: string, sets: SetLog[]) {
    setExerciseLogs((prev) => new Map(prev).set(exerciseId, sets));
    updateSessionLog(exerciseId, sets);
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
              date: makeupDate ?? localIso(),
              sessionType: session.type,
              sessionLabel: session.label,
              durationMinutes,
              completed: true,
              exerciseLogs: adjustedExercises.map((ex) => ({
                exerciseId: ex.id,
                exerciseName: swaps[ex.id] ?? ex.name,
                sets: exerciseLogs.get(ex.id) ?? [],
              })),
            };

            await saveWorkoutLog(log);
            completeWorkout(durationMinutes);
            clearActiveSession();
            if (log.date === localIso()) {
              setWorkoutDone(true);
              cancelTodayWorkoutReminder();
            } else {
              await markWorkoutDoneOn(log.date, WEIGHTS.workoutDone);
            }
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.back();
          },
        },
      ]
    );
  }

  function handleOptions() {
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
      {restTimerSecs !== null && (
        <RestTimer
          seconds={restTimerSecs}
          exerciseName={restExerciseName}
          onComplete={() => setRestTimerSecs(null)}
          onDismiss={() => setRestTimerSecs(null)}
        />
      )}

      <WorkoutTopBar
        type={session.type}
        label={session.label}
        intent={session.intent}
        meta={meta}
        elapsed={formatElapsed(elapsed)}
        setsDone={setsDone}
        setsTotal={setsTotal}
        accentColor={accentColor}
        onMinimize={() => router.back()}
        onOptions={handleOptions}
        onFinish={handleFinish}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {previousSession && (
          <View style={styles.prevBanner}>
            <Text style={styles.prevBannerText}>
              Previous: {previousSession.date} · {previousSession.durationMinutes}min
              {' '}— <Text style={styles.prevBannerHot}>beat these numbers.</Text>
            </Text>
          </View>
        )}

        {session.warmUp.length > 0 && (
          <StretchSection title="WARM-UP" stretches={session.warmUp} accentColor={accentColor} />
        )}

        {adjustedExercises.map((exercise, idx) => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            previousLog={matchingPreviousLog(previousSession, exercise, swaps[exercise.id])}
            initialSets={exerciseLogs.get(exercise.id)}
            onSetsUpdate={handleSetsUpdate}
            onRestStart={(secs) => { setRestTimerSecs(secs); setRestExerciseName(swaps[exercise.id] ?? exercise.name); }}
            activeSwap={swaps[exercise.id]}
            onSwap={(name) => handleSwap(exercise.id, name)}
            isActive={true}
            enterDelay={idx * 60}
          />
        ))}

        {session.coolDown.length > 0 && (
          <StretchSection title="COOL-DOWN" stretches={session.coolDown} accentColor={Colors.accent2} />
        )}

        <View style={styles.finishSection}>
          <Button label="Finish Workout" variant="primary" fullWidth onPress={handleFinish} />
          <Text style={styles.finishNote}>Partial workouts still count toward your streak.</Text>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
