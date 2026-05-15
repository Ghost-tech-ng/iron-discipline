import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { WEEKLY_SPLIT, SESSION_COLORS } from '../../constants/workouts';
import { Colors, Spacing, Typography } from '../../constants/theme';
import type { DayOfWeek } from '../../types';

const DAYS: { key: DayOfWeek; label: string }[] = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

export default function Step3Screen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.step}>3 of 5</Text>
          <Text style={styles.title}>Your split</Text>
          <Text style={styles.subtitle}>
            Pre-loaded with the optimal 5-day PPL programme. Thursday is your rest day.
          </Text>
        </View>

        <Card style={styles.splitCard}>
          {DAYS.map(({ key, label }, idx) => {
            const session = WEEKLY_SPLIT[key];
            const color = session ? SESSION_COLORS[session.type] : Colors.muted;
            return (
              <View key={key}>
                <View style={styles.dayRow}>
                  <View style={[styles.colorDot, { backgroundColor: color }]} />
                  <Text style={styles.dayLabel}>{label}</Text>
                  <Text style={[styles.sessionLabel, { color }]}>
                    {session ? session.label : 'Rest'}
                  </Text>
                </View>
                {idx < DAYS.length - 1 && <View style={styles.sep} />}
              </View>
            );
          })}
        </Card>

        <Card style={styles.noteCard}>
          <Text style={styles.noteTitle}>Why this split works</Text>
          <Text style={styles.noteBody}>
            Every muscle is trained twice per week (2× frequency). Research shows this produces 3.1% more muscle growth than 1×/week. Thursday rest is placed strategically — you train Mon/Tue/Wed, rest, then finish Fri/Sat strong.
          </Text>
        </Card>

        <Button label="This is my split →" variant="primary" fullWidth onPress={() => router.push('/(onboarding)/step4')} />

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.base },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    gap: Spacing.md,
    paddingBottom: 40,
  },
  header: { gap: 8 },
  step: {
    ...Typography.label,
    color: Colors.muted,
    letterSpacing: 1.5,
  },
  title: {
    ...Typography.h1,
    color: Colors.primary,
    fontWeight: '700',
    letterSpacing: -1,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.secondary,
    lineHeight: 22,
  },
  splitCard: { gap: 0, padding: 0, overflow: 'hidden' },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dayLabel: {
    ...Typography.body,
    color: Colors.secondary,
    width: 88,
  },
  sessionLabel: {
    ...Typography.body,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  sep: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginLeft: 32,
  },
  noteCard: { gap: 6 },
  noteTitle: {
    ...Typography.small,
    color: Colors.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  noteBody: {
    ...Typography.small,
    color: Colors.secondary,
    lineHeight: 19,
  },
});
