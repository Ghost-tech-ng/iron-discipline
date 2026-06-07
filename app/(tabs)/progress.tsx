import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Image,
  Pressable,
  Modal,
  Alert,
  Dimensions,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { WeightChart } from '../../components/progress/WeightChart';
import { ScoreChart } from '../../components/progress/ScoreChart';
import { StrengthChart } from '../../components/progress/StrengthChart';
import { CalorieChart } from '../../components/progress/CalorieChart';
import { ConsistencyCalendar } from '../../components/progress/ConsistencyCalendar';
import { useProgressStore } from '../../store/progressStore';
import { useUserStore } from '../../store/userStore';
import {
  loadWeeklyCheckIns,
  loadDisciplineHistory,
} from '../../services/disciplineService';
import { loadStrengthHistory, loadWorkoutDates } from '../../services/workoutService';
import { loadDailyCalorieHistory, loadDailyMacroHistory } from '../../services/nutritionService';
import { exportAllData } from '../../services/exportService';
import { syncToCloud, isOnline } from '../../services/syncService';
import { getUserId } from '../../services/db';
import { isMongoConfigured } from '../../services/mongoService';
import { SyncCard } from '../../components/ui/SyncCard';
import { useSyncStore } from '../../store/syncStore';
import { useColors } from '../../hooks/useColors';
import { NoiseOverlay } from '../../components/ui/NoiseOverlay';
import { Colors, Spacing, Typography } from '../../constants/theme';

const SCREEN_W = Dimensions.get('window').width;

const STRENGTH_EXERCISES = [
  { id: 'bench_press', label: 'Bench' },
  { id: 'deadlift', label: 'Deadlift' },
  { id: 'back_squat', label: 'Squat' },
  { id: 'ohp_mon', label: 'OHP' },
  { id: 'barbell_row', label: 'Row' },
];

