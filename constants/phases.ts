import { localIso } from '../utils/date';
import type { ColorScheme } from './theme';

/**
 * THE SCULPT PROTOCOL — 16 weeks, two blocks: ATTACK then BUILD.
 *
 * Goal (set 2026-10-07): 12% body fat — full six-pack, small waist, big chest.
 * That outranks the earlier 87 kg floor. At 89 kg with a ~92 cm navel waist,
 * body fat sits somewhere around 15-18%, so lean mass is ~73-76 kg and 12% lands
 * at roughly 83-86 kg. 87 kg would stop the cut around 14-16%: upper abs in good
 * light, not the full set. The working target is ~84 kg, but the mirror and the
 * waist decide when the cut is done, not the scale.
 *
 *   - ATTACK (weeks 1-10): ~0.5-0.7 kg/wk, about 0.7%/wk of bodyweight.
 *     Garthe et al. 2011 (Int J Sport Nutr Exerc Metab): trained athletes
 *     cutting at 0.7%/wk kept or gained lean mass; 1.4%/wk did not. Nutrients
 *     2021 (PMC8471721): 0.5-1.0%/wk is the ceiling for protecting fat-free mass
 *     in lifters, protein 2.2-3.0 g/kg. 210 g at ~86 kg is ~2.4 g/kg. One
 *     Saturday refeed a week for adherence (MATADOR-style diet-break
 *     literature). Heavy pressing stays in so the chest keeps its size while
 *     the fat over it comes off.
 *   - BUILD (weeks 11-16): a small, deliberate surplus (~+200-250 kcal/day) to
 *     add chest, shoulder and arm size from a lean start, where more of a
 *     surplus goes to muscle than fat. The waist is the guardrail: a rise of
 *     more than 1 cm in a week means the surplus is too big.
 */

export const PROTOCOL_START = '2026-08-10'; // Monday
export const PROTOCOL_WEEKS = 16;

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
  /** Theme colour key so each phase reads distinctly in both light and dark mode. */
  accent: keyof ColorScheme;
}

/**
 * Everything below is derived from these, so if bodyweight is wrong the whole
 * protocol is wrong. Recalculate the baselines if this changes by more than ~3kg.
 *
 * Mifflin-St Jeor at 89 kg / 191 cm / male / ~30 yr → BMR ≈ 1940 kcal.
 * Activity ×1.55 (5 lifting sessions + daily Zone-2 walking) → TDEE ≈ 3000 kcal.
 * TDEE(w) ≈ 15.5w + 1625.5625, so TDEE falls as weight drops: TDEE(86.5) ≈ 2966,
 * TDEE(84) ≈ 2928.
 *
 * ATTACK avg ~86.5 kg → TDEE ~2966 → −660/day → 2306 (~0.6 kg/wk, ~0.7%/wk)
 * BUILD  avg ~84.5 kg → TDEE ~2935 → +220/day → 3157 (~0.2-0.3 kg/wk up)
 * Target: 89 kg → ~84 kg by end of week 10, then a slow lean gain to week 16.
 */
export const PROTOCOL_BODYWEIGHT_KG = 89;
export const PROTOCOL_HEIGHT_CM = 191;
export const ESTIMATED_TDEE = 3000;

