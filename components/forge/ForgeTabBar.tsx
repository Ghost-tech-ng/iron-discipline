import React, { useState } from 'react';
import { Platform, View, StyleSheet, Text, Pressable } from 'react-native';
import { router, type Tabs } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useWorkoutStore } from '../../store/workoutStore';
import { useColors } from '../../hooks/useColors';
import { Fonts } from '../../constants/theme';
import { PressableScale } from '../ui/PressableScale';
import { QuickStrikeSheet } from './QuickStrikeSheet';
import { AnvilIcon, BoltIcon, ChartIcon, CheckIcon, DumbbellIcon } from './TabIcons';

type TabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0];

const BAR_H = 64;
const CENTRE = 60;
const BOTTOM = Platform.OS === 'ios' ? 28 : 18;

/** Overlays (the dragon) stand on the bar: its top edge, and how far the centre button rises above it. */
export const TAB_BAR_TOP = BOTTOM + BAR_H;
export const TAB_CENTRE_RISE = CENTRE / 2 - 4;
export const TAB_CENTRE_HALF = CENTRE / 2 + 6;

const LEFT = [
  { name: 'index', title: 'Forge', Icon: AnvilIcon },
  { name: 'workouts', title: 'Train', Icon: DumbbellIcon },
] as const;
const RIGHT = [
  { name: 'progress', title: 'Progress', Icon: ChartIcon },
  { name: 'habits', title: 'Habits', Icon: CheckIcon },
] as const;
type TabDef = (typeof LEFT)[number] | (typeof RIGHT)[number];

export function ForgeTabBar({ state, navigation }: TabBarProps) {
  const C = useColors();
  const [sheetOpen, setSheetOpen] = useState(false);
  const activeSession = useWorkoutStore((s) => s.activeSession);
  const focusedName = state.routes[state.index]?.name;

  const styles = React.useMemo(() => StyleSheet.create({
    outer: { position: 'absolute', bottom: BOTTOM, left: 16, right: 16, gap: 8 },
    banner: {
      flexDirection: 'row', alignItems: 'center', gap: 8, height: 38, paddingHorizontal: 16, borderRadius: 19,
      borderWidth: 1, backgroundColor: C.surface, borderColor: C.accent + '66',
    },
    bannerDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.accent },
    bannerText: { fontFamily: Fonts.bodyBold, fontSize: 12, letterSpacing: 0.3, color: C.accent },
    bar: {
      height: BAR_H, flexDirection: 'row', alignItems: 'center', borderRadius: BAR_H / 2,
      backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
      shadowColor: C.shadow, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.4, shadowRadius: 24, elevation: 18,
    },
    tab: { flex: 1, height: BAR_H, alignItems: 'center', justifyContent: 'center', gap: 3 },
    label: { fontFamily: Fonts.bodyBold, fontSize: 9, letterSpacing: 1, textTransform: 'uppercase' },
    underline: { width: 16, height: 2.5, borderRadius: 2, backgroundColor: C.accent },
    underlineOff: { backgroundColor: 'transparent' },
    centreSlot: { width: CENTRE + 12, alignItems: 'center' },
    centre: {
      width: CENTRE, height: CENTRE, borderRadius: CENTRE / 2, marginTop: -CENTRE / 2 + 4,
      backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center',
      borderWidth: 4, borderColor: C.base,
      shadowColor: C.accent, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.55, shadowRadius: 14, elevation: 10,
    },
  }), [C]);

  const renderTab = (def: TabDef) => {
    const route = state.routes.find((r) => r.name === def.name);
    if (!route) return null;
    const focused = focusedName === def.name;
    const color = focused ? C.accent : C.muted;
    return (
      <Pressable key={def.name} style={styles.tab} onPress={() => { if (!focused) navigation.navigate(route.name as never); }}>
        <def.Icon color={color} />
        <Text style={[styles.label, { color }]}>{def.title}</Text>
        <View style={[styles.underline, !focused && styles.underlineOff]} />
      </Pressable>
    );
  };

  return (
    <View style={styles.outer} pointerEvents="box-none">
      {activeSession && (
        <Pressable
          style={styles.banner}
          onPress={() => router.push({ pathname: '/workout/[id]', params: { id: activeSession.sessionType } })}
        >
          <View style={styles.bannerDot} />
          <Text style={styles.bannerText}>{activeSession.sessionType.toUpperCase()} in session — tap to resume</Text>
        </Pressable>
      )}
      <View style={styles.bar}>
        {LEFT.map(renderTab)}
        <View style={styles.centreSlot}>
          <PressableScale
            style={styles.centre}
            scaleTo={0.9}
            accessibilityLabel="Quick actions"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setSheetOpen(true);
            }}
          >
            <BoltIcon color={C.onAccent} />
          </PressableScale>
        </View>
        {RIGHT.map(renderTab)}
      </View>
      <QuickStrikeSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} />
    </View>
  );
}
