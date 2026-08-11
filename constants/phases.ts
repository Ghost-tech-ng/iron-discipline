/**
 * THE SCULPT PROTOCOL — 22 weeks, three phases.
 *
 * Built around one uncomfortable fact: spot reduction does not exist. A 2021
 * meta-analysis (13 studies, 1,158 participants) found a pooled effect size of
 * roughly zero for training a region to strip fat from it, and a 2025 review of
 * 62 RCTs found intervention type changes body composition but not fat
 * *distribution*. Flank and lower-abdominal fat is dense in alpha-2 adrenergic
 * receptors, which are antilipolytic — that tissue is the last to go, and it
 * only goes when total body fat gets low enough.
 *
 * So love handles are not a training problem. They are a body-fat-percentage
 * problem, and the only lever is a sustained deficit held long enough to reach
 * roughly 10–11% body fat. That is what Phases 1 and 2 are for.
 *
 * Phase 3 is where the chest gets built, because you cannot be in a surplus and
 * strip stubborn fat at the same time. Legs and lower back are the exception:
 * they are undertrained enough that they will still grow during the deficit
 * (Barakat 2020, Sports Medicine — recomposition is achievable in trained
 * lifters when a muscle group has untapped adaptive headroom).
 */

export const PROTOCOL_START = '2026-08-10'; // Monday
export const PROTOCOL_WEEKS = 22;

export type PhaseId = 'strip' | 'carve' | 'build';
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
  /** Weekly-average calories. Training and rest days cycle around this and net to it. */
  baselineCalories: number;
  training: MacroTarget;
  rest: MacroTarget;
  /** Present only in phases that use a scheduled weekly refeed. */
  refeed?: MacroTarget;
  /** Day index of the weekly refeed. 0 = Monday … 6 = Sunday. */
  refeedDay?: number;
  /** Week number inside the protocol that runs as a deload. */
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
 *
 * Each phase's baseline is set against the TDEE at that phase's *average*
 * bodyweight, not the starting one — TDEE falls as you get lighter, so a fixed
 * deficit silently shrinks over a cut:
 *   STRIP  avg ~86.5 kg → TDEE ~2965 → −665/day → 2300  (0.7 %/wk)
 *   CARVE  avg ~82.5 kg → TDEE ~2905 → −545/day → 2360  (0.6 %/wk, slowed on purpose)
 *   BUILD  avg ~82.5 kg → TDEE ~2905 → +245/day → 3150  (lean gain)
 */
export const PROTOCOL_BODYWEIGHT_KG = 89;
export const PROTOCOL_HEIGHT_CM = 191;
export const ESTIMATED_TDEE = 3000;

