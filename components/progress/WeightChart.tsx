import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText, G, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { Colors, Typography } from '../../constants/theme';
import type { WeeklyCheckIn } from '../../types';

interface Props {
  checkIns: WeeklyCheckIn[];
  startWeight: number;
  goalWeight: number;
}

const PAD = { top: 16, right: 16, bottom: 32, left: 44 };

function bezierPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const cp1x = (points[i - 1].x + points[i].x) / 2;
    d += ` C ${cp1x} ${points[i - 1].y} ${cp1x} ${points[i].y} ${points[i].x} ${points[i].y}`;
  }
  return d;
}

export function WeightChart({ checkIns, startWeight, goalWeight }: Props) {
  const [width, setWidth] = useState(320);

  const innerW = width - PAD.left - PAD.right;
  const innerH = 140;
  const totalH = innerH + PAD.top + PAD.bottom;

  const allWeights = checkIns.map((c) => c.weightKg);
  const yMax = Math.max(startWeight + 1, ...allWeights) + 1;
  const yMin = Math.min(goalWeight - 1, ...allWeights) - 1;
  const yRange = yMax - yMin;

  const totalWeeks = 12;

  function toX(week: number): number {
    return PAD.left + ((week - 1) / (totalWeeks - 1)) * innerW;
  }

  function toY(weight: number): number {
    return PAD.top + (1 - (weight - yMin) / yRange) * innerH;
  }

  // Y axis ticks: 4 evenly spaced
  const yTicks = Array.from({ length: 4 }, (_, i) =>
    Math.round(yMin + (yRange / 3) * i)
  );

  // X axis ticks: weeks 1,3,6,9,12
  const xTicks = [1, 3, 6, 9, 12];

  const dataPoints = checkIns
    .slice()
    .sort((a, b) => a.week - b.week)
    .map((c) => ({ x: toX(c.week), y: toY(c.weightKg), weight: c.weightKg, week: c.week }));

  const linePath = bezierPath(dataPoints);

  // Area fill path (close below the line)
  const areaPath =
    dataPoints.length >= 2
      ? `${linePath} L ${dataPoints[dataPoints.length - 1].x} ${PAD.top + innerH} L ${dataPoints[0].x} ${PAD.top + innerH} Z`
      : '';

  const goalY = toY(goalWeight);
  const startY = toY(startWeight);

  if (width === 0) return null;

  return (
    <View
      style={styles.container}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      <Svg width={width} height={totalH}>
        <Defs>
          <LinearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={Colors.accent} stopOpacity={0.25} />
            <Stop offset="1" stopColor={Colors.accent} stopOpacity={0} />
          </LinearGradient>
        </Defs>

        {/* Horizontal grid lines */}
        {yTicks.map((tick) => (
          <G key={tick}>
            <Line
              x1={PAD.left}
              y1={toY(tick)}
              x2={PAD.left + innerW}
              y2={toY(tick)}
              stroke={Colors.border}
              strokeWidth={1}
            />
            <SvgText
              x={PAD.left - 6}
              y={toY(tick) + 4}
              fontSize={9}
              fill={Colors.muted}
              textAnchor="end"
            >
              {tick}
            </SvgText>
          </G>
        ))}

        {/* Goal line (dashed green) */}
        <Line
          x1={PAD.left}
          y1={goalY}
          x2={PAD.left + innerW}
          y2={goalY}
          stroke={Colors.accentGreen}
          strokeWidth={1}
          strokeDasharray="4 4"
        />
        <SvgText
          x={PAD.left + innerW - 2}
          y={goalY - 4}
          fontSize={9}
          fill={Colors.accentGreen}
          textAnchor="end"
        >
          GOAL
        </SvgText>

        {/* Start line (dashed muted) */}
        <Line
          x1={PAD.left}
          y1={startY}
          x2={PAD.left + innerW}
          y2={startY}
          stroke={Colors.muted}
          strokeWidth={1}
          strokeDasharray="3 3"
        />

        {/* X axis labels */}
        {xTicks.map((week) => (
          <SvgText
            key={week}
            x={toX(week)}
            y={totalH - 4}
            fontSize={9}
            fill={Colors.muted}
            textAnchor="middle"
          >
            W{week}
          </SvgText>
        ))}

        {/* Area fill */}
        {areaPath !== '' && (
          <Path d={areaPath} fill="url(#areaGrad)" />
        )}

        {/* Line */}
        {linePath !== '' && (
          <Path
            d={linePath}
            stroke={Colors.accent}
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Data points */}
        {dataPoints.map((pt) => (
          <G key={pt.week}>
            <Circle cx={pt.x} cy={pt.y} r={4} fill={Colors.base} stroke={Colors.accent} strokeWidth={2} />
            <SvgText
              x={pt.x}
              y={pt.y - 8}
              fontSize={9}
              fill={Colors.primary}
              textAnchor="middle"
              fontWeight="600"
            >
              {pt.weight}
            </SvgText>
          </G>
        ))}

        {/* Empty state axis */}
        {dataPoints.length === 0 && (
          <SvgText
            x={PAD.left + innerW / 2}
            y={PAD.top + innerH / 2}
            fontSize={11}
            fill={Colors.muted}
            textAnchor="middle"
          >
            No weigh-ins yet
          </SvgText>
        )}
      </Svg>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.accent }]} />
          <Text style={styles.legendText}>Weight</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendLine, { borderColor: Colors.accentGreen }]} />
          <Text style={styles.legendText}>Goal {goalWeight}kg</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendLine, { borderColor: Colors.muted }]} />
          <Text style={styles.legendText}>Start {startWeight}kg</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLine: {
    width: 16,
    height: 0,
    borderTopWidth: 1.5,
    borderStyle: 'dashed',
  },
  legendText: {
    fontSize: 10,
    color: Colors.muted,
  },
});
