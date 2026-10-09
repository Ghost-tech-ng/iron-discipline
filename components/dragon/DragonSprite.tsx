import React, { useEffect, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useColors } from '../../hooks/useColors';
import { Fonts } from '../../constants/theme';
import type { DragonMotion } from '../../hooks/useDragonBrain';
import type { DragonMood, DragonStage } from '../../utils/dragon';
import { DragonBody, DragonWing, WING_PIVOT, dragonPalette, type Eyes } from './DragonArt';

interface Props {
  stage: DragonStage;
  mood: DragonMood;
  eyes: Eyes;
  crack: number;
  size: number;
  motion: DragonMotion;
  children?: React.ReactNode;
}

function Glow({ size }: { size: number }) {
  const C = useColors();
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [pulse]);
  const style = useAnimatedStyle(() => ({ opacity: 0.12 + pulse.value * 0.2, transform: [{ scale: 0.95 + pulse.value * 0.15 }] }));
  const d = size * 1.15;
  return (
    <Animated.View
      style={[{ position: 'absolute', left: (size - d) / 2, top: (size - d) / 2, width: d, height: d, borderRadius: d / 2, backgroundColor: C.accentHeat }, style]}
    />
  );
}

function SleepZ({ delay, size }: { delay: number; size: number }) {
  const C = useColors();
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(delay, withRepeat(withTiming(1, { duration: 2400, easing: Easing.out(Easing.quad) }), -1, false));
  }, [p, delay]);
  const style = useAnimatedStyle(() => ({
    opacity: p.value < 0.15 ? p.value / 0.15 : 1 - p.value,
    transform: [{ translateX: -p.value * 14 }, { translateY: -p.value * size * 0.6 }, { scale: 0.7 + p.value * 0.6 }],
  }));
  return (
    <Animated.Text style={[{ position: 'absolute', left: size * 0.15, top: size * 0.05, color: C.accent2, fontFamily: Fonts.display, fontSize: 14 }, style]}>
      z
    </Animated.Text>
  );
}

/** The dragon at its current position: halo, flippable body, flapping wing, and whatever floats with it. */
export function DragonSprite({ stage, mood, eyes, crack, size, motion, children }: Props) {
  const C = useColors();
  const p = useMemo(() => dragonPalette(C, stage), [C, stage]);
  const { x, y, facing, flap, squash, tilt } = motion;
  const pivot = WING_PIVOT[stage];

  const place = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }, { translateY: y.value }] }));
  const body = useAnimatedStyle(() => ({
    transform: [{ scaleX: facing.value * (2 - squash.value) }, { scaleY: squash.value }, { rotate: `${tilt.value}deg` }],
  }));
  const wing = useAnimatedStyle(() => ({ transform: [{ rotate: `${flap.value}deg` }] }));

  return (
    <Animated.View style={[{ position: 'absolute', left: 0, top: 0, width: size, height: size }, place]}>
      {mood === 'blazing' && <Glow size={size} />}
      <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: '50% 75%' }, body]}>
        <DragonBody stage={stage} eyes={eyes} crack={crack} p={p} />
        <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: `${pivot.x * 100}% ${pivot.y * 100}%` }, wing]}>
          <DragonWing stage={stage} p={p} />
        </Animated.View>
      </Animated.View>
      {mood === 'sleeping' && (
        <>
          <SleepZ delay={0} size={size} />
          <SleepZ delay={1200} size={size} />
        </>
      )}
      {children}
    </Animated.View>
  );
}
