import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Card } from '../../components/ui/Card';
import { PressableScale } from '../../components/ui/PressableScale';
import { WEEKLY_SPLIT, SESSION_COLORS } from '../../constants/workouts';
import { loadRecentCompletedDates } from '../../services/workoutService';
import { useColors } from '../../hooks/useColors';
import { NoiseOverlay } from '../../components/ui/NoiseOverlay';
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

function localDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function WorkoutsScreen() {
  const Colors = useColors();
  const todayIndex = new Date().getDay();
  const todayKey = DAYS[todayIndex === 0 ? 6 : todayIndex - 1].key;
  const [missedSessions, setMissedSessions] = useState<{ key: DayOfWeek; label: string; daysAgo: number }[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadRecentCompletedDates(7).then((completed) => {
        const completedDates = new Set(completed.map((c) => c.date));
        const missed: { key: DayOfWeek; label: string; daysAgo: number }[] = [];

        for (let i = 1; i <= 6; i++) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = localDate(d);
          const jsDay = d.getDay();
          const dayKey = DAYS[jsDay === 0 ? 6 : jsDay - 1].key;
          const session = WEEKLY_SPLIT[dayKey];
          if (session && !completedDates.has(dateStr)) {
            missed.push({ key: dayKey, label: DAYS[jsDay === 0 ? 6 : jsDay - 1].label, daysAgo: i });
          }
        }
        setMissedSessions(missed.slice(0, 3));
      });
    }, [])
  );

  const styles = React.useMemo(() => StyleSheet.create({
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
    sectionLabel: {
      ...Typography.label,
      color: Colors.muted,
      letterSpacing: 1.5,
      marginBottom: 2,
    },
    makeupCard: {
      gap: 6,
      borderWidth: 1,
      borderColor: Colors.accentAmber + '60',
      backgroundColor: Colors.accentAmber + '08',
    },
    makeupBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 4,
      backgroundColor: Colors.accentAmber + '25',
    },
    makeupBadgeText: {
      ...Typography.caption,
      color: Colors.accentAmber,
      fontWeight: '700',
      letterSpacing: 0.8,
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
          <Text style={styles.title}>Training</Text>
          <Text style={styles.subtitle}>5-Day PPL · Push / Pull / Legs / Upper / Lower</Text>
        </Animated.View>

        {/* Missed sessions — make up today */}
        {missedSessions.length > 0 && (
          <Animated.View entering={FadeInDown.delay(50).duration(400)} style={{ gap: Spacing.sm }}>
            <Text style={styles.sectionLabel}>MAKE UP A MISSED SESSION</Text>
            {missedSessions.map(({ key, label, daysAgo }) => {
              const session = WEEKLY_SPLIT[key]!;
              const accentColor = SESSION_COLORS[session.type] ?? Colors.accentAmber;
              return (
                <PressableScale
                  key={`makeup_${key}`}
                  onPress={() => {
                    const d = new Date();
                    d.setDate(d.getDate() - daysAgo);
                    router.push({ pathname: '/workout/[id]', params: { id: session.type, makeupDate: localDate(d) } });
                  }}
                >
                  <Card style={styles.makeupCard}>
                    <View style={styles.dayHeader}>
                      <View style={styles.dayLeft}>
                        <Text style={[styles.dayLabel, { color: Colors.accentAmber }]}>{label}</Text>
                        <View style={styles.makeupBadge}>
                          <Text style={styles.makeupBadgeText}>
                            {daysAgo === 1 ? 'YESTERDAY' : `${daysAgo}D AGO`}
                          </Text>
                        </View>
                      </View>
                      <View style={[styles.typeTag, { backgroundColor: accentColor + '15' }]}>
                        <Text style={[styles.typeText, { color: accentColor }]}>
                          {session.type.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.sessionName}>{session.label}</Text>
                    <Text style={styles.exerciseList}>
                      {session.exercises.slice(0, 4).map((e) => e.name).join('  ·  ')}
                      {session.exercises.length > 4 && `  +${session.exercises.length - 4} more`}
                    </Text>
                  </Card>
                </PressableScale>
              );
            })}
          </Animated.View>
        )}

        {DAYS.map(({ key, label }, idx) => {
          const session = WEEKLY_SPLIT[key];
          const isToday = key === todayKey;
          const accentColor = session
            ? SESSION_COLORS[session.type] ?? Colors.accent
            : Colors.muted;

          return (
            <Animated.View key={key} entering={FadeInDown.delay(idx * 70).duration(400)}>
            <PressableScale
              onPress={() => {
                if (session) router.push({ pathname: '/workout/[id]', params: { id: session.type } });
              }}
            >
              <Card
                style={[
                  styles.dayCard,
                  isToday ? { borderColor: accentColor, backgroundColor: accentColor + '08' } : null,
                ]}
                accentColor={isToday && session ? accentColor : undefined}
                glow={isToday && session ? accentColor : undefined}
              >
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
            </Animated.View>
          );
        })}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
