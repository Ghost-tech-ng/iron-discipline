import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { SetLog } from '../../types';
import { useColors } from '../../hooks/useColors';
import { Typography, Spacing } from '../../constants/theme';

interface SetRowProps {
  setNumber: number;
  previous?: { weight: number; reps: number };
  defaultWeight?: number;
  onComplete: (set: SetLog) => void;
  completed: boolean;
  existingLog?: SetLog;
}

export function SetRow({
  setNumber,
  previous,
  defaultWeight = 0,
  onComplete,
  completed,
  existingLog,
}: SetRowProps) {
  const Colors = useColors();
  const [weight, setWeight] = useState(
    existingLog?.weight?.toString() ?? (previous?.weight ?? defaultWeight).toString()
  );
  const [reps, setReps] = useState(
    existingLog?.reps?.toString() ?? (previous?.reps ?? '').toString()
  );

  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  function handleComplete() {
    if (!weight || !reps) return;
    scale.value = withSequence(
      withSpring(0.92, { damping: 10 }),
      withSpring(1, { damping: 12 })
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onComplete({
      setNumber,
      weight: parseFloat(weight) || 0,
      reps: parseInt(reps, 10) || 0,
      completed: true,
    });
  }

  const styles = React.useMemo(() => StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 10,
      paddingHorizontal: Spacing.md,
    },
    rowDone: {
      opacity: 0.55,
    },
    setNum: {
      width: 24,
      alignItems: 'center',
    },
    setNumText: {
      ...Typography.small,
      color: Colors.muted,
      fontWeight: '600',
    },
    setNumDone: {
      color: Colors.accentGreen,
    },
    prevCol: {
      width: 52,
      alignItems: 'center',
    },
    prevText: {
      ...Typography.caption,
      color: Colors.muted,
      fontWeight: '500',
    },
    prevEmpty: {
      ...Typography.caption,
      color: Colors.border,
    },
    input: {
      flex: 1,
      backgroundColor: Colors.surface2,
      borderRadius: 8,
      paddingVertical: 9,
      paddingHorizontal: 10,
      ...Typography.body,
      color: Colors.primary,
      textAlign: 'center',
      borderWidth: 1,
      borderColor: Colors.border,
      minWidth: 56,
    },
    inputDone: {
      borderColor: 'transparent',
      backgroundColor: 'transparent',
      color: Colors.secondary,
    },
    x: {
      ...Typography.small,
      color: Colors.muted,
    },
    checkBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 1.5,
      borderColor: Colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkBtnDone: {
      backgroundColor: Colors.accentGreen + '20',
      borderColor: Colors.accentGreen,
    },
    checkText: {
      fontSize: 18,
      color: Colors.muted,
    },
    checkTextDone: {
      color: Colors.accentGreen,
      fontWeight: '700',
      fontSize: 16,
    },
  }), [Colors]);

  return (
    <Animated.View style={[styles.row, completed && styles.rowDone, animStyle]}>
      {/* Set number */}
      <View style={styles.setNum}>
        <Text style={[styles.setNumText, completed && styles.setNumDone]}>
          {setNumber}
        </Text>
      </View>

      {/* Previous (ghost) */}
      <View style={styles.prevCol}>
        {previous ? (
          <Text style={styles.prevText}>
            {previous.weight}×{previous.reps}
          </Text>
        ) : (
          <Text style={styles.prevEmpty}>—</Text>
        )}
      </View>

      {/* Weight input */}
      <TextInput
        style={[styles.input, completed && styles.inputDone]}
        value={weight}
        onChangeText={setWeight}
        keyboardType="decimal-pad"
        placeholder="kg"
        placeholderTextColor={Colors.muted}
        editable={!completed}
        selectTextOnFocus
        selectionColor={Colors.accent}
      />

      <Text style={styles.x}>×</Text>

      {/* Reps input */}
      <TextInput
        style={[styles.input, completed && styles.inputDone]}
        value={reps}
        onChangeText={setReps}
        keyboardType="number-pad"
        placeholder="reps"
        placeholderTextColor={Colors.muted}
        editable={!completed}
        selectTextOnFocus
        selectionColor={Colors.accent}
      />

      {/* Complete button */}
      <Pressable
        onPress={handleComplete}
        disabled={completed}
        style={[styles.checkBtn, completed && styles.checkBtnDone]}
      >
        <Text style={[styles.checkText, completed && styles.checkTextDone]}>
          {completed ? '✓' : '○'}
        </Text>
      </Pressable>
    </Animated.View>
  );
}
