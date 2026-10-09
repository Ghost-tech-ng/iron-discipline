import React, { useEffect, useMemo } from 'react';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useColors } from '../../hooks/useColors';
import type { DragonStage } from '../../utils/dragon';
import { MOUTH } from './DragonArt';

interface SparkSpec {
  dx: number;
  dy: number;
  r: number;
  color: string;
  delay: number;
}

function Spark({ ox, oy, spec }: { ox: number; oy: number; spec: SparkSpec }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withTiming(1, { duration: 650 + spec.delay, easing: Easing.out(Easing.cubic) });
  }, [p, spec.delay]);
  const style = useAnimatedStyle(() => ({
    opacity: 1 - p.value,
    transform: [
      { translateX: ox - spec.r + spec.dx * p.value },
      { translateY: oy - spec.r + spec.dy * p.value + 22 * p.value * p.value },
      { scale: 1 - p.value * 0.5 },
    ],
  }));
  const d = spec.r * 2;
  return <Animated.View style={[{ position: 'absolute', left: 0, top: 0, width: d, height: d, borderRadius: spec.r, backgroundColor: spec.color }, style]} />;
}

/** A puff of fire from the mouth (or the top of the egg). Mount it keyed per cheer. */
export function SparkBurst({ stage, size, dir, big }: { stage: DragonStage; size: number; dir: 1 | -1; big: boolean }) {
  const C = useColors();
  const mouth = MOUTH[stage];
  const ox = (dir === 1 ? mouth.x : 1 - mouth.x) * size;
  const oy = mouth.y * size;

  const sparks = useMemo<SparkSpec[]>(() => {
    const colors = [C.accentHeat, C.heatPeak, C.accent];
    return Array.from({ length: big ? 12 : 7 }, (_, i) => ({
      dx: stage === 'egg' ? (Math.random() - 0.5) * 60 : dir * (20 + Math.random() * (big ? 70 : 45)),
      dy: stage === 'egg' ? -20 - Math.random() * 40 : -45 + Math.random() * 55,
      r: 2 + Math.random() * (big ? 3.5 : 2.5),
      color: colors[i % colors.length],
      delay: Math.random() * 200,
    }));
  }, [C, stage, dir, big]);

  return (
    <>
      {sparks.map((s, i) => (
        <Spark key={i} ox={ox} oy={oy} spec={s} />
      ))}
    </>
  );
}