export const PHASES: readonly Phase[] = [
  {
    id: 'attack',
    name: 'ATTACK',
    subtitle: 'Ten weeks to 12% — 89kg down to ~84kg, every ab visible',
    startWeek: 1,
    endWeek: 10,
    baselineCalories: 2306,
    // Protein 210g (~2.4g/kg at 86.5kg avg) held constant with BUILD so the habit
    // never shifts. Fat ~0.7g/kg averaged across the week — rest days dip lower
    // and the refeed lower still so carbs can carry it. One refeed, Saturday.
    // 4 training + 2 rest + 1 refeed = 16,140 kcal/wk ≈ 2306/day baseline.
    training: { calories: 2420, protein: 210, carbs: 249, fat: 65 },
    rest: { calories: 1880, protein: 210, carbs: 130, fat: 58 },
    refeed: { calories: 2700, protein: 190, carbs: 372, fat: 50 },
    refeedDays: [5], // Saturday
    deloadWeek: 6,
    expectedWeeklyKg: '0.5 – 0.7 kg/wk down',
    waistGoal: '−5 to −8 cm across the block',
    cardio: [
      'Fasted Zone-2 walk, 35 min, 6 mornings — before your first meal',
      '2 × 12-min intervals after lifting (30s hard / 90s easy)',
      '8,000+ steps on both rest days — no exceptions',
    ],
    actions: [
      "Protein 210g every single day — this is what keeps the chest and the abs underneath the fat you're losing",
      'Rest days are lower-carb by design. Saturday carries the carb-up for the week',
      'Keep every press heavy. Dropping the weight on a cut is how the chest goes flat',
      'Weigh every morning, log it. Judge the 7-day average, never a single number',
      'Measure your waist at the navel every Sunday morning, relaxed, before food — this is the metric that matters, not the scale',
      'Done early if all six abs show in morning light and the waist has stalled two weeks — switch to BUILD. Hard floor: 82kg on the 7-day average',
      'Sleep 7h+. Under-sleeping on a deficit costs lean mass first',
    ],
    accent: 'accent',
  },
  {
    id: 'build',
    name: 'BUILD',
    subtitle: 'Lean gain — chest and shoulders grow while the waist holds',
    startWeek: 11,
    endWeek: 16,
    baselineCalories: 3157,
    // No refeed: there is no deficit to break up. Training days carry the
    // surplus to fund the session; rest days sit just under TDEE. The week nets
    // ~+220/day over TDEE at ~84.5kg — a lean gain, not a bulk. Protein holds at
    // 210g. 5 training + 2 rest = 22,100 kcal/wk ≈ 3157/day baseline.
    training: { calories: 3300, protein: 210, carbs: 446, fat: 75 },
    rest: { calories: 2800, protein: 210, carbs: 332, fat: 70 },
    deloadWeek: 15,
    expectedWeeklyKg: '0.2 – 0.3 kg/wk up',
    waistGoal: 'Hold within +1cm of your week-10 waist',
    cardio: [
      'Fasted Zone-2 walk, 25 min, 4 mornings — enough for heart health, not enough to eat into recovery',
      '8,000+ steps daily — general activity, not an extra deficit lever',
      'Drop the post-lifting intervals this block — recovery capacity goes into training volume, not conditioning',
    ],
    actions: [
      'Protein holds at 210g — the single biggest lever for whether the surplus builds muscle or just adds fat',
      'Weigh every morning and judge it against the waist — scale up 0.2-0.3kg a week with a flat waist is exactly right',
      'Measure waist every Sunday — if it climbs more than 1cm in a week, pull training-day carbs back by 50g',
      'Progressive overload every session — the whole reason for the surplus is to have the calories to add weight to the bar',
      'Sleep 7h+ — building needs recovery capacity even more than a cut does',
    ],
    accent: 'accent2',
  },
];

/** One line of intent for each of the 16 weeks. Ordered, index 0 = week 1. */
export const WEEK_FOCUS: readonly string[] = [
  'Week 1 of 16. The cut to 12% starts now — roughly 84kg. Measure your waist at the navel (morning, relaxed, before food), weigh in, take all three photos. That is your baseline.',
  'First real read on the trend. If the 7-day average is not down at least 0.4kg, cut rest-day carbs by 20g.',
  'Add one set to every compound. Keep every press heavy — the deficit reveals the abs, heavy chest work keeps the chest full while it happens.',
  'Trend check: ~1.5-2.5kg down from day one and the waist ~2-3cm smaller. Losing faster than 0.9kg a week means eat more on training days.',
  'Peak volume before the deload. Hardest training week of the first half — push it, recovery is coming.',
  'DELOAD. Volume down 40%, calories unchanged, Saturday refeed still runs. Fatigue drops and strength comes back — the scale often dips this week.',
  'Second half of the cut, back to full volume. Upper abs should be clearly showing; the lower abs and the line under the navel come off last.',
  'Hunger usually peaks around here. Protein, high-volume food and sleep are the fix — never skip the Saturday refeed to speed things up.',
  'Mirror check in morning light. If all six are visible and the waist has stalled for two weeks, you are at 12% — switch to BUILD numbers early.',
  'Last week of the cut. Full measurements and photos. Expect ~84kg and 5-8cm off the waist. Lower abs not there yet? Keep eating ATTACK numbers for 1-2 more weeks before BUILD.',
  'BUILD opens. Small surplus on training days — this is where the chest gets bigger. The waist is the guardrail: up more than 1cm in a week, pull training-day carbs back 50g.',
  'Push loads on presses and rows every session. The surplus is only worth it if the bar moves.',
  'Scale up 0.2-0.3kg a week is the target. More than that is fat, not muscle — the abs should stay sharp.',
  'Peak BUILD volume. Chest, shoulders and arms should look fuller than week 10 with every ab still visible.',
  'DELOAD. Volume down 40%, calories unchanged. Last recovery week of the protocol.',
  'Final week. Full measurements, full photos, log every session. Compare to week 1: smaller waist, full six-pack, bigger chest.',
];

const DAY_MS = 86400000;

function toMidnight(iso: string): number {
  return new Date(iso + 'T00:00:00').getTime();
}

export function todayIso(): string {
  return localIso();
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
 * planned deload in each block (week 6 and week 15). Accumulated
 * fatigue is what stalls training over 16 weeks — the deloads are not
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
  return localIso(new Date(ms));
}

export function formatRange(startIso: string, endIso: string): string {
  const fmt = (iso: string) =>
    new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  return `${fmt(startIso)} – ${fmt(endIso)}`;
}

export function phaseDateRange(phase: Phase): string {
  const start = weekStartDate(phase.startWeek);
  const endMs = toMidnight(weekStartDate(phase.endWeek)) + 6 * DAY_MS;
  return formatRange(start, localIso(new Date(endMs)));
}