export const PHASES: readonly Phase[] = [
  {
    id: 'strip',
    name: 'STRIP',
    subtitle: 'Take the bulk of the fat off',
    startWeek: 1,
    endWeek: 8,
    baselineCalories: 2300,
    // Protein 2.4 g/kg at 87kg avg. Garthe 2011: cutting at ~0.7%/wk gained 2.1%
    // lean mass and lost 31% of fat mass; cutting at 1.4%/wk gained no lean mass
    // and lost only 21%. Faster is not faster. Fat floor ~0.72 g/kg protects
    // testosterone. 5 training + 2 rest = 16106 kcal/wk ≈ 2300/day baseline.
    training: { calories: 2502, protein: 210, carbs: 258, fat: 70 },
    rest: { calories: 1798, protein: 210, carbs: 100, fat: 62 },
    deloadWeek: 6,
    expectedWeeklyKg: '0.55 – 0.65 kg/wk',
    waistGoal: '−5 to −7 cm across the phase',
    cardio: [
      'Fasted Zone-2 walk, 30 min, 5 mornings — before your first meal',
      '2 × 12-min intervals after lifting (30s hard / 90s easy)',
      '8,000+ steps on every rest day — no exceptions',
    ],
    actions: [
      'Protein 210g every single day — deficit or not, this is what keeps the muscle',
      'Rest days are low-carb by design. The carbs live on training days where they fuel work',
      'Weigh every morning, log it. Judge the 7-day average, never a single number',
      'Measure your waist at the navel every Sunday — this is the metric that matters, not the scale',
      'Sleep 7h+. Under-sleeping in a deficit costs you lean mass, not fat',
    ],
    accent: '#ef4444',
  },
  {
    id: 'carve',
    name: 'CARVE',
    subtitle: 'The last of the love handles',
    startWeek: 9,
    endWeek: 14,
    baselineCalories: 2360,
    // Slow the rate down deliberately. The final layer of flank fat comes off at
    // low body fat, where a hard deficit costs lean mass faster than it costs fat.
    // Protein holds at 2.55 g/kg of the lower bodyweight — relatively higher than
    // STRIP, which is the point: the leaner you get, the more protein spares muscle.
    // The Saturday refeed replaces a training day, so training days are pulled
    // below what they would otherwise be to pay for it. 4 training + 2 rest +
    // 1 refeed = 16519 kcal/wk ≈ 2360/day baseline. Without that compensation the
    // refeed silently makes the phase a 54 kcal/day shallower deficit than stated.
    training: { calories: 2466, protein: 210, carbs: 249, fat: 70 },
    rest: { calories: 1900, protein: 210, carbs: 130, fat: 60 },
    refeed: { calories: 2855, protein: 190, carbs: 400, fat: 55 },
    refeedDay: 5, // Saturday
    deloadWeek: 12,
    expectedWeeklyKg: '0.4 – 0.55 kg/wk',
    waistGoal: '−3 to −4 cm — this is where the flank finally moves',
    cardio: [
      'Fasted Zone-2 walk, 40 min, 6 mornings',
      '2 × 15-min intervals after lifting',
      'Add a 20-min evening walk after your last meal',
    ],
    actions: [
      'Saturday is a full carb refeed — 400g carbs, fat down. Restores leptin and training output',
      'Protein holds at 210g on a lighter bodyweight — that is a higher dose per kg than STRIP, on purpose',
      'Scale will move slower now. That is correct. Waist and photos are the signal',
      'No alcohol in this phase. It blunts fat oxidation for ~12h and you have no margin',
      'Front, side and back photos every Sunday, same light, same time',
    ],
    accent: '#f59e0b',
  },
  {
    id: 'build',
    name: 'BUILD',
    subtitle: 'Chest, shoulders, and the frame around the new waist',
    startWeek: 15,
    endWeek: 22,
    baselineCalories: 3150,
    // Lean gain, not a bulk. ~+245 kcal over the TDEE you will have at ~82kg,
    // which yields roughly 0.2 kg/wk — fast enough to grow, slow enough that the
    // waist holds. Protein drops to ~2.2 g/kg because a surplus already spares
    // muscle; the freed calories go to carbs, which drive training output.
    // 5 training + 2 rest = 22061 kcal/wk ≈ 3150/day baseline.
    training: { calories: 3313, protein: 185, carbs: 452, fat: 85 },
    rest: { calories: 2748, protein: 185, carbs: 340, fat: 72 },
    deloadWeek: 18,
    expectedWeeklyKg: '+0.15 – 0.25 kg/wk',
    waistGoal: 'Hold. If waist climbs 2.5 cm, drop to 2,900 for two weeks',
    cardio: [
      'Zone-2 walk, 25 min, 3 mornings — appetite and insulin sensitivity, not fat loss',
      'Drop the intervals. Recovery goes into the lifts now',
    ],
    actions: [
      'Surplus is small on purpose. A big surplus refills the fat you just spent 14 weeks removing',
      'Chest moves first in every session now — freshest effort on the priority',
      'Keep measuring your waist weekly. It is the guardrail on this phase',
      'Push the top set of every compound. The calories are there to be used',
      'Creatine 5g daily, non-negotiable — cheapest performance gain available',
    ],
    accent: '#2d9cff',
  },
];

/** One line of intent for each of the 22 weeks. Ordered, index 0 = week 1. */
export const WEEK_FOCUS: readonly string[] = [
  'Set the baseline. Weigh in, measure your waist, take all three photos. You cannot steer without a starting point.',
  'Lock the food in. Same meals, same times — decision fatigue is what breaks deficits.',
  'Volume steps up. One extra set on every compound.',
  'First honest read on the trend. Losing under 0.4 kg/wk? Take 100 off rest days.',
  'Peak volume of the phase. This is the hardest training week so far.',
  'DELOAD. Volume down 40%, calories unchanged. You grow this week, not last week.',
  'Back to full volume. Strength should feel better than week 5 — that is the deload working.',
  'End of Phase 1. Full measurements. The waist number should be 5–7 cm down.',
  'CARVE opens. Calories up slightly, rate slows. Trust it.',
  'First refeed Saturday. Eat the carbs, do not fear the water weight the next morning.',
  'Flank fat starts moving now. Compare side photos to week 1, not to yesterday.',
  'DELOAD. The lowest-body-fat weeks are the ones where recovery breaks first.',
  'Push the leg and lower-back work hard. These are still growing on a deficit.',
  'End of the cut. Full measurements, full photos. This is your leanest point.',
  'BUILD opens. Calories jump. Expect 1–2 kg of scale weight in 5 days — that is glycogen and water, not fat.',
  'Chest volume peaks. Incline first, every session, freshest.',
  'Add load, not reps. The rep ranges are already correct.',
  'DELOAD. Surplus stays. This is where the tissue actually assembles.',
  'Waist check. Up more than 2.5 cm from week 14? Drop to 2,700 kcal.',
  'Strength should be at all-time highs. If it is not, you are under-eating or under-sleeping.',
  'Second-to-last week. Push every top set to genuine failure.',
  'Final week. Full measurements, full photos, and set the next block.',
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
  const startMs = toMidnight(PROTOCOL_START);
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
  const isRefeed = phase.refeed !== undefined && dow === phase.refeedDay;

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
 * Linear volume ramp inside each phase, reset at every phase boundary, with one
 * planned deload. Accumulated fatigue is what stalls a 22-week block — the
 * deload is not optional recovery, it is where the adaptation is expressed.
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
  const ms = toMidnight(PROTOCOL_START) + (week - 1) * 7 * DAY_MS;
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
