import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { router, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PressableScale } from '../ui/PressableScale';
import { useColors } from '../../hooks/useColors';
import { Fonts, Radius, Spacing } from '../../constants/theme';
import { WEEKLY_SPLIT } from '../../constants/workouts';
import { mondayIndex } from '../../constants/phases';
import type { DayOfWeek } from '../../types';

const DAY_NAMES: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

interface QuickAction {
  key: string;
  label: string;
  sub: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  href: Href;
}

function buildActions(): QuickAction[] {
  const session = WEEKLY_SPLIT[DAY_NAMES[mondayIndex()]];
  return [
    session
      ? { key: 'strike', label: 'Start workout', sub: session.label.split(' — ')[0], icon: 'barbell', href: { pathname: '/workout/[id]', params: { id: session.type } } }
      : { key: 'strike', label: 'Start workout', sub: 'Rest day — pick a session', icon: 'barbell', href: '/(tabs)/workouts' },
    { key: 'meal', label: 'Log meal', sub: 'Photo, search or manual', icon: 'restaurant', href: '/meal/log' },
    { key: 'weigh', label: 'Weigh-in', sub: 'Morning scale reading', icon: 'scale', href: '/progress/weigh-in' },
    { key: 'fuel', label: 'Fuel & water', sub: 'Macros, water, supplements', icon: 'water', href: '/(tabs)/nutrition' },
  ];
}

interface QuickStrikeSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function QuickStrikeSheet({ visible, onClose }: QuickStrikeSheetProps) {
  const C = useColors();
  const styles = React.useMemo(() => StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: C.base + 'CC', justifyContent: 'flex-end' },
    sheet: {
      backgroundColor: C.surface, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl,
      borderWidth: 1, borderColor: C.border, padding: Spacing.md, paddingBottom: Spacing.xl + Spacing.md, gap: Spacing.sm,
    },
    grab: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: C.borderLight, marginBottom: Spacing.sm },
    title: { fontFamily: Fonts.display, fontSize: 22, letterSpacing: 1.5, color: C.primary, marginBottom: 4 },
    row: {
      flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: C.surface2,
      borderRadius: Radius.lg, paddingVertical: 14, paddingHorizontal: 14,
    },
    icon: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' },
    text: { flex: 1 },
    label: { fontFamily: Fonts.bodyBold, fontSize: 15, color: C.primary },
    sub: { fontFamily: Fonts.body, fontSize: 12, color: C.muted, marginTop: 1 },
  }), [C]);

  const go = (href: Href) => {
    onClose();
    router.push(href);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.grab} />
          <Text style={styles.title}>QUICK STRIKE</Text>
          {buildActions().map((a) => (
            <PressableScale key={a.key} style={styles.row} onPress={() => go(a.href)} scaleTo={0.98}>
              <View style={styles.icon}><Ionicons name={a.icon} size={20} color={C.onAccent} /></View>
              <View style={styles.text}>
                <Text style={styles.label}>{a.label}</Text>
                <Text style={styles.sub}>{a.sub}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={C.muted} />
            </PressableScale>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
