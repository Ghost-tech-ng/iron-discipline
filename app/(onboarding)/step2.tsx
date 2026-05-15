import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useUserStore } from '../../store/userStore';
import { Colors, Spacing, Typography } from '../../constants/theme';
import { USER_TARGETS } from '../../constants/nutrition';

export default function Step2Screen() {
  const { profile, setProfile } = useUserStore();
  const [calories, setCalories] = useState(profile.goalCalories);
  const [protein, setProtein] = useState(profile.goalProtein);

  const weight = profile.weightKg;
  const recommendedProtein = Math.round(weight * 2.1);
  const recommendedCalories = 2500;

  function handleNext() {
    setProfile({ goalCalories: calories, goalProtein: protein });
    router.push('/(onboarding)/step3');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.step}>2 of 5</Text>
          <Text style={styles.title}>Your targets</Text>
          <Text style={styles.subtitle}>
            Science-set for your weight and goal. You can adjust later in settings.
          </Text>
        </View>

        {/* Protein card */}
        <Card style={styles.targetCard} glow={Colors.accent}>
          <Text style={styles.targetTitle}>DAILY PROTEIN</Text>
          <Text style={styles.targetValue}>
            {recommendedProtein}
            <Text style={styles.targetUnit}>g</Text>
          </Text>
          <Text style={styles.targetBasis}>
            2.1g × {weight}kg bodyweight
          </Text>
          <Text style={styles.targetNote}>
            Most important number. At this level you preserve muscle while losing fat, even in a calorie deficit.
          </Text>
        </Card>

        {/* Calories card */}
        <Card style={styles.targetCard}>
          <Text style={styles.targetTitle}>DAILY CALORIES</Text>
          <Text style={[styles.targetValue, { color: Colors.accentAmber }]}>
            {recommendedCalories}
            <Text style={styles.targetUnit}>kcal</Text>
          </Text>
          <Text style={styles.targetBasis}>
            ~500 kcal below estimated TDEE
          </Text>
          <Text style={styles.targetNote}>
            This creates a sustainable deficit for 0.5–0.75kg fat loss per week without tanking your gym performance.
          </Text>
        </Card>

        {/* Research note */}
        <Card style={styles.researchCard}>
          <Text style={styles.researchTitle}>Why these numbers</Text>
          {[
            'Protein: ISSN 2017 guidelines — 1.6–2.2g/kg for fat loss phases. Upper range used for maximum muscle protection.',
            'Calories: 500 kcal/day deficit = ~0.5kg fat/week. You are 6\'3" and training hard — do not go lower than 2,200.',
            'At 95kg cutting to ~89kg = ~6kg fat lost. Realistic in 12 weeks. Visible change at your height.',
          ].map((item) => (
            <View key={item} style={styles.researchRow}>
              <View style={styles.dot} />
              <Text style={styles.researchText}>{item}</Text>
            </View>
          ))}
        </Card>

        <Button label="These look right →" variant="primary" fullWidth onPress={handleNext} />

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
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
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
  targetCard: { gap: 8 },
  targetTitle: {
    ...Typography.label,
    color: Colors.muted,
    letterSpacing: 1.5,
  },
  targetValue: {
    fontSize: 52,
    fontWeight: '800',
    color: Colors.accent,
    letterSpacing: -2,
    lineHeight: 58,
  },
  targetUnit: {
    fontSize: 24,
    fontWeight: '400',
    letterSpacing: -1,
  },
  targetBasis: {
    ...Typography.small,
    color: Colors.secondary,
    fontWeight: '500',
  },
  targetNote: {
    ...Typography.small,
    color: Colors.secondary,
    lineHeight: 19,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    paddingTop: 10,
    marginTop: 4,
  },
  researchCard: { gap: 10 },
  researchTitle: {
    ...Typography.small,
    color: Colors.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  researchRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.accent,
    marginTop: 8,
    flexShrink: 0,
  },
  researchText: {
    ...Typography.small,
    color: Colors.secondary,
    lineHeight: 19,
    flex: 1,
  },
});
