import React from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { Card } from '../../components/ui/Card';
import { PressableScale } from '../../components/ui/PressableScale';
import { useHabitStore } from '../../store/habitStore';
import { useDisciplineStore } from '../../store/disciplineStore';
import { Colors, Spacing, Typography } from '../../constants/theme';

function HabitRow({ id, label, completed, onToggle }: {
  id: string;
  label: string;
  completed: boolean;
  onToggle: () => void;
}) {
  const scale = useSharedValue(1);

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePress() {
    scale.value = withSequence(
      withSpring(1.3, { damping: 10 }),
      withSpring(1, { damping: 12 })
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onToggle();
  }

  return (
    <PressableScale onPress={handlePress}>
      <View style={[habitStyles.row, completed && habitStyles.rowDone]}>
        <Animated.View
          style={[
            habitStyles.checkbox,
            completed && habitStyles.checkboxDone,
            checkStyle,
          ]}
        >
          {completed && <Text style={habitStyles.checkmark}>✓</Text>}
        </Animated.View>
        <Text style={[habitStyles.label, completed && habitStyles.labelDone]}>
          {label}
        </Text>
      </View>
    </PressableScale>
  );
}

export default function HabitsScreen() {
  const { habits, toggleHabit, completionPercent } = useHabitStore();
  const { setSleepLogged, setCardioLogged } = useDisciplineStore();
  const pct = completionPercent();

  function handleToggle(id: string) {
    toggleHabit(id);
    if (id === 'sleep') setSleepLogged(habits.find(h => h.id === 'sleep')?.completed === false);
    if (id === 'cardio') setCardioLogged(habits.find(h => h.id === 'cardio')?.completed === false);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Habits</Text>
        <Text style={styles.subtitle}>Daily non-negotiables</Text>

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

        <Card style={styles.noteCard}>
          <Text style={styles.noteTitle}>Why these habits matter</Text>
          <Text style={styles.noteBody}>
            Each habit has a 20% weight in your Discipline Score. Miss all five = 30 pts off your score, regardless of your workout. Sleep and steps are the two most underestimated factors in body recomposition.
          </Text>
        </Card>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const habitStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: 14,
  },
  rowDone: { opacity: 0.7 },
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
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.base },
  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.md, paddingTop: Spacing.lg, gap: Spacing.md },
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
    marginLeft: 56,
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
});
