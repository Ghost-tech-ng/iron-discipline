import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useDisciplineStore } from '../../store/disciplineStore';
import { useColors } from '../../hooks/useColors';
import { Fonts, Radius, Spacing } from '../../constants/theme';
import { getProtocolStatus } from '../../constants/phases';
import { RANKS, computeRank, currentRun, heatDelta, nextRank, type HeatDay, type Rank } from '../../utils/heat';
import { HeatGauge } from './HeatGauge';
import { HeatSources, nextHeatHint, useHeatSources } from './HeatSources';

function rankLine(rank: Rank, history: readonly HeatDay[], score: number): string {
  const next = nextRank(rank);
  if (!next) return 'Damascus. The steel is folded.';
  if (next.id === 'damascus') return 'Finish all 16 weeks to earn Damascus.';
  const run = currentRun(history, score, next.minHeat);
  return `${Math.min(run, next.days)}/${next.days} days above ${next.minHeat}° toward ${next.name}.`;
}

export function HeatCard({ history }: { history: readonly HeatDay[] }) {
  const C = useColors();
  const score = useDisciplineStore((s) => s.score);
  const sources = useHeatSources();
  const ps = getProtocolStatus();
  const rank = computeRank(history, score, ps.isActive && ps.dayNumber >= ps.totalDays);
  const rankIdx = RANKS.findIndex((r) => r.id === rank.id);
  const hint = nextHeatHint(sources, score);

  const styles = React.useMemo(() => StyleSheet.create({
    card: {
      backgroundColor: C.surface,
      borderRadius: Radius.xl,
      borderWidth: 1,
      borderColor: C.border,
      overflow: 'hidden',
      padding: Spacing.md,
      paddingLeft: Spacing.sm,
      gap: Spacing.md,
    },
    glow: {
      position: 'absolute', left: -60, top: -60, width: 240, height: 240, borderRadius: 120,
      backgroundColor: C.accent, opacity: 0.1,
    },
    top: { flexDirection: 'row', alignItems: 'center' },
    rule: { width: 1, alignSelf: 'stretch', marginVertical: 24, marginRight: 14, marginLeft: 4, backgroundColor: C.borderLight },
    side: { flex: 1 },
    cap: { fontFamily: Fonts.bodyBold, fontSize: 9.5, letterSpacing: 2.6, color: C.muted },
    rank: { fontFamily: Fonts.display, fontSize: 32, lineHeight: 32, letterSpacing: 1.5, color: C.primary, marginTop: 4 },
    stamps: { flexDirection: 'row', gap: 5, marginTop: 10 },
    stamp: {
      width: 24, height: 24, borderRadius: 6, borderWidth: 1, borderColor: C.borderLight,
      alignItems: 'center', justifyContent: 'center',
    },
    stampEarned: { backgroundColor: C.accent2, borderColor: C.accent2 },
    stampNow: { backgroundColor: C.accent, borderColor: C.accent },
    stampText: { fontFamily: Fonts.display, fontSize: 12, color: C.dim },
    stampTextEarned: { color: C.base },
    stampTextNow: { color: C.onAccent },
    hint: { fontFamily: Fonts.body, fontSize: 11, lineHeight: 16, color: C.secondary, marginTop: 10 },
    hot: { fontFamily: Fonts.bodyHeavy, color: C.accentHeat },
    sources: { paddingLeft: Spacing.sm },
  }), [C]);

  return (
    <View style={styles.card}>
      <View style={styles.glow} pointerEvents="none" />
      <View style={styles.top}>
        <HeatGauge score={score} delta={heatDelta(history, score)} size={156} />
        <View style={styles.rule} />
        <View style={styles.side}>
          <Text style={styles.cap}>RANK</Text>
          <Text style={styles.rank}>{rank.name.toUpperCase()}</Text>
          <View style={styles.stamps}>
            {RANKS.map((r, i) => (
              <View key={r.id} style={[styles.stamp, i < rankIdx && styles.stampEarned, i === rankIdx && styles.stampNow]}>
                <Text style={[styles.stampText, i < rankIdx && styles.stampTextEarned, i === rankIdx && styles.stampTextNow]}>
                  {r.letter}
                </Text>
              </View>
            ))}
          </View>
          <Text style={styles.hint}>
            {hint ? (
              <>
                {hint.actions} to reach <Text style={styles.hot}>{hint.reach}°</Text>.{' '}
              </>
            ) : (
              'Every source lit. Hold the heat. '
            )}
            {rankLine(rank, history, score)}
          </Text>
        </View>
      </View>
      <View style={styles.sources}>
        <HeatSources sources={sources} />
      </View>
    </View>
  );
}
