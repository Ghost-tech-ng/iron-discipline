import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Colors, Typography } from '../../constants/theme';

interface DayScore {
  date: string;
  score: number;
}

interface Props {
  history: DayScore[];
}

type Range = '7D' | '28D' | '90D';

const DAYS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const BAR_H = 64;

function getRange(range: Range): { label: string; dateStr: string }[] {
  const days = range === '7D' ? 7 : range === '28D' ? 28 : 90;
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    result.push({
      label: range === '90D'
        ? (i % 7 === 0 ? `W${Math.floor((days - 1 - i) / 7) + 1}` : '')
        : DAYS_SHORT[d.getDay()],
      dateStr: d.toISOString().split('T')[0],
    });
  }
  return result;
}

function scoreColor(score: number): string {
  if (score >= 80) return Colors.accentGreen;
  if (score >= 50) return Colors.accent;
  if (score > 0) return Colors.accentAmber;
  return Colors.surface2;
}

export function ScoreChart({ history }: Props) {
  const [range, setRange] = useState<Range>('28D');

  const scoreMap: Record<string, number> = {};
  history.forEach((d) => { scoreMap[d.date] = d.score; });

  const today = new Date().toISOString().split('T')[0];
  const days = getRange(range);

  const scores = days.map((d) => scoreMap[d.dateStr] ?? 0);
  const avg = scores.filter((s) => s > 0).length > 0
    ? Math.round(scores.filter((s) => s > 0).reduce((a, b) => a + b, 0) / scores.filter((s) => s > 0).length)
    : 0;

  const barWidth = range === '7D' ? 32 : range === '28D' ? 10 : 6;
  const barGap = range === '7D' ? 6 : range === '28D' ? 3 : 2;

  return (
    <View style={styles.container}>
      {/* Range tabs + avg */}
      <View style={styles.header}>
        <View style={styles.tabs}>
          {(['7D', '28D', '90D'] as Range[]).map((r) => (
            <Pressable
              key={r}
              style={[styles.tab, range === r && styles.tabActive]}
              onPress={() => setRange(r)}
            >
              <Text style={[styles.tabText, range === r && styles.tabTextActive]}>{r}</Text>
            </Pressable>
          ))}
        </View>
        {avg > 0 && (
          <Text style={[styles.avg, { color: scoreColor(avg) }]}>
            avg {avg}
          </Text>
        )}
      </View>

      {/* Bars */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.barsScroll, { gap: barGap }]}
      >
        {days.map(({ dateStr, label }) => {
          const score = scoreMap[dateStr] ?? 0;
          const barH = score > 0 ? Math.max(3, Math.round((score / 100) * BAR_H)) : 3;
          const isToday = dateStr === today;
          const color = isToday && score === 0 ? Colors.border : scoreColor(score);

          return (
            <View key={dateStr} style={[styles.bar, { width: barWidth }]}>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      height: barH,
                      backgroundColor: color,
                      opacity: isToday && score === 0 ? 1 : 1,
                    },
                  ]}
                />
              </View>
              {label !== '' && (
                <Text
                  style={[
                    styles.dayLabel,
                    isToday && { color: Colors.accent, fontWeight: '700' },
                    range === '90D' && { fontSize: 8 },
                  ]}
                  numberOfLines={1}
                >
                  {label}
                </Text>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Score legend */}
      <View style={styles.legend}>
        {[
          { color: Colors.accentGreen, label: '≥80' },
          { color: Colors.accent, label: '≥50' },
          { color: Colors.accentAmber, label: '>0' },
          { color: Colors.surface2, label: 'missed' },
        ].map(({ color, label }) => (
          <View key={label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: color, borderWidth: color === Colors.surface2 ? 1 : 0, borderColor: Colors.border }]} />
            <Text style={styles.legendText}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.surface2,
    borderRadius: 8,
    padding: 2,
    gap: 2,
  },
  tab: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tabActive: {
    backgroundColor: Colors.surface,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.muted,
  },
  tabTextActive: {
    color: Colors.primary,
  },
  avg: {
    fontSize: 12,
    fontWeight: '700',
  },
  barsScroll: {
    alignItems: 'flex-end',
    paddingBottom: 2,
    minWidth: '100%',
  },
  bar: {
    alignItems: 'center',
    gap: 3,
  },
  barTrack: {
    height: BAR_H,
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    borderRadius: 3,
    minHeight: 3,
  },
  dayLabel: {
    fontSize: 9,
    color: Colors.muted,
    textAlign: 'center',
  },
  legend: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 10,
    color: Colors.muted,
  },
});