export default function ProgressScreen() {
  const Colors = useColors();
  const { checkIns, latestWeight, totalLost, loadCheckIns } = useProgressStore();
  const { profile } = useUserStore();
  const { setSyncing, setLastSynced, setError } = useSyncStore();

  async function handleManualSync() {
    if (!isMongoConfigured()) {
      Alert.alert(
        'MongoDB not configured',
        'Add your MongoDB Atlas credentials to .env.local to enable cloud backup.'
      );
      return;
    }
    const online = await isOnline();
    if (!online) {
      Alert.alert('No Internet', 'You are offline. Connect to the internet and try again.');
      return;
    }
    setSyncing(true);
    try {
      const userId = await getUserId();
      await syncToCloud(userId);
      setLastSynced(new Date().toISOString());
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Sync failed';
      setError(msg);
      Alert.alert('Sync Failed', msg);
    } finally {
      setSyncing(false);
    }
  }

  const [scoreHistory, setScoreHistory] = useState<{ date: string; score: number }[]>([]);
  const [strengthData, setStrengthData] = useState<
    Record<string, { date: string; weight: number; reps: number }[]>
  >({});
  const [calorieHistory, setCalorieHistory] = useState<{ date: string; calories: number }[]>([]);
  const [workoutDates, setWorkoutDates] = useState<string[]>([]);
  const [lightboxUri, setLightboxUri] = useState<string | null>(null);
  const [macroHistory, setMacroHistory] = useState<{ date: string; calories: number; protein: number; carbs: number; fat: number }[]>([]);

  const currentWeight = latestWeight() ?? profile.weightKg;
  const lost = totalLost();
  const photos = checkIns.filter((c) => !!c.photoUri);

  const loadAllData = useCallback(() => {
    loadWeeklyCheckIns().then((data) => {
      loadCheckIns(
        data.map((d) => ({
          id: d.id,
          week: d.week,
          date: d.date,
          weightKg: d.weightKg,
          waistCm: d.waistCm,
          photoUri: d.photoUri,
          notes: d.notes,
        }))
      );
    });

    loadDisciplineHistory().then(setScoreHistory);
    loadDailyCalorieHistory(30).then(setCalorieHistory);
    loadWorkoutDates(84).then(setWorkoutDates);
    loadDailyMacroHistory(14).then(setMacroHistory);

    Promise.all(
      STRENGTH_EXERCISES.map(async (ex) => {
        const history = await loadStrengthHistory(ex.id, 12);
        return { id: ex.id, history };
      })
    ).then((results) => {
      const map: Record<string, { date: string; weight: number; reps: number }[]> = {};
      results.forEach(({ id, history }) => { map[id] = history; });
      setStrengthData(map);
    });
  }, []);

  useEffect(() => { loadAllData(); }, []);

  useFocusEffect(useCallback(() => {
    loadWorkoutDates(84).then(setWorkoutDates);
  }, []));

  const THUMB_SIZE = (SCREEN_W - Spacing.md * 2 - 8) / 3;

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
    chartCard: { gap: Spacing.sm },
    goalCard: { gap: Spacing.sm },
    cardTitle: { ...Typography.label, color: Colors.muted, letterSpacing: 1.5 },
    lostBadge: {
      alignSelf: 'flex-start',
      backgroundColor: Colors.accentGreen + '20',
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 20,
    },
    lostText: { ...Typography.small, color: Colors.accentGreen, fontWeight: '700' },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: Spacing.sm,
    },
    sectionTitle: { ...Typography.label, color: Colors.muted, letterSpacing: 1.5 },
    sectionSub: { ...Typography.caption, color: Colors.secondary },
    photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
    photoThumb: {
      width: THUMB_SIZE,
      height: THUMB_SIZE * 1.3,
      borderRadius: 8,
      overflow: 'hidden',
      backgroundColor: Colors.surface,
    },
    photoImg: { width: '100%', height: '100%' },
    photoLabel: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'flex-end',
      padding: 6,
      backgroundColor: 'rgba(0,0,0,0.35)',
    },
    photoWeek: { fontSize: 10, color: Colors.primary, fontWeight: '700' },
    photoWeight: { fontSize: 10, color: Colors.secondary },
    compareCard: { gap: Spacing.sm },
    compareRow: { flexDirection: 'row', gap: 8 },
    compareItem: { flex: 1, gap: 4 },
    compareImg: {
      width: '100%',
      aspectRatio: 3 / 4,
      borderRadius: 8,
    },
    compareLabel: {
      ...Typography.caption,
      color: Colors.muted,
      textAlign: 'center',
    },
    protocolCard: { gap: 8 },
    ruleRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      marginTop: 4,
    },
    ruleDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: Colors.accent,
      marginTop: 7,
    },
    ruleText: {
      ...Typography.small,
      color: Colors.secondary,
      flex: 1,
      lineHeight: 18,
    },
    timelineCard: { gap: 10 },
    timelineRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 4,
    },
    weekLabel: {
      ...Typography.small,
      color: Colors.accent,
      fontWeight: '700',
      width: 56,
    },
    changeLabel: {
      ...Typography.small,
      color: Colors.primary,
      fontWeight: '600',
      width: 90,
    },
    noteLabel: { ...Typography.small, color: Colors.muted, flex: 1 },
    emptyCard: {
      alignItems: 'center',
      paddingVertical: Spacing.xl,
      gap: 6,
    },
    emptyText: { ...Typography.body, color: Colors.secondary, fontWeight: '600' },
    emptySub: { ...Typography.small, color: Colors.muted },
    checkInCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    checkInLeft: { flex: 1, gap: 2 },
    checkInWeek: { ...Typography.small, color: Colors.accent, fontWeight: '700' },
    checkInDate: { ...Typography.caption, color: Colors.muted },
    checkInNotes: { ...Typography.caption, color: Colors.secondary, marginTop: 2 },
    checkInRight: { alignItems: 'flex-end', gap: 4 },
    checkInWeight: { ...Typography.h4, color: Colors.primary, fontWeight: '700' },
    checkInWaist: { ...Typography.caption, color: Colors.muted },
    checkInThumb: { width: 44, height: 58, borderRadius: 6 },
    lightboxBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.92)',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
    },
    lightboxImage: {
      width: SCREEN_W,
      height: SCREEN_W * 1.4,
    },
    lightboxClose: { ...Typography.small, color: Colors.muted },
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
          <Text style={styles.title}>Progress</Text>
          <Text style={styles.subtitle}>Weigh in every Monday morning</Text>
        </Animated.View>

        {/* Weight trend chart */}
        <Animated.View entering={FadeInDown.delay(80).duration(450)}>
          <Card style={styles.chartCard}>
            <Text style={styles.cardTitle}>WEIGHT TREND — 12 WEEKS</Text>
            {lost !== null && lost > 0 && (
              <View style={styles.lostBadge}>
                <Text style={styles.lostText}>−{lost}kg lost</Text>
              </View>
            )}
            <WeightChart
              checkIns={checkIns}
              startWeight={profile.weightKg}
              goalWeight={profile.goalWeightKg}
            />
          </Card>
        </Animated.View>

        {/* Goal progress bar */}
        <Animated.View entering={FadeInDown.delay(160).duration(450)}>
          <Card style={styles.goalCard}>
            <Text style={styles.cardTitle}>12-WEEK GOAL</Text>
            <GoalBar
              current={currentWeight}
              start={profile.weightKg}
              goal={profile.goalWeightKg}
            />
          </Card>
        </Animated.View>

        {/* Weekly analytics summary */}
        <Animated.View entering={FadeInDown.delay(240).duration(450)}>
          <WeeklyAnalyticsCard
            macroHistory={macroHistory}
            scoreHistory={scoreHistory}
            workoutDates={workoutDates}
            proteinGoal={profile.goalProtein}
            calorieGoal={profile.goalCalories}
          />
        </Animated.View>

        {/* Discipline score chart */}
        <Animated.View entering={FadeInDown.delay(300).duration(450)}>
          <Card style={styles.chartCard}>
            <Text style={styles.cardTitle}>DISCIPLINE SCORE HISTORY</Text>
            <ScoreChart history={scoreHistory} />
          </Card>
        </Animated.View>

        {/* Workout consistency calendar */}
        <Animated.View entering={FadeInDown.delay(320).duration(450)}>
          <Card style={styles.chartCard}>
            <Text style={styles.cardTitle}>WORKOUT CONSISTENCY — 12 WEEKS</Text>
            <ConsistencyCalendar workoutDates={workoutDates} weeks={12} />
          </Card>
        </Animated.View>

        {/* Strength progress */}
        <Animated.View entering={FadeInDown.delay(400).duration(450)}>
          <Card style={styles.chartCard}>
            <Text style={styles.cardTitle}>STRENGTH PROGRESS</Text>
            <StrengthChart exercises={STRENGTH_EXERCISES} data={strengthData} />
          </Card>
        </Animated.View>

        {/* Calorie adherence */}
        <Animated.View entering={FadeInDown.delay(480).duration(450)}>
          <Card style={styles.chartCard}>
            <Text style={styles.cardTitle}>CALORIE ADHERENCE — 30 DAYS</Text>
            <CalorieChart history={calorieHistory} target={profile.goalCalories} />
          </Card>
        </Animated.View>

        {/* Progress photos */}
        {photos.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>PROGRESS PHOTOS</Text>
              <Text style={styles.sectionSub}>
                {photos.length} photo{photos.length !== 1 ? 's' : ''}
              </Text>
            </View>
            <View style={styles.photoGrid}>
              {photos.map((c) => (
                <Pressable
                  key={c.id}
                  style={styles.photoThumb}
                  onPress={() => setLightboxUri(c.photoUri!)}
                >
                  <Image
                    source={{ uri: c.photoUri! }}
                    style={styles.photoImg}
                    resizeMode="cover"
                  />
                  <View style={styles.photoLabel}>
                    <Text style={styles.photoWeek}>W{c.week}</Text>
                    <Text style={styles.photoWeight}>{c.weightKg}kg</Text>
                  </View>
                </Pressable>
              ))}
            </View>

            {/* Side-by-side first vs latest */}
            {photos.length >= 2 && (
              <Card style={styles.compareCard}>
                <Text style={styles.cardTitle}>BEFORE / AFTER</Text>
                <View style={styles.compareRow}>
                  <View style={styles.compareItem}>
                    <Image
                      source={{ uri: photos[0].photoUri! }}
                      style={styles.compareImg}
                      resizeMode="cover"
                    />
                    <Text style={styles.compareLabel}>
                      Week {photos[0].week} · {photos[0].weightKg}kg
                    </Text>
                  </View>
                  <View style={styles.compareItem}>
                    <Image
                      source={{ uri: photos[photos.length - 1].photoUri! }}
                      style={styles.compareImg}
                      resizeMode="cover"
                    />
                    <Text style={styles.compareLabel}>
                      Week {photos[photos.length - 1].week} · {photos[photos.length - 1].weightKg}kg
                    </Text>
                  </View>
                </View>
              </Card>
            )}
          </>
        )}

        {/* Coaching insight */}
        <Animated.View entering={FadeInDown.delay(560).duration(450)}>
          <CoachingCard sessionCount={workoutDates.length} checkIns={checkIns} workoutDates={workoutDates} />
        </Animated.View>

        {/* Weigh-in protocol */}
        <Card style={styles.protocolCard}>
          <Text style={styles.cardTitle}>WEIGH-IN PROTOCOL</Text>
          {[
            'Monday morning — same day every week',
            'First thing after waking, after toilet',
            'Before food or water — lowest body water state',
            'Judge trend over 2–3 weeks, not single readings',
          ].map((rule) => (
            <View key={rule} style={styles.ruleRow}>
              <View style={styles.ruleDot} />
              <Text style={styles.ruleText}>{rule}</Text>
            </View>
          ))}
        </Card>

        {/* Expected timeline */}
        <Card style={styles.timelineCard}>
          <Text style={styles.cardTitle}>EXPECTED TIMELINE</Text>
          {[
            { weeks: 'Wk 1–2', change: '−1.5 to −3 kg', note: 'Mostly water + glycogen' },
            { weeks: 'Wk 3–6', change: '−0.5–0.75/wk', note: 'True fat loss begins' },
            { weeks: 'Wk 7–10', change: '−0.4–0.6/wk', note: 'Rate slows — stay consistent' },
            { weeks: 'Wk 11–12', change: '−0.3–0.5/wk', note: 'Final stretch — hold form' },
          ].map((row) => (
            <View key={row.weeks} style={styles.timelineRow}>
              <Text style={styles.weekLabel}>{row.weeks}</Text>
              <Text style={styles.changeLabel}>{row.change}</Text>
              <Text style={styles.noteLabel}>{row.note}</Text>
            </View>
          ))}
        </Card>

        {/* Check-in history */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>CHECK-IN HISTORY</Text>
        </View>

        {checkIns.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No check-ins yet.</Text>
            <Text style={styles.emptySub}>Log your first weigh-in to start tracking.</Text>
          </Card>
        ) : (
          checkIns.map((c) => (
            <Card key={c.id} style={styles.checkInCard}>
              <View style={styles.checkInLeft}>
                <Text style={styles.checkInWeek}>Week {c.week}</Text>
                <Text style={styles.checkInDate}>{c.date}</Text>
                {c.notes && <Text style={styles.checkInNotes}>{c.notes}</Text>}
              </View>
              <View style={styles.checkInRight}>
                <Text style={styles.checkInWeight}>{c.weightKg}kg</Text>
                {c.waistCm && (
                  <Text style={styles.checkInWaist}>{c.waistCm}cm</Text>
                )}
                {c.photoUri && (
                  <Pressable onPress={() => setLightboxUri(c.photoUri!)}>
                    <Image source={{ uri: c.photoUri }} style={styles.checkInThumb} />
                  </Pressable>
                )}
              </View>
            </Card>
          ))
        )}

        <Button
          label="+ Log Weigh-In"
          variant="primary"
          fullWidth
          onPress={() => router.push('/progress/weigh-in')}
        />

        <SyncCard onSyncPress={handleManualSync} />

        <Button
          label="Export Data as CSV"
          variant="secondary"
          fullWidth
          onPress={async () => {
            try {
              await exportAllData();
            } catch (e: unknown) {
              const msg = e instanceof Error ? e.message : 'Export failed';
              Alert.alert('Export Error', msg);
            }
          }}
        />

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Photo lightbox */}
      <Modal visible={lightboxUri !== null} transparent animationType="fade">
        <Pressable style={styles.lightboxBackdrop} onPress={() => setLightboxUri(null)}>
          {lightboxUri && (
            <Image
              source={{ uri: lightboxUri }}
              style={styles.lightboxImage}
              resizeMode="contain"
            />
          )}
          <Text style={styles.lightboxClose}>Tap to close</Text>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

