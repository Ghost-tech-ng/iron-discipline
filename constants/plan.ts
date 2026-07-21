export const PUSH_PLAN_START = '2026-07-14';
export const PUSH_PLAN_END = '2026-08-03';

export interface PlanPhase {
  week: 1 | 2 | 3;
  name: string;
  dates: string;
  startDate: string;
  endDate: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  actions: readonly string[];
}

export const PUSH_PLAN: PlanPhase[] = [
  {
    week: 1,
    name: 'The Strip',
    dates: 'Jul 14 – 20',
    startDate: '2026-07-14',
    endDate: '2026-07-20',
    calories: 2100,
    protein: 185,
    carbs: 220,
    fat: 55,
    actions: [
      'Protein up to 185g — sardine tin + extra egg closes the gap',
      'Fasted 20-min walk before 10 AM meal, every morning',
      'Zero takeout — sardines + eggs + bread is the fallback',
      'Weigh every morning, log it — track the 7-day trend',
    ],
  },
  {
    week: 2,
    name: 'Hold the Line',
    dates: 'Jul 21 – 27',
    startDate: '2026-07-21',
    endDate: '2026-07-27',
    calories: 2100,
    protein: 185,
    carbs: 200,
    fat: 55,
    actions: [
      'Carbs down to 200g — tightens the deficit on stubborn fat',
      'One extra set per compound lift — signal your body to keep the muscle',
      'Fasted walk every single morning — this is where others plateau',
      'Trust the mirror this week, not just the scale',
    ],
  },
  {
    week: 3,
    name: 'The Peak',
    dates: 'Jul 28 – Aug 3',
    startDate: '2026-07-28',
    endDate: '2026-08-03',
    calories: 2100,
    protein: 185,
    carbs: 200,
    fat: 55,
    actions: [
      'Days 1–4: Same cut continues — macros unchanged',
      'Day 5–6 (Aug 1–2): Carb refeed → 340g carbs, cut fat to 30g, ~2,400 kcal',
      'Day 7 (Aug 3): Low sodium, clean eating — this is your best look',
      'Day 7 morning: Take progress photo after a light pump',
    ],
  },
];

// Refeed and peak day overrides within Week 3
const REFEED_DATES = ['2026-08-01', '2026-08-02'];
const PEAK_DATE = '2026-08-03';

export type PlanStatus =
  | { isActive: true; phase: PlanPhase; dayNumber: number; daysRemaining: number; totalDays: 21; isRefeedDay: boolean; isPeakDay: boolean }
  | { isActive: false; phase: null; dayNumber: number; daysRemaining: number; totalDays: 21; isRefeedDay: false; isPeakDay: false };

export function getExtraCompoundSets(): number {
  const status = getActivePlanStatus();
  if (!status.isActive) return 0;
  return status.phase.week >= 2 ? 1 : 0;
}

export function getActivePlanStatus(): PlanStatus {
  const today = new Date().toISOString().split('T')[0];
  const startMs = new Date(PUSH_PLAN_START + 'T00:00:00').getTime();
  const endMs = new Date(PUSH_PLAN_END + 'T00:00:00').getTime();
  const nowMs = new Date(today + 'T00:00:00').getTime();
  const totalDays = 21 as const;

  const dayNumber = nowMs < startMs
    ? 0
    : Math.min(totalDays, Math.floor((nowMs - startMs) / 86400000) + 1);

  const daysRemaining = nowMs > endMs
    ? 0
    : Math.floor((endMs - nowMs) / 86400000) + 1;

  if (nowMs < startMs || nowMs > endMs) {
    return { isActive: false, phase: null, dayNumber, daysRemaining, totalDays, isRefeedDay: false, isPeakDay: false };
  }

  const phase = PUSH_PLAN.find((p) => today >= p.startDate && today <= p.endDate) ?? PUSH_PLAN[0];

  return {
    isActive: true,
    phase,
    dayNumber,
    daysRemaining,
    totalDays,
    isRefeedDay: REFEED_DATES.includes(today),
    isPeakDay: today === PEAK_DATE,
  };
}
