import React, { useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { DragonHero } from '../../components/dragon/DragonHero';
import { DragonBody, dragonPalette } from '../../components/dragon/DragonArt';
import { useColors } from '../../hooks/useColors';
import { Fonts, Spacing, Typography } from '../../constants/theme';
import { RANKS } from '../../utils/heat';
import type { DragonStage } from '../../utils/dragon';

const [, TEMPERED, FORGED] = RANKS;

const STAGES: { stage: DragonStage; name: string; earn: string }[] = [
  { stage: 'egg', name: 'Egg', earn: 'Where it starts. Every strong day cracks the shell.' },
  { stage: 'hatchling', name: 'Hatchling', earn: `${TEMPERED.days} days in a row at ${TEMPERED.minHeat}°+ (Tempered)` },
  { stage: 'drake', name: 'Drake', earn: `${FORGED.days} days in a row at ${FORGED.minHeat}°+ (Forged) — it grows wings and flies` },
  { stage: 'dragon', name: 'Damascus Dragon', earn: 'Finish the full protocol' },
];

const HABITS: { icon: string; text: string }[] = [
  { icon: '📈', text: 'Your streak makes it bigger within each stage.' },
  { icon: '🔥', text: "Today's heat sets its mood — red-hot when you're on it, sluggish when you're not." },
  { icon: '🎉', text: 'It jumps and breathes fire when you log a session, protein, water, habits and more.' },
  { icon: '🌙', text: 'It sleeps from 22:00 to 06:00.' },
  { icon: '👆', text: 'It roams above the tab bar but never blocks a tap.' },
  { icon: '🐉', text: 'Hide or bring it back any time from the Habits tab.' },
];

export default function DragonIntroScreen() {
  const Colors = useColors();

  const styles = useMemo(() => StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.base },
    content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, gap: Spacing.md, paddingBottom: 40 },
    header: { gap: 8 },
    step: { ...Typography.label, color: Colors.muted, letterSpacing: 1.5 },
    title: { ...Typography.h1, color: Colors.primary, fontWeight: '700', letterSpacing: -1 },
    subtitle: { ...Typography.body, color: Colors.secondary, lineHeight: 22 },
    hero: { alignItems: 'center', paddingVertical: Spacing.sm },
    card: { padding: 0, overflow: 'hidden' },
    row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, paddingHorizontal: Spacing.md },
    sprite: { width: 44, height: 44 },
    info: { flex: 1, gap: 2 },
    name: { color: Colors.primary, fontFamily: Fonts.display, fontSize: 18, letterSpacing: 0.5 },
    detail: { ...Typography.caption, color: Colors.muted, lineHeight: 17 },
    sep: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border, marginLeft: 74 },
    sectionTitle: { ...Typography.label, color: Colors.muted, letterSpacing: 1.5, marginTop: Spacing.sm },
    habitRow: { flexDirection: 'row', gap: 12, paddingVertical: 8, paddingHorizontal: Spacing.md },
    habitIcon: { fontSize: 16, width: 22, textAlign: 'center' },
    habitText: { ...Typography.small, color: Colors.secondary, flex: 1, lineHeight: 20 },
  }), [Colors]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.step}>5 of 6</Text>
          <Text style={styles.title}>Meet your dragon</Text>
          <Text style={styles.subtitle}>
            It lives on your screen and grows with your discipline. Show up and it evolves. Slack off and it shows.
          </Text>
        </View>

        <View style={styles.hero}>
          <DragonHero size={130} />
        </View>

        <Text style={styles.sectionTitle}>HOW IT GROWS</Text>
        <Card style={styles.card}>
          {STAGES.map((s, idx) => (
            <React.Fragment key={s.stage}>
              <View style={styles.row}>
                <View style={styles.sprite}>
                  <DragonBody stage={s.stage} eyes="open" crack={0} p={dragonPalette(Colors, s.stage)} />
                </View>
                <View style={styles.info}>
                  <Text style={styles.name}>{s.name}</Text>
                  <Text style={styles.detail}>{s.earn}</Text>
                </View>
              </View>
              {idx < STAGES.length - 1 && <View style={styles.sep} />}
            </React.Fragment>
          ))}
        </Card>

        <Text style={styles.sectionTitle}>HOW IT LIVES</Text>
        <Card style={[styles.card, { paddingVertical: 6 }]}>
          {HABITS.map((h) => (
            <View key={h.icon} style={styles.habitRow}>
              <Text style={styles.habitIcon}>{h.icon}</Text>
              <Text style={styles.habitText}>{h.text}</Text>
            </View>
          ))}
        </Card>

        <Button label="Let's raise it →" variant="primary" fullWidth onPress={() => router.push('/(onboarding)/step5')} />
      </ScrollView>
    </SafeAreaView>
  );
}
