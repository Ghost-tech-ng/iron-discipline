import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useColors } from '../../hooks/useColors';
import { Typography } from '../../constants/theme';

interface DataPoint {
  date: string;
  weight: number;
  reps: number;
}

interface Exercise {
  id: string;
  label: string;
}

interface Props {
  exercises: Exercise[];
  data: Record<string, DataPoint[]>;
}

const PAD = { top: 16, right: 16, bottom: 28, left: 40 };
const INNER_H = 100;

function bezierPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const cp1x = (points[i - 1].x + points[i].x) / 2;
    d += ` C ${cp1x} ${points[i - 1].y} ${cp1x} ${points[i].y} ${points[i].x} ${points[i].y}`;
  }
  return d;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

export function StrengthChart({ exercises, data }: Props) {
  const Colors = useColors();
  const [selected, setSelected] = useState(exercises[0]?.id ?? '');
  const [width, setWidth] = useState(320);

  const points = data[selected] ?? [];
  const innerW = width - PAD.left - PAD.right;
  const totalH = INNER_H + PAD.top + PAD.bottom;

  const weights = points.map((p) => p.weight);
  const yMax = weights.length > 0 ? Math.max(...weights) + 5 : 100;
  const yMin = weights.length > 0 ? Math.max(0, Math.min(...weights) - 5) : 0;
  const yRange = yMax - yMin || 1;

  function toX(i: number): number {
    return PAD.left + (i / Math.max(points.length - 1, 1)) * innerW;
  }
  function toY(w: number): number {
    return PAD.top + (1 - (w - yMin) / yRange) * INNER_H;
  }

  const svgPoints = points.map((p, i) => ({ x: toX(i), y: toY(p.weight) }));
  const linePath = bezierPath(svgPoints);
  const areaPath =
    svgPoints.length >= 2
      ? `${linePath} L ${svgPoints[svgPoints.length - 1].x} ${PAD.top + INNER_H} L ${svgPoints[0].x} ${PAD.top + INNER_H} Z`
      : '';

  const yTicks = [yMin, Math.round((yMin + yMax) / 2), yMax];

  const styles = React.useMemo(() => StyleSheet.create({
    container: { gap: 10 },
    tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    tab: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 6,
      backgroundColor: Colors.surface2,
    },
    tabActive: { backgroundColor: Colors.accent },
    tabText: { fontSize: 11, fontWeight: '600', color: Colors.muted },
    tabTextActive: { color: Colors.base },
    empty: { alignItems: 'center', justifyContent: 'center' },
    emptyText: { ...Typography.small, color: Colors.muted },
    delta: { ...Typography.small, fontWeight: '700', textAlign: 'center' },
  }), [Colors]);

  return (
    <View style={styles.container}>
      {/* Exercise selector */}
      <View style={styles.tabs}>
        {exercises.map((ex) => (
          <Pressable
            key={ex.id}
            style={[styles.tab, selected === ex.id && styles.tabActive]}
            onPress={() => setSelected(ex.id)}
          >
            <Text style={[styles.tabText, selected === ex.id && styles.tabTextActive]}>
              {ex.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {points.length < 2 ? (
          <View style={[styles.empty, { height: totalH }]}>
            <Text style={styles.emptyText}>Log 2+ sessions to see trend</Text>
          </View>
        ) : (
          <Svg width={width} height={totalH}>
            <Defs>
              <LinearGradient id="strGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={Colors.accent} stopOpacity={0.2} />
                <Stop offset="1" stopColor={Colors.accent} stopOpacity={0} />
              </LinearGradient>
            </Defs>

            {yTicks.map((tick) => (
              <G key={tick}>
                <Line
                  x1={PAD.left} y1={toY(tick)}
                  x2={PAD.left + innerW} y2={toY(tick)}
                  stroke={Colors.border} strokeWidth={1}
                />
                <SvgText x={PAD.left - 4} y={toY(tick) + 4} fontSize={9} fill={Colors.muted} textAnchor="end">
                  {tick}
                </SvgText>
              </G>
            ))}

            {areaPath !== '' && <Path d={areaPath} fill="url(#strGrad)" />}
            {linePath !== '' && (
              <Path d={linePath} stroke={Colors.accent} strokeWidth={2} fill="none" strokeLinecap="round" />
            )}

            {svgPoints.map((pt, i) => (
              <G key={i}>
                <Circle cx={pt.x} cy={pt.y} r={3} fill={Colors.base} stroke={Colors.accent} strokeWidth={2} />
                {i === svgPoints.length - 1 && (
                  <SvgText x={pt.x} y={pt.y - 7} fontSize={9} fill={Colors.primary} textAnchor="middle" fontWeight="600">
                    {points[i].weight}kg
                  </SvgText>
                )}
              </G>
            ))}

            {/* X-axis: first and last dates */}
            <SvgText x={svgPoints[0].x} y={totalH - 4} fontSize={9} fill={Colors.muted} textAnchor="middle">
              {formatDate(points[0].date)}
            </SvgText>
            {points.length > 1 && (
              <SvgText
                x={svgPoints[svgPoints.length - 1].x}
                y={totalH - 4}
                fontSize={9}
                fill={Colors.muted}
                textAnchor="middle"
              >
                {formatDate(points[points.length - 1].date)}
              </SvgText>
            )}
          </Svg>
        )}
      </View>

      {points.length >= 2 && (() => {
        const first = points[0].weight;
        const last = points[points.length - 1].weight;
        const diff = last - first;
        return (
          <Text style={[styles.delta, { color: diff >= 0 ? Colors.accentGreen : Colors.accentRed }]}>
            {diff >= 0 ? '+' : ''}{diff.toFixed(1)}kg from first session
          </Text>
        );
      })()}
    </View>
  );
}
