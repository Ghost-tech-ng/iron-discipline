import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  FadeInDown,
  Easing,
} from 'react-native-reanimated';
import { Card } from '../../components/ui/Card';
import { PressableScale } from '../../components/ui/PressableScale';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { useHabitStore } from '../../store/habitStore';
import { useDisciplineStore } from '../../store/disciplineStore';
import { useNutritionStore } from '../../store/nutritionStore';
import { useProgressStore } from '../../store/progressStore';
import { useUserStore } from '../../store/userStore';
import { useColors } from '../../hooks/useColors';
import { NoiseOverlay } from '../../components/ui/NoiseOverlay';
import { Colors, Spacing, Typography } from '../../constants/theme';
import { resetAllData } from '../../services/db';
import { router } from 'expo-router';

function HabitRow({ id, label, completed, onToggle }: {
  id: string;
  label: string;
  completed: boolean;
  onToggle: () => void;
}) {
  const Colors = useColors();

  // Checkbox container bounce
  const boxScale = useSharedValue(1);
  // Checkmark appears with a spring scale-in
  const checkScale = useSharedValue(completed ? 1 : 0);
  // Ripple ring: scale + opacity
  const rippleScale = useSharedValue(0.3);
  const rippleOpacity = useSharedValue(0);
  // Row flash background
  const flashOpacity = useSharedValue(0);

  useEffect(() => {
    if (completed) {
      checkScale.value = withSpring(1, { damping: 11, stiffness: 260 });
    } else {
      checkScale.value = withTiming(0, { duration: 150 });
    }
  }, [completed]);

  function handlePress() {
    const togglingOn = !completed;

    // Checkbox bounce
    boxScale.value = withSequence(
      withSpring(1.28, { damping: 8, stiffness: 300 }),
      withSpring(1.0, { damping: 14, stiffness: 220 })
    );

    if (togglingOn) {
      // Ripple burst
      rippleScale.value = 0.3;
      rippleOpacity.value = 0.7;
      rippleScale.value = withTiming(2.6, { duration: 500, easing: Easing.out(Easing.quad) });
      rippleOpacity.value = withTiming(0, { duration: 500, easing: Easing.out(Easing.quad) });

      // Row green flash
      flashOpacity.value = 0.18;
      flashOpacity.value = withTiming(0, { duration: 600, easing: Easing.out(Easing.quad) });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    onToggle();
  }

  const boxStyle = useAnimatedStyle(() => ({
    transform: [{ scale: boxScale.value }],
  }));

  const checkmarkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: checkScale.value,
  }));

  const rippleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: rippleScale.value }],
    opacity: rippleOpacity.value,
  }));

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));

  const habitStyles = React.useMemo(() => StyleSheet.create({
    outer: { overflow: 'hidden' },
    flash: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: Colors.accentGreen,
      borderRadius: 10,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      paddingVertical: 14,
      paddingHorizontal: Spacing.md,
    },
    checkboxWrap: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ripple: {
      position: 'absolute',
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: Colors.accentGreen,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 6,
      borderWidth: 1.5,
      borderColor: Colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxDone: {
      backgroundColor: Colors.accentGreen,
      borderColor: Colors.accentGreen,
    },
    checkmark: {
      fontSize: 13,
      color: '#000',
      fontWeight: '700',
    },
    label: {
      ...Typography.body,
      color: Colors.primary,
      flex: 1,
    },
    labelDone: {
      color: Colors.secondary,
      textDecorationLine: 'line-through',
    },
  }), [Colors]);

  return (
    <PressableScale onPress={handlePress}>
      <View style={habitStyles.outer}>
        {/* Row green flash overlay */}
        <Animated.View style={[habitStyles.flash, flashStyle]} pointerEvents="none" />

        <View style={[habitStyles.row, completed && { opacity: 0.75 }]}>
          {/* Checkbox + ripple */}
          <View style={habitStyles.checkboxWrap}>
            {/* Ripple ring */}
            <Animated.View style={[habitStyles.ripple, rippleStyle]} pointerEvents="none" />

            {/* Checkbox with bounce */}
            <Animated.View
              style={[
                habitStyles.checkbox,
                completed && habitStyles.checkboxDone,
                boxStyle,
              ]}
            >
              <Animated.Text style={[habitStyles.checkmark, checkmarkStyle]}>
                ✓
              </Animated.Text>
            </Animated.View>
          </View>

          <Text style={[habitStyles.label, completed && habitStyles.labelDone]}>
            {label}
          </Text>
        </View>
      </View>
    </PressableScale>
  );
}

