import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { GlowRing } from '../../components/ui/GlowRing';
import { GradientBar } from '../../components/ui/GradientBar';
import { Card } from '../../components/ui/Card';
import { PressableScale } from '../../components/ui/PressableScale';
import { StatBadge } from '../../components/ui/StatBadge';
import { Divider } from '../../components/ui/Divider';
import { useDisciplineStore } from '../../store/disciplineStore';
import { useNutritionStore } from '../../store/nutritionStore';
import { useUserStore } from '../../store/userStore';
import { useWorkoutStore } from '../../store/workoutStore';
import { Ionicons } from '@expo/vector-icons';
import { loadDisciplineHistory } from '../../services/disciplineService';
import { CoachCard } from '../../components/ai/CoachCard';
import { WEEKLY_SPLIT } from '../../constants/workouts';
import { useColors } from '../../hooks/useColors';
import { Colors, Spacing, Typography } from '../../constants/theme';
import type { DayOfWeek } from '../../types';

function computeStreak(history: { date: string; score: number }[]): number {
  if (history.length === 0) return 0;
  const todayDate = new Date().toISOString().split('T')[0];
  const sorted = [...history]
    .filter((h) => h.date !== todayDate)
    .sort((a, b) => b.date.localeCompare(a.date));
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < sorted.length; i++) {
    const expected = new Date(today);
    expected.setDate(today.getDate() - (i + 1));
    const expectedStr = expected.toISOString().split('T')[0];
    if (sorted[i].date === expectedStr && sorted[i].score >= 50) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

const DAY_NAMES: DayOfWeek[] = [
  'monday','tuesday','wednesday','thursday','friday','saturday','sunday',
];

function getTodaySession() {
  const jsDay = new Date().getDay(); // 0=Sun
  const dayIndex = jsDay === 0 ? 6 : jsDay - 1;
  const dayName = DAY_NAMES[dayIndex];
  return { dayName, session: WEEKLY_SPLIT[dayName] };
}

function getGreeting(name: string): string {
  const hour = new Date().getHours();
  const prefix = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  return name ? `${prefix}, ${name.split(' ')[0]}.` : `${prefix}.`;
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export default function DashboardScreen() {
  const Colors = useColors();
  const { score, workoutDone, proteinHit, calorieHit, supplementsTaken } = useDisciplineStore();
  const { getTotals, waterMl } = useNutritionStore();
  const { profile } = useUserStore();
  const { activeWorkout } = useWorkoutStore();
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    loadDisciplineHistory().then((history) => {
      setStreak(computeStreak(history));
    });
  }, [score]); // re-run when today's score updates

  const { session } = getTodaySession();
  const { calories, protein, carbs, fat } = getTotals();
  const calorieRemaining = profile.goalCalories - calories;
  const proteinRemaining = profile.goalProtein - protein;
  const waterPct = waterMl / profile.goalWaterMl;

  const styles = React.useMemo(() => StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: Colors.base,
    },
    scroll: { flex: 1 },
    content: {
      paddingHorizontal: Spacing.md,
      paddingTop: Spacing.lg,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: Spacing.lg,
    },
    greeting: {
      ...Typography.h2,
      color: Colors.primary,
      fontWeight: '700',
      letterSpacing: -0.8,
    },
    date: {
      ...Typography.small,
      color: Colors.secondary,
      marginTop: 2,
    },
    streakBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: Colors.surface,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 20,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: Colors.border,
    },
    streakCount: {
      ...Typography.body,
      color: Colors.primary,
      fontWeight: '700',
    },
    disciplineCard: {
      marginBottom: Spacing.lg,
      padding: Spacing.lg,
    },
    disciplineInner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.lg,
    },
    disciplineStats: {
      flex: 1,
      gap: Spacing.sm,
    },
    disciplineCaption: {
      ...Typography.small,
      color: Colors.secondary,
      lineHeight: 18,
    },
    scoreBreakdown: {
      gap: 2,
      marginTop: 4,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.sm,
      marginTop: Spacing.md,
    },
    sectionTitle: {
      ...Typography.label,
      color: Colors.muted,
      letterSpacing: 1.5,
    },
    sectionSub: {
      ...Typography.caption,
      color: Colors.secondary,
    },
    sessionCard: {
      marginBottom: Spacing.md,
      gap: 6,
    },
    sessionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    sessionDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    sessionLabel: {
      ...Typography.h4,
      color: Colors.primary,
      fontWeight: '600',
      flex: 1,
    },
    doneBadge: {
      backgroundColor: Colors.accentGreen + '20',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 4,
    },
    doneText: {
      ...Typography.caption,
      color: Colors.accentGreen,
      fontWeight: '700',
      letterSpacing: 1,
    },
    exerciseCount: {
      ...Typography.small,
      color: Colors.secondary,
    },
    sessionCta: {
      ...Typography.small,
      color: Colors.accent,
      fontWeight: '600',
      marginTop: 4,
    },
    restCard: {
      marginBottom: Spacing.md,
      alignItems: 'center',
      paddingVertical: Spacing.lg,
      gap: 4,
    },
    restLabel: {
      ...Typography.h4,
      color: Colors.muted,
      fontWeight: '600',
      letterSpacing: 2,
    },
    restSub: {
      ...Typography.small,
      color: Colors.muted,
    },
    nutritionCard: {
      marginBottom: Spacing.md,
      gap: 0,
    },
    macroGrid: {
      flexDirection: 'row',
      paddingBottom: Spacing.sm,
    },
    bars: {
      gap: Spacing.sm,
    },
    quickActions: {
      flexDirection: 'row',
      gap: Spacing.sm,
      marginBottom: Spacing.md,
    },
  }), [Colors]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting(profile.name)}</Text>
            <Text style={styles.date}>{formatDate()}</Text>
          </View>
          <PressableScale style={styles.streakBadge} onPress={() => router.push('/(tabs)/progress')}>
            <Ionicons name="flame" size={16} color={Colors.accentAmber} />
            <Text style={styles.streakCount}>{streak}</Text>
          </PressableScale>
        </View>

        {/* Discipline Score — hero element */}
        <Card style={styles.disciplineCard} glow={score > 70 ? Colors.accent : undefined}>
          <View style={styles.disciplineInner}>
            <GlowRing score={score} size={200} strokeWidth={14} />
            <View style={styles.disciplineStats}>
              <Text style={styles.disciplineCaption}>
                {score === 0
                  ? 'Start your day. Execute the system.'
                  : score < 50
                  ? 'Keep pushing. The session counts.'
                  : score < 80
                  ? 'Solid. Finish strong.'
                  : 'Locked in. This is the standard.'}
              </Text>
              <View style={styles.scoreBreakdown}>
                <ScoreRow label="Workout" done={workoutDone} pts={25} />
                <ScoreRow label="Protein" done={proteinHit} pts={20} />
                <ScoreRow label="Calories" done={calorieHit} pts={15} />
                <ScoreRow label="Supplements" done={supplementsTaken.length >= 5} pts={15} />
                <ScoreRow label="Water" done={waterPct >= 1} pts={10} />
              </View>
            </View>
          </View>
        </Card>

        {/* Today's session */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>TODAY'S SESSION</Text>
        </View>

        {session ? (
          <PressableScale onPress={() => router.push({ pathname: '/workout/[id]', params: { id: session.type } })}>
            <Card
              style={[styles.sessionCard, { borderColor: (Colors as Record<string, string>)[session.type] ?? Colors.border }]}
            >
              <View style={styles.sessionHeader}>
                <View
                  style={[
                    styles.sessionDot,
                    { backgroundColor: Colors[session.type] || Colors.accent },
                  ]}
                />
                <Text style={styles.sessionLabel}>{session.label}</Text>
                {workoutDone && (
                  <View style={styles.doneBadge}>
                    <Text style={styles.doneText}>DONE</Text>
                  </View>
                )}
              </View>
              <Text style={styles.exerciseCount}>
                {session.exercises.length} exercises
              </Text>
              <Text style={styles.sessionCta}>
                {workoutDone ? 'View completed workout' : 'Tap to begin →'}
              </Text>
            </Card>
          </PressableScale>
        ) : (
          <Card style={styles.restCard}>
            <Text style={styles.restLabel}>REST DAY</Text>
            <Text style={styles.restSub}>30-min walk + active recovery.</Text>
          </Card>
        )}

        {/* Nutrition summary */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>NUTRITION</Text>
          <Text style={styles.sectionSub}>
            {calorieRemaining > 0
              ? `${calorieRemaining} kcal remaining`
              : 'Target reached'}
          </Text>
        </View>

        <Card style={styles.nutritionCard}>
          <View style={styles.macroGrid}>
            <StatBadge
              value={calories}
              label="kcal"
              color={Colors.accentAmber}
            />
            <StatBadge
              value={`${protein}g`}
              label="protein"
              color={Colors.accent}
            />
            <StatBadge
              value={`${carbs}g`}
              label="carbs"
              color={Colors.accentGreen}
            />
            <StatBadge
              value={`${fat}g`}
              label="fat"
              color={Colors.accent2}
            />
          </View>

          <Divider />

          <View style={styles.bars}>
            <GradientBar
              value={calories}
              max={profile.goalCalories}
              label="Calories"
              unit="kcal"
              color={Colors.accentAmber}
            />
            <GradientBar
              value={protein}
              max={profile.goalProtein}
              label="Protein"
              unit="g"
              color={Colors.accent}
            />
            <GradientBar
              value={waterMl}
              max={profile.goalWaterMl}
              label="Water"
              unit="ml"
              color={Colors.accent2}
            />
          </View>
        </Card>

        {/* AI Coach */}
        <CoachCard
          data={{
            score,
            protein,
            proteinGoal: profile.goalProtein,
            calories,
            calorieGoal: profile.goalCalories,
            workoutDone,
            streak,
            weightTrend: 'unknown',
          }}
        />

        {/* Quick actions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
        </View>

        <View style={styles.quickActions}>
          <QuickAction
            label="Log Meal"
            iconName="restaurant-outline"
            color={Colors.accentAmber}
            onPress={() => router.push('/meal/log')}
          />
          <QuickAction
            label="Start Workout"
            iconName="barbell-outline"
            color={Colors.accent}
            onPress={() => {
              const s = getTodaySession();
              if (s.session) router.push({ pathname: '/workout/[id]', params: { id: s.session.type } });
            }}
          />
          <QuickAction
            label="Add Water"
            iconName="water-outline"
            color={Colors.accent2}
            onPress={() => router.push('/nutrition')}
          />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function ScoreRow({ label, done, pts }: { label: string; done: boolean; pts: number }) {
  const Colors = useColors();
  const scoreRowStyles = React.useMemo(() => StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 3,
    },
    indicator: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    label: {
      ...Typography.small,
      color: Colors.secondary,
      flex: 1,
    },
    pts: {
      ...Typography.caption,
      color: Colors.muted,
      fontWeight: '600',
    },
  }), [Colors]);

  return (
    <View style={scoreRowStyles.row}>
      <View
        style={[
          scoreRowStyles.indicator,
          { backgroundColor: done ? Colors.accentGreen : Colors.surface2 },
        ]}
      />
      <Text style={scoreRowStyles.label}>{label}</Text>
      <Text style={scoreRowStyles.pts}>+{pts}</Text>
    </View>
  );
}

function QuickAction({ label, iconName, color, onPress }: { label: string; iconName: React.ComponentProps<typeof Ionicons>['name']; color: string; onPress?: () => void }) {
  const Colors = useColors();
  const qaStyles = React.useMemo(() => StyleSheet.create({
    action: {
      flex: 1,
      backgroundColor: Colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      paddingVertical: 16,
      alignItems: 'center',
      gap: 6,
    },
    label: {
      ...Typography.caption,
      fontWeight: '600',
      letterSpacing: 0.3,
      textTransform: 'uppercase',
    },
  }), [Colors]);

  return (
    <PressableScale onPress={onPress} style={[qaStyles.action, { borderColor: color + '40' }]}>
      <Ionicons name={iconName} size={22} color={color} />
      <Text style={[qaStyles.label, { color }]}>{label}</Text>
    </PressableScale>
  );
}
