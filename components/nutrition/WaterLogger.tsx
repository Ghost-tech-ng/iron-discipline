import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { useNutritionStore } from '../../store/nutritionStore';
import { useDisciplineStore } from '../../store/disciplineStore';
import { useHabitStore } from '../../store/habitStore';
import { logWater } from '../../services/nutritionService';
import { useColors } from '../../hooks/useColors';
import { Typography, Spacing } from '../../constants/theme';

const AMOUNTS = [
  { label: '250', ml: 250 },
  { label: '500', ml: 500 },
  { label: '750', ml: 750 },
  { label: '1L', ml: 1000 },
];

const GOAL_ML = 3500;

export function WaterLogger() {
  const Colors = useColors();
  const { waterMl, addWater } = useNutritionStore();
  const { setWaterGoalHit } = useDisciplineStore();
  const pct = Math.min(waterMl / GOAL_ML, 1);
  const glassCount = Math.round((waterMl / GOAL_ML) * 8);

  async function handleAdd(ml: number) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addWater(ml);
    await logWater(ml);
    if (waterMl + ml >= GOAL_ML) {
      setWaterGoalHit(true);
      const habitStore = useHabitStore.getState();
      const waterHabit = habitStore.habits.find((h) => h.id === 'water');
      if (waterHabit && !waterHabit.completed) {
        habitStore.toggleHabit('water');
      }
    }
  }

  const styles = React.useMemo(() => StyleSheet.create({
    container: { gap: 10 },
    glassRow: {
      flexDirection: 'row',
      gap: 5,
    },
    glass: {
      flex: 1,
      height: 20,
      borderRadius: 3,
      backgroundColor: Colors.surface2,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    glassFull: {
      backgroundColor: Colors.accent2,
      borderColor: Colors.accent2,
    },
    track: {
      height: 4,
      backgroundColor: Colors.surface2,
      borderRadius: 2,
      overflow: 'hidden',
    },
    fill: {
      height: '100%',
      backgroundColor: Colors.accent2,
      borderRadius: 2,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 4,
    },
    current: {
      ...Typography.h4,
      color: Colors.primary,
      fontWeight: '700',
    },
    goal: {
      ...Typography.small,
      color: Colors.muted,
    },
    done: {
      ...Typography.body,
      color: Colors.accentGreen,
      marginLeft: 4,
    },
    btnRow: {
      flexDirection: 'row',
      gap: 8,
    },
    addBtn: {
      flex: 1,
      backgroundColor: Colors.surface2,
      borderRadius: 8,
      paddingVertical: 9,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: Colors.border,
    },
    addBtnText: {
      ...Typography.small,
      color: Colors.accent2,
      fontWeight: '700',
    },
  }), [Colors]);

  return (
    <View style={styles.container}>
      {/* Glasses visual */}
      <View style={styles.glassRow}>
        {Array.from({ length: 8 }).map((_, i) => (
          <View
            key={i}
            style={[styles.glass, i < glassCount && styles.glassFull]}
          />
        ))}
      </View>

      {/* Bar */}
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct * 100}%` }]} />
      </View>

      {/* Numbers */}
      <View style={styles.infoRow}>
        <Text style={styles.current}>
          {waterMl >= 1000
            ? `${(waterMl / 1000).toFixed(1)}L`
            : `${waterMl}ml`}
        </Text>
        <Text style={styles.goal}>/ 3.5L</Text>
        {pct >= 1 && <Text style={styles.done}>✓</Text>}
      </View>

      {/* Add buttons */}
      <View style={styles.btnRow}>
        {AMOUNTS.map((a) => (
          <Pressable key={a.ml} onPress={() => handleAdd(a.ml)} style={styles.addBtn}>
            <Text style={styles.addBtnText}>+{a.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
