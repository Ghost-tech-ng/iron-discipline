import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  FadeInDown,
  Easing,
} from 'react-native-reanimated';
import { SetRow, SET_ACTION_WIDTH } from './SetRow';
import { SwapPicker } from './SwapPicker';
import { ExerciseHeader, type Recommendation } from './ExerciseHeader';
import { getExerciseImageUrl, getSwapImageUrl } from '../../constants/exerciseImages';
import type { Exercise, SetLog, ExerciseLog, MuscleGroup } from '../../types';
import { useColors } from '../../hooks/useColors';
import { Fonts, Spacing, Radius } from '../../constants/theme';

const LEG_MUSCLES: MuscleGroup[] = ['legs', 'quads', 'hamstrings', 'glutes', 'calves'];

function calcRecommendation(exercise: Exercise, previousLog: ExerciseLog | undefined): Recommendation {
  if (exercise.bodyweight) return { weight: 0, direction: 'none' };
  if (!previousLog || previousLog.sets.length === 0) return { weight: 0, direction: 'none' };
  const completedSets = previousLog.sets.filter((s) => s.completed);
  if (completedSets.length === 0) return { weight: 0, direction: 'none' };
  const maxWeight = Math.max(...completedSets.map((s) => s.weight));
  // Double progression: earn the top of the rep range on every set before adding load.
  // Bumping at the bottom of the range turned lateral raises and curls into +5 kg jumps
  // every session, which stalls within weeks and drags form with it.
  const allHitTop = completedSets.every((s) => s.reps >= exercise.repsMax);
  if (allHitTop && maxWeight > 0) {
    const isLower = exercise.muscleGroups.some((m) => LEG_MUSCLES.includes(m));
    return { weight: maxWeight + (isLower ? 5 : 2.5), direction: 'up' };
  }
  return { weight: maxWeight, direction: 'hold' };
}

interface ExerciseCardProps {
  exercise: Exercise;
  previousLog?: ExerciseLog;
  initialSets?: SetLog[];
  onSetsUpdate: (exerciseId: string, sets: SetLog[]) => void;
  onRestStart: (seconds: number) => void;
  isActive: boolean;
  enterDelay?: number;
  /** Substitute the user picked for this slot, if any. */
  activeSwap?: string;
  onSwap: (swapName: string | null) => void;
}

