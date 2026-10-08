import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing,
} from 'react-native-reanimated';
import { useColors } from '../../hooks/useColors';
import { Fonts, Spacing } from '../../constants/theme';
import { StrikeBar } from './StrikeBar';

interface WorkoutTopBarProps {
  type: string;
  label: string;
  intent?: string;
  meta: string;
  elapsed: string;
  setsDone: number;
  setsTotal: number;
  accentColor: string;
  onMinimize: () => void;
  onOptions: () => void;
  onFinish: () => void;
}

export function WorkoutTopBar(p: WorkoutTopBarProps) {
  const C = useColors();
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.5, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) })
      ),
      -1
    );
  }, []);
  const dotStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  const [name, detail] = p.label.split(' — ');

  const styles = React.useMemo(() => StyleSheet.create({
    bar: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: Spacing.sm, paddingVertical: 8,
    },
    iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    centre: { alignItems: 'center', gap: 3 },
    pill: {
      flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 3,
      borderRadius: 999, backgroundColor: p.accentColor + '22',
    },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: p.accentColor },
    pillText: { fontFamily: Fonts.bodyHeavy, fontSize: 10, letterSpacing: 2, color: p.accentColor },
    elapsed: { fontFamily: Fonts.display, fontSize: 17, letterSpacing: 1, color: C.secondary, fontVariant: ['tabular-nums'] },
    right: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    finish: { paddingVertical: 8, paddingHorizontal: 16, backgroundColor: C.accent, borderRadius: 999 },
    finishText: { fontFamily: Fonts.display, fontSize: 15, letterSpacing: 1.2, color: C.onAccent },
    head: {
      paddingHorizontal: Spacing.md, paddingBottom: Spacing.md, gap: 4,
      borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border,
    },
    title: { fontFamily: Fonts.displayBlack, fontSize: 36, lineHeight: 38, color: C.primary },
    detail: { fontFamily: Fonts.bodyBold, fontSize: 13, color: p.accentColor },
    intent: { fontFamily: Fonts.body, fontSize: 12, lineHeight: 17, color: C.secondary },
    meta: { fontFamily: Fonts.bodyBold, fontSize: 10, letterSpacing: 1.4, color: C.muted, marginBottom: 8 },
  }), [C, p.accentColor]);

  return (
    <View>
      <View style={styles.bar}>
        <Pressable onPress={p.onMinimize} style={styles.iconBtn} hitSlop={6}>
          <Ionicons name="chevron-down" size={24} color={C.muted} />
        </Pressable>
        <View style={styles.centre}>
          <View style={styles.pill}>
            <Animated.View style={[styles.dot, dotStyle]} />
            <Text style={styles.pillText}>{p.type.toUpperCase()}</Text>
          </View>
          <Text style={styles.elapsed}>{p.elapsed}</Text>
        </View>
        <View style={styles.right}>
          <Pressable onPress={p.onOptions} style={styles.iconBtn} hitSlop={6}>
            <Ionicons name="ellipsis-horizontal" size={20} color={C.muted} />
          </Pressable>
          <Pressable onPress={p.onFinish} style={styles.finish}>
            <Text style={styles.finishText}>DONE</Text>
          </Pressable>
        </View>
      </View>
      <View style={styles.head}>
        <Text style={styles.title}>{name.toUpperCase()}</Text>
        {detail ? <Text style={styles.detail}>{detail}</Text> : null}
        {p.intent ? <Text style={styles.intent}>{p.intent}</Text> : null}
        <Text style={styles.meta}>{p.meta}</Text>
        <StrikeBar done={p.setsDone} total={p.setsTotal} />
      </View>
    </View>
  );
}