import type { WeeklyCheckIn } from '../../types';

function CoachingCard({ sessionCount, checkIns, workoutDates }: { sessionCount: number; checkIns: WeeklyCheckIn[]; workoutDates: string[] }) {
  const Colors = useColors();

  // Calculate actual weeks since first workout (min 1 to avoid division by zero)
  const firstDate = workoutDates.length > 0 ? new Date(workoutDates[0] + 'T00:00:00') : new Date();
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const weeksElapsed = Math.max(1, Math.ceil((Date.now() - firstDate.getTime()) / msPerWeek));
  const sessionsPerWeek = sessionCount / weeksElapsed;
  const weightChange = checkIns.length >= 2
    ? checkIns[0].weightKg - checkIns[checkIns.length - 1].weightKg
    : null;

  let urgency: 'red' | 'amber' | 'green' = 'red';
  let headline = '';
  let body = '';
  let action = '';

  if (sessionsPerWeek < 2) {
    urgency = 'red';
    headline = 'Training frequency is the bottleneck';
    body = `${sessionCount} sessions in ${weeksElapsed} week${weeksElapsed !== 1 ? 's' : ''} = ${sessionsPerWeek.toFixed(1)}/week. Fat loss and muscle retention both require consistent mechanical stimulus — 4–5 sessions per week minimum. Without it, there is nothing to drive progressive overload, and your body has no reason to spare muscle while in a calorie deficit.`;
    action = 'Target: 4 sessions every week, no exceptions. Set the session time in your calendar like a meeting.';
  } else if (sessionsPerWeek < 3.5) {
    urgency = 'amber';
    headline = 'Frequency is improving — dial in consistency';
    body = `${sessionsPerWeek.toFixed(1)} sessions/week is a start. You need 4–5 to optimise body recomposition. Each missed session is a missed progressive overload opportunity that compounds over your training period.`;
    action = 'Add one more training day. Push/pull/legs/upper/lower covers everything — pick the session you skip most and lock it in.';
  } else {
    urgency = 'green';
    headline = 'Training frequency is solid';
    body = `${sessionsPerWeek.toFixed(1)} sessions/week. Now focus on progressive overload — adding 5kg to a lift every 1–2 weeks. If you hit the rep target on all sets, go up next session.`;
    action = 'Log your weights every set. The app tracks your PRs — beat them each time.';
  }

  const dotColor = urgency === 'red' ? Colors.accentRed : urgency === 'amber' ? Colors.accentAmber : Colors.accentGreen;

  const s = React.useMemo(() => StyleSheet.create({
    card: {
      backgroundColor: Colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: dotColor + '40',
      borderLeftWidth: 3,
      borderLeftColor: dotColor,
      padding: Spacing.md,
      gap: 10,
    },
    tag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    tagDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: dotColor },
    tagText: { ...Typography.label, color: dotColor, letterSpacing: 1.2 },
    headline: { ...Typography.h4, color: Colors.primary, fontWeight: '700', letterSpacing: -0.3 },
    body: { ...Typography.small, color: Colors.secondary, lineHeight: 20 },
    actionBox: {
      backgroundColor: dotColor + '12',
      borderRadius: 8,
      padding: 10,
    },
    actionText: { ...Typography.small, color: Colors.primary, lineHeight: 18, fontWeight: '600' },
    stat: { ...Typography.caption, color: Colors.muted },
  }), [Colors, dotColor]);

  return (
    <View style={s.card}>
      <View style={s.tag}>
        <View style={s.tagDot} />
        <Text style={s.tagText}>COACH ANALYSIS</Text>
      </View>
      <Text style={s.headline}>{headline}</Text>
      <Text style={s.body}>{body}</Text>
      {weightChange !== null && (
        <Text style={s.stat}>
          Weight change over check-ins: {weightChange > 0 ? '+' : ''}{weightChange.toFixed(2)}kg
          {weightChange > 0.5 ? ' — reduce calories by 300 kcal' : weightChange < -0.75 ? ' — good deficit rate' : ' — deficit is working, stay consistent'}
        </Text>
      )}
      <View style={s.actionBox}>
        <Text style={s.actionText}>{action}</Text>
      </View>
    </View>
  );
}

