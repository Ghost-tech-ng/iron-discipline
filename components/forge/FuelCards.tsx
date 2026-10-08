import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNutritionStore } from '../../store/nutritionStore';
import { useColors } from '../../hooks/useColors';
import { useActivePlanTargets } from '../../hooks/useActivePlanTargets';
import { Fonts, Radius, Spacing } from '../../constants/theme';

interface FuelStatProps {
  label: string;
  value: number;
  goal: number;
  unit: string;
  color: string;
}

function FuelStat({ label, value, goal, unit, color }: FuelStatProps) {
  const C = useColors();
  const pct = goal > 0 ? Math.min(value / goal, 1) : 0;
  const left = goal - value;
  const styles = React.useMemo(() => StyleSheet.create({
    card: { flex: 1, backgroundColor: C.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: C.border, padding: 14 },
    cap: { fontFamily: Fonts.bodyBold, fontSize: 9.5, letterSpacing: 2.2, color: C.muted },
    row: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 6 },
    value: { fontFamily: Fonts.displayBlack, fontSize: 30, lineHeight: 32, color: C.primary },
    goal: { fontFamily: Fonts.bodySemi, fontSize: 11, color: C.muted },
    track: { height: 5, borderRadius: 3, backgroundColor: C.surface2, marginTop: 10, overflow: 'hidden' },
    fill: { height: 5, borderRadius: 3 },
    left: { fontFamily: Fonts.bodySemi, fontSize: 10.5, color: C.secondary, marginTop: 7 },
  }), [C]);

  return (
    <View style={styles.card}>
      <Text style={styles.cap}>{label}</Text>
      <View style={styles.row}>
        <Text style={styles.value}>{value.toLocaleString()}</Text>
        <Text style={styles.goal}>/ {goal.toLocaleString()}{unit}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.left}>{left > 0 ? `${left.toLocaleString()}${unit} to go` : 'Target hit'}</Text>
    </View>
  );
}

export function FuelCards() {
  const C = useColors();
  const plan = useActivePlanTargets();
  const calories = useNutritionStore((s) => Math.round(s.today.calories));
  const protein = useNutritionStore((s) => Math.round(s.today.protein));
  const styles = React.useMemo(() => StyleSheet.create({
    row: { flexDirection: 'row', gap: Spacing.sm },
    note: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: Spacing.sm },
    chip: { borderRadius: 999, borderWidth: 1, borderColor: C.borderLight, paddingVertical: 3, paddingHorizontal: 8 },
    chipText: { fontFamily: Fonts.bodyHeavy, fontSize: 9, letterSpacing: 1.8, color: C.secondary },
    rationale: { flex: 1, fontFamily: Fonts.body, fontSize: 11.5, lineHeight: 16, color: C.muted },
  }), [C]);

  return (
    <View>
      <View style={styles.row}>
        <FuelStat label="KCAL" value={calories} goal={plan.calories} unit="" color={C.accent} />
        <FuelStat label="PROTEIN" value={protein} goal={plan.protein} unit="g" color={C.accent2} />
      </View>
      <View style={styles.note}>
        <View style={styles.chip}><Text style={styles.chipText}>{plan.dayLabel}</Text></View>
        <Text style={styles.rationale}>{plan.rationale}</Text>
      </View>
    </View>
  );
}
