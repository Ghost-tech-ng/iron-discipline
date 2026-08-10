import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useColors } from '../../hooks/useColors';
import { Typography } from '../../constants/theme';
import type { WeeklyCheckIn } from '../../types';

/**
 * Waist and chest on one axis, because the thing being tracked is the gap
 * between them. Two lines converging is a bad phase; two lines spreading apart
 * is the taper opening up — which no weight chart can show you.
 */
interface Props {
  checkIns: WeeklyCheckIn[];
  goalWaist: number;
  totalWeeks: number;
}

const PAD = { top: 18, right: 16, bottom: 32, left: 40 };

function bezierPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const cp1x = (points[i - 1].x + points[i].x) / 2;
    d += ` C ${cp1x} ${points[i - 1].y} ${cp1x} ${points[i].y} ${points[i].x} ${points[i].y}`;
  }
  return d;
}

export function WaistChart({ checkIns, goalWaist, totalWeeks }: Props) {
  const Colors = useColors();
  const [width, setWidth] = useState(320);

  const innerW = width - PAD.left - PAD.right;
  const innerH = 140;
  const totalH = innerH + PAD.top + PAD.bottom;

  const sorted = [...checkIns].sort((a, b) => a.week - b.week);
  const waistPts = sorted.filter((c) => typeof c.waistCm === 'number');
  const chestPts = sorted.filter((c) => typeof c.chestCm === 'number');

  const values = [
    goalWaist,
    ...waistPts.map((c) => c.waistCm as number),
    ...chestPts.map((c) => c.chestCm as number),
  ];
  const yMax = Math.max(...values) + 3;
  const yMin = Math.min(...values) - 3;
  const yRange = yMax - yMin || 1;

  const toX = (week: number) =>
    PAD.left + ((week - 1) / Math.max(1, totalWeeks - 1)) * innerW;
  const toY = (cm: number) => PAD.top + (1 - (cm - yMin) / yRange) * innerH;

  const yTicks = Array.from({ length: 4 }, (_, i) => Math.round(yMin + (yRange / 3) * i));
  const xTicks = [1, 6, 11, 16, totalWeeks].filter((w) => w <= totalWeeks);

  const waistLine = bezierPath(waistPts.map((c) => ({ x: toX(c.week), y: toY(c.waistCm as number) })));
  const chestLine = bezierPath(chestPts.map((c) => ({ x: toX(c.week), y: toY(c.chestCm as number) })));

  const areaPath =
    waistPts.length >= 2
      ? `${waistLine} L ${toX(waistPts[waistPts.length - 1].week)} ${PAD.top + innerH} L ${toX(waistPts[0].week)} ${PAD.top + innerH} Z`
      : '';

  const goalY = toY(goalWaist);

  const styles = React.useMemo(() => StyleSheet.create({
    container: { width: '100%' },
    legend: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 4, flexWrap: 'wrap' },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendLine: { width: 16, height: 0, borderTopWidth: 1.5, borderStyle: 'dashed' },
    legendText: { ...Typography.caption, fontSize: 10, color: Colors.muted },
  }), [Colors]);

  return (
    <View style={styles.container} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <Svg width={width} height={totalH}>
        <Defs>
          <LinearGradient id="waistGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={Colors.accentHeat} stopOpacity={0.22} />
            <Stop offset="1" stopColor={Colors.accentHeat} stopOpacity={0} />
          </LinearGradient>
        </Defs>

        {yTicks.map((tick) => (
          <G key={`y${tick}`}>
            <Line
              x1={PAD.left}
              y1={toY(tick)}
              x2={PAD.left + innerW}
              y2={toY(tick)}
              stroke={Colors.border}
              strokeWidth={1}
            />
            <SvgText x={PAD.left - 6} y={toY(tick) + 4} fontSize={9} fill={Colors.muted} textAnchor="end">
              {tick}
            </SvgText>
          </G>
        ))}

        {/* Goal waist */}
        <Line
          x1={PAD.left}
          y1={goalY}
          x2={PAD.left + innerW}
          y2={goalY}
          stroke={Colors.accentGreen}
          strokeWidth={1}
          strokeDasharray="4 4"
        />
        <SvgText x={PAD.left + innerW - 2} y={goalY - 4} fontSize={9} fill={Colors.accentGreen} textAnchor="end">
          GOAL {goalWaist}
        </SvgText>

        {xTicks.map((week) => (
          <SvgText key={`x${week}`} x={toX(week)} y={totalH - 4} fontSize={9} fill={Colors.muted} textAnchor="middle">
            W{week}
          </SvgText>
        ))}

        {areaPath !== '' && <Path d={areaPath} fill="url(#waistGrad)" />}

        {chestLine !== '' && (
          <Path
            d={chestLine}
            stroke={Colors.accent}
            strokeWidth={1.5}
            fill="none"
            strokeDasharray="5 3"
            strokeLinecap="round"
          />
        )}

        {waistLine !== '' && (
          <Path
            d={waistLine}
            stroke={Colors.accentHeat}
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {waistPts.map((c) => (
          <G key={`w${c.week}`}>
            <Circle
              cx={toX(c.week)}
              cy={toY(c.waistCm as number)}
              r={4}
              fill={Colors.base}
              stroke={Colors.accentHeat}
              strokeWidth={2}
            />
            <SvgText
              x={toX(c.week)}
              y={toY(c.waistCm as number) - 8}
              fontSize={9}
              fill={Colors.primary}
              textAnchor="middle"
              fontWeight="600"
            >
              {c.waistCm}
            </SvgText>
          </G>
        ))}

        {waistPts.length === 0 && (
          <SvgText
            x={PAD.left + innerW / 2}
            y={PAD.top + innerH / 2}
            fontSize={11}
            fill={Colors.muted}
            textAnchor="middle"
          >
            No tape measurements yet
          </SvgText>
        )}
      </Svg>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.accentHeat }]} />
          <Text style={styles.legendText}>Waist</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendLine, { borderColor: Colors.accent }]} />
          <Text style={styles.legendText}>Chest</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendLine, { borderColor: Colors.accentGreen }]} />
          <Text style={styles.legendText}>Goal {goalWaist}cm</Text>
        </View>
      </View>
    </View>
  );
}
