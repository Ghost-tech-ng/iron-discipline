import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { PressableScale } from '../ui/PressableScale';
import { useColors } from '../../hooks/useColors';
import { Fonts, Radius, Spacing } from '../../constants/theme';
import type { WorkoutSession } from '../../types';

interface StrikeCardProps {
  session: WorkoutSession | null;
  done: boolean;
}

export function StrikeCard({ session, done }: StrikeCardProps) {
  const C = useColors();
  const styles = React.useMemo(() => StyleSheet.create({
    card: {
      backgroundColor: C.feature, borderRadius: Radius.xl, overflow: 'hidden',
      padding: Spacing.md, paddingLeft: Spacing.md + 6, minHeight: 150,
    },
    stripe: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, backgroundColor: C.accent },
    plate: { position: 'absolute', right: -34, top: -30, opacity: 0.12 },
    pill: {
      alignSelf: 'flex-start', borderRadius: 999, borderWidth: 1, borderColor: C.onFeature,
      paddingVertical: 3, paddingHorizontal: 9,
    },
    pillText: { fontFamily: Fonts.bodyHeavy, fontSize: 9.5, letterSpacing: 2, color: C.onFeature },
    title: { fontFamily: Fonts.displayBlack, fontSize: 34, lineHeight: 34, color: C.onFeature, marginTop: 10 },
    sub: { fontFamily: Fonts.bodySemi, fontSize: 12, color: C.featureMuted, marginTop: 2 },
    bottom: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: Spacing.md },
    meta: { fontFamily: Fonts.bodyBold, fontSize: 11, letterSpacing: 1.2, color: C.featureMuted },
    go: {
      width: 52, height: 52, borderRadius: 26, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center',
      shadowColor: C.accent, shadowOpacity: 0.5, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4,
    },
    stamp: {
      borderWidth: 2, borderColor: C.accent, borderRadius: 6, paddingVertical: 2, paddingHorizontal: 8,
      transform: [{ rotate: '-8deg' }],
    },
    stampText: { fontFamily: Fonts.displayBlack, fontSize: 18, letterSpacing: 2, color: C.accent },
    restBody: { fontFamily: Fonts.body, fontSize: 13, lineHeight: 19, color: C.featureMuted, marginTop: 6 },
  }), [C]);

  const plate = (
    <Svg width={150} height={150} viewBox="0 0 100 100" style={styles.plate} pointerEvents="none">
      <Circle cx={50} cy={50} r={46} fill="none" stroke={C.onFeature} strokeWidth={6} />
      <Circle cx={50} cy={50} r={30} fill="none" stroke={C.onFeature} strokeWidth={2} />
      <Circle cx={50} cy={50} r={9} fill={C.onFeature} />
    </Svg>
  );

  if (!session) {
    return (
      <View style={styles.card}>
        <View style={styles.stripe} />
        {plate}
        <View style={styles.pill}><Text style={styles.pillText}>REST · RECOVER</Text></View>
        <Text style={styles.title}>QUENCH DAY</Text>
        <Text style={styles.restBody}>Fasted Zone-2 walk, 40 min. Mobility. This is when the growth actually lands.</Text>
      </View>
    );
  }

  const [name, detail] = session.label.split(' — ');
  const sets = session.exercises.reduce((n, e) => n + e.sets, 0);
  const open = () => router.push({ pathname: '/workout/[id]', params: { id: session.type } });

  return (
    <PressableScale onPress={open} scaleTo={0.98}>
      <View style={styles.card}>
        <View style={styles.stripe} />
        {plate}
        <View style={styles.pill}>
          <Text style={styles.pillText}>
            {session.type.toUpperCase()} · {String(session.exercises.length).padStart(2, '0')} EXERCISES
          </Text>
        </View>
        <Text style={styles.title}>{name.toUpperCase()}</Text>
        {detail && <Text style={styles.sub}>{detail}</Text>}
        <View style={styles.bottom}>
          <Text style={styles.meta}>~{sets * 3} MIN · {sets} SETS</Text>
          {done ? (
            <View style={styles.stamp}><Text style={styles.stampText}>DONE</Text></View>
          ) : (
            <View style={styles.go}><Ionicons name="arrow-forward" size={24} color={C.onAccent} /></View>
          )}
        </View>
      </View>
    </PressableScale>
  );
}
