import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import Svg, { Path, Rect } from 'react-native-svg';
import { PressableScale } from '../ui/PressableScale';
import { useColors } from '../../hooks/useColors';
import { useUserStore } from '../../store/userStore';
import { Fonts, Spacing } from '../../constants/theme';
import { HALLMARK_HEAT } from '../../utils/heat';

interface ForgeHeaderProps {
  dayNumber: number;
  totalDays: number;
  streak: number;
  score: number;
}

function formatDate(): string {
  const d = new Date();
  const wd = d.toLocaleDateString('en-GB', { weekday: 'short' });
  const mo = d.toLocaleDateString('en-GB', { month: 'short' });
  return `${wd} · ${String(d.getDate()).padStart(2, '0')} ${mo}`.toUpperCase();
}

export function ForgeHeader({ dayNumber, totalDays, streak, score }: ForgeHeaderProps) {
  const C = useColors();
  const name = useUserStore((s) => s.profile.name).split(' ')[0];
  const hallmarked = score >= HALLMARK_HEAT;

  const styles = React.useMemo(() => StyleSheet.create({
    top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    tag: { borderLeftWidth: 2, borderLeftColor: C.accent, paddingLeft: 10 },
    tagText: { fontFamily: Fonts.bodyBold, fontSize: 9, letterSpacing: 2.7, lineHeight: 15, color: C.secondary },
    me: {
      flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: C.surface,
      borderWidth: 1, borderColor: C.border, borderRadius: 16, paddingVertical: 6, paddingLeft: 6, paddingRight: 12,
    },
    avatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontFamily: Fonts.displayBlack, fontSize: 16, color: C.onAccent },
    meKicker: { fontFamily: Fonts.bodySemi, fontSize: 9, color: C.muted },
    meName: { fontFamily: Fonts.bodyBold, fontSize: 12, color: C.primary },
    dayRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: Spacing.md },
    day: { fontFamily: Fonts.displayBlack, fontSize: 54, lineHeight: 54, color: C.primary },
    dayOf: { color: C.accent },
    date: { fontFamily: Fonts.bodyBold, fontSize: 9.5, letterSpacing: 2.6, color: C.muted, marginTop: 6 },
    streak: {
      flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.surface,
      borderWidth: 1, borderColor: hallmarked ? C.accent + '73' : C.border,
      borderRadius: 14, paddingVertical: 7, paddingLeft: 9, paddingRight: 12,
    },
    streakVal: { fontFamily: Fonts.display, fontSize: 20, lineHeight: 20, color: C.primary },
    streakCap: { fontFamily: Fonts.bodyBold, fontSize: 8, letterSpacing: 1.6, color: C.secondary },
  }), [C, hallmarked]);

  return (
    <View>
      <View style={styles.top}>
        <View style={styles.tag}>
          <Text style={styles.tagText}>DISCIPLINE BUILDS{'\n'}THE LIFE YOU WANT.</Text>
        </View>
        <View style={styles.me}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(name[0] ?? 'I').toUpperCase()}</Text>
          </View>
          <View>
            <Text style={styles.meKicker}>Keep going,</Text>
            <Text style={styles.meName}>{name || 'Iron'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.dayRow}>
        <View>
          {dayNumber > 0 ? (
            <Text style={styles.day}>
              DAY {dayNumber} <Text style={styles.dayOf}>/ {totalDays}</Text>
            </Text>
          ) : (
            <Text style={styles.day}>
              DAY <Text style={styles.dayOf}>ZERO</Text>
            </Text>
          )}
          <Text style={styles.date}>{formatDate()}</Text>
        </View>
        <PressableScale style={styles.streak} onPress={() => router.push('/(tabs)/progress')}>
          <Svg width={22} height={22} viewBox="0 0 24 24">
            <Rect x={2.5} y={2.5} width={19} height={19} rx={5} fill={hallmarked ? C.accent : C.surface2} />
            <Path d="M8 16V8l4 5 4-5v8" fill="none" stroke={hallmarked ? C.onAccent : C.muted} strokeWidth={2} strokeLinejoin="round" />
          </Svg>
          <View>
            <Text style={styles.streakVal}>{streak} {streak === 1 ? 'DAY' : 'DAYS'}</Text>
            <Text style={styles.streakCap}>{hallmarked ? 'HALLMARKED' : `HALLMARK AT ${HALLMARK_HEAT}°`}</Text>
          </View>
        </PressableScale>
      </View>
    </View>
  );
}
