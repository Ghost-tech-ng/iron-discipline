import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useColors } from '../../hooks/useColors';
import { STAGE_ORDER, type DragonStage } from '../../utils/dragon';
import { DragonBody, DragonWing, WING_PIVOT, dragonPalette } from './DragonArt';

/** A floating dragon that cycles through every stage — the onboarding preview of what it becomes. */
export function DragonHero({ size }: { size: number }) {
  const C = useColors();
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(reduced ? 2 : 0);
  const stage: DragonStage = STAGE_ORDER[index];
  const p = useMemo(() => dragonPalette(C, stage), [C, stage]);
  const bob = useSharedValue(0);
  const flap = useSharedValue(0);
  const pop = useSharedValue(1);

  useEffect(() => {
    if (reduced) return;
    bob.value = withRepeat(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.sin) }), -1, true);
    flap.value = withRepeat(withSequence(withTiming(-34, { duration: 160 }), withTiming(8, { duration: 160 })), -1, false);
    const interval = setInterval(() => setIndex((i) => (i + 1) % STAGE_ORDER.length), 1800);
    return () => clearInterval(interval);
  }, [reduced, bob, flap]);

  useEffect(() => {
    if (reduced) return;
    pop.value = withSequence(withTiming(0.8, { duration: 90 }), withTiming(1.1, { duration: 160 }), withTiming(1, { duration: 200 }));
  }, [stage, reduced, pop]);

  const body = useAnimatedStyle(() => ({
    transform: [{ translateY: -bob.value * 10 }, { scale: pop.value }],
  }));
  const wing = useAnimatedStyle(() => ({ transform: [{ rotate: `${flap.value}deg` }] }));
  const shadow = useAnimatedStyle(() => ({ transform: [{ scaleX: 1 - bob.value * 0.2 }], opacity: 0.25 - bob.value * 0.1 }));
  const pivot = WING_PIVOT[stage];

  return (
    <View style={{ width: size, height: size + 14, alignItems: 'center' }}>
      <Animated.View style={[{ width: size, height: size, transformOrigin: '50% 80%' }, body]}>
        <DragonBody stage={stage} eyes="open" crack={0.9} p={p} />
        <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: `${pivot.x * 100}% ${pivot.y * 100}%` }, wing]}>
          <DragonWing stage={stage} p={p} />
        </Animated.View>
      </Animated.View>
      <Animated.View style={[{ width: size * 0.5, height: 8, borderRadius: 4, backgroundColor: C.shadow, marginTop: 4 }, shadow]} />
    </View>
  );
}
