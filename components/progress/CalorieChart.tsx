import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';
import { Colors, Typography } from '../../constants/theme';

interface DayCalories {
  date: string;
  calories: number;
}

interface Props {
  history: DayCalories[];
  target: number;
}

const BAR_W = 8;
const BAR_GAP = 3;
const CHART_H = 80;
const PAD_TOP = 12;
const PAD_BOTTOM = 16;
const TOTAL_H = CHART_H + PAD_TOP + PAD_BOTTOM;

function barColor(calories: number, target: number): string {
  if (calories === 0) return Colors.surface2;
  const ratio = calories / target;
  if (ratio >= 0.9 && ratio <= 1.1) return Colors.accentGreen;
  if (ratio < 0.9) return Colors.accent;
  return Colors.accentRed;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

export function CalorieChart({ history, target }: Props) {
  if (history.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No calorie data yet</Text>
      </View>
    );
  }

  const maxCal = Math.max(target * 1.2, ...history.map((d) => d.calories));
  const targetY = PAD_TOP + (1 - target / maxCal) * CHART_H;
  const totalWidth = history.length * (BAR_W + BAR_GAP) + 40;

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 8 }}
      >
        <Svg width={Math.max(totalWidth, 280)} height={TOTAL_H}>
          {/* Target line */}
          <Line
            x1={0} y1={targetY}
            x2={totalWidth} y2={targetY}
            stroke={Colors.accentAmber}
            strokeWidth={1}
            strokeDasharray="4 3"
          />
          <SvgText x={4} y={targetY - 3} fontSize={8} fill={Colors.accentAmber}>
            {target}
          </SvgText>

          {history.map((day, i) => {
            const x = i * (BAR_W + BAR_GAP) + 20;
            const barH = day.calories > 0
              ? Math.max(2, Math.round((day.calories / maxCal) * CHART_H))
              : 2;
            const y = PAD_TOP + CHART_H - barH;
            const color = barColor(day.calories, target);
            const isLastOrEvery5 = i === history.length - 1 || i % 5 === 0;

            return (
              <React.Fragment key={day.date}>
                <Rect x={x} y={y} width={BAR_W} height={barH} fill={color} rx={2} />
                {isLastOrEvery5 && (
                  <SvgText
                    x={x + BAR_W / 2}
                    y={TOTAL_H - 2}
                    fontSize={8}
                    fill={Colors.muted}
                    textAnchor="middle"
                  >
                    {formatDate(day.date)}
                  </SvgText>
                )}
              </React.Fragment>
            );
          })}
        </Svg>
      </ScrollView>

      {/* Legend */}
      <View style={styles.legend}>
        {[
          { color: Colors.accentGreen, label: '±10% target' },
          { color: Colors.accent, label: 'Under' },
          { color: Colors.accentRed, label: 'Over' },
          { color: Colors.accentAmber, label: `Target ${target} kcal`, dashed: true },
        ].map(({ color, label, dashed }) => (
          <View key={label} style={styles.legendItem}>
            {dashed
              ? <View style={[styles.legendLine, { borderColor: color }]} />
              : <View style={[styles.legendDot, { backgroundColor: color }]} />
            }
            <Text style={styles.legendText}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  empty: { height: 80, alignItems: 'center', justifyContent: 'center' },
  emptyText: { ...Typography.small, color: Colors.muted },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 2 },
  legendLine: { width: 16, height: 0, borderTopWidth: 1.5, borderStyle: 'dashed' },
  legendText: { fontSize: 10, color: Colors.muted },
});
