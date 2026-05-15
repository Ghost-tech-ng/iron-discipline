import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography } from '../../constants/theme';

interface Props {
  workoutDates: string[];
  weeks?: number;
}

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const CELL = 14;
const GAP = 3;

export function ConsistencyCalendar({ workoutDates, weeks = 12 }: Props) {
  const dateSet = new Set(workoutDates);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Build a grid of weeks x 7 days, ending today
  const totalDays = weeks * 7;
  const endDate = new Date(today);
  // Align end to Saturday (day 6)
  const dayOfWeek = endDate.getDay();
  const daysToAdd = 6 - dayOfWeek;
  endDate.setDate(endDate.getDate() + daysToAdd);

  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - totalDays + 1);

  // Build grid: array of weeks, each week is 7 days
  const grid: { dateStr: string; isFuture: boolean; isWorkout: boolean }[][] = [];
  const cursor = new Date(startDate);

  for (let w = 0; w < weeks; w++) {
    const week: { dateStr: string; isFuture: boolean; isWorkout: boolean }[] = [];
    for (let d = 0; d < 7; d++) {
      const dateStr = cursor.toISOString().split('T')[0];
      const isFuture = cursor > today;
      week.push({ dateStr, isFuture, isWorkout: dateSet.has(dateStr) });
      cursor.setDate(cursor.getDate() + 1);
    }
    grid.push(week);
  }

  const totalWorkouts = workoutDates.filter((d) => {
    const date = new Date(d);
    return date >= startDate && date <= today;
  }).length;

  return (
    <View style={styles.container}>
      {/* Day-of-week headers */}
      <View style={styles.row}>
        <View style={styles.weekSpacer} />
        {DAYS.map((d, i) => (
          <View key={i} style={[styles.cell, { backgroundColor: 'transparent' }]}>
            <Text style={styles.dayHeader}>{d}</Text>
          </View>
        ))}
      </View>

      {/* Grid */}
      {grid.map((week, wi) => {
        const firstDay = week[0].dateStr;
        const d = new Date(firstDay);
        const weekLabel = `W${wi + 1}`;
        return (
          <View key={wi} style={styles.row}>
            <View style={styles.weekSpacer}>
              <Text style={styles.weekLabel}>{wi % 3 === 0 ? weekLabel : ''}</Text>
            </View>
            {week.map(({ dateStr, isFuture, isWorkout }) => (
              <View
                key={dateStr}
                style={[
                  styles.cell,
                  {
                    backgroundColor: isFuture
                      ? 'transparent'
                      : isWorkout
                      ? Colors.accentGreen
                      : Colors.surface2,
                    borderWidth: isFuture ? 0 : 0,
                    opacity: isFuture ? 0.2 : 1,
                  },
                ]}
              />
            ))}
          </View>
        );
      })}

      <Text style={styles.summary}>
        {totalWorkouts} session{totalWorkouts !== 1 ? 's' : ''} in {weeks} weeks
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: GAP },
  row: {
    flexDirection: 'row',
    gap: GAP,
    alignItems: 'center',
  },
  weekSpacer: { width: 24 },
  weekLabel: { fontSize: 8, color: Colors.muted, textAlign: 'right' },
  cell: {
    width: CELL,
    height: CELL,
    borderRadius: 3,
  },
  dayHeader: { fontSize: 8, color: Colors.muted, textAlign: 'center', width: CELL },
  summary: { ...Typography.caption, color: Colors.muted, marginTop: 2 },
});
