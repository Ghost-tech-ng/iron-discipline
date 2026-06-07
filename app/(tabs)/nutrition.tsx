import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator, Pressable, Alert } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/ui/Card';
import { GradientBar } from '../../components/ui/GradientBar';
import { Button } from '../../components/ui/Button';
import { WaterLogger } from '../../components/nutrition/WaterLogger';
import { SupplementTracker } from '../../components/nutrition/SupplementTracker';
import { useNutritionStore } from '../../store/nutritionStore';
import { deleteMealEntry } from '../../services/nutritionService';
import { useUserStore } from '../../store/userStore';
import { useColors } from '../../hooks/useColors';
import { NoiseOverlay } from '../../components/ui/NoiseOverlay';
import { Colors, Spacing, Typography } from '../../constants/theme';
import { DAILY_MEAL_PLAN, type MealSlot } from '../../constants/nutrition';
import { generateMealPlan, loadCachedMealPlan } from '../../services/aiService';
import { loadDailyMacroHistory } from '../../services/nutritionService';

export default function NutritionScreen() {
  const Colors = useColors();
  const { getTotals, today, waterMl, removeMeal } = useNutritionStore();
  const { profile } = useUserStore();
  const { calories, protein, carbs, fat } = getTotals();
  const [expandedMeal, setExpandedMeal] = useState<number | null>(null);
  const [mealPlan, setMealPlan] = useState<MealSlot[]>(DAILY_MEAL_PLAN);
  const [refreshing, setRefreshing] = useState(false);
  const [aiGenerated, setAiGenerated] = useState(false);
  const [weeklyMacros, setWeeklyMacros] = useState<{ avgProtein: number | null; avgCalories: number | null; daysLogged: number }>({ avgProtein: null, avgCalories: null, daysLogged: 0 });

  useEffect(() => {
    loadCachedMealPlan().then((cached) => {
      if (cached && cached.length > 0) {
        setMealPlan(cached);
        setAiGenerated(true);
      }
    });
    loadDailyMacroHistory(7).then((history) => {
      const days = history.filter((d) => d.protein > 0 || d.calories > 0);
      if (days.length === 0) return;
      const avgProtein = Math.round(days.reduce((s, d) => s + d.protein, 0) / days.length);
      const avgCalories = Math.round(days.reduce((s, d) => s + d.calories, 0) / days.length);
      setWeeklyMacros({ avgProtein, avgCalories, daysLogged: days.length });
    });
  }, []);

  async function handleRefreshMealPlan() {
    setRefreshing(true);
    try {
      const plan = await generateMealPlan(
        profile.weightKg,
        profile.goalProtein,
        profile.goalCalories
      );
      if (plan.length > 0) {
        setMealPlan(plan);
        setAiGenerated(true);
        setExpandedMeal(null);
      }
    } catch {
      // silently fail — keep current plan
    } finally {
      setRefreshing(false);
    }
  }

  function handleDeleteMeal(entryId: string, name: string) {
    Alert.alert('Remove entry?', name, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          removeMeal(entryId);
          deleteMealEntry(entryId);
        },
      },
    ]);
  }

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
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: Spacing.md,
      gap: 10,
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
    mealMacros: { alignItems: 'flex-end', gap: 2, minWidth: 70 },
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
    deleteBtn: {
      flexShrink: 0,
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
    mealPlanCard: { gap: 0, padding: 0, overflow: 'hidden' },
    mealSlot: {
      paddingHorizontal: Spacing.md,
      paddingVertical: 12,
    },
    mealSlotHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    mealSlotTime: {
      ...Typography.caption,
      color: Colors.muted,
      width: 60,
    },
    mealSlotEmoji: {
      fontSize: 16,
    },
    mealSlotInfo: { flex: 1 },
    mealSlotLabel: {
      ...Typography.small,
      color: Colors.primary,
      fontWeight: '600',
    },
    mealSlotMacros: {
      ...Typography.caption,
      color: Colors.muted,
    },
    mealSlotChevron: {
      ...Typography.caption,
      color: Colors.muted,
    },
    mealSlotExpanded: {
      paddingTop: 8,
      paddingLeft: 70,
      gap: 6,
    },
    mealSlotWhy: {
      ...Typography.caption,
      color: Colors.secondary,
      lineHeight: 17,
      fontStyle: 'italic',
    },
    mealSlotFood: {
      ...Typography.caption,
      color: Colors.primary,
      lineHeight: 18,
    },
    mealSlotDot: {
      color: Colors.accent,
    },
    mealSlotSep: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: Colors.border,
      marginLeft: Spacing.md,
    },
    mealPlanTotal: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.md,
      paddingVertical: 10,
      backgroundColor: Colors.surface2,
    },
    mealPlanTotalText: {
      ...Typography.caption,
      color: Colors.secondary,
    },
    mealPlanTotalVal: {
      ...Typography.caption,
      color: Colors.primary,
      fontWeight: '700',
    },
  }), [Colors]);

  return (
    <SafeAreaView style={styles.safe}>
      <NoiseOverlay />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(0).duration(450)}>
          <Text style={styles.title}>Fuel</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={styles.subtitle}>
              {remaining.protein > 0 ? `${remaining.protein}g protein to go` : 'Protein target hit'}
            </Text>
            {remaining.protein <= 0 && (
              <Ionicons name="checkmark-circle" size={14} color={Colors.accentGreen} />
            )}
          </View>
        </Animated.View>

        {/* Calorie summary */}
        <Animated.View entering={FadeInDown.delay(80).duration(450)}>
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

          {weeklyMacros.daysLogged > 0 && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 4, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border }}>
              <Text style={{ ...Typography.caption, color: Colors.muted }}>
                7-day avg · {weeklyMacros.daysLogged}d logged
              </Text>
              <Text style={{ ...Typography.caption, color: Colors.secondary }}>
                <Text style={{ color: weeklyMacros.avgProtein != null && weeklyMacros.avgProtein >= profile.goalProtein * 0.9 ? Colors.accentGreen : Colors.accentAmber }}>
                  {weeklyMacros.avgProtein}g P
                </Text>
                {' · '}
                <Text style={{ color: Colors.secondary }}>
                  {weeklyMacros.avgCalories} kcal
                </Text>
              </Text>
            </View>
          )}
        </Card>
        </Animated.View>

        {/* Meals logged today */}
        {today.entries.length > 0 && (
          <Animated.View entering={FadeInDown.delay(160).duration(450)}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>TODAY'S MEALS</Text>
              <Text style={styles.sectionCount}>{today.entries.length} entries</Text>
            </View>
            <Card style={styles.mealsCard}>
              {today.entries.map((entry, idx) => (
                <React.Fragment key={entry.id}>
                  <View style={styles.mealRow}>
                    <Pressable
                      onPress={() => handleDeleteMeal(entry.id, entry.foodItem.name)}
                      hitSlop={12}
                      style={styles.deleteBtn}
                    >
                      <Ionicons name="remove-circle" size={22} color={Colors.accentRed} />
                    </Pressable>
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
          </Animated.View>
        )}

        {/* Meal plan */}
        <Animated.View entering={FadeInDown.delay(200).duration(450)}>
        <View style={styles.sectionHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.sectionLabel}>MEAL PLAN + TIMING</Text>
            {aiGenerated && (
              <Text style={[styles.sectionCount, { color: Colors.accent }]}>AI</Text>
            )}
          </View>
          <TouchableOpacity onPress={handleRefreshMealPlan} disabled={refreshing}>
            {refreshing
              ? <ActivityIndicator size="small" color={Colors.accent} />
              : <Text style={[styles.sectionCount, { color: Colors.accent }]}>Refresh</Text>
            }
          </TouchableOpacity>
        </View>
        <Card style={styles.mealPlanCard}>
          {mealPlan.map((slot, idx) => (
            <React.Fragment key={slot.time}>
              <TouchableOpacity
                style={styles.mealSlot}
                onPress={() => setExpandedMeal(expandedMeal === idx ? null : idx)}
                activeOpacity={0.7}
              >
                <View style={styles.mealSlotHeader}>
                  <Text style={styles.mealSlotTime}>{slot.time}</Text>
                  <Ionicons name={(slot.icon || 'restaurant-outline') as any} size={18} color={Colors.accent} style={{ marginRight: 2 }} />
                  <View style={styles.mealSlotInfo}>
                    <Text style={styles.mealSlotLabel}>{slot.label}</Text>
                    <Text style={styles.mealSlotMacros}>
                      {slot.protein}g protein · {slot.calories} kcal
                    </Text>
                  </View>
                  <Ionicons
                    name={expandedMeal === idx ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={Colors.muted}
                  />
                </View>
                {expandedMeal === idx && (
                  <View style={styles.mealSlotExpanded}>
                    <Text style={styles.mealSlotWhy}>{slot.why}</Text>
                    {slot.foods.map((food) => (
                      <View key={food} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="ellipse" size={4} color={Colors.muted} />
                        <Text style={styles.mealSlotFood}>{food}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </TouchableOpacity>
              {idx < mealPlan.length - 1 && <View style={styles.mealSlotSep} />}
            </React.Fragment>
          ))}
          <View style={styles.mealPlanTotal}>
            <Text style={styles.mealPlanTotalText}>Daily total</Text>
            <Text style={styles.mealPlanTotalVal}>
              ~{mealPlan.reduce((s, m) => s + m.protein, 0)}g protein ·{' '}
              {mealPlan.reduce((s, m) => s + m.calories, 0)} kcal
            </Text>
          </View>
        </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(280).duration(450)} style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Button
              label="+ Log a Meal"
              variant="primary"
              fullWidth
              onPress={() => router.push('/meal/log')}
            />
          </View>
          <TouchableOpacity
            onPress={() => router.push('/advisor' as any)}
            style={{
              width: 48,
              borderRadius: 12,
              backgroundColor: Colors.surface2,
              borderWidth: 1,
              borderColor: Colors.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="sparkles" size={20} color={Colors.accent} />
          </TouchableOpacity>
        </Animated.View>

        {/* Water logger */}
        <Animated.View entering={FadeInDown.delay(360).duration(450)}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>WATER INTAKE</Text>
          </View>
          <Card>
            <WaterLogger />
          </Card>
        </Animated.View>

        {/* Supplements */}
        <Animated.View entering={FadeInDown.delay(440).duration(450)}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>DAILY SUPPLEMENTS</Text>
          </View>
          <SupplementTracker />
        </Animated.View>

        {/* Protein note */}
        <Animated.View entering={FadeInDown.delay(520).duration(450)}>
          <Card style={styles.noteCard}>
            <Text style={styles.noteTitle}>Daily protein target</Text>
            <Text style={styles.noteBody}>
              <Text style={{ color: Colors.accent, fontWeight: '700' }}>{profile.goalProtein}g</Text>
              {' '}at {profile.weightKg}kg — 1.8g/kg bodyweight. Hit this every day regardless of training. This single variable has the biggest impact on body recomposition.
            </Text>
          </Card>
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
