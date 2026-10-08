import React, { useEffect } from 'react';
import { View, ScrollView, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useDisciplineStore } from '../../store/disciplineStore';
import { useNutritionStore } from '../../store/nutritionStore';
import { useUserStore } from '../../store/userStore';
import { CoachCard } from '../../components/ai/CoachCard';
import { NoiseOverlay } from '../../components/ui/NoiseOverlay';
import { ForgeHeader } from '../../components/forge/ForgeHeader';
import { ProtocolTrack } from '../../components/forge/ProtocolTrack';
import { StartProtocolCard } from '../../components/forge/StartProtocolCard';
import { HeatCard } from '../../components/forge/HeatCard';
import { SectionHeader } from '../../components/forge/SectionHeader';
import { StrikeCard } from '../../components/forge/StrikeCard';
import { FuelCards } from '../../components/forge/FuelCards';
import { useColors } from '../../hooks/useColors';
import { useHeatHistory } from '../../hooks/useHeatHistory';
import { useActivePlanTargets } from '../../hooks/useActivePlanTargets';
import { WEEKLY_SPLIT } from '../../constants/workouts';
import { getProtocolStatus, mondayIndex } from '../../constants/phases';
import { Spacing } from '../../constants/theme';
import { computeStreak } from '../../utils/heat';
import type { DayOfWeek } from '../../types';

const DAY_NAMES: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

function confirmStart(title: string, body: string, cta: string, onYes: () => void, destructive = false) {
  Alert.alert(title, body, [
    { text: destructive ? 'Cancel' : 'Not yet', style: 'cancel' },
    {
      text: cta,
      style: destructive ? 'destructive' : 'default',
      onPress: () => {
        onYes();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      },
    },
  ]);
}

const enter = (i: number) => FadeInDown.delay(i * 60).duration(450);

export default function ForgeScreen() {
  const C = useColors();
  const { score, workoutDone, setWorkoutDone } = useDisciplineStore();
  const totals = useNutritionStore((s) => s.today);
  const startProtocol = useUserStore((s) => s.startProtocol);
  const plan = useActivePlanTargets();
  const status = getProtocolStatus();
  const history = useHeatHistory(score);
  const streak = computeStreak(history);
  const session = WEEKLY_SPLIT[DAY_NAMES[mondayIndex()]];
  const isRestDay = !session;

  useEffect(() => {
    if (isRestDay && !workoutDone) setWorkoutDone(true);
  }, [isRestDay]);

  const handleStart = () =>
    confirmStart(
      'Start The Sculpt Protocol',
      "Today becomes Day 1 — week, phase and macro targets all count from here. There's no backlog of missed sessions before this point.",
      "I'm Ready",
      startProtocol
    );
  const handleRestart = () =>
    confirmStart(
      'Restart From Day 1',
      'Today becomes Day 1 of week 1 again. Your logged meals, workouts and check-ins are kept.',
      'Restart',
      startProtocol,
      true
    );

  const styles = React.useMemo(() => StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.base },
    content: { paddingHorizontal: Spacing.md, paddingTop: Spacing.lg },
    heat: { marginTop: Spacing.lg },
    coach: { marginTop: Spacing.lg },
  }), [C]);

  return (
    <SafeAreaView style={styles.safe}>
      <NoiseOverlay />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={enter(0)}>
          <ForgeHeader dayNumber={status.isActive ? status.dayNumber : 0} totalDays={status.totalDays} streak={streak} score={score} />
        </Animated.View>

        <Animated.View entering={enter(1)}>
          {status.isActive ? <ProtocolTrack status={status} onRestart={handleRestart} /> : <StartProtocolCard onStart={handleStart} />}
        </Animated.View>

        <Animated.View entering={enter(2)} style={styles.heat}>
          <HeatCard history={history} />
        </Animated.View>

        <Animated.View entering={enter(3)}>
          <SectionHeader title="TODAY'S STRIKE" link="Full split →" onLink={() => router.push('/(tabs)/workouts')} />
          <StrikeCard session={session} done={workoutDone && !isRestDay} />
        </Animated.View>

        <Animated.View entering={enter(4)}>
          <SectionHeader title="FUEL" link="Log meal →" onLink={() => router.push('/meal/log')} />
          <FuelCards />
        </Animated.View>

        <Animated.View entering={enter(5)} style={styles.coach}>
          <CoachCard
            data={{
              score,
              protein: Math.round(totals.protein),
              proteinGoal: plan.protein,
              calories: Math.round(totals.calories),
              calorieGoal: plan.calories,
              workoutDone,
              streak,
              weightTrend: 'unknown',
            }}
          />
        </Animated.View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