function WeeklyAnalyticsCard({
  macroHistory,
  scoreHistory,
  workoutDates,
  proteinGoal,
  calorieGoal,
}: {
  macroHistory: { date: string; calories: number; protein: number }[];
  scoreHistory: { date: string; score: number }[];
  workoutDates: string[];
  proteinGoal: number;
  calorieGoal: number;
}) {
  const Colors = useColors();

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const cutoff = sevenDaysAgo.toISOString().split('T')[0];

  const recentMacros = macroHistory.filter((d) => d.date >= cutoff);
  const recentScores = scoreHistory.filter((d) => d.date >= cutoff);
  const recentWorkouts = workoutDates.filter((d) => d >= cutoff);

  const daysLogged = recentMacros.length;
  const avgProtein = daysLogged > 0 ? Math.round(recentMacros.reduce((s, d) => s + d.protein, 0) / daysLogged) : null;
  const avgCalories = daysLogged > 0 ? Math.round(recentMacros.reduce((s, d) => s + d.calories, 0) / daysLogged) : null;
  const avgScore = recentScores.length > 0 ? Math.round(recentScores.reduce((s, d) => s + d.score, 0) / recentScores.length) : null;
  const workoutsThisWeek = recentWorkouts.length;

  const proteinPct = avgProtein != null ? Math.min(Math.round((avgProtein / proteinGoal) * 100), 100) : 0;
  const calPct = avgCalories != null ? Math.min(Math.round((avgCalories / calorieGoal) * 100), 100) : 0;
  const workoutPct = Math.min(Math.round((workoutsThisWeek / 5) * 100), 100);
  const scorePct = avgScore ?? 0;

  function statusColor(pct: number, inverse = false) {
    if (inverse) return pct > 110 ? Colors.accentRed : pct >= 90 ? Colors.accentGreen : Colors.accentAmber;
    return pct >= 90 ? Colors.accentGreen : pct >= 70 ? Colors.accentAmber : Colors.accentRed;
  }

  const s = React.useMemo(() => StyleSheet.create({
    card: { gap: 14 },
    title: { ...Typography.label, color: Colors.muted, letterSpacing: 1.5 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    tile: {
      flex: 1,
      minWidth: '45%',
      backgroundColor: Colors.surface2,
      borderRadius: 12,
      padding: 12,
      gap: 6,
    },
    tileLabel: { ...Typography.caption, color: Colors.muted, letterSpacing: 0.5 },
    tileValue: { ...Typography.h3, fontWeight: '700', letterSpacing: -0.5 },
    tileBar: {
      height: 4,
      borderRadius: 2,
      backgroundColor: Colors.border,
      overflow: 'hidden',
    },
    tileBarFill: { height: '100%', borderRadius: 2 },
    tileSub: { ...Typography.caption, color: Colors.muted },
    noData: { ...Typography.small, color: Colors.muted, textAlign: 'center', paddingVertical: 12 },
  }), [Colors]);

  if (daysLogged === 0 && recentWorkouts.length === 0) {
    return (
      <Card style={s.card}>
        <Text style={s.title}>7-DAY AVERAGES</Text>
        <Text style={s.noData}>No data logged yet. Start tracking meals and workouts.</Text>
      </Card>
    );
  }

  return (
    <Card style={s.card}>
      <Text style={s.title}>7-DAY AVERAGES</Text>
      <View style={s.grid}>
        <View style={s.tile}>
          <Text style={s.tileLabel}>AVG PROTEIN</Text>
          <Text style={[s.tileValue, { color: statusColor(proteinPct) }]}>
            {avgProtein != null ? `${avgProtein}g` : '--'}
          </Text>
          <View style={s.tileBar}>
            <View style={[s.tileBarFill, { width: `${proteinPct}%`, backgroundColor: statusColor(proteinPct) }]} />
          </View>
          <Text style={s.tileSub}>{proteinPct}% of {proteinGoal}g target</Text>
        </View>

        <View style={s.tile}>
          <Text style={s.tileLabel}>AVG CALORIES</Text>
          <Text style={[s.tileValue, { color: statusColor(calPct, true) }]}>
            {avgCalories != null ? `${avgCalories}` : '--'}
          </Text>
          <View style={s.tileBar}>
            <View style={[s.tileBarFill, { width: `${calPct}%`, backgroundColor: statusColor(calPct, true) }]} />
          </View>
          <Text style={s.tileSub}>{calPct}% of {calorieGoal} kcal target</Text>
        </View>

        <View style={s.tile}>
          <Text style={s.tileLabel}>WORKOUTS</Text>
          <Text style={[s.tileValue, { color: statusColor(workoutPct) }]}>
            {workoutsThisWeek} / 5
          </Text>
          <View style={s.tileBar}>
            <View style={[s.tileBarFill, { width: `${workoutPct}%`, backgroundColor: statusColor(workoutPct) }]} />
          </View>
          <Text style={s.tileSub}>this week</Text>
        </View>

        <View style={s.tile}>
          <Text style={s.tileLabel}>AVG DISCIPLINE</Text>
          <Text style={[s.tileValue, { color: statusColor(scorePct) }]}>
            {avgScore != null ? `${avgScore}` : '--'}
          </Text>
          <View style={s.tileBar}>
            <View style={[s.tileBarFill, { width: `${scorePct}%`, backgroundColor: statusColor(scorePct) }]} />
          </View>
          <Text style={s.tileSub}>/ 100 score</Text>
        </View>
      </View>
      {daysLogged > 0 && (
        <Text style={{ ...Typography.caption, color: Colors.muted }}>
          Based on {daysLogged} day{daysLogged !== 1 ? 's' : ''} of logged meals this week
        </Text>
      )}
    </Card>
  );
}

function GoalBar({
  current,
  start,
  goal,
}: {
  current: number;
  start: number;
  goal: number;
}) {
  const Colors = useColors();
  const totalChange = start - goal;
  const achieved = start - current;
  const pct = totalChange > 0 ? Math.min(achieved / totalChange, 1) : 0;

  const gbStyles = React.useMemo(() => StyleSheet.create({
    container: { gap: 8 },
    labels: { flexDirection: 'row', justifyContent: 'space-between' },
    label: { ...Typography.small, color: Colors.secondary },
    track: {
      height: 8,
      backgroundColor: Colors.surface2,
      borderRadius: 4,
      overflow: 'hidden',
    },
    fill: { height: '100%', backgroundColor: Colors.accent, borderRadius: 4 },
    bottom: { flexDirection: 'row', justifyContent: 'space-between' },
    current: { ...Typography.caption, color: Colors.primary, fontWeight: '600' },
    pct: { ...Typography.caption, color: Colors.accent },
  }), [Colors]);

  return (
    <View style={gbStyles.container}>
      <View style={gbStyles.labels}>
        <Text style={gbStyles.label}>Start {start}kg</Text>
        <Text style={[gbStyles.label, { color: Colors.accentGreen }]}>
          Goal {goal}kg
        </Text>
      </View>
      <View style={gbStyles.track}>
        <View style={[gbStyles.fill, { width: `${pct * 100}%` }]} />
      </View>
      <View style={gbStyles.bottom}>
        <Text style={gbStyles.current}>{current}kg current</Text>
        <Text style={gbStyles.pct}>{Math.round(pct * 100)}% to goal</Text>
      </View>
    </View>
  );
}
