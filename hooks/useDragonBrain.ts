import { useCallback, useEffect, useRef } from 'react';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Easing,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { TAB_BAR_TOP, TAB_CENTRE_HALF, TAB_CENTRE_RISE } from '../components/forge/ForgeTabBar';
import { canFly, type DragonMood, type DragonStage } from '../utils/dragon';

export interface DragonMotion {
  x: SharedValue<number>;
  y: SharedValue<number>;
  /** 1 = facing right, -1 = facing left. */
  facing: SharedValue<number>;
  /** Wing angle in degrees; 0 is the drawn pose. */
  flap: SharedValue<number>;
  /** Vertical scale; the horizontal scale bulges to match. */
  squash: SharedValue<number>;
  /** Rotation in the dragon's own frame, so positive always leans forward. */
  tilt: SharedValue<number>;
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const pick = <T>(xs: readonly T[]): T => xs[Math.floor(Math.random() * xs.length)];
const t = (duration: number, easing = Easing.inOut(Easing.quad)) => ({ duration, easing });

/**
 * Runs the dragon's routine on a JS timer loop: each action starts its
 * animations and returns how long they take, then the next one is chosen.
 * Ground walkers live on either side of the centre button and hop over it.
 */
export function useDragonBrain(stage: DragonStage, mood: DragonMood, size: number) {
  const { width, height } = useWindowDimensions();
  const { top } = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const facing = useSharedValue(1);
  const flap = useSharedValue(0);
  const squash = useSharedValue(1);
  const tilt = useSharedValue(0);
  const airborne = useRef(false);
  const placed = useRef(false);
  const celebrateRef = useRef<(big: boolean) => void>(() => {});

  useEffect(() => {
    const ground = height - TAB_BAR_TOP - size * 0.94;
    const mid = width / 2;
    const minX = 18;
    const maxX = width - 18 - size;
    const leftMax = Math.max(minX, mid - TAB_CENTRE_HALF - size);
    const rightMin = Math.min(maxX, mid + TAB_CENTRE_HALF);
    const sky = top + 70;
    const flyer = canFly(stage);
    const pace = mood === 'sluggish' ? 0.6 : mood === 'blazing' ? 1.35 : 1;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const later = (ms: number, fn: () => void) => {
      clearTimeout(timer);
      timer = setTimeout(fn, ms);
    };
    const onLeft = (px: number) => px + size / 2 < mid;
    const groundSpot = (left: boolean) => (left ? rand(minX, leftMax) : rand(rightMin, maxX));
    const face = (to: number) => {
      facing.value = to >= x.value ? 1 : -1;
    };
    const rest = () => rand(900, 2600) * (mood === 'sluggish' ? 1.8 : 1);
    const flapBurst = (n: number) =>
      withSequence(withRepeat(withSequence(withTiming(-40, t(80)), withTiming(10, t(80))), n, false), withTiming(0, t(120)));

    if (reduced) {
      x.value = maxX;
      y.value = ground;
      celebrateRef.current = (big) => {
        squash.value = withSequence(withTiming(big ? 0.85 : 0.92, t(120)), withTiming(1, t(200)));
      };
      return;
    }

    if (!placed.current) {
      x.value = groundSpot(Math.random() < 0.5);
      y.value = ground;
      placed.current = true;
    } else if (!flyer || !airborne.current) {
      airborne.current = false;
      y.value = withTiming(ground, t(500));
      flap.value = withTiming(0, t(200));
    }
    if (mood !== 'sleeping') squash.value = withTiming(1, t(300));

    const walkTo = (to: number): number => {
      face(to);
      const steps = Math.max(1, Math.round(Math.abs(to - x.value) / (44 * pace) / 0.32));
      const ms = steps * 320;
      x.value = withTiming(to, t(ms, Easing.linear));
      const lift = stage === 'egg' ? 2 : stage === 'hatchling' ? 7 : 3;
      y.value = withRepeat(
        withSequence(withTiming(ground - lift, t(160, Easing.out(Easing.quad))), withTiming(ground, t(160, Easing.in(Easing.quad)))),
        steps,
        false
      );
      if (stage === 'egg') {
        tilt.value = withSequence(withRepeat(withSequence(withTiming(9, t(160)), withTiming(-9, t(160))), steps, false), withTiming(0, t(120)));
      }
      return ms;
    };

    const hopOver = (to: number): number => {
      face(to);
      const ms = 1000 / pace;
      x.value = withTiming(to, t(ms));
      y.value = withSequence(
        withTiming(ground - TAB_CENTRE_RISE - size * 0.5 - 10, t(ms / 2, Easing.out(Easing.quad))),
        withTiming(ground, t(ms / 2, Easing.in(Easing.quad)))
      );
      if (stage === 'egg') tilt.value = withSequence(withTiming(360, t(ms)), withTiming(0, { duration: 0 }));
      else flap.value = flapBurst(Math.round(ms / 160));
      return ms;
    };

    const wander = (): number => {
      const left = onLeft(x.value);
      if (Math.random() < 0.18) return hopOver(groundSpot(!left));
      const to = clamp(x.value + rand(40, 150) * pick([-1, 1]), left ? minX : rightMin, left ? leftMax : maxX);
      return walkTo(to);
    };

    const tricks: (() => number)[] = [
      () => {
        facing.value = -facing.value;
        return 900;
      },
      () => {
        squash.value = withSequence(withTiming(0.86, t(220)), withTiming(1.08, t(220)), withTiming(1, t(200)));
        return 700;
      },
      stage === 'egg'
        ? () => {
            tilt.value = withSequence(...[-14, 14, -9, 9, -4, 0].map((d) => withTiming(d, t(90))));
            return 600;
          }
        : () => {
            flap.value = flapBurst(2);
            return 500;
          },
    ];

    const flyTo = (tx: number, ty: number): number => {
      const ms = Math.max(700, (Math.hypot(tx - x.value, ty - y.value) / (130 * pace)) * 1000);
      face(tx);
      flap.value = withRepeat(withSequence(withTiming(-38, t(120)), withTiming(10, t(120))), -1, false);
      tilt.value = withTiming(ty < y.value - 20 ? -10 : ty > y.value + 20 ? 8 : 0, t(250));
      x.value = withTiming(tx, t(ms, Easing.inOut(Easing.sin)));
      y.value = withTiming(ty, t(ms, Easing.inOut(Easing.sin)));
      airborne.current = true;
      return ms;
    };

    const settle = (ty: number) => {
      tilt.value = withTiming(0, t(200));
      if (ty < ground) {
        flap.value = withRepeat(withSequence(withTiming(-26, t(220)), withTiming(6, t(220))), -1, false);
        y.value = withRepeat(withTiming(ty - 8, t(700, Easing.inOut(Easing.sin))), -1, true);
        return;
      }
      airborne.current = false;
      flap.value = withTiming(0, t(180));
      squash.value = withSequence(withTiming(0.82, t(90)), withTiming(1, t(200)));
    };

    const flight = () => {
      const q = Math.random();
      const land = airborne.current && q < 0.5;
      const ty = land ? ground : rand(sky, ground - 90);
      const tx = land ? groundSpot(Math.random() < 0.5) : q < 0.75 ? pick([minX, maxX]) : rand(minX, maxX);
      later(flyTo(tx, ty), () => {
        settle(ty);
        later(rest(), step);
      });
    };

    const goToBed = () => {
      const tuckIn = () => {
        settle(ground);
        facing.value = -1;
        squash.value = withTiming(0.92, t(400));
      };
      if (Math.abs(x.value - maxX) < 4 && !airborne.current) return tuckIn();
      later(flyer ? flyTo(maxX, ground) : onLeft(x.value) ? hopOver(maxX) : walkTo(maxX), tuckIn);
    };

    function step() {
      if (mood === 'sleeping') return goToBed();
      const r = Math.random();
      if (flyer && (airborne.current || r < 0.35)) return flight();
      const idle = r < (mood === 'sluggish' ? 0.75 : 0.5);
      later((idle ? pick(tricks)() : wander()) + rest(), step);
    }

    celebrateRef.current = (big) => {
      clearTimeout(timer);
      if (flyer && airborne.current) {
        tilt.value = withSequence(withTiming(-360, t(700)), withTiming(0, { duration: 0 }));
        flap.value = flapBurst(5);
      } else {
        squash.value = withSequence(withTiming(0.8, t(90)), withTiming(1.12, t(160)), withTiming(1, t(240)));
        y.value = withSequence(
          withTiming(ground - (big ? 64 : 34), t(280, Easing.out(Easing.quad))),
          withTiming(ground, t(280, Easing.in(Easing.quad)))
        );
        if (stage === 'egg') tilt.value = withSequence(...[-16, 16, -10, 10, 0].map((d) => withTiming(d, t(90))));
        else flap.value = flapBurst(4);
      }
      later(1400, step);
    };

    later(rest() / 2, step);
    return () => {
      clearTimeout(timer);
      celebrateRef.current = () => {};
    };
  }, [stage, mood, size, width, height, top, reduced, x, y, facing, flap, squash, tilt]);

  const celebrate = useCallback((big: boolean) => celebrateRef.current(big), []);
  const motion: DragonMotion = { x, y, facing, flap, squash, tilt };
  return { motion, celebrate };
}
