import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Pressable,
  TextInput,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { FoodSearchBar } from '../../components/nutrition/FoodSearchBar';
import { MacroPill } from '../../components/nutrition/MacroPill';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { PressableScale } from '../../components/ui/PressableScale';
import { FOOD_LIBRARY } from '../../constants/nutrition';
import { useNutritionStore } from '../../store/nutritionStore';
import { useDisciplineStore } from '../../store/disciplineStore';
import { saveMealEntry } from '../../services/nutritionService';
import { Colors, Spacing, Typography } from '../../constants/theme';
import type { MealCategory, FoodItem } from '../../types';

const CATEGORIES: { key: MealCategory; label: string; emoji: string }[] = [
  { key: 'breakfast', label: 'Breakfast', emoji: '🌅' },
  { key: 'lunch', label: 'Lunch', emoji: '☀️' },
  { key: 'post_workout', label: 'Post-Workout', emoji: '💪' },
  { key: 'dinner', label: 'Dinner', emoji: '🌙' },
  { key: 'snack', label: 'Snack', emoji: '🥜' },
];

function getDefaultCategory(): MealCategory {
  const h = new Date().getHours();
  if (h < 10) return 'breakfast';
  if (h < 14) return 'lunch';
  if (h < 16) return 'post_workout';
  if (h < 21) return 'dinner';
  return 'snack';
}

export default function LogMealScreen() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<FoodItem | null>(null);
  const [category, setCategory] = useState<MealCategory>(getDefaultCategory());
  const [quantity, setQuantity] = useState('1');

  const { addMeal, getTotals } = useNutritionStore();
  const { setProteinHit, setCalorieHit } = useDisciplineStore();

  const qty = parseFloat(quantity) || 1;

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return FOOD_LIBRARY;
    return FOOD_LIBRARY.filter((f) => f.name.toLowerCase().includes(q));
  }, [search]);

  async function handleAdd() {
    if (!selected) return;

    const entry = {
      id: `meal_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      category,
      foodItem: selected,
      quantity: qty,
    };

    addMeal(entry);
    await saveMealEntry(entry);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Re-evaluate discipline score targets
    const totals = getTotals();
    const newProtein = totals.protein + selected.protein * qty;
    const newCalories = totals.calories + selected.calories * qty;

    // These thresholds match the store's user profile defaults
    if (newProtein >= 190) setProteinHit(true);
    if (newCalories >= 2300 && newCalories <= 2750) setCalorieHit(true);

    router.back();
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>✕</Text>
        </Pressable>
        <Text style={styles.title}>Log a Meal</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Category chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
        >
          {CATEGORIES.map((c) => (
            <Pressable
              key={c.key}
              onPress={() => setCategory(c.key)}
              style={[
                styles.catChip,
                category === c.key && styles.catChipActive,
              ]}
            >
              <Text style={styles.catEmoji}>{c.emoji}</Text>
              <Text
                style={[
                  styles.catLabel,
                  category === c.key && styles.catLabelActive,
                ]}
              >
                {c.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Search */}
        <FoodSearchBar
          value={search}
          onChange={setSearch}
          onClear={() => setSearch('')}
        />

        {/* Selected food */}
        {selected && (
          <Card style={styles.selectedCard} glow={Colors.accent}>
            <View style={styles.selectedHeader}>
              <Text style={styles.selectedName}>{selected.name}</Text>
              <Pressable onPress={() => setSelected(null)}>
                <Text style={styles.clearSelected}>Change</Text>
              </Pressable>
            </View>

            <Text style={styles.serving}>{selected.servingSize}</Text>

            <MacroPill
              calories={selected.calories}
              protein={selected.protein}
              carbs={selected.carbs}
              fat={selected.fat}
              multiplier={qty}
            />

            {/* Quantity */}
            <View style={styles.qtyRow}>
              <Text style={styles.qtyLabel}>Servings</Text>
              <View style={styles.qtyControls}>
                <Pressable
                  onPress={() => setQuantity((prev) => Math.max(0.25, parseFloat(prev) - 0.25).toString())}
                  style={styles.qtyBtn}
                >
                  <Text style={styles.qtyBtnText}>−</Text>
                </Pressable>
                <TextInput
                  style={styles.qtyInput}
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="decimal-pad"
                  selectionColor={Colors.accent}
                />
                <Pressable
                  onPress={() => setQuantity((prev) => (parseFloat(prev) + 0.25).toString())}
                  style={styles.qtyBtn}
                >
                  <Text style={styles.qtyBtnText}>+</Text>
                </Pressable>
              </View>
            </View>

            <Button
              label={`Add ${qty > 1 ? `${qty}×` : ''} ${selected.name}`}
              variant="primary"
              fullWidth
              onPress={handleAdd}
            />
          </Card>
        )}

        {/* Food list */}
        {!selected && (
          <View style={styles.foodList}>
            <Text style={styles.listHeader}>
              {search ? `${filtered.length} results` : 'All foods'}
            </Text>
            {filtered.map((food) => (
              <PressableScale key={food.id} onPress={() => setSelected(food)}>
                <View style={styles.foodRow}>
                  <View style={styles.foodInfo}>
                    <Text style={styles.foodName}>{food.name}</Text>
                    <Text style={styles.foodServing}>{food.servingSize}</Text>
                  </View>
                  <MacroPill
                    calories={food.calories}
                    protein={food.protein}
                    carbs={food.carbs}
                    fat={food.fat}
                  />
                </View>
              </PressableScale>
            ))}
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.base },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    ...Typography.body,
    color: Colors.muted,
    fontSize: 18,
  },
  title: {
    ...Typography.h4,
    color: Colors.primary,
    fontWeight: '700',
  },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    gap: Spacing.md,
  },
  categoryRow: {
    gap: 8,
    paddingRight: Spacing.md,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  catChipActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accent + '15',
  },
  catEmoji: { fontSize: 14 },
  catLabel: {
    ...Typography.small,
    color: Colors.secondary,
    fontWeight: '500',
  },
  catLabelActive: { color: Colors.accent, fontWeight: '700' },
  selectedCard: { gap: Spacing.md },
  selectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  selectedName: {
    ...Typography.h4,
    color: Colors.primary,
    fontWeight: '700',
    flex: 1,
    letterSpacing: -0.3,
  },
  clearSelected: {
    ...Typography.small,
    color: Colors.accent,
    fontWeight: '600',
  },
  serving: {
    ...Typography.caption,
    color: Colors.muted,
    marginTop: -8,
  },
  qtyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  qtyLabel: {
    ...Typography.body,
    color: Colors.secondary,
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyBtn: {
    width: 36,
    height: 36,
    backgroundColor: Colors.surface2,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  qtyBtnText: {
    ...Typography.h4,
    color: Colors.primary,
  },
  qtyInput: {
    width: 56,
    textAlign: 'center',
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '700',
    backgroundColor: Colors.surface2,
    borderRadius: 8,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  foodList: { gap: 2 },
  listHeader: {
    ...Typography.label,
    color: Colors.muted,
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  foodRow: {
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    marginBottom: 6,
  },
  foodInfo: { gap: 2 },
  foodName: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
  },
  foodServing: {
    ...Typography.caption,
    color: Colors.muted,
  },
});
