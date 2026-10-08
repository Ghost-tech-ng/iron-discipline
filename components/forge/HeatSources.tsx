import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useDisciplineStore, WEIGHTS, TOTAL_SUPPLEMENTS } from '../../store/disciplineStore';
import { useNutritionStore } from '../../store/nutritionStore';
import { useUserStore } from '../../store/userStore';
import { useColors } from '../../hooks/useColors';
import { Fonts } from '../../constants/theme';

export interface HeatSource {
  key: string;
  label: string;
  /** Imperative used in the "do this next" hint. */
  action: string;
  pts: number;
  earned: number;
}

/** Every input to today's heat, with what it's worth and what's been earned so far. */
export function useHeatSources(): HeatSource[] {
  const d = useDisciplineStore();
  const waterMl = useNutritionStore((s) => s.waterMl);
  const goalWaterMl = useUserStore((s) => s.profile.goalWaterMl);
  const suppEarned = Math.round(
    (Math.min(d.supplementsTaken.length, TOTAL_SUPPLEMENTS) / TOTAL_SUPPLEMENTS) * WEIGHTS.supplementsTaken
  );
  const all = (on: boolean, pts: number) => (on ? pts : 0);

  return [
    { key: 'workout', label: 'Train', action: 'Train', pts: WEIGHTS.workoutDone, earned: all(d.workoutDone, WEIGHTS.workoutDone) },
    { key: 'protein', label: 'Protein', action: 'hit protein', pts: WEIGHTS.proteinHit, earned: all(d.proteinHit, WEIGHTS.proteinHit) },
    { key: 'calories', label: 'Kcal', action: 'land calories', pts: WEIGHTS.calorieHit, earned: all(d.calorieHit, WEIGHTS.calorieHit) },
    { key: 'cardio', label: 'Cardio', action: 'log cardio', pts: WEIGHTS.cardioLogged, earned: all(d.cardioLogged, WEIGHTS.cardioLogged) },
    { key: 'supps', label: 'Supps', action: 'take supplements', pts: WEIGHTS.supplementsTaken, earned: suppEarned },
    { key: 'sleep', label: 'Sleep', action: 'log sleep', pts: WEIGHTS.sleepLogged, earned: all(d.sleepLogged, WEIGHTS.sleepLogged) },
    { key: 'water', label: 'Water', action: 'finish water', pts: WEIGHTS.waterGoalHit, earned: all(waterMl >= goalWaterMl, WEIGHTS.waterGoalHit) },
  ];
}

/** The two biggest unlit sources, and the heat they'd bring today to. */
export function nextHeatHint(sources: readonly HeatSource[], score: number): { actions: string; reach: number } | null {
  const open = sources.filter((s) => s.earned < s.pts).sort((a, b) => (b.pts - b.earned) - (a.pts - a.earned)).slice(0, 2);
  if (open.length === 0) return null;
  const reach = Math.min(100, score + open.reduce((n, s) => n + s.pts - s.earned, 0));
  const actions = open.map((s, i) => (i === 0 ? s.action[0].toUpperCase() + s.action.slice(1) : s.action)).join(' + ');
  return { actions, reach };
}

export function HeatSources({ sources }: { sources: readonly HeatSource[] }) {
  const C = useColors();
  const styles = React.useMemo(() => StyleSheet.create({
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: C.border,
      paddingHorizontal: 8,
      paddingVertical: 5,
    },
    pillOn: { borderColor: C.accent, backgroundColor: C.accent + '1F' },
    pillPart: { borderColor: C.accent + '66' },
    label: { fontFamily: Fonts.bodyBold, fontSize: 10, letterSpacing: 1, color: C.muted },
    labelOn: { color: C.primary },
    pts: { fontFamily: Fonts.display, fontSize: 13, color: C.dim },
    ptsOn: { color: C.accent },
  }), [C]);

  return (
    <View style={styles.row}>
      {sources.map((s) => {
        const on = s.earned >= s.pts;
        const part = !on && s.earned > 0;
        return (
          <View key={s.key} style={[styles.pill, on && styles.pillOn, part && styles.pillPart]}>
            <Text style={[styles.label, (on || part) && styles.labelOn]}>{s.label.toUpperCase()}</Text>
            <Text style={[styles.pts, (on || part) && styles.ptsOn]}>
              {part ? `${s.earned}/${s.pts}` : `+${s.pts}`}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
