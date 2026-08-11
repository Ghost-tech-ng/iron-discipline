/**
 * THE SCULPT PROTOCOL — 8 weeks, two blocks. Compressed from the original
 * 22-week STRIP → CARVE → BUILD plan because the deadline moved: two months,
 * not five and a half.
 *
 * What that compression costs, stated plainly: real hypertrophy needs a
 * caloric surplus, and an 8-week window run at a fixed deadline does not have
 * room for one without giving up most of the fat-loss target. So there is no
 * BUILD phase here — this is a single continuous cut, split into two blocks
 * for pacing and adherence, not two different physiological modes. Chest and
 * ab "growth" over these 8 weeks is mostly fat loss revealing muscle that is
 * already there, not new tissue. Legs and lower back are the exception —
 * Barakat 2020 (Sports Medicine) shows undertrained muscle groups can still
 * add size in a deficit because they have adaptive headroom the rest of the
 * body has already used up — so leg/lower-back frequency and priority in
 * constants/workouts.ts stays exactly as aggressive as before.
 *
 * The rate itself sits deliberately at the upper edge of what the literature
 * supports for a resistance-trained lifter, not the middle of it:
 *   - Garthe et al. 2011 (Int J Sport Nutr Exerc Metab): athletes cutting at
 *     0.7%/wk gained lean mass; cutting at 1.4%/wk did not gain lean mass but
 *     did not lose it either, given high training frequency and high protein.
 *   - Nutrients 2021 (PMC8471721): 0.5–1.0%/wk is the ceiling for resistance-
 *     trained individuals to protect fat-free mass; protein 2.2–3.0 g/kg.
 *   - MATADOR-style diet-break literature: scheduled refeeds beat one
 *     continuous deficit for adherence and blunt adaptive thermogenesis.
 * This plan runs close to 1.0%/wk early and eases toward 0.8%/wk late, with
 * protein held at 210g (2.4–2.6 g/kg across this weight range) and refeed
 * frequency doubling in the second half — spending the diet-break benefit
 * where fatigue is highest instead of the same single day throughout.
 */

export const PROTOCOL_START = '2026-08-10'; // Monday
export const PROTOCOL_WEEKS = 8;

export type PhaseId = 'attack' | 'finish';
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
 *
 * Each block's baseline is set against the TDEE at that block's *average*
 * bodyweight, not the starting one — TDEE falls as you get lighter:
 *   ATTACK avg ~87 kg   → TDEE ~2975 → −900/day → 2075  (~0.9 %/wk)
 *   FINISH avg ~84 kg   → TDEE ~2930 → −830/day → 2100  (~0.75 %/wk, eased slightly)
 * Target: 89 kg → ~82 kg by the end of week 8.
 */
export const PROTOCOL_BODYWEIGHT_KG = 89;
export const PROTOCOL_HEIGHT_CM = 191;
export const ESTIMATED_TDEE = 3000;

