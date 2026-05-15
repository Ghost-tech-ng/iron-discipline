import React from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { Card } from '../../components/ui/Card';
import { GradientBar } from '../../components/ui/GradientBar';
import { Button } from '../../components/ui/Button';
import { WaterLogger } from '../../components/nutrition/WaterLogger';
import { SupplementTracker } from '../../components/nutrition/SupplementTracker';
import { useNutritionStore } from '../../store/nutritionStore';
import { useUserStore } from '../../store/userStore';
import { useColors } from '../../hooks/useColors';
import { Colors, Spacing, Typography } from '../../constants/theme';

export default function NutritionScreen() {
  const Colors = useColors();
  const { getTotals, today, waterMl } = useNutritionStore();
  const { profile } = useUserStore();
  const { calories, protein, carbs, fat } = getTotals();

  const remaining = {
    calories: profile.goalCalories - calories,
    protein: Math.max(0, profile.goalProtein - protein),
  };

  const styles = React.useMemo(() => StyleSheet.create({
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
    totalsCard: { gap: Spacing.md },
    mainCalRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
    },
    calValue: {
      ...Typography.h2,
      color: Colors.primary,
      fontWeight: '700',
      letterSpacing: -0.8,
      textAlign: 'center',
    },
    calLabel: {
      ...Typography.caption,
      color: Colors.muted,
      textAlign: 'center',
      marginTop: 2,
    },
    calDivider: {
      width: 1,
      height: 40,
      backgroundColor: Colors.border,
    },
    bars: { gap: Spacing.sm },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 4,
    },
    sectionLabel: {
      ...Typography.label,
      color: Colors.muted,
      letterSpacing: 1.5,
    },
    sectionCount: {
      ...Typography.caption,
      color: Colors.secondary,
    },
    mealsCard: { padding: 0, overflow: 'hidden' },
    mealRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: Spacing.md,
      gap: 12,
    },
    mealInfo: { flex: 1, gap: 2 },
    mealName: {
      ...Typography.small,
      color: Colors.primary,
      fontWeight: '600',
    },
    mealCategory: {
      ...Typography.caption,
      color: Colors.muted,
      textTransform: 'capitalize',
    },
    mealMacros: { alignItems: 'flex-end', gap: 2 },
    mealCal: {
      ...Typography.small,
      color: Colors.accentAmber,
      fontWeight: '700',
    },
    mealProtein: {
      ...Typography.caption,
      color: Colors.accent,
      fontWeight: '600',
    },
    mealSep: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: Colors.border,
      marginLeft: Spacing.md,
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
      lineHeight: 20,
    },
  }), [Colors]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Fuel</Text>
        <Text style={styles.subtitle}>
          {remaining.protein > 0
            ? `${remaining.protein}g protein to go`
            : 'Protein target hit ✓'}
        </Text>

        {/* Calorie summary */}
        <Card style={styles.totalsCard}>
          <View style={styles.mainCalRow}>
            <View>
              <Text style={styles.calValue}>{calories}</Text>
              <Text style={styles.calLabel}>eaten</Text>
            </View>
            <View style={styles.calDivider} />
            <View>
              <Text style={[
                styles.calValue,
                { color: remaining.calories >= 0 ? Colors.accentGreen : Colors.accentRed }
              ]}>
                {Math.abs(remaining.calories)}
              </Text>
              <Text style={styles.calLabel}>
                {remaining.calories >= 0 ? 'remaining' : 'over'}
              </Text>
            </View>
            <View style={styles.calDivider} />
            <View>
              <Text style={styles.calValue}>{profile.goalCalories}</Text>
              <Text style={styles.calLabel}>target</Text>
            </View>
          </View>

          <View style={styles.bars}>
            <GradientBar value={calories} max={profile.goalCalories} label="Calories" unit="kcal" color={Colors.accentAmber} />
            <GradientBar value={protein} max={profile.goalProtein} label="Protein" unit="g" color={Colors.accent} />
            <GradientBar value={carbs} max={profile.goalCarbs} label="Carbs" unit="g" color={Colors.accentGreen} />
            <GradientBar value={fat} max={profile.goalFat} label="Fat" unit="g" color={Colors.accent2} />
          </View>
        </Card>

        {/* Meals logged today */}
        {today.entries.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>TODAY'S MEALS</Text>
              <Text style={styles.sectionCount}>{today.entries.length} entries</Text>
            </View>
            <Card style={styles.mealsCard}>
              {today.entries.map((entry, idx) => (
                <React.Fragment key={entry.id}>
                  <View style={styles.mealRow}>
                    <View style={styles.mealInfo}>
                      <Text style={styles.mealName}>{entry.foodItem.name}</Text>
                      <Text style={styles.mealCategory}>
                        {entry.category.replace('_', ' ')} · ×{entry.quantity}
                        {entry.time ? `  ·  ${entry.time}` : ''}
                      </Text>
                    </View>
                    <View style={styles.mealMacros}>
                      <Text style={styles.mealCal}>
                        {Math.round(entry.foodItem.calories * entry.quantity)} kcal
                      </Text>
                      <Text style={styles.mealProtein}>
                        {Math.round(entry.foodItem.protein * entry.quantity)}g P
                      </Text>
                    </View>
                  </View>
                  {idx < today.entries.length - 1 && <View style={styles.mealSep} />}
                </React.Fragment>
              ))}
            </Card>
          </>
        )}

        <Button
          label="+ Log a Meal"
          variant="primary"
          fullWidth
          onPress={() => router.push('/meal/log')}
        />

        {/* Water logger */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>WATER INTAKE</Text>
        </View>
        <Card>
          <WaterLogger />
        </Card>

        {/* Supplements */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>DAILY SUPPLEMENTS</Text>
        </View>
        <SupplementTracker />

        {/* Protein note */}
        <Card style={styles.noteCard}>
          <Text style={styles.noteTitle}>Daily protein target</Text>
          <Text style={styles.noteBody}>
            <Text style={{ color: Colors.accent, fontWeight: '700' }}>{profile.goalProtein}g</Text>
            {' '}at {profile.weightKg}kg — 1.8g/kg bodyweight. Hit this every day regardless of training. This single variable has the biggest impact on body recomposition.
          </Text>
        </Card>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