export function ExerciseCard({
  exercise,
  previousLog,
  initialSets,
  onSetsUpdate,
  onRestStart,
  enterDelay = 0,
  activeSwap,
  onSwap,
}: ExerciseCardProps) {
  const C = useColors();
  const [completedSets, setCompletedSets] = useState<SetLog[]>(initialSets ?? []);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const completedCount = completedSets.length;
  const recommendation = calcRecommendation(exercise, previousLog);

  useEffect(() => {
    let cancelled = false;
    setImageUrl(null);
    const load = activeSwap ? getSwapImageUrl(activeSwap) : getExerciseImageUrl(exercise.id);
    load.then((url) => { if (!cancelled) setImageUrl(url); });
    return () => { cancelled = true; };
  }, [exercise.id, activeSwap]);

  const totalSets = exercise.sets;
  const allDone = completedCount >= totalSets;
  const inProgress = completedCount > 0 && !allDone;
  const isDone = (n: number) => completedSets.some((s) => s.setNumber === n);
  const nextSet = Array.from({ length: totalSets }, (_, i) => i + 1).find((n) => !isDone(n));

  const borderAnim = useSharedValue(0);
  const pulseOpacity = useSharedValue(0);
  const doneScale = useSharedValue(1);

  useEffect(() => {
    if (allDone) {
      borderAnim.value = withTiming(1, { duration: 300 });
      pulseOpacity.value = withTiming(0, { duration: 200 });
      doneScale.value = withSequence(
        withSpring(1.025, { damping: 8, stiffness: 260 }),
        withSpring(1.0, { damping: 14, stiffness: 200 })
      );
    } else if (inProgress) {
      borderAnim.value = withTiming(0, { duration: 200 });
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.35, { duration: 900, easing: Easing.inOut(Easing.quad) })
        ),
        -1
      );
    } else {
      borderAnim.value = withTiming(0, { duration: 200 });
      pulseOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [allDone, inProgress]);

  const cardStyle = useAnimatedStyle(() => ({
    borderColor: borderAnim.value === 1 ? C.accent : C.border,
    transform: [{ scale: doneScale.value }],
  }));
  const accentBarStyle = useAnimatedStyle(() => ({ opacity: pulseOpacity.value }));

  function handleSetComplete(set: SetLog) {
    const updated = [...completedSets.filter((s) => s.setNumber !== set.setNumber), set];
    setCompletedSets(updated);
    onSetsUpdate(exercise.id, updated);
    if (updated.length < totalSets) onRestStart(exercise.restSeconds);
  }

  function handleSetUndo(setNumber: number) {
    const updated = completedSets.filter((s) => s.setNumber !== setNumber);
    setCompletedSets(updated);
    onSetsUpdate(exercise.id, updated);
  }

  const styles = React.useMemo(() => StyleSheet.create({
    card: { backgroundColor: C.surface, borderRadius: Radius.lg, borderWidth: 1.5, overflow: 'hidden' },
    accentBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: C.accent, zIndex: 1 },
    brief: { paddingHorizontal: Spacing.md, paddingTop: 12, gap: 4 },
    notes: { fontFamily: Fonts.bodySemi, fontSize: 12, color: C.secondary },
    why: { fontFamily: Fonts.body, fontSize: 11.5, lineHeight: 16, color: C.muted },
    colHeaders: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: Spacing.md, paddingTop: 12, paddingBottom: 6 },
    colHead: { fontFamily: Fonts.bodyHeavy, fontSize: 9, letterSpacing: 1.4, color: C.muted, textAlign: 'center' },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: C.border },
    setSep: { height: StyleSheet.hairlineWidth, backgroundColor: C.surface2, marginLeft: 40 },
    undoHint: { fontFamily: Fonts.body, fontSize: 11, color: C.muted, textAlign: 'center', paddingVertical: 6 },
    specRow: { paddingHorizontal: Spacing.md, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.border },
    specText: { fontFamily: Fonts.bodyBold, fontSize: 10, letterSpacing: 1, color: C.muted },
  }), [C]);

  return (
    <Animated.View entering={FadeInDown.delay(enterDelay).duration(400)} style={[styles.card, cardStyle]}>
      <Animated.View style={[styles.accentBar, accentBarStyle]} />

      <ExerciseHeader
        exercise={exercise}
        activeSwap={activeSwap}
        imageUrl={imageUrl}
        completedCount={completedCount}
        recommendation={recommendation}
      />

      {(exercise.notes || exercise.why) && (
        <View style={styles.brief}>
          {exercise.notes && <Text style={styles.notes}>{exercise.notes}</Text>}
          {exercise.why && <Text style={styles.why}>{exercise.why}</Text>}
        </View>
      )}

      <View style={styles.colHeaders}>
        <Text style={[styles.colHead, { width: 22 }]}>SET</Text>
        <Text style={[styles.colHead, { width: 50 }]}>PREV</Text>
        <Text style={[styles.colHead, { flex: 1 }]}>{exercise.bodyweight ? 'BW' : 'KG'}</Text>
        <View style={{ width: 8 }} />
        <Text style={[styles.colHead, { flex: 1 }]}>{exercise.isTimed ? 'SECS' : 'REPS'}</Text>
        <View style={{ width: SET_ACTION_WIDTH }} />
      </View>

      <View style={styles.divider} />

      {Array.from({ length: totalSets }).map((_, i) => (
        <React.Fragment key={`${activeSwap ?? 'base'}-${i}`}>
          <SetRow
            setNumber={i + 1}
            previous={previousLog?.sets.find((s) => s.setNumber === i + 1)}
            defaultWeight={
              recommendation.direction !== 'none'
                ? recommendation.weight
                : (previousLog?.sets[i]?.weight ?? 0)
            }
            onComplete={handleSetComplete}
            onUndo={handleSetUndo}
            completed={isDone(i + 1)}
            isNext={nextSet === i + 1}
            existingLog={completedSets.find((s) => s.setNumber === i + 1)}
            noWeight={exercise.bodyweight}
          />
          {i < totalSets - 1 && <View style={styles.setSep} />}
        </React.Fragment>
      ))}

      {completedCount > 0 && <Text style={styles.undoHint}>Tap a stamp to undo a set</Text>}

      {!!exercise.swaps?.length && (
        <SwapPicker originalName={exercise.name} swaps={exercise.swaps} activeSwap={activeSwap} onSwap={onSwap} />
      )}

      <View style={styles.specRow}>
        <Text style={styles.specText}>
          {totalSets} SETS · {exercise.repsMin}–{exercise.repsMax}{' '}
          {exercise.isTimed ? 'SECS' : exercise.bodyweight ? 'REPS/SECS' : 'REPS'}
          {exercise.perSide ? ' PER SIDE' : ''} · {exercise.restSeconds}S QUENCH
        </Text>
      </View>
    </Animated.View>
  );
}
