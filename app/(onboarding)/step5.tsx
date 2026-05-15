import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useUserStore } from '../../store/userStore';
import { saveUserProfile } from '../../services/userService';
import { useColors } from '../../hooks/useColors';
import { Colors, Spacing, Typography } from '../../constants/theme';

export default function Step5Screen() {
  const Colors = useColors();
  const { profile, completeOnboarding } = useUserStore();

  async function handleFinish() {
    completeOnboarding();
    await saveUserProfile({ ...profile, onboardingComplete: true });
    router.replace('/(tabs)');
  }

  const srStyles = React.useMemo(() => StyleSheet.create({
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 10,
    },
    label: { ...Typography.small, color: Colors.secondary },
    value: { ...Typography.small, fontWeight: '700' },
  }), [Colors]);

  const styles = React.useMemo(() => StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.base },
    content: {
      flex: 1,
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.xl,
      paddingBottom: Spacing.xl,
      justifyContent: 'space-between',
    },
    top: { gap: 8 },
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
    summary: {
      backgroundColor: Colors.surface,
      borderRadius: 16,
      paddingHorizontal: Spacing.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: Colors.border,
    },
    sep: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: Colors.border,
      marginVertical: 4,
    },
    warningCard: {
      backgroundColor: Colors.surface2,
      borderColor: Colors.border,
    },
    warningText: {
      ...Typography.small,
      color: Colors.secondary,
      lineHeight: 20,
    },
  }), [Colors]);

  function SummaryRow({
    label,
    value,
    color = Colors.primary,
  }: {
    label: string;
    value: string;
    color?: string;
  }) {
    return (
      <View style={srStyles.row}>
        <Text style={srStyles.label}>{label}</Text>
        <Text style={[srStyles.value, { color }]}>{value}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <View style={styles.top}>
          <Text style={styles.step}>5 of 5</Text>
          <Text style={styles.title}>
            {profile.name ? `You're set, ${profile.name.split(' ')[0]}.` : "You're set."}
          </Text>
          <Text style={styles.subtitle}>
            Here's your system. Execute it daily.
          </Text>
        </View>

        <View style={styles.summary}>
          <SummaryRow label="Starting weight" value={`${profile.weightKg}kg`} />
          <SummaryRow label="Goal weight" value={`${profile.goalWeightKg}kg`} />
          <SummaryRow label="Target to lose" value={`~${profile.weightKg - profile.goalWeightKg}kg`} color={Colors.accentGreen} />
          <View style={styles.sep} />
          <SummaryRow label="Daily protein" value={`${profile.goalProtein}g`} color={Colors.accent} />
          <SummaryRow label="Daily calories" value={`${profile.goalCalories} kcal`} color={Colors.accentAmber} />
          <SummaryRow label="Daily water" value="3.5L" color={Colors.accent2} />
          <View style={styles.sep} />
          <SummaryRow label="Training days" value="Mon / Tue / Wed / Fri / Sat" />
          <SummaryRow label="Rest days" value="Thu / Sun" />
          <SummaryRow label="Weigh-in day" value="Every Monday AM" />
        </View>

        <Card style={styles.warningCard}>
          <Text style={styles.warningText}>
            The Discipline Score starts at{' '}
            <Text style={{ color: Colors.primary, fontWeight: '700' }}>0</Text>
            {' '}every morning. You build it back by executing the system. Miss nothing.
          </Text>
        </Card>

        <Button
          label="Enter Iron Discipline"
          variant="primary"
          fullWidth
          onPress={handleFinish}
        />
      </View>
    </SafeAreaView>
  );
}
