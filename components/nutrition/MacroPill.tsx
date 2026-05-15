import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography } from '../../constants/theme';

interface MacroPillProps {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  multiplier?: number;
}

export function MacroPill({ calories, protein, carbs, fat, multiplier = 1 }: MacroPillProps) {
  const scale = (v: number) => Math.round(v * multiplier * 10) / 10;

  return (
    <View style={styles.row}>
      <MacroChip value={scale(calories)} label="kcal" color={Colors.accentAmber} />
      <MacroChip value={scale(protein)} label="P" color={Colors.accent} />
      <MacroChip value={scale(carbs)} label="C" color={Colors.accentGreen} />
      <MacroChip value={scale(fat)} label="F" color={Colors.accent2} />
    </View>
  );
}

function MacroChip({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <View style={[styles.chip, { backgroundColor: color + '18' }]}>
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  value: {
    ...Typography.small,
    fontWeight: '700',
  },
  label: {
    ...Typography.caption,
    color: Colors.muted,
  },
});
