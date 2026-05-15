import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useProgressStore } from '../../store/progressStore';
import { useUserStore } from '../../store/userStore';
import { saveWeeklyCheckIn } from '../../services/disciplineService';
import { Colors, Spacing, Typography } from '../../constants/theme';
import type { WeeklyCheckIn } from '../../types';

export default function WeighInScreen() {
  const { checkIns, addCheckIn } = useProgressStore();
  const { profile } = useUserStore();

  const lastWeight = checkIns[0]?.weightKg ?? profile.weightKg;
  const weekNumber = checkIns.length + 1;

  const [weight, setWeight] = useState(String(lastWeight));
  const [waist, setWaist] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const weightNum = parseFloat(weight);
  const waistNum = waist ? parseFloat(waist) : undefined;
  const delta = checkIns.length > 0 ? weightNum - lastWeight : null;

  async function handleSave() {
    if (isNaN(weightNum) || weightNum < 30 || weightNum > 250) {
      Alert.alert('Invalid weight', 'Enter a weight between 30 and 250 kg.');
      return;
    }

    setSaving(true);
    try {
      const id = `checkin_${Date.now()}`;
      const today = new Date().toISOString().split('T')[0];

      const checkIn: WeeklyCheckIn = {
        id,
        week: weekNumber,
        date: today,
        weightKg: weightNum,
        waistCm: waistNum,
        notes: notes.trim() || undefined,
      };

      await saveWeeklyCheckIn(
        id,
        weekNumber,
        weightNum,
        waistNum ?? null,
        null,
        notes.trim() || null
      );

      addCheckIn(checkIn);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e) {
      Alert.alert('Error', 'Could not save check-in. Try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Week {weekNumber} Check-In</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Weight input — hero element */}
          <View style={styles.weightSection}>
            <Text style={styles.weightLabel}>BODY WEIGHT</Text>
            <View style={styles.weightRow}>
              <TextInput
                style={styles.weightInput}
                value={weight}
                onChangeText={setWeight}
                keyboardType="decimal-pad"
                placeholder="0.0"
                placeholderTextColor={Colors.muted}
                selectTextOnFocus
              />
              <Text style={styles.weightUnit}>kg</Text>
            </View>

            {delta !== null && !isNaN(delta) && (
              <View style={[
                styles.deltaBadge,
                { backgroundColor: delta <= 0 ? Colors.accentGreen + '20' : Colors.accentRed + '20' }
              ]}>
                <Text style={[
                  styles.deltaText,
                  { color: delta <= 0 ? Colors.accentGreen : Colors.accentRed }
                ]}>
                  {delta <= 0 ? '' : '+'}{delta.toFixed(1)} kg vs last week
                </Text>
              </View>
            )}
          </View>

          {/* Goal progress */}
          <Card style={styles.goalCard}>
            <View style={styles.goalRow}>
              <View style={styles.goalItem}>
                <Text style={styles.goalValue}>{profile.weightKg}kg</Text>
                <Text style={styles.goalLabel}>Start</Text>
              </View>
              <View style={styles.goalArrow}>
                <View style={styles.arrowLine} />
                <Text style={styles.arrowHead}>›</Text>
              </View>
              <View style={styles.goalItem}>
                <Text style={[styles.goalValue, { color: Colors.accent }]}>
                  {isNaN(weightNum) ? '—' : weightNum.toFixed(1)}kg
                </Text>
                <Text style={styles.goalLabel}>Now</Text>
              </View>
              <View style={styles.goalArrow}>
                <View style={styles.arrowLine} />
                <Text style={styles.arrowHead}>›</Text>
              </View>
              <View style={styles.goalItem}>
                <Text style={[styles.goalValue, { color: Colors.accentGreen }]}>
                  {profile.goalWeightKg}kg
                </Text>
                <Text style={styles.goalLabel}>Goal</Text>
              </View>
            </View>

            {!isNaN(weightNum) && (
              <Text style={styles.remaining}>
                {Math.max(0, weightNum - profile.goalWeightKg).toFixed(1)} kg to goal
              </Text>
            )}
          </Card>

          {/* Optional measurements */}
          <Text style={styles.sectionTitle}>OPTIONAL</Text>

          <Card style={styles.optionalCard}>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Waist (cm)</Text>
              <TextInput
                style={styles.fieldInput}
                value={waist}
                onChangeText={setWaist}
                keyboardType="decimal-pad"
                placeholder="e.g. 88"
                placeholderTextColor={Colors.muted}
              />
            </View>
            <View style={[styles.fieldRow, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border }]}>
              <Text style={styles.fieldLabel}>Notes</Text>
              <TextInput
                style={[styles.fieldInput, styles.notesInput]}
                value={notes}
                onChangeText={setNotes}
                placeholder="How's the recomposition feeling?"
                placeholderTextColor={Colors.muted}
                multiline
                numberOfLines={3}
              />
            </View>
          </Card>

          {/* Protocol reminder */}
          <Card style={styles.protocolCard}>
            <Text style={styles.protocolTitle}>WEIGH-IN PROTOCOL</Text>
            <Text style={styles.protocolBody}>
              Monday morning · After toilet · Before food or water · Same scale
            </Text>
            <Text style={[styles.protocolBody, { marginTop: 4 }]}>
              Judge trend over 2–3 weeks, not single readings. Water weight swings ±1–2 kg daily.
            </Text>
          </Card>

          <Button
            label={saving ? 'Saving…' : 'Log Check-In'}
            variant="primary"
            fullWidth
            onPress={handleSave}
          />

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    ...Typography.body,
    color: Colors.muted,
    fontSize: 18,
  },
  headerTitle: {
    ...Typography.h4,
    color: Colors.primary,
    fontWeight: '700',
  },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    gap: Spacing.md,
  },
  weightSection: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    gap: 8,
  },
  weightLabel: {
    ...Typography.label,
    color: Colors.muted,
    letterSpacing: 2,
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  weightInput: {
    fontSize: 72,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: -3,
    minWidth: 160,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  weightUnit: {
    ...Typography.h2,
    color: Colors.muted,
    fontWeight: '400',
  },
  deltaBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  deltaText: {
    ...Typography.small,
    fontWeight: '700',
  },
  goalCard: {
    gap: 10,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
  },
  goalItem: {
    alignItems: 'center',
    flex: 1,
  },
  goalValue: {
    ...Typography.h4,
    color: Colors.primary,
    fontWeight: '700',
  },
  goalLabel: {
    ...Typography.caption,
    color: Colors.muted,
    marginTop: 2,
  },
  goalArrow: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    width: 24,
  },
  arrowLine: {
    height: 1,
    width: 8,
    backgroundColor: Colors.border,
  },
  arrowHead: {
    color: Colors.muted,
    fontSize: 16,
  },
  remaining: {
    ...Typography.small,
    color: Colors.muted,
    textAlign: 'center',
  },
  sectionTitle: {
    ...Typography.label,
    color: Colors.muted,
    letterSpacing: 1.5,
    marginTop: 4,
  },
  optionalCard: {
    padding: 0,
    overflow: 'hidden',
    gap: 0,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    gap: 12,
  },
  fieldLabel: {
    ...Typography.small,
    color: Colors.secondary,
    width: 90,
  },
  fieldInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.primary,
    textAlign: 'right',
  },
  notesInput: {
    textAlign: 'left',
    paddingTop: 0,
  },
  protocolCard: {
    gap: 6,
    backgroundColor: Colors.surface2,
  },
  protocolTitle: {
    ...Typography.caption,
    color: Colors.muted,
    letterSpacing: 1.5,
  },
  protocolBody: {
    ...Typography.small,
    color: Colors.secondary,
    lineHeight: 18,
  },
});
