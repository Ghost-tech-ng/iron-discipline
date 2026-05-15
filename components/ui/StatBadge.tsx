import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Radius, Spacing } from '../../constants/theme';

interface StatBadgeProps {
  value: string | number;
  label: string;
  color?: string;
  unit?: string;
}

export function StatBadge({ value, label, color = Colors.primary, unit }: StatBadgeProps) {
  return (
    <View style={styles.container}>
      <View style={styles.valueRow}>
        <Text style={[styles.value, { color }]}>{value}</Text>
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 2,
    flex: 1,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  value: {
    ...Typography.h3,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  unit: {
    ...Typography.caption,
    color: Colors.muted,
    marginBottom: 1,
  },
  label: {
    ...Typography.caption,
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});
