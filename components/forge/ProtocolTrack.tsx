import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Path } from 'react-native-svg';
import { PressableScale } from '../ui/PressableScale';
import { useColors } from '../../hooks/useColors';
import { useUserStore } from '../../store/userStore';
import { useProgressStore } from '../../store/progressStore';
import { Fonts } from '../../constants/theme';
import { PHASES, PROTOCOL_WEEKS, type ProtocolStatus } from '../../constants/phases';

interface ProtocolTrackProps {
  status: ProtocolStatus;
  onRestart: () => void;
}

export function ProtocolTrack({ status, onRestart }: ProtocolTrackProps) {
  const C = useColors();
  const goalKg = useUserStore((s) => s.profile.goalWeightKg);
  const profileKg = useUserStore((s) => s.profile.weightKg);
  const latestKg = useProgressStore((s) => s.latestWeight());
  const nowKg = Math.round(latestKg ?? profileKg);
  const isAttack = status.phase.id === PHASES[0].id;
  const chipColor = status.isDeloadWeek ? C.accent2 : C[status.phase.accent];
  const chipText = status.isDeloadWeek || !isAttack ? C.base : C.onAccent;
  const buildStart = PHASES[1].startWeek;

  const styles = React.useMemo(() => StyleSheet.create({
    segs: { flexDirection: 'row', gap: 3, marginTop: 14 },
    seg: { flex: 1, height: 5, borderRadius: 2, backgroundColor: C.surface2 },
    segBuild: { backgroundColor: C.accent2 + '40' },
    segPast: { backgroundColor: C.accent, opacity: 0.45 },
    segNow: { backgroundColor: C.accent, shadowColor: C.accent, shadowOpacity: 0.9, shadowRadius: 6, shadowOffset: { width: 0, height: 0 }, elevation: 3 },
    line: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 10 },
    chip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingVertical: 5, paddingLeft: 8, paddingRight: 11 },
    chipLabel: { fontFamily: Fonts.bodyHeavy, fontSize: 10, letterSpacing: 2.2 },
    meta: { fontFamily: Fonts.bodyBold, fontSize: 10, letterSpacing: 1.2, color: C.secondary },
    dot: { fontFamily: Fonts.bodyBold, fontSize: 10, color: C.dim },
    restart: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', marginTop: 8, paddingVertical: 2 },
    restartText: { fontFamily: Fonts.bodyBold, fontSize: 10, letterSpacing: 0.8, color: C.muted },
  }), [C]);

  const meta = [`WK ${status.week}/${PROTOCOL_WEEKS}`, isAttack ? 'CUT TO 12%' : 'LEAN BUILD'];
  if (isAttack) meta.push(`${nowKg} → ${goalKg} KG`);

  return (
    <View>
      <View style={styles.segs}>
        {Array.from({ length: PROTOCOL_WEEKS }, (_, i) => {
          const wk = i + 1;
          return (
            <View
              key={wk}
              style={[
                styles.seg,
                wk >= buildStart && styles.segBuild,
                wk < status.week && styles.segPast,
                wk === status.week && styles.segNow,
              ]}
            />
          );
        })}
      </View>
      <View style={styles.line}>
        <View style={[styles.chip, { backgroundColor: chipColor }]}>
          <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={chipText} strokeWidth={2.4}>
            <Circle cx={12} cy={12} r={8} />
            <Circle cx={12} cy={12} r={2.5} fill={chipText} />
            <Path d="M12 1v4M12 19v4M1 12h4M19 12h4" />
          </Svg>
          <Text style={[styles.chipLabel, { color: chipText }]}>
            {status.phase.name.toUpperCase()}{status.isDeloadWeek ? ' · DELOAD' : ''}
          </Text>
        </View>
        {meta.map((m, i) => (
          <React.Fragment key={m}>
            {i > 0 && <Text style={styles.dot}>·</Text>}
            <Text style={styles.meta}>{m}</Text>
          </React.Fragment>
        ))}
      </View>
      <PressableScale style={styles.restart} onPress={onRestart} hitSlop={8}>
        <Ionicons name="refresh" size={12} color={C.muted} />
        <Text style={styles.restartText}>Restart from Day 1</Text>
      </PressableScale>
    </View>
  );
}