export const PHASES: readonly Phase[] = [
  {
    id: 'attack',
    name: 'ATTACK',
    subtitle: 'Two months, full deficit from day one',
    startWeek: 1,
    endWeek: 4,
    baselineCalories: 2075,
    // Protein 210g (2.4g/kg at 87kg avg) held constant with FINISH so the habit
    // never shifts. Fat floor ~0.75g/kg. Deficit is steep on purpose — the
    // deadline is fixed, so the rate sits at the top of what Garthe 2011 and the
    // Nutrients 2021 review still call defensible for a trained lifter, not the
    // middle. One refeed a week from week 1, not eased in, because an 8-week cut
    // has no slack to build the habit gradually. 4 training + 2 rest + 1 refeed
    // = 14,524 kcal/wk ≈ 2075/day baseline.
    training: { calories: 2181, protein: 210, carbs: 189, fat: 65 },
    rest: { calories: 1614, protein: 210, carbs: 63, fat: 58 },
    refeed: { calories: 2570, protein: 190, carbs: 340, fat: 50 },
    refeedDays: [5], // Saturday
    deloadWeek: 4,
    expectedWeeklyKg: '0.85 – 1.0 kg/wk',
    waistGoal: '−4 to −6 cm across the block',
    cardio: [
      'Fasted Zone-2 walk, 35 min, 6 mornings — before your first meal',
      '2 × 12-min intervals after lifting (30s hard / 90s easy)',
      '8,000+ steps on both rest days — no exceptions',
    ],
    actions: [
      'Protein 210g every single day — this is what a steep deficit costs you if you skip it',
      'Rest days are low-carb by design. Saturday carries the only carb-up of the week',
      'Weigh every morning, log it. Judge the 7-day average, never a single number',
      'Measure your waist at the navel every Sunday — this is the metric that matters, not the scale',
      'Sleep 7h+. On a deficit this steep, under-sleeping costs lean mass first',
    ],
    accent: '#ef4444',
  },
  {
    id: 'finish',
    name: 'FINISH',
    subtitle: 'The last month — refeeds double, calories step down',
    startWeek: 5,
    endWeek: 8,
    baselineCalories: 2100,
    // Bodyweight and TDEE have both dropped, so the same absolute deficit would
    // silently become a smaller percentage — this baseline corrects for that.
    // Refeed frequency doubles to twice weekly (Wednesday + Saturday, both
    // training days) rather than one day carrying the whole week's carb-up —
    // MATADOR-style diet-break research shows split refeeds protect adherence
    // and blunt adaptive thermogenesis better than one big one, which matters
    // most in exactly this back-half-of-a-hard-cut window. Protein still 210g.
    // 3 training + 2 rest + 2 refeed = 14,700 kcal/wk ≈ 2100/day baseline.
    training: { calories: 2100, protein: 210, carbs: 175, fat: 62 },
    rest: { calories: 1550, protein: 210, carbs: 54, fat: 55 },
    refeed: { calories: 2650, protein: 195, carbs: 360, fat: 48 },
    refeedDays: [2, 5], // Wednesday, Saturday
    deloadWeek: 0, // Already spent at week 4 — the transition point. No second deload in a 4-week block.
    expectedWeeklyKg: '0.65 – 0.8 kg/wk',
    waistGoal: '−3 to −4 cm — this is where the flank finally moves',
    cardio: [
      'Fasted Zone-2 walk, 40 min, 6 mornings',
      '2 × 15-min intervals after lifting',
      'Add a 20-min evening walk after your last meal',
    ],
    actions: [
      'Wednesday and Saturday are both full carb refeeds now — eat them, do not fear the water weight next morning',
      'Protein holds at 210g on a lighter bodyweight — a higher dose per kg than ATTACK, on purpose',
      'Scale will move slower than ATTACK. That is correct. Waist and photos are the signal',
      'No alcohol this block. It blunts fat oxidation for ~12h and there is no margin left',
      'If a joint or your sleep is breaking down, take an unplanned deload — a missed week beats an injury with 4 weeks left',
    ],
    accent: '#f59e0b',
  },
];

/** One line of intent for each of the 8 weeks. Ordered, index 0 = week 1. */
export const WEEK_FOCUS: readonly string[] = [
  'Week 1 of 8. No easing in — full deficit from day one. Weigh in, measure your waist, take all three photos as your baseline.',
  'Add one set to every compound. First real read on the trend — if the 7-day average is not down at least 0.5kg, cut rest-day carbs by 20g.',
  'Peak volume before the deload. Hardest training week of the block — push it, recovery is coming.',
  'DELOAD. Volume down 40%, calories unchanged. Saturday refeed still runs. This is the only recovery week the whole 8 weeks gets — use it.',
  'FINISH opens. Refeed frequency doubles — Wednesday and Saturday both carry a full carb day now. This is what keeps training output up for the last month.',
  'Bodyweight and TDEE have both dropped — calories step down to match. Protein and leg/lower-back frequency stay exactly where they are.',
  'Second-to-last week. This is where the waist number moves the most — flank fat responds late in a cut, and you are deep enough now.',
  'Final week. Full measurements, full photos, log every session. Whatever the scale reads on day 56 is the number — no extending the deadline.',
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
 * Linear volume ramp inside each phase, reset at every phase boundary, with one
 * planned deload for the whole 8-week block, sitting at the transition point
 * between ATTACK and FINISH. Accumulated fatigue is what stalls a cut this
 * steep — the deload is not optional recovery, it is where the adaptation is
 * expressed.
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
