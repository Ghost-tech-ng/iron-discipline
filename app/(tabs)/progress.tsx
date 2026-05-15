import React from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useProgressStore } from '../../store/progressStore';
import { useUserStore } from '../../store/userStore';
import { Colors, Spacing, Typography } from '../../constants/theme';

function WeightBar({ current, start, goal }: { current: number; start: number; goal: number }) {
  const totalChange = start - goal;
  const achieved = start - current;
  const pct = totalChange > 0 ? Math.min(achieved / totalChange, 1) : 0;

  return (
    <View style={wbStyles.container}>
      <View style={wbStyles.labels}>
        <Text style={wbStyles.label}>Start {start}kg</Text>
        <Text style={[wbStyles.label, { color: Colors.accentGreen }]}>Goal {goal}kg</Text>
      </View>
      <View style={wbStyles.track}>
        <View style={[wbStyles.fill, { width: `${pct * 100}%` }]} />
      </View>
      <View style={wbStyles.bottom}>
        <Text style={wbStyles.current}>{current}kg current</Text>
        <Text style={wbStyles.pct}>{Math.round(pct * 100)}% to goal</Text>
      </View>
    </View>
  );
}

export default function ProgressScreen() {
  const { checkIns, latestWeight, totalLost } = useProgressStore();
  const { profile } = useUserStore();
  const currentWeight = latestWeight() ?? profile.weightKg;
  const lost = totalLost();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Progress</Text>
        <Text style={styles.subtitle}>Weigh in every Monday morning</Text>

        {/* Goal progress bar */}
        <Card style={styles.goalCard}>
          <Text style={styles.cardTitle}>12-WEEK GOAL</Text>
          <WeightBar
            current={currentWeight}
            start={profile.weightKg}
            goal={profile.goalWeightKg}
          />
          {lost !== null && lost > 0 && (
            <Text style={styles.lostText}>
              −{lost}kg total lost
            </Text>
          )}
        </Card>

        {/* Weigh-in protocol reminder */}
        <Card style={styles.protocolCard}>
          <Text style={styles.cardTitle}>WEIGH-IN PROTOCOL</Text>
          {[
            'Monday morning — same day every week',
            'First thing after waking, after toilet',
            'Before food or water — lowest body water state',
            'Same scale, same surface',
            'Judge trend over 2–3 weeks, not single readings',
          ].map((rule) => (
            <View key={rule} style={styles.ruleRow}>
              <View style={styles.ruleDot} />
              <Text style={styles.ruleText}>{rule}</Text>
            </View>
          ))}
        </Card>

        {/* Expected timeline */}
        <Card style={styles.timelineCard}>
          <Text style={styles.cardTitle}>EXPECTED TIMELINE</Text>
          {[
            { weeks: 'Wk 1–2', change: '−1.5 to −3 kg', note: 'Mostly water + glycogen' },
            { weeks: 'Wk 3–6', change: '−0.5–0.75/wk', note: 'True fat loss begins' },
            { weeks: 'Wk 7–10', change: '−0.4–0.6/wk', note: 'Rate slows — stay consistent' },
            { weeks: 'Wk 11–12', change: '−0.3–0.5/wk', note: 'Final stretch — hold form' },
          ].map((row) => (
            <View key={row.weeks} style={styles.timelineRow}>
              <Text style={styles.weekLabel}>{row.weeks}</Text>
              <Text style={styles.changeLabel}>{row.change}</Text>
              <Text style={styles.noteLabel}>{row.note}</Text>
            </View>
          ))}
        </Card>

        {/* Check-in history */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>CHECK-IN HISTORY</Text>
        </View>

        {checkIns.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No check-ins logged yet.</Text>
            <Text style={styles.emptySub}>Log your first weigh-in to start tracking.</Text>
          </Card>
        ) : (
          checkIns.map((c) => (
            <Card key={c.id} style={styles.checkInCard}>
              <Text style={styles.checkInWeek}>Week {c.week}</Text>
              <Text style={styles.checkInDate}>{c.date}</Text>
              <Text style={styles.checkInWeight}>{c.weightKg}kg</Text>
            </Card>
          ))
        )}

        <Button label="+ Log Weigh-In" variant="primary" fullWidth />

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const wbStyles = StyleSheet.create({
  container: { gap: 8 },
  labels: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { ...Typography.small, color: Colors.secondary },
  track: {
    height: 8,
    backgroundColor: Colors.surface2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 4,
  },
  bottom: { flexDirection: 'row', justifyContent: 'space-between' },
  current: { ...Typography.caption, color: Colors.primary, fontWeight: '600' },
  pct: { ...Typography.caption, color: Colors.accent },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.base },
  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.md, paddingTop: Spacing.lg, gap: Spacing.md },
  title: {
    ...Typography.h1,
    color: Colors.primary,
    fontWeight: '700',
    letterSpacing: -1,
  },
  subtitle: { ...Typography.small, color: Colors.secondary },
  goalCard: { gap: Spacing.sm },
  cardTitle: {
    ...Typography.label,
    color: Colors.muted,
    letterSpacing: 1.5,
  },
  lostText: {
    ...Typography.body,
    color: Colors.accentGreen,
    fontWeight: '700',
    textAlign: 'center',
  },
  protocolCard: { gap: 8 },
  ruleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 4 },
  ruleDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.accent,
    marginTop: 7,
  },
  ruleText: { ...Typography.small, color: Colors.secondary, flex: 1, lineHeight: 18 },
  timelineCard: { gap: 10 },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  weekLabel: {
    ...Typography.small,
    color: Colors.accent,
    fontWeight: '700',
    width: 56,
  },
  changeLabel: {
    ...Typography.small,
    color: Colors.primary,
    fontWeight: '600',
    width: 90,
  },
  noteLabel: { ...Typography.small, color: Colors.muted, flex: 1 },
  sectionHeader: { marginTop: Spacing.sm },
  sectionTitle: {
    ...Typography.label,
    color: Colors.muted,
    letterSpacing: 1.5,
  },
  emptyCard: { alignItems: 'center', paddingVertical: Spacing.xl, gap: 6 },
  emptyText: { ...Typography.body, color: Colors.secondary, fontWeight: '600' },
  emptySub: { ...Typography.small, color: Colors.muted },
  checkInCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checkInWeek: { ...Typography.small, color: Colors.accent, fontWeight: '700' },
  checkInDate: { ...Typography.small, color: Colors.muted },
  checkInWeight: { ...Typography.h4, color: Colors.primary, fontWeight: '700' },
});
