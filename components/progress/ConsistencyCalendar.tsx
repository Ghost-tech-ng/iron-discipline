import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '../../hooks/useColors';
import { Typography } from '../../constants/theme';

interface Props {
  workoutDates: string[];
  weeks?: number;
}

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const CELL = 14;
const GAP = 3;

function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function startOfWeek(d: Date): Date {
  // Sunday-start: back up to the Sunday of that week
  const result = new Date(d);
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() - result.getDay());
  return result;
}

export function ConsistencyCalendar({ workoutDates, weeks = 12 }: Props) {
  const Colors = useColors();
  const dateSet = new Set(workoutDates);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = localDateStr(today);

  // Start from the Sunday of the earliest workout week (or 12 weeks ago max)
  const sorted = [...workoutDates].sort();
  const fallbackStart = new Date(today);
  fallbackStart.setDate(fallbackStart.getDate() - (weeks - 1) * 7);

  const firstWorkoutDate = sorted.length > 0 ? new Date(sorted[0] + 'T00:00:00') : today;
  const gridStart = startOfWeek(
    firstWorkoutDate < fallbackStart ? fallbackStart : firstWorkoutDate
  );

  // End = Saturday of current week
  const gridEnd = new Date(today);
  gridEnd.setDate(gridEnd.getDate() + (6 - gridEnd.getDay()));

  // Build weeks from gridStart → gridEnd (oldest first = W1 at top)
  const grid: { dateStr: string; isFuture: boolean; isWorkout: boolean }[][] = [];
  const cursor = new Date(gridStart);

  while (cursor <= gridEnd) {
    const week: { dateStr: string; isFuture: boolean; isWorkout: boolean }[] = [];
    for (let d = 0; d < 7; d++) {
      const dateStr = localDateStr(cursor);
      week.push({ dateStr, isFuture: cursor > today, isWorkout: dateSet.has(dateStr) });
      cursor.setDate(cursor.getDate() + 1);
    }
    grid.push(week);
  }

  const totalWorkouts = workoutDates.filter((d) => d >= localDateStr(gridStart) && d <= todayStr).length;
  const totalWeeks = grid.length;

  const styles = React.useMemo(() => StyleSheet.create({
    container: { gap: GAP },
    row: { flexDirection: 'row', gap: GAP, alignItems: 'center' },
    weekSpacer: { width: 24 },
    weekLabel: { fontSize: 8, color: Colors.muted, textAlign: 'right' },
    cell: { width: CELL, height: CELL, borderRadius: 3 },
    dayHeader: { fontSize: 8, color: Colors.muted, textAlign: 'center', width: CELL },
    summary: { ...Typography.caption, color: Colors.muted, marginTop: 2 },
  }), [Colors]);

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

      {/* W1 = oldest (top), most recent week at bottom */}
      {grid.map((week, wi) => {
        const weekNum = wi + 1;
        return (
          <View key={wi} style={styles.row}>
            <View style={styles.weekSpacer}>
              <Text style={styles.weekLabel}>{wi % 3 === 0 ? `W${weekNum}` : ''}</Text>
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
                    opacity: isFuture ? 0.2 : 1,
                  },
                ]}
              />
            ))}
          </View>
        );
      })}

      <Text style={styles.summary}>
        {totalWorkouts} session{totalWorkouts !== 1 ? 's' : ''} in {totalWeeks} week{totalWeeks !== 1 ? 's' : ''}
      </Text>
    </View>
  );
}
