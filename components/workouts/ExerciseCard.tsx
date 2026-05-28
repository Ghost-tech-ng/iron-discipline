import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
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
import { SetRow } from './SetRow';
import { getExerciseImageUrl } from '../../constants/exerciseImages';
import type { Exercise, SetLog, ExerciseLog, MuscleGroup } from '../../types';
import { useColors } from '../../hooks/useColors';
import { Typography, Spacing, Radius } from '../../constants/theme';

const LEG_MUSCLES: MuscleGroup[] = ['legs', 'quads', 'hamstrings', 'glutes', 'calves'];

function calcRecommendation(
  exercise: Exercise,
  previousLog: ExerciseLog | undefined
): { weight: number; direction: 'up' | 'hold' | 'none' } {
  if (exercise.bodyweight) return { weight: 0, direction: 'none' };
  if (!previousLog || previousLog.sets.length === 0) return { weight: 0, direction: 'none' };
  const completedSets = previousLog.sets.filter((s) => s.completed);
  if (completedSets.length === 0) return { weight: 0, direction: 'none' };
  const maxWeight = Math.max(...completedSets.map((s) => s.weight));
  const allHitReps = completedSets.every((s) => s.reps >= exercise.repsMin);
  if (allHitReps) {
    return { weight: maxWeight + 5, direction: 'up' };
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
}

export function ExerciseCard({
  exercise,
  previousLog,
  initialSets,
  onSetsUpdate,
  onRestStart,
  isActive,
  enterDelay = 0,
}: ExerciseCardProps) {
  const Colors = useColors();
  const [completedSets, setCompletedSets] = useState<SetLog[]>(initialSets ?? []);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const completedCount = completedSets.length;
  const recommendation = calcRecommendation(exercise, previousLog);

  useEffect(() => {
    getExerciseImageUrl(exercise.id).then(setImageUrl);
  }, [exercise.id]);

  const totalSets = exercise.sets;
  const allDone = completedCount >= totalSets;
  const inProgress = completedCount > 0 && !allDone;

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
      pulseOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [allDone, inProgress]);

  const cardStyle = useAnimatedStyle(() => ({
    borderColor: borderAnim.value === 1 ? Colors.accentGreen : Colors.border,
    transform: [{ scale: doneScale.value }],
  }));

  const accentBarStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

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

  function getPreviousSet(setNum: number) {
    return previousLog?.sets.find((s) => s.setNumber === setNum);
  }

  function isSetCompleted(setNum: number) {
    return completedSets.some((s) => s.setNumber === setNum);
  }

  const styles = React.useMemo(() => StyleSheet.create({
    card: {
      backgroundColor: Colors.surface,
      borderRadius: Radius.lg,
      borderWidth: 1,
      overflow: 'hidden',
    },
    accentBar: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 3,
      backgroundColor: Colors.accent,
      zIndex: 1,
    },
    imageContainer: {
      width: '100%',
      height: 148,
      backgroundColor: '#f0ede8',
      alignItems: 'center',
      justifyContent: 'center',
    },
    exerciseImage: { width: '100%', height: '100%' },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingHorizontal: Spacing.md,
      paddingTop: Spacing.md,
      paddingBottom: 8,
      gap: 12,
    },
    headerLeft: { flex: 1, gap: 4 },
    name: {
      ...Typography.h4,
      color: Colors.primary,
      fontWeight: '700',
      letterSpacing: -0.3,
    },
    nameDone: { color: Colors.secondary },
    notes: {
      ...Typography.caption,
      color: Colors.muted,
      fontStyle: 'italic',
    },
    progress: {
      backgroundColor: Colors.surface2,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
    },
    progressText: {
      ...Typography.small,
      color: Colors.secondary,
      fontWeight: '700',
      fontVariant: ['tabular-nums'],
    },
    colHeaders: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: Spacing.md,
      paddingBottom: 6,
    },
    colHead: {
      ...Typography.label,
      color: Colors.muted,
      letterSpacing: 0.8,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: Colors.border,
    },
    setSep: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: Colors.surface2,
      marginLeft: 40,
    },
    specRow: {
      paddingHorizontal: Spacing.md,
      paddingVertical: 10,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: Colors.border,
    },
    specText: { ...Typography.caption, color: Colors.muted },
    targetBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      borderWidth: 1,
    },
    targetBadgeUp: {
      backgroundColor: Colors.accentGreen + '15',
      borderColor: Colors.accentGreen + '50',
    },
    targetBadgeHold: {
      backgroundColor: '#f59e0b15',
      borderColor: '#f59e0b50',
    },
    targetText: {
      ...Typography.caption,
      fontWeight: '600',
      fontSize: 11,
      letterSpacing: 0.3,
    },
    targetTextUp: { color: Colors.accentGreen },
    targetTextHold: { color: '#f59e0b' },
    undoHint: {
      ...Typography.caption,
      color: Colors.muted,
      textAlign: 'center',
      paddingBottom: 6,
      fontStyle: 'italic',
    },
  }), [Colors]);

  return (
    <Animated.View
      entering={FadeInDown.delay(enterDelay).duration(400)}
      style={[styles.card, cardStyle]}
    >
      <Animated.View style={[styles.accentBar, accentBarStyle]} />

      {imageUrl && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUrl }} style={styles.exerciseImage} resizeMode="contain" />
        </View>
      )}

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.name, allDone && styles.nameDone]}>{exercise.name}</Text>
          {exercise.notes && <Text style={styles.notes}>{exercise.notes}</Text>}
          {recommendation.direction !== 'none' && (
            <View style={[
              styles.targetBadge,
              recommendation.direction === 'up' ? styles.targetBadgeUp : styles.targetBadgeHold,
            ]}>
              <Text style={[
                styles.targetText,
                recommendation.direction === 'up' ? styles.targetTextUp : styles.targetTextHold,
              ]}>
                {recommendation.direction === 'up'
                  ? `Target ${recommendation.weight}kg ↑`
                  : `Target ${recommendation.weight}kg — hold`}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.progress}>
          <Text style={[styles.progressText, allDone && { color: Colors.accentGreen }]}>
            {completedCount}/{totalSets}
          </Text>
        </View>
      </View>

      {/* Column headers */}
      <View style={styles.colHeaders}>
        <View style={{ width: 24 }} />
        <Text style={[styles.colHead, { width: 52, textAlign: 'center' }]}>PREV</Text>
        {exercise.bodyweight ? (
          <Text style={[styles.colHead, { flex: 1, textAlign: 'center' }]}>BW</Text>
        ) : (
          <Text style={[styles.colHead, { flex: 1, textAlign: 'center' }]}>KG</Text>
        )}
        <View style={{ width: 12 }} />
        <Text style={[styles.colHead, { flex: 1, textAlign: 'center' }]}>REPS</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.divider} />

      {/* Sets */}
      {Array.from({ length: totalSets }).map((_, i) => (
        <React.Fragment key={i}>
          <SetRow
            setNumber={i + 1}
            previous={getPreviousSet(i + 1)}
            defaultWeight={
              recommendation.direction !== 'none'
                ? recommendation.weight
                : (previousLog?.sets[i]?.weight ?? 0)
            }
            onComplete={handleSetComplete}
            onUndo={handleSetUndo}
            completed={isSetCompleted(i + 1)}
            existingLog={completedSets.find((s) => s.setNumber === i + 1)}
            noWeight={exercise.bodyweight}
          />
          {i < totalSets - 1 && <View style={styles.setSep} />}
        </React.Fragment>
      ))}

      {completedCount > 0 && (
        <Text style={styles.undoHint}>Tap ✓ to undo a set</Text>
      )}

      <View style={styles.specRow}>
        <Text style={styles.specText}>
          {totalSets} sets · {exercise.repsMin}–{exercise.repsMax} {exercise.bodyweight ? 'reps/secs' : 'reps'} · {exercise.restSeconds}s rest
        </Text>
      </View>
    </Animated.View>
  );
}
