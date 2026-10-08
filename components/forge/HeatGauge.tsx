import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { useColors } from '../../hooks/useColors';
import { Fonts } from '../../constants/theme';

// A 270° pyrometer dial on a 160×160 box, opening at the bottom.
const CX = 80;
const ARC_R = 62;
const TICK_R = 74;
const START_DEG = 135;
const SWEEP_DEG = 270;
const ARC_LEN = (ARC_R * Math.PI * SWEEP_DEG) / 180;
const VALUE_ARC = 'M36.16 123.84A62 62 0 1 1 123.84 123.84';
const TICK_ARC = 'M27.67 132.33A74 74 0 1 1 132.33 132.33';

interface HeatGaugeProps {
  score: number;
  delta: number | null;
  size?: number;
}

export function HeatGauge({ score, delta, size = 160 }: HeatGaugeProps) {
  const C = useColors();
  const pct = Math.min(Math.max(score, 0), 100) / 100;
  const knobRad = ((START_DEG + SWEEP_DEG * pct) * Math.PI) / 180;
  const knobX = CX + ARC_R * Math.cos(knobRad);
  const knobY = CX + ARC_R * Math.sin(knobRad);
  const filled = `${(ARC_LEN * pct).toFixed(1)} 400`;

  const styles = React.useMemo(() => StyleSheet.create({
    wrap: { width: size, height: size },
    center: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center', paddingTop: 6 },
    scoreRow: { flexDirection: 'row', alignItems: 'flex-start' },
    score: {
      fontFamily: Fonts.displayBlack,
      fontSize: size * 0.37,
      lineHeight: size * 0.37,
      color: C.primary,
      textShadowColor: C.accent,
      textShadowRadius: 18,
    },
    deg: { fontFamily: Fonts.displayBlack, fontSize: size * 0.16, color: C.accent, marginTop: 2 },
    label: { fontFamily: Fonts.bodyBold, fontSize: 9.5, letterSpacing: 3.2, color: C.primary, marginTop: 4 },
    delta: { fontFamily: Fonts.bodyHeavy, fontSize: 10, color: C.accentHeat, marginTop: 4 },
    deltaCold: { color: C.accent2 },
  }), [C, size]);

  return (
    <View style={styles.wrap}>
      <Svg width={size} height={size} viewBox="0 0 160 160">
        <Defs>
          <LinearGradient id="heat" x1="0" y1="1" x2="1" y2="0">
            <Stop offset="0" stopColor={C.accent2} />
            <Stop offset="0.5" stopColor={C.accent} />
            <Stop offset="1" stopColor={C.heatPeak} />
          </LinearGradient>
        </Defs>
        <Path d={TICK_ARC} fill="none" stroke={C.dim} strokeWidth={5} strokeDasharray="1.2 11.715" />
        <Path d={TICK_ARC} fill="none" stroke={C.secondary} strokeWidth={8} strokeDasharray="1.8 62.775" />
        <Path d={VALUE_ARC} fill="none" stroke={C.surface2} strokeWidth={10} strokeLinecap="round" />
        {pct > 0 && (
          <>
            <Path d={VALUE_ARC} fill="none" stroke={C.accent} strokeOpacity={0.22} strokeWidth={20} strokeLinecap="round" strokeDasharray={filled} />
            <Path d={VALUE_ARC} fill="none" stroke="url(#heat)" strokeWidth={10} strokeLinecap="round" strokeDasharray={filled} />
            <Circle cx={knobX} cy={knobY} r={10} fill={C.heatPeak} fillOpacity={0.25} />
            <Circle cx={knobX} cy={knobY} r={6.5} fill={C.heatPeak} />
          </>
        )}
      </Svg>
      <View style={styles.center} pointerEvents="none">
        <View style={styles.scoreRow}>
          <Text style={styles.score}>{score}</Text>
          <Text style={styles.deg}>°</Text>
        </View>
        <Text style={styles.label}>HEAT</Text>
        {delta !== null && delta !== 0 && (
          <Text style={[styles.delta, delta < 0 && styles.deltaCold]}>
            {delta > 0 ? '▲' : '▼'} {Math.abs(delta)}° vs yday
          </Text>
        )}
      </View>
    </View>
  );
}
