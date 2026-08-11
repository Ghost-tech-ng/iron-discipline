/**
 * THE SCULPT PROTOCOL — 12 weeks, two blocks: ATTACK then BUILD.
 *
 * Extended from the original 8-week ATTACK → FINISH cut after a floor got
 * set explicitly: do not go below 87 kg, and get there through recomposition
 * — visible muscle at that weight, not a smaller version of the same
 * physique. Abs were already ~60% visible and love handles already small
 * going into this revision, which means there was never 7kg of fat left to
 * lose — the original 82kg target overshot what was actually needed.
 *
 * So the structure changed shape, not just length:
 *   - ATTACK (weeks 1-4) is a gentler taper than the original — ~0.4-0.55
 *     kg/wk instead of ~0.85-1.0 kg/wk — designed to land at ~87kg by the
 *     end of week 4, not blow through the floor by week 2.
 *   - FINISH is gone. A second deficit block only made sense when there was
 *     another 4-5kg to strip; there is not.
 *   - BUILD (weeks 5-12) replaces it: calories step up to ~maintenance,
 *     training days running a small surplus and rest days a small deficit
 *     so the week nets out at (not above) TDEE. This is recomposition —
 *     Barakat 2020 (Sports Medicine) and the general recomp literature both
 *     show visible simultaneous muscle gain + fat retention/loss is
 *     realistic at maintenance-to-slight-surplus calories with high protein
 *     and progressive overload, especially in a lifter who still has
 *     undertrained muscle groups with adaptive headroom. It is not a bulk —
 *     protein holds at 210g throughout, and there is no scheduled refeed in
 *     BUILD because refeeds are an adherence tool for a deficit; there is no
 *     deficit here to break up.
 *
 * The ATTACK-era literature still applies to the ATTACK block, just at a
 * gentler rate:
 *   - Garthe et al. 2011 (Int J Sport Nutr Exerc Metab): athletes cutting at
 *     0.7%/wk gained lean mass; 1.4%/wk did not, given high training
 *     frequency and high protein.
 *   - Nutrients 2021 (PMC8471721): 0.5-1.0%/wk is the ceiling for
 *     resistance-trained individuals to protect fat-free mass; protein
 *     2.2-3.0 g/kg. This plan now sits at the bottom of that range, not the
 *     top, because the floor matters more than the clock here.
 *   - MATADOR-style diet-break literature: scheduled refeeds beat one
 *     continuous deficit for adherence and blunt adaptive thermogenesis —
 *     kept in ATTACK, dropped in BUILD because it is not needed there.
 */

export const PROTOCOL_START = '2026-08-10'; // Monday
export const PROTOCOL_WEEKS = 12;

/**
 * PROTOCOL_START above is a design anchor, not a live start switch — without
 * this, every day between install and whenever the user actually begins reads
 * as a missed session. Null = not started yet; the user sets it by tapping
 * "Start Protocol", which pins day 1 to that date. Kept as in-memory state,
 * mirrored into SQLite/userStore, because every date function below reads it
 * synchronously and can't await a DB read.
 */
let startOverride: string | null = null;

export function setProtocolStartOverride(iso: string | null): void {
  startOverride = iso;
}

export function getProtocolStartOverride(): string | null {
  return startOverride;
}

export function hasProtocolStarted(): boolean {
  return startOverride !== null;
}

export type PhaseId = 'attack' | 'build';
export type DayType = 'training' | 'rest' | 'refeed';

