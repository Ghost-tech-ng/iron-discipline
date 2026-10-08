import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { SetLog } from '../../types';
import { useColors } from '../../hooks/useColors';
import { Fonts, Spacing } from '../../constants/theme';

/** Width of the strike/stamp column; ExerciseCard's column headers pad to match. */
export const SET_ACTION_WIDTH = 74;

interface SetRowProps {
  setNumber: number;
  previous?: { weight: number; reps: number };
  defaultWeight?: number;
  onComplete: (set: SetLog) => void;
  onUndo: (setNumber: number) => void;
  completed: boolean;
  /** The first unlogged set — gets the red STRIKE call to action. */
  isNext?: boolean;
  existingLog?: SetLog;
  noWeight?: boolean;
}

export function SetRow({
  setNumber,
  previous,
  defaultWeight = 0,
  onComplete,
  onUndo,
  completed,
  isNext = false,
  existingLog,
  noWeight = false,
}: SetRowProps) {
  const C = useColors();
  const [weight, setWeight] = useState(
    existingLog?.weight?.toString() ?? (previous?.weight ?? defaultWeight).toString()
  );
  const [reps, setReps] = useState(
    existingLog?.reps?.toString() ?? (previous?.reps ?? '').toString()
  );

  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  function handleComplete() {
    if (completed) {
      // Undo — tap again to re-enter
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onUndo(setNumber);
      return;
    }
    if (!reps || (!noWeight && !weight)) return;
    scale.value = withSequence(
      withSpring(0.92, { damping: 10 }),
      withSpring(1, { damping: 12 })
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onComplete({
      setNumber,
      weight: noWeight ? 0 : parseFloat(weight) || 0,
      reps: parseInt(reps, 10) || 0,
      completed: true,
    });
  }

  const styles = React.useMemo(() => StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: Spacing.md },
    rowNext: { backgroundColor: C.accent + '12' },
    setNum: { width: 22, alignItems: 'center' },
    setNumText: { fontFamily: Fonts.display, fontSize: 17, color: C.muted },
    setNumDone: { color: C.accent },
    setNumNext: { color: C.primary },
    prevCol: { width: 50, alignItems: 'center' },
    prevText: { fontFamily: Fonts.bodySemi, fontSize: 11, color: C.muted },
    prevEmpty: { fontFamily: Fonts.body, fontSize: 11, color: C.dim },
    input: {
      flex: 1, minWidth: 48, backgroundColor: C.surface2, borderRadius: 8, borderWidth: 1, borderColor: C.border,
      paddingVertical: 7, paddingHorizontal: 8, fontFamily: Fonts.display, fontSize: 18, color: C.primary, textAlign: 'center',
    },
    inputNext: { borderColor: C.accent + '66' },
    inputDone: { borderColor: C.surface, backgroundColor: C.surface, color: C.secondary },
    bwLabel: { flex: 1, textAlign: 'center', fontFamily: Fonts.display, fontSize: 15, letterSpacing: 1, color: C.muted },
    x: { fontFamily: Fonts.bodySemi, fontSize: 12, color: C.muted },
    action: { width: SET_ACTION_WIDTH, alignItems: 'flex-end', justifyContent: 'center' },
    strike: {
      flexDirection: 'row', alignItems: 'center', gap: 4, height: 34, paddingHorizontal: 12, borderRadius: 999,
      backgroundColor: C.accent, shadowColor: C.accent, shadowOpacity: 0.5, shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 }, elevation: 4,
    },
    strikeText: { fontFamily: Fonts.display, fontSize: 14, letterSpacing: 1.2, color: C.onAccent },
    box: {
      width: 30, height: 30, marginRight: 4, borderRadius: 7, borderWidth: 1.5, borderColor: C.borderLight,
      alignItems: 'center', justifyContent: 'center',
    },
    stamp: { backgroundColor: C.accent, borderColor: C.accent, transform: [{ rotate: '-8deg' }] },
  }), [C]);

  return (
    <Animated.View style={[styles.row, isNext && styles.rowNext, animStyle]}>
      <View style={styles.setNum}>
        <Text style={[styles.setNumText, isNext && styles.setNumNext, completed && styles.setNumDone]}>
          {setNumber}
        </Text>
      </View>

      <View style={styles.prevCol}>
        {previous ? (
          <Text style={styles.prevText}>
            {noWeight ? `${previous.reps}r` : `${previous.weight}×${previous.reps}`}
          </Text>
        ) : (
          <Text style={styles.prevEmpty}>—</Text>
        )}
      </View>

      {noWeight ? (
        <Text style={styles.bwLabel}>BW</Text>
      ) : (
        <TextInput
          style={[styles.input, isNext && styles.inputNext, completed && styles.inputDone]}
          value={weight}
          onChangeText={setWeight}
          keyboardType="decimal-pad"
          placeholder="kg"
          placeholderTextColor={C.muted}
          editable={!completed}
          selectTextOnFocus
          selectionColor={C.accent}
        />
      )}

      <Text style={styles.x}>×</Text>

      <TextInput
        style={[styles.input, isNext && styles.inputNext, completed && styles.inputDone]}
        value={reps}
        onChangeText={setReps}
        keyboardType="number-pad"
        placeholder="reps"
        placeholderTextColor={C.muted}
        editable={!completed}
        selectTextOnFocus
        selectionColor={C.accent}
      />

      <View style={styles.action}>
        {isNext && !completed ? (
          <Pressable onPress={handleComplete} style={styles.strike} hitSlop={6}>
            <Ionicons name="hammer" size={13} color={C.onAccent} />
            <Text style={styles.strikeText}>STRIKE</Text>
          </Pressable>
        ) : (
          <Pressable onPress={handleComplete} style={[styles.box, completed && styles.stamp]} hitSlop={8}>
            {completed && <Ionicons name="checkmark" size={18} color={C.onAccent} />}
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}
