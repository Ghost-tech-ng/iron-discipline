import React from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { Card } from '../../components/ui/Card';
import { PressableScale } from '../../components/ui/PressableScale';
import { WEEKLY_SPLIT, SESSION_COLORS } from '../../constants/workouts';
import { Colors, Spacing, Typography } from '../../constants/theme';
import type { DayOfWeek } from '../../types';

const DAYS: { key: DayOfWeek; label: string }[] = [
  { key: 'monday', label: 'Mon' },
  { key: 'tuesday', label: 'Tue' },
  { key: 'wednesday', label: 'Wed' },
  { key: 'thursday', label: 'Thu' },
  { key: 'friday', label: 'Fri' },
  { key: 'saturday', label: 'Sat' },
  { key: 'sunday', label: 'Sun' },
];

export default function WorkoutsScreen() {
  const todayIndex = new Date().getDay();
  const todayKey = DAYS[todayIndex === 0 ? 6 : todayIndex - 1].key;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Training</Text>
        <Text style={styles.subtitle}>5-Day PPL · Push / Pull / Legs / Upper / Lower</Text>

        {DAYS.map(({ key, label }) => {
          const session = WEEKLY_SPLIT[key];
          const isToday = key === todayKey;
          const accentColor = session
            ? SESSION_COLORS[session.type] ?? Colors.accent
            : Colors.muted;

          return (
            <PressableScale
              key={key}
              onPress={() => {
                if (session) router.push({ pathname: '/workout/[id]', params: { id: session.type } });
              }}
            >
              <Card style={[styles.dayCard, isToday ? { borderColor: accentColor } : null]}>
                <View style={styles.dayHeader}>
                  <View style={styles.dayLeft}>
                    <Text style={[styles.dayLabel, isToday ? { color: accentColor } : null]}>
                      {label}
                    </Text>
                    {isToday && (
                      <View style={[styles.todayPill, { backgroundColor: accentColor + '20' }]}>
                        <Text style={[styles.todayText, { color: accentColor }]}>TODAY</Text>
                      </View>
                    )}
                  </View>

                  {session ? (
                    <View style={styles.dayRight}>
                      <View style={[styles.typeTag, { backgroundColor: accentColor + '15' }]}>
                        <Text style={[styles.typeText, { color: accentColor }]}>
                          {session.type.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <Text style={styles.restText}>Rest</Text>
                  )}
                </View>

                {session && (
                  <>
                    <Text style={styles.sessionName}>{session.label}</Text>
                    <Text style={styles.exerciseList}>
                      {session.exercises
                        .slice(0, 4)
                        .map((e) => e.name)
                        .join('  ·  ')}
                      {session.exercises.length > 4 && `  +${session.exercises.length - 4} more`}
                    </Text>
                  </>
                )}
              </Card>
            </PressableScale>
          );
        })}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.base },
  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.md, paddingTop: Spacing.lg, gap: Spacing.sm },
  title: {
    ...Typography.h1,
    color: Colors.primary,
    fontWeight: '700',
    letterSpacing: -1,
  },
  subtitle: {
    ...Typography.small,
    color: Colors.muted,
    marginBottom: Spacing.sm,
    letterSpacing: 0.2,
  },
  dayCard: {
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dayLabel: {
    ...Typography.h4,
    color: Colors.secondary,
    fontWeight: '600',
    width: 34,
  },
  todayPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  todayText: {
    ...Typography.caption,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  dayRight: {},
  typeTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeText: {
    ...Typography.caption,
    fontWeight: '700',
    letterSpacing: 1,
  },
  restText: {
    ...Typography.small,
    color: Colors.muted,
    fontStyle: 'italic',
  },
  sessionName: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  exerciseList: {
    ...Typography.caption,
    color: Colors.muted,
    lineHeight: 16,
  },
});
