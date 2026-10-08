import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useDisciplineStore } from '../../store/disciplineStore';
import { useNutritionStore } from '../../store/nutritionStore';
import { saveSupplementLog, saveMealEntry, deleteMealEntry } from '../../services/nutritionService';
import { DEFAULT_SUPPLEMENTS, FOOD_LIBRARY } from '../../constants/nutrition';
import { localIso } from '../../utils/date';
import type { MealEntry } from '../../types';
import { useColors } from '../../hooks/useColors';
import { Typography, Spacing } from '../../constants/theme';

const WHEY_FOOD = FOOD_LIBRARY.find((f) => f.id === 'whey_protein');

/** One id per day so un-ticking whey removes exactly the scoop that ticking it logged. */
const wheyEntryId = (date: string) => `supp_whey_${date}`;

function SupplementRow({
  id,
  name,
  dose,
  timing,
  taken,
  onToggle,
}: {
  id: string;
  name: string;
  dose: string;
  timing: string;
  taken: boolean;
  onToggle: () => void;
}) {
  const Colors = useColors();
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  function handlePress() {
    scale.value = withSequence(
      withSpring(0.9, { damping: 12 }),
      withSpring(1, { damping: 14 })
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle();
  }

  const suppStyles = React.useMemo(() => StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: Spacing.md,
    },
    rowDone: { opacity: 0.5 },
    check: {
      width: 24,
      height: 24,
      borderRadius: 6,
      borderWidth: 1.5,
      borderColor: Colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkDone: {
      backgroundColor: Colors.accentGreen,
      borderColor: Colors.accentGreen,
    },
    checkMark: {
      fontSize: 13,
      color: Colors.base,
      fontWeight: '700',
    },
    info: { flex: 1, gap: 2 },
    name: {
      ...Typography.body,
      color: Colors.primary,
      fontWeight: '500',
    },
    nameDone: {
      textDecorationLine: 'line-through',
      color: Colors.secondary,
    },
    detail: {
      ...Typography.caption,
      color: Colors.muted,
    },
  }), [Colors]);

  return (
    <Pressable onPress={handlePress}>
      <Animated.View style={[suppStyles.row, taken && suppStyles.rowDone, style]}>
        <View style={[suppStyles.check, taken && suppStyles.checkDone]}>
          {taken && <Ionicons name="checkmark" size={14} color="#fff" />}
        </View>
        <View style={suppStyles.info}>
          <Text style={[suppStyles.name, taken && suppStyles.nameDone]}>{name}</Text>
          <Text style={suppStyles.detail}>{dose} · {timing}</Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

export function SupplementTracker() {
  const Colors = useColors();
  const { supplementsTaken, markSupplementTaken } = useDisciplineStore();
  const { addMeal, removeMeal } = useNutritionStore();
  const doneCount = supplementsTaken.length;
  const total = DEFAULT_SUPPLEMENTS.length;

  async function handleToggle(id: string) {
    markSupplementTaken(id);
    const nowTaken = !supplementsTaken.includes(id);
    if (id === 'whey') syncWheyMeal(nowTaken);
    try {
      await saveSupplementLog(id, nowTaken);
    } catch (e) {
      console.warn('[supplements] save failed', e);
    }
  }

  function syncWheyMeal(taken: boolean) {
    if (!WHEY_FOOD) return;
    const now = new Date();
    const date = localIso(now);
    const entryId = wheyEntryId(date);
    const logged = useNutritionStore.getState().today.entries.some((e) => e.id === entryId);
    if (taken && !logged) {
      const entry: MealEntry = {
        id: entryId,
        date,
        time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
        category: 'post_workout',
        foodItem: WHEY_FOOD,
        quantity: 1,
      };
      addMeal(entry);
      saveMealEntry(entry).catch((e) => console.warn('[supplements] whey meal save failed', e));
    } else if (!taken && logged) {
      removeMeal(entryId);
      deleteMealEntry(entryId).catch((e) => console.warn('[supplements] whey meal delete failed', e));
    }
  }

  const styles = React.useMemo(() => StyleSheet.create({
    container: {
      backgroundColor: Colors.surface,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: Colors.border,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: Colors.border,
    },
    headerLabel: {
      ...Typography.label,
      color: Colors.muted,
      letterSpacing: 1.5,
    },
    count: {
      ...Typography.small,
      color: Colors.secondary,
      fontWeight: '700',
    },
    sep: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: Colors.border,
      marginLeft: 52,
    },
  }), [Colors]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerLabel}>SUPPLEMENTS</Text>
        <Text style={[
          styles.count,
          doneCount === total && { color: Colors.accentGreen }
        ]}>
          {doneCount}/{total}
        </Text>
      </View>

      {DEFAULT_SUPPLEMENTS.map((supp, idx) => (
        <React.Fragment key={supp.id}>
          <SupplementRow
            id={supp.id}
            name={supp.name}
            dose={supp.dose}
            timing={supp.timing}
            taken={supplementsTaken.includes(supp.id)}
            onToggle={() => handleToggle(supp.id)}
          />
          {idx < DEFAULT_SUPPLEMENTS.length - 1 && (
            <View style={styles.sep} />
          )}
        </React.Fragment>
      ))}
    </View>
  );
}