export default function HabitsScreen() {
  const Colors = useColors();
  const { habits, toggleHabit, completionPercent, checkNewDay } = useHabitStore();
  const { setSleepLogged, setCardioLogged } = useDisciplineStore();

  useEffect(() => { checkNewDay(); }, []);
  const [resetting, setResetting] = useState(false);
  const pct = completionPercent();

  async function handleReset() {
    Alert.alert(
      'Reset All Data',
      'This will wipe every meal, workout, check-in and your profile. You will go back to the setup screen. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Everything',
          style: 'destructive',
          onPress: async () => {
            setResetting(true);
            try {
              await resetAllData();
              useUserStore.getState().loadProfile({
                name: '', heightCm: 191, weightKg: 95, goalWeightKg: 89,
                goalCalories: 2500, goalProtein: 200, goalCarbs: 240,
                goalFat: 72, goalWaterMl: 3500, onboardingComplete: false,
              });
              useUserStore.getState().setHydrated();
              useNutritionStore.getState().hydrateToday([], 0);
              useProgressStore.getState().loadCheckIns([]);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              router.replace('/(onboarding)');
            } catch (e) {
              Alert.alert('Error', 'Reset failed. Try again.');
            } finally {
              setResetting(false);
            }
          },
        },
      ]
    );
  }

  function handleToggle(id: string) {
    toggleHabit(id);
    if (id === 'sleep') setSleepLogged(habits.find(h => h.id === 'sleep')?.completed === false);
    if (id === 'cardio') setCardioLogged(habits.find(h => h.id === 'cardio')?.completed === false);
  }

  const styles = React.useMemo(() => StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.base },
    scroll: { flex: 1 },
    content: { paddingHorizontal: Spacing.md, paddingTop: Spacing.lg, gap: Spacing.md },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    titleBlock: { flex: 1 },
    title: {
      ...Typography.h1,
      color: Colors.primary,
      fontWeight: '700',
      letterSpacing: -1,
    },
    subtitle: {
      ...Typography.small,
      color: Colors.secondary,
    },
    progressCard: { gap: 10 },
    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    progressLabel: {
      ...Typography.label,
      color: Colors.muted,
      letterSpacing: 1.5,
    },
    progressPct: {
      ...Typography.h3,
      fontWeight: '700',
    },
    progressTrack: {
      height: 6,
      backgroundColor: Colors.surface2,
      borderRadius: 3,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 3,
    },
    habitsCard: { padding: 0, overflow: 'hidden' },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: Colors.border,
      marginLeft: 64,
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
    resetBtn: {
      alignItems: 'center',
      paddingVertical: 14,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: Colors.accentRed + '40',
      backgroundColor: Colors.accentRed + '10',
    },
    resetText: {
      ...Typography.small,
      color: Colors.accentRed,
      fontWeight: '600',
      letterSpacing: 0.3,
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
        <Animated.View entering={FadeInDown.delay(0).duration(450)} style={styles.header}>
          <View style={styles.titleBlock}>
            <Text style={styles.title}>Habits</Text>
            <Text style={styles.subtitle}>Daily non-negotiables</Text>
          </View>
          <ThemeToggle />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).duration(450)}>
          <Card style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>TODAY</Text>
              <Text style={[
                styles.progressPct,
                { color: pct === 100 ? Colors.accentGreen : pct > 60 ? Colors.accent : Colors.accentAmber }
              ]}>
                {pct}%
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: pct === 100 ? Colors.accentGreen : Colors.accent }]} />
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(160).duration(450)}>
          <Card style={styles.habitsCard}>
            {habits.map((habit, idx) => (
              <React.Fragment key={habit.id}>
                <HabitRow
                  id={habit.id}
                  label={habit.label}
                  completed={habit.completed}
                  onToggle={() => handleToggle(habit.id)}
                />
                {idx < habits.length - 1 && <View style={styles.separator} />}
              </React.Fragment>
            ))}
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(240).duration(450)}>
          <Card style={styles.noteCard}>
            <Text style={styles.noteTitle}>Why these habits matter</Text>
            <Text style={styles.noteBody}>
              Each habit has a 20% weight in your Discipline Score. Miss all five = 30 pts off your score, regardless of your workout. Sleep and steps are the two most underestimated factors in body recomposition.
            </Text>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(320).duration(450)}>
          <PressableScale onPress={handleReset} style={styles.resetBtn}>
            <Text style={styles.resetText}>
              {resetting ? 'Resetting…' : 'Reset All Data'}
            </Text>
          </PressableScale>
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
