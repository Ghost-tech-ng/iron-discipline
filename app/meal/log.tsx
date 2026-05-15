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
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { readAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import { FoodSearchBar } from '../../components/nutrition/FoodSearchBar';
import { MacroPill } from '../../components/nutrition/MacroPill';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { PressableScale } from '../../components/ui/PressableScale';
import { FOOD_LIBRARY } from '../../constants/nutrition';
import { useNutritionStore } from '../../store/nutritionStore';
import { saveMealEntry } from '../../services/nutritionService';
import {
  estimateMealFromText,
  estimateMealFromPhoto,
  type MealEstimate,
} from '../../services/aiService';
import { useColors } from '../../hooks/useColors';
import { Colors, Spacing, Typography } from '../../constants/theme';
import type { MealCategory, FoodItem } from '../../types';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];
const CATEGORIES: { key: MealCategory; label: string; icon: IoniconsName }[] = [
  { key: 'breakfast', label: 'Breakfast', icon: 'sunny-outline' },
  { key: 'lunch', label: 'Lunch', icon: 'partly-sunny-outline' },
  { key: 'post_workout', label: 'Post-Workout', icon: 'barbell-outline' },
  { key: 'dinner', label: 'Dinner', icon: 'moon-outline' },
  { key: 'snack', label: 'Snack', icon: 'cafe-outline' },
];

function getDefaultCategory(): MealCategory {
  const h = new Date().getHours();
  if (h < 10) return 'breakfast';
  if (h < 14) return 'lunch';
  if (h < 16) return 'post_workout';
  if (h < 21) return 'dinner';
  return 'snack';
}

function estimateToFoodItem(e: MealEstimate): FoodItem {
  return {
    id: `ai_${Date.now()}`,
    name: e.name,
    calories: e.calories,
    protein: e.protein,
    carbs: e.carbs,
    fat: e.fat,
    servingSize: e.servingSize,
  };
}

type InputMode = 'library' | 'describe' | 'photo';

