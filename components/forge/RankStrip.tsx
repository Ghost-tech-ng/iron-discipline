import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useDisciplineStore } from '../../store/disciplineStore';
import { useColors } from '../../hooks/useColors';
import { Fonts, Radius, Spacing } from '../../constants/theme';
import { getProtocolStatus } from '../../constants/phases';
import { RANKS, computeRank, computeStreak, currentRun, nextRank, type HeatDay } from '../../utils/heat';

/** Compact rank + hallmark streak for screens that don't carry the full HeatCard. */
export function RankStrip({ history }: { history: readonly HeatDay[] }) {
  const C = useColors();
  const score = useDisciplineStore((s) => s.score);
  const ps = getProtocolStatus();
  const rank = computeRank(history, score, ps.isActive && ps.dayNumber >= ps.totalDays);
  const rankIdx = RANKS.findIndex((r) => r.id === rank.id);
  const streak = computeStreak(history);
  const next = nextRank(rank);

  let toward = 'The steel is folded.';
  if (next?.id === 'damascus') toward = 'Finish all 16 weeks for Damascus.';
  else if (next) {
    const run = Math.min(currentRun(history, score, next.minHeat), next.days);
    toward = `${run}/${next.days} days above ${next.minHeat}° to ${next.name}.`;
  }

  const styles = React.useMemo(() => StyleSheet.create({
    card: {
      flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: C.surface,
      borderRadius: Radius.lg, borderWidth: 1, borderColor: C.border, padding: Spacing.md,
    },
    left: { flex: 1, gap: 6 },
    cap: { fontFamily: Fonts.bodyBold, fontSize: 9, letterSpacing: 2.4, color: C.muted },
    rank: { fontFamily: Fonts.display, fontSize: 26, lineHeight: 28, letterSpacing: 1.2, color: C.primary },
    stamps: { flexDirection: 'row', gap: 5 },
    stamp: {
      width: 22, height: 22, borderRadius: 6, borderWidth: 1, borderColor: C.borderLight,
      alignItems: 'center', justifyContent: 'center',
    },
    stampEarned: { backgroundColor: C.accent2, borderColor: C.accent2 },
    stampNow: { backgroundColor: C.accent, borderColor: C.accent },
    stampText: { fontFamily: Fonts.display, fontSize: 11, color: C.dim },
    stampTextEarned: { color: C.base },
    stampTextNow: { color: C.onAccent },
    toward: { fontFamily: Fonts.body, fontSize: 11, color: C.secondary },
    streak: {
      alignItems: 'center', minWidth: 74, paddingVertical: 10, paddingHorizontal: 10, borderRadius: Radius.md,
      borderWidth: 1, borderColor: streak > 0 ? C.accent + '73' : C.border, backgroundColor: C.surface2,
    },
    streakVal: { fontFamily: Fonts.displayBlack, fontSize: 30, lineHeight: 32, color: streak > 0 ? C.accent : C.primary },
    streakCap: { fontFamily: Fonts.bodyBold, fontSize: 8, letterSpacing: 1.6, color: C.secondary },
  }), [C, streak]);

  return (
    <View style={styles.card}>
      <View style={styles.left}>
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
        <Text style={styles.toward}>{toward}</Text>
      </View>
      <View style={styles.streak}>
        <Text style={styles.streakVal}>{streak}</Text>
        <Text style={styles.streakCap}>HALLMARK</Text>
        <Text style={styles.streakCap}>{streak === 1 ? 'DAY' : 'DAYS'}</Text>
      </View>
    </View>
  );
}