export interface MacroTarget {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Phase {
  id: PhaseId;
  name: string;
  subtitle: string;
  startWeek: number;
  endWeek: number;
  /** Weekly-average calories. Training, rest and refeed days cycle around this and net to it. */
  baselineCalories: number;
  training: MacroTarget;
  rest: MacroTarget;
  /** Present only in phases that use scheduled refeed days. */
  refeed?: MacroTarget;
  /** Day indices of weekly refeeds. 0 = Monday … 6 = Sunday. Empty/absent = none this phase. */
  refeedDays?: number[];
  /** Week number inside the protocol that runs as a deload. 0 = no deload this phase. */
  deloadWeek: number;
  expectedWeeklyKg: string;
  waistGoal: string;
  cardio: readonly string[];
  actions: readonly string[];
  /** Colour hint used by the UI so each phase reads distinctly. */
  accent: string;
}

/**
 * Everything below is derived from these, so if bodyweight is wrong the whole
 * protocol is wrong. Recalculate the baselines if this changes by more than ~3kg.
 *
 * Mifflin-St Jeor at 89 kg / 191 cm / male / ~30 yr → BMR ≈ 1940 kcal.
 * Activity ×1.55 (5 lifting sessions + daily Zone-2 walking) → TDEE ≈ 3000 kcal.
 * TDEE(w) ≈ 15.5w + 1625.5625, so TDEE falls as weight drops: TDEE(88) ≈ 2990,
 * TDEE(87) ≈ 2974.
 *
 * ATTACK avg ~88 kg → TDEE ~2990 → −570/day → 2420 (~0.45%/wk, floor-aware)
 * BUILD avg ~87 kg  → TDEE ~2974 → baseline 2986, ~+12/day — effectively
 *   maintenance, with the surplus concentrated on training days only.
 * Target: 89 kg → ~87 kg by end of week 4, then hold ~87kg through week 12
 * while visible muscle increases — the scale is not supposed to move much
 * after week 4.
 */
export const PROTOCOL_BODYWEIGHT_KG = 89;
export const PROTOCOL_HEIGHT_CM = 191;
export const ESTIMATED_TDEE = 3000;

export const PHASES: readonly Phase[] = [
  {
    id: 'attack',
    name: 'ATTACK',
    subtitle: 'Four weeks, floor-aware deficit — 89kg down to ~87kg, no further',
    startWeek: 1,
    endWeek: 4,
    baselineCalories: 2420,
    // Protein 210g (2.4g/kg at 88kg avg) held constant with BUILD so the habit
    // never shifts. Fat floor ~0.75g/kg. The deficit is real but deliberately
    // gentler than a standard cut — there is only ~2kg between the start
    // weight and the 87kg floor, so the rate is tuned to arrive there around
    // week 4, not to maximise weekly loss. One refeed a week, Saturday.
    // 4 training + 2 rest + 1 refeed = 16,940 kcal/wk = 2420/day baseline.
    training: { calories: 2545, protein: 210, carbs: 280, fat: 65 },
    rest: { calories: 1975, protein: 210, carbs: 160, fat: 55 },
    refeed: { calories: 2810, protein: 190, carbs: 400, fat: 50 },
    refeedDays: [5], // Saturday
    deloadWeek: 4,
    expectedWeeklyKg: '0.4 – 0.55 kg/wk down',
    waistGoal: '−2 to −3 cm across the block',
    cardio: [
      'Fasted Zone-2 walk, 35 min, 6 mornings — before your first meal',
      '2 × 12-min intervals after lifting (30s hard / 90s easy)',
      '8,000+ steps on both rest days — no exceptions',
    ],
    actions: [
      "Protein 210g every single day — this is what protects the muscle you're trying to keep visible",
      'Rest days are lower-carb by design. Saturday carries the carb-up for the week',
      "Don't chase the deficit below 87kg on the scale — if the 7-day average hits the floor before week 4 ends, switch to BUILD's macros early",
      'Weigh every morning, log it. Judge the 7-day average, never a single number',
      'Measure your waist at the navel every Sunday — this is the metric that matters, not the scale',
      'Sleep 7h+. Under-sleeping on a deficit costs lean mass first',
    ],
    accent: '#ef4444',
  },
  {
    id: 'build',
    name: 'BUILD',
    subtitle: 'Recomposition — deficit ends, muscle goes on without the fat coming back',
    startWeek: 5,
    endWeek: 12,
    baselineCalories: 2986,
    // No refeed field: refeeds are an adherence tool for a deficit, and BUILD
    // is not running one. Training days carry a small surplus over TDEE to
    // fuel and fund the session; rest days sit a little under TDEE so the
    // week nets out at roughly maintenance (2986 vs TDEE ~2974 at 87kg avg),
    // not a bulk. Protein stays at 210g — the difference between the surplus
    // becoming muscle or becoming fat is almost entirely down to this number
    // plus training. 5 training + 2 rest = 20,900 kcal/wk ≈ 2986/day baseline.
    training: { calories: 3100, protein: 210, carbs: 412, fat: 68 },
    rest: { calories: 2700, protein: 210, carbs: 330, fat: 60 },
    deloadWeek: 9,
    expectedWeeklyKg: '±0.1 – 0.2 kg/wk — the scale should barely move',
    waistGoal: 'Hold at ≤ +1cm from week 4 — a stable waist through the surplus is the whole point',
    cardio: [
      'Fasted Zone-2 walk, 25 min, 4 mornings — enough for heart health, not enough to eat into recovery',
      '8,000+ steps daily — general activity, not an extra deficit lever',
      'Drop the post-lifting intervals this block — recovery capacity goes into training volume, not conditioning',
    ],
    actions: [
      'Protein holds at 210g — the single biggest lever for whether the surplus builds muscle or just adds fat',
      'Weigh every morning, but judge it against the waist, not on its own — a rising scale with a flat or shrinking waist is exactly the point of this block',
      'Measure waist every Sunday — if it climbs more than 1cm in a week, that means the surplus is too big, not a green light to eat more',
      'Progressive overload every session — the whole reason for the surplus is to have the calories to add weight to the bar',
      'Sleep 7h+ — recomposition needs recovery capacity even more than a cut does',
    ],
    accent: '#22c55e',
  },
];

/** One line of intent for each of the 12 weeks. Ordered, index 0 = week 1. */
export const WEEK_FOCUS: readonly string[] = [
  'Week 1 of 12. Deficit starts now, but it is a gentle one — the floor is 87kg, not zero. Weigh in, measure your waist, take all three photos as your baseline.',
  'Add one set to every compound. First real read on the trend — if the 7-day average is not down at least 0.3kg, cut rest-day carbs by 15g.',
  'Peak volume before the deload. Hardest training week of the ATTACK block — push it, recovery is coming.',
  'DELOAD. Volume down 40%, calories unchanged. Saturday refeed still runs. Last week of ATTACK — you should be close to 87kg, not below it.',
  'BUILD opens. The deficit ends here — calories step up to right around maintenance. This is recomposition: the abs you have stay, muscle goes on top of them.',
  'Training-day calories carry a small surplus, rest days sit a little under — the week nets out at maintenance, not above it. Protein and leg/lower-back frequency stay exactly where they are.',
  'Third week of BUILD. Weight should be flat to slightly up on the scale — that is muscle and glycogen, not fat coming back. Waist should not be climbing.',
  'Fourth week of BUILD, halfway through the block. Volume should be climbing — this is the phase built for adding visible size.',
  'DELOAD. Volume down 40%, calories unchanged. Second and last planned recovery week of the whole 12 weeks.',
  'BUILD resumes at full volume. Push loads on the big lifts — this is where most of the visible muscle gets added.',
  'Second-to-last week. This is where visible muscle should separate from just "lean" — chest, shoulders and arms fuller than they were at week 5.',
  'Final week. Full measurements, full photos, log every session. You should read ~87kg or a little above it, with visibly more muscle than day one — that is the recomp working.',
];

const DAY_MS = 86400000;

function toMidnight(iso: string): number {
  return new Date(iso + 'T00:00:00').getTime();
}

export function todayIso(): string {
  return new Date().toISOString().split('T')[0];
}

/** 0 = Monday … 6 = Sunday, matching how the training split is indexed. */
export function mondayIndex(d: Date = new Date()): number {
  const js = d.getDay();
  return js === 0 ? 6 : js - 1;
}

export interface ProtocolStatus {
  isActive: boolean;
  /** 1-based week inside the whole protocol. 0 before it starts. */
  week: number;
  /** 1-based week inside the current phase. */
  weekInPhase: number;
  /** 1-based day inside the whole protocol. */
  dayNumber: number;
  daysRemaining: number;
  totalDays: number;
  phase: Phase;
  phaseIndex: number;
  isDeloadWeek: boolean;
  dayType: DayType;
  targets: MacroTarget;
  focus: string;
  /** Fraction 0–1 through the current phase. */
  phaseProgress: number;
}

export function getProtocolStatus(isoDate: string = todayIso()): ProtocolStatus {
  const totalDaysUnstarted = PROTOCOL_WEEKS * 7;
  if (startOverride === null) {
    const phase = PHASES[0];
    return {
      isActive: false,
      week: 0,
      weekInPhase: 0,
      dayNumber: 0,
      daysRemaining: totalDaysUnstarted,
      totalDays: totalDaysUnstarted,
      phase,
      phaseIndex: 0,
      isDeloadWeek: false,
      dayType: 'training',
      targets: phase.training,
      focus: WEEK_FOCUS[0],
      phaseProgress: 0,
    };
  }

  const startMs = toMidnight(startOverride);
  const nowMs = toMidnight(isoDate);
  const totalDays = PROTOCOL_WEEKS * 7;
  const endMs = startMs + (totalDays - 1) * DAY_MS;

  const rawDay = Math.floor((nowMs - startMs) / DAY_MS) + 1;
  const dayNumber = Math.min(Math.max(rawDay, 0), totalDays);
  const isActive = nowMs >= startMs && nowMs <= endMs;

  const week = dayNumber <= 0 ? 1 : Math.min(PROTOCOL_WEEKS, Math.ceil(dayNumber / 7));
  const phaseIndex = Math.max(
    0,
    PHASES.findIndex((p) => week >= p.startWeek && week <= p.endWeek)
  );
  const phase = PHASES[phaseIndex];
  const weekInPhase = week - phase.startWeek + 1;
  const isDeloadWeek = week === phase.deloadWeek;

  const dow = mondayIndex(new Date(isoDate + 'T00:00:00'));
  const isRestDay = dow === 3 || dow === 6; // Thursday and Sunday
  const isRefeed = phase.refeed !== undefined && (phase.refeedDays?.includes(dow) ?? false);

  const dayType: DayType = isRefeed ? 'refeed' : isRestDay ? 'rest' : 'training';
  const targets =
    dayType === 'refeed' && phase.refeed
      ? phase.refeed
      : dayType === 'rest'
      ? phase.rest
      : phase.training;

  return {
    isActive,
    week: dayNumber <= 0 ? 0 : week,
    weekInPhase,
    dayNumber,
    daysRemaining: Math.max(0, Math.floor((endMs - nowMs) / DAY_MS) + (nowMs <= endMs ? 1 : 0)),
    totalDays,
    phase,
    phaseIndex,
    isDeloadWeek,
    dayType,
    targets,
    focus: WEEK_FOCUS[Math.min(WEEK_FOCUS.length - 1, Math.max(0, week - 1))],
    phaseProgress: Math.min(1, Math.max(0, weekInPhase / (phase.endWeek - phase.startWeek + 1))),
  };
}

export interface VolumeModifier {
  extraSets: number;
  setMultiplier: number;
  isDeload: boolean;
}

/**
 * Linear volume ramp inside each phase, reset at every phase boundary, with a
 * planned deload at the end of each block (week 4 and week 9). Accumulated
 * fatigue is what stalls training over 12 weeks — the deloads are not
 * optional recovery, they are where the adaptation is expressed.
 */
export function getVolumeModifier(isoDate: string = todayIso()): VolumeModifier {
  const s = getProtocolStatus(isoDate);
  if (!s.isActive) return { extraSets: 0, setMultiplier: 1, isDeload: false };
  if (s.isDeloadWeek) return { extraSets: 0, setMultiplier: 0.6, isDeload: true };
  return {
    extraSets: Math.min(2, Math.floor((s.weekInPhase - 1) / 2)),
    setMultiplier: 1,
    isDeload: false,
  };
}

export function getPhaseByWeek(week: number): Phase {
  return PHASES.find((p) => week >= p.startWeek && week <= p.endWeek) ?? PHASES[0];
}

/** Calendar date a given protocol week starts on. */
export function weekStartDate(week: number): string {
  const ms = toMidnight(startOverride ?? PROTOCOL_START) + (week - 1) * 7 * DAY_MS;
  return new Date(ms).toISOString().split('T')[0];
}

export function formatRange(startIso: string, endIso: string): string {
  const fmt = (iso: string) =>
    new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  return `${fmt(startIso)} – ${fmt(endIso)}`;
}

export function phaseDateRange(phase: Phase): string {
  const start = weekStartDate(phase.startWeek);
  const endMs = toMidnight(weekStartDate(phase.endWeek)) + 6 * DAY_MS;
  return formatRange(start, new Date(endMs).toISOString().split('T')[0]);
}