export default function LogMealScreen() {
  const Colors = useColors();
  const params = useLocalSearchParams<{
    scannedId?: string; scannedName?: string; scannedCalories?: string;
    scannedProtein?: string; scannedCarbs?: string; scannedFat?: string; scannedServing?: string;
  }>();

  // If we arrived from barcode scan, pre-select the scanned item
  const scannedFood: FoodItem | null = params.scannedId ? {
    id: params.scannedId,
    name: params.scannedName ?? 'Scanned Product',
    calories: Number(params.scannedCalories) || 0,
    protein: Number(params.scannedProtein) || 0,
    carbs: Number(params.scannedCarbs) || 0,
    fat: Number(params.scannedFat) || 0,
    servingSize: params.scannedServing ?? '1 serving',
  } : null;

  const [inputMode, setInputMode] = useState<InputMode>(scannedFood ? 'library' : 'library');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<FoodItem | null>(scannedFood);
  const [category, setCategory] = useState<MealCategory>(getDefaultCategory());
  const [quantity, setQuantity] = useState('1');

  // AI describe mode
  const [description, setDescription] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const { addMeal } = useNutritionStore();
  const qty = parseFloat(quantity) || 1;

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return FOOD_LIBRARY;
    return FOOD_LIBRARY.filter((f) => f.name.toLowerCase().includes(q));
  }, [search]);

  async function handleAIDescribe() {
    const desc = description.trim();
    if (!desc) return;
    setAiLoading(true);
    try {
      const estimate = await estimateMealFromText(desc);
      setSelected(estimateToFoodItem(estimate));
      setInputMode('library'); // show the selected card
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      Alert.alert('AI Error', msg.includes('API key') ? msg : 'Could not estimate meal. Check connection and try again.');
    } finally {
      setAiLoading(false);
    }
  }

  async function handlePhotoAnalysis() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      base64: true,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    let base64 = asset.base64;

    // Fallback: read from file system if base64 not returned
    if (!base64 && asset.uri) {
      base64 = await readAsStringAsync(asset.uri, {
        encoding: EncodingType.Base64,
      });
    }

    if (!base64) {
      Alert.alert('Error', 'Could not read image. Try again.');
      return;
    }

    setAiLoading(true);
    try {
      const mimeType = asset.mimeType ?? 'image/jpeg';
      const estimate = await estimateMealFromPhoto(base64, mimeType);
      setSelected(estimateToFoodItem(estimate));
      setInputMode('library');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      Alert.alert('AI Error', msg.includes('API key') ? msg : 'Could not analyse photo. Check connection and try again.');
    } finally {
      setAiLoading(false);
    }
  }

  async function handleAdd() {
    if (!selected) return;

    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const entry = {
      id: `meal_${Date.now()}`,
      date: now.toISOString().split('T')[0],
      time,
      category,
      foodItem: selected,
      quantity: qty,
    };

    addMeal(entry);
    await saveMealEntry(entry);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  }

  const styles = React.useMemo(() => StyleSheet.create({
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
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    backText: { ...Typography.body, color: Colors.muted, fontSize: 18 },
    title: { ...Typography.h4, color: Colors.primary, fontWeight: '700' },
    scanBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    scroll: { flex: 1 },
    content: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md, gap: Spacing.md },
    categoryRow: { gap: 8, paddingRight: Spacing.md },
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
    catChipActive: { borderColor: Colors.accent, backgroundColor: Colors.accent + '15' },
    catLabel: { ...Typography.small, color: Colors.secondary, fontWeight: '500' },
    catLabelActive: { color: Colors.accent, fontWeight: '700' },
    modeTabs: {
      flexDirection: 'row',
      backgroundColor: Colors.surface2,
      borderRadius: 10,
      padding: 3,
      gap: 2,
    },
    modeTab: { flex: 1, paddingVertical: 7, borderRadius: 8, alignItems: 'center' },
    modeTabActive: { backgroundColor: Colors.surface },
    modeTabText: { fontSize: 12, fontWeight: '600', color: Colors.muted },
    modeTabTextActive: { color: Colors.primary },
    describeCard: { gap: Spacing.sm },
    describeLabel: { ...Typography.label, color: Colors.muted, letterSpacing: 1.5 },
    describeInput: {
      ...Typography.body,
      color: Colors.primary,
      backgroundColor: Colors.surface2,
      borderRadius: 10,
      padding: 12,
      minHeight: 80,
      textAlignVertical: 'top',
      borderWidth: 1,
      borderColor: Colors.border,
    },
    photoSub: { ...Typography.small, color: Colors.secondary, lineHeight: 20 },
    aiLoadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' },
    aiLoadingText: { ...Typography.small, color: Colors.muted },
    selectedCard: { gap: Spacing.md },
    selectedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    selectedName: { ...Typography.h4, color: Colors.primary, fontWeight: '700', flex: 1, letterSpacing: -0.3 },
    clearSelected: { ...Typography.small, color: Colors.accent, fontWeight: '600' },
    serving: { ...Typography.caption, color: Colors.muted, marginTop: -8 },
    qtyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    qtyLabel: { ...Typography.body, color: Colors.secondary },
    qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    qtyBtn: {
      width: 36, height: 36,
      backgroundColor: Colors.surface2, borderRadius: 8,
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: Colors.border,
    },
    qtyBtnText: { ...Typography.h4, color: Colors.primary },
    qtyInput: {
      width: 56, textAlign: 'center',
      ...Typography.body, color: Colors.primary, fontWeight: '700',
      backgroundColor: Colors.surface2, borderRadius: 8,
      paddingVertical: 8, borderWidth: 1, borderColor: Colors.accent,
    },
    foodList: { gap: 8 },
    listHeader: { ...Typography.label, color: Colors.muted, letterSpacing: 1.2 },
    foodRow: {
      paddingVertical: 14, paddingHorizontal: Spacing.md,
      backgroundColor: Colors.surface, borderRadius: 12,
      gap: 8, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border,
    },
    foodInfo: { gap: 2 },
    foodName: { ...Typography.body, color: Colors.primary, fontWeight: '600' },
    foodServing: { ...Typography.caption, color: Colors.muted },
  }), [Colors]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>✕</Text>
          </Pressable>
          <Text style={styles.title}>Log a Meal</Text>
          <Pressable onPress={() => router.push('/meal/scan')} style={styles.scanBtn}>
            <Ionicons name="barcode-outline" size={22} color={Colors.accent} />
          </Pressable>
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
                style={[styles.catChip, category === c.key && styles.catChipActive]}
              >
                <Ionicons
                  name={c.icon}
                  size={14}
                  color={category === c.key ? Colors.accent : Colors.muted}
                />
                <Text style={[styles.catLabel, category === c.key && styles.catLabelActive]}>
                  {c.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Input mode tabs */}
          <View style={styles.modeTabs}>
            {([
              { key: 'library', label: 'Library' },
              { key: 'describe', label: 'Describe' },
              { key: 'photo', label: 'Photo AI' },
            ] as { key: InputMode; label: string }[]).map((m) => (
              <Pressable
                key={m.key}
                style={[styles.modeTab, inputMode === m.key && styles.modeTabActive]}
                onPress={() => setInputMode(m.key)}
              >
                <Text style={[styles.modeTabText, inputMode === m.key && styles.modeTabTextActive]}>
                  {m.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Describe mode */}
          {inputMode === 'describe' && (
            <Card style={styles.describeCard}>
              <Text style={styles.describeLabel}>DESCRIBE YOUR MEAL</Text>
              <TextInput
                style={styles.describeInput}
                value={description}
                onChangeText={setDescription}
                placeholder="e.g. 2 scrambled eggs, 2 slices toast with butter and a cup of milk"
                placeholderTextColor={Colors.muted}
                multiline
                numberOfLines={3}
              />
              <Button
                label={aiLoading ? 'Estimating...' : 'Estimate with AI'}
                variant="primary"
                fullWidth
                onPress={handleAIDescribe}
              />
              {aiLoading && (
                <View style={styles.aiLoadingRow}>
                  <ActivityIndicator size="small" color={Colors.accent} />
                  <Text style={styles.aiLoadingText}>Gemini is analysing your meal...</Text>
                </View>
              )}
            </Card>
          )}

          {/* Photo AI mode */}
          {inputMode === 'photo' && (
            <Card style={styles.describeCard}>
              <Text style={styles.describeLabel}>PHOTO MEAL ANALYSIS</Text>
              <Text style={styles.photoSub}>
                Pick a photo of your meal and Gemini will estimate the macros.
              </Text>
              <Button
                label={aiLoading ? 'Analysing...' : 'Pick Photo to Analyse'}
                variant="primary"
                fullWidth
                onPress={handlePhotoAnalysis}
              />
              {aiLoading && (
                <View style={styles.aiLoadingRow}>
                  <ActivityIndicator size="small" color={Colors.accent} />
                  <Text style={styles.aiLoadingText}>Gemini is analysing your photo...</Text>
                </View>
              )}
            </Card>
          )}

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

              <View style={styles.qtyRow}>
                <Text style={styles.qtyLabel}>Servings</Text>
                <View style={styles.qtyControls}>
                  <Pressable
                    onPress={() =>
                      setQuantity((prev) => Math.max(0.25, parseFloat(prev) - 0.25).toString())
                    }
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
                    onPress={() =>
                      setQuantity((prev) => (parseFloat(prev) + 0.25).toString())
                    }
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

          {/* Library food list */}
          {inputMode === 'library' && !selected && (
            <View style={styles.foodList}>
              <FoodSearchBar value={search} onChange={setSearch} onClear={() => setSearch('')} />
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
    </KeyboardAvoidingView>
  );
}
