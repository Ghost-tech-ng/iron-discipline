import { create } from 'zustand';
import type { WeeklyCheckIn } from '../types';

/**
 * Waist is the headline metric of the Sculpt Protocol, not weight.
 *
 * Scale weight moves with glycogen, sodium and gut content — it can swing 2 kg
 * in a day and says nothing about where the fat went. Waist at the navel tracks
 * abdominal and flank fat directly, and waist:hip separates "the fat is coming
 * off the middle" from "everything is shrinking". Weight should trend down
 * through ATTACK (weeks 1-4, toward the 87kg floor), then hold roughly flat
 * through BUILD (weeks 5-12) while the waist stays flat and visible muscle
 * increases — a rising scale in BUILD is expected, not a reversal, as long as
 * the waist isn't rising with it. A refeed day bumping the scale 1-2kg
 * overnight is glycogen and water either way.
 */

/** Oldest → newest. Store keeps check-ins newest-first. */
function chronological(checkIns: WeeklyCheckIn[]): WeeklyCheckIn[] {
  return [...checkIns].sort((a, b) => a.week - b.week);
}

function firstWith(
  checkIns: WeeklyCheckIn[],
  field: keyof WeeklyCheckIn
): number | null {
  for (const c of chronological(checkIns)) {
    const v = c[field];
    if (typeof v === 'number') return v;
  }
  return null;
}

function latestWith(
  checkIns: WeeklyCheckIn[],
  field: keyof WeeklyCheckIn
): number | null {
  for (const c of checkIns) {
    const v = c[field];
    if (typeof v === 'number') return v;
  }
  return null;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export interface TrendPoint {
  week: number;
  date: string;
  value: number;
}

interface ProgressStore {
  checkIns: WeeklyCheckIn[];
  addCheckIn: (checkIn: WeeklyCheckIn) => void;
  loadCheckIns: (checkIns: WeeklyCheckIn[]) => void;

  latestWeight: () => number | null;
  totalLost: () => number | null;

  latestWaist: () => number | null;
  /** Positive = centimetres gone from the waist since the first measured week. */
  waistLost: () => number | null;
  /** Change since the previous check-in that recorded a waist. */
  waistWeekDelta: () => number | null;
  /** Waist ÷ hip. Under 0.85 is the visual "V-taper" zone for a 6'3" frame. */
  waistToHip: () => number | null;
  /** Chest ÷ waist. Rising = the taper is opening up. */
  chestToWaist: () => number | null;
  /** Chest growth in cm since the first measured week. */
  chestGained: () => number | null;
  /**
   * The one that matters in a recomp: cm off the waist per kg of scale weight
   * lost. Above ~1.0 means the waist is outrunning the scale — fat is leaving
   * the middle faster than mass overall. Null when weight barely moved.
   */
  recompRatio: () => number | null;

  waistSeries: () => TrendPoint[];
  weightSeries: () => TrendPoint[];
}

export const useProgressStore = create<ProgressStore>((set, get) => ({
  checkIns: [],

  addCheckIn: (checkIn) =>
    set((state) => ({
      checkIns: [checkIn, ...state.checkIns].sort((a, b) => b.week - a.week),
    })),

  loadCheckIns: (checkIns) => set({ checkIns }),

  latestWeight: () => {
    const { checkIns } = get();
    return checkIns.length > 0 ? checkIns[0].weightKg : null;
  },

  totalLost: () => {
    const { checkIns } = get();
    if (checkIns.length < 2) return null;
    const latest = checkIns[0].weightKg;
    const first = checkIns[checkIns.length - 1].weightKg;
    return round1(first - latest);
  },

  latestWaist: () => latestWith(get().checkIns, 'waistCm'),

  waistLost: () => {
    const { checkIns } = get();
    const first = firstWith(checkIns, 'waistCm');
    const latest = latestWith(checkIns, 'waistCm');
    if (first === null || latest === null || first === latest) return null;
    return round1(first - latest);
  },

  waistWeekDelta: () => {
    const measured = get().checkIns.filter((c) => typeof c.waistCm === 'number');
    if (measured.length < 2) return null;
    return round1((measured[0].waistCm as number) - (measured[1].waistCm as number));
  },

  waistToHip: () => {
    const { checkIns } = get();
    for (const c of checkIns) {
      if (typeof c.waistCm === 'number' && typeof c.hipCm === 'number' && c.hipCm > 0) {
        return Math.round((c.waistCm / c.hipCm) * 100) / 100;
      }
    }
    return null;
  },

  chestToWaist: () => {
    const { checkIns } = get();
    for (const c of checkIns) {
      if (typeof c.chestCm === 'number' && typeof c.waistCm === 'number' && c.waistCm > 0) {
        return Math.round((c.chestCm / c.waistCm) * 100) / 100;
      }
    }
    return null;
  },

  chestGained: () => {
    const { checkIns } = get();
    const first = firstWith(checkIns, 'chestCm');
    const latest = latestWith(checkIns, 'chestCm');
    if (first === null || latest === null || first === latest) return null;
    return round1(latest - first);
  },

  recompRatio: () => {
    const { checkIns, waistLost } = get();
    const cmLost = waistLost();
    if (cmLost === null || cmLost <= 0 || checkIns.length < 2) return null;
    const kgLost = checkIns[checkIns.length - 1].weightKg - checkIns[0].weightKg;
    if (kgLost < 0.5) return null;
    return Math.round((cmLost / kgLost) * 100) / 100;
  },

  waistSeries: () =>
    chronological(get().checkIns)
      .filter((c) => typeof c.waistCm === 'number')
      .map((c) => ({ week: c.week, date: c.date, value: c.waistCm as number })),

  weightSeries: () =>
    chronological(get().checkIns).map((c) => ({
      week: c.week,
      date: c.date,
      value: c.weightKg,
    })),
}));
