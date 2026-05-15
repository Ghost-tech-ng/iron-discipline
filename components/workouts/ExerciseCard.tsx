import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { SetRow } from './SetRow';
import type { Exercise, SetLog, ExerciseLog } from '../../types';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';

interface ExerciseCardProps {
  exercise: Exercise;
  previousLog?: ExerciseLog;
  onSetsUpdate: (exerciseId: string, sets: SetLog[]) => void;
  onRestStart: (seconds: number) => void;
  isActive: boolean;
}

export function ExerciseCard({
  exercise,
  previousLog,
  onSetsUpdate,
  onRestStart,
  isActive,
}: ExerciseCardProps) {
  const [completedSets, setCompletedSets] = useState<SetLog[]>([]);
  const completedCount = completedSets.length;
  const totalSets = exercise.sets;
  const allDone = completedCount >= totalSets;

  const borderAnim = useSharedValue(0);
  const cardStyle = useAnimatedStyle(() => ({
    borderColor: borderAnim.value === 1 ? Colors.accentGreen : Colors.border,
  }));

  function handleSetComplete(set: SetLog) {
    const updated = [...completedSets.filter((s) => s.setNumber !== set.setNumber), set];
    setCompletedSets(updated);
    onSetsUpdate(exercise.id, updated);

    if (updated.length >= totalSets) {
      borderAnim.value = withTiming(1, { duration: 400 });
    }

    // Trigger rest timer (not on last set if all done)
    if (updated.length < totalSets) {
      onRestStart(exercise.restSeconds);
    }
  }

  function getPreviousSet(setNum: number): { weight: number; reps: number } | undefined {
    return previousLog?.sets.find((s) => s.setNumber === setNum);
  }

  function isSetCompleted(setNum: number): boolean {
    return completedSets.some((s) => s.setNumber === setNum);
  }

  return (
    <Animated.View style={[styles.card, cardStyle, allDone && styles.cardDone]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.name, allDone && styles.nameDone]}>{exercise.name}</Text>
          {exercise.notes && (
            <Text style={styles.notes}>{exercise.notes}</Text>
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
        <Text style={[styles.colHead, { flex: 1, textAlign: 'center' }]}>KG</Text>
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
            defaultWeight={previousLog?.sets[i]?.weight ?? 0}
            onComplete={handleSetComplete}
            completed={isSetCompleted(i + 1)}
            existingLog={completedSets.find((s) => s.setNumber === i + 1)}
          />
          {i < totalSets - 1 && <View style={styles.setSep} />}
        </React.Fragment>
      ))}

      {/* Spec line */}
      <View style={styles.specRow}>
        <Text style={styles.specText}>
          {totalSets} sets · {exercise.repsMin}–{exercise.repsMax} reps · {exercise.restSeconds}s rest
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  cardDone: {
    backgroundColor: Colors.surface,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: 8,
    gap: 12,
  },
  headerLeft: { flex: 1, gap: 3 },
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
  specText: {
    ...Typography.caption,
    color: Colors.muted,
  },
});
