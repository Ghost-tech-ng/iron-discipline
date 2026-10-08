import { localIso, daysAgoIso } from './date';

export interface HeatDay {
  date: string;
  score: number;
}

export type RankId = 'raw' | 'tempered' | 'forged' | 'damascus';

export interface Rank {
  id: RankId;
  name: string;
  letter: string;
  /** Consecutive days at or above `minHeat` needed to earn it. 0 = not earned by a run. */
  days: number;
  minHeat: number;
}

export const RANKS: readonly Rank[] = [
  { id: 'raw', name: 'Raw', letter: 'R', days: 0, minHeat: 0 },
  { id: 'tempered', name: 'Tempered', letter: 'T', days: 7, minHeat: 70 },
  { id: 'forged', name: 'Forged', letter: 'F', days: 21, minHeat: 80 },
  { id: 'damascus', name: 'Damascus', letter: 'D', days: 0, minHeat: 0 },
];

/** A day counts toward the hallmark streak at 50° and up. */
export const HALLMARK_HEAT = 50;

function byDate(history: readonly HeatDay[]): Map<string, number> {
  return new Map(history.map((h) => [h.date, h.score]));
}

/** Consecutive hallmarked days before today. Today is still being played, so it never breaks the streak. */
export function computeStreak(history: readonly HeatDay[]): number {
  const scores = byDate(history);
  let streak = 0;
  for (let i = 1; i <= history.length; i++) {
    const s = scores.get(daysAgoIso(i));
    if (s === undefined || s < HALLMARK_HEAT) break;
    streak++;
  }
  return streak;
}

/** Current run of days at or above `minHeat`, counting today only once it qualifies. */
export function currentRun(history: readonly HeatDay[], todayScore: number, minHeat: number): number {
  const scores = byDate(history);
  let run = todayScore >= minHeat ? 1 : 0;
  for (let i = 1; i <= history.length; i++) {
    const s = scores.get(daysAgoIso(i));
    if (s === undefined || s < minHeat) break;
    run++;
  }
  return run;
}

/** Longest run of consecutive calendar days at or above `minHeat` anywhere in the window. */
function longestRun(history: readonly HeatDay[], todayScore: number, minHeat: number): number {
  const scores = byDate(history);
  scores.set(localIso(), todayScore);
  const dates = [...scores.keys()].filter((d) => (scores.get(d) ?? 0) >= minHeat).sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of dates) {
    run = prev !== null && nextDay(prev) === d ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

function nextDay(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return localIso(new Date(y, m - 1, d + 1));
}

/** Ranks are earned, not held: once a run earns one, a later miss doesn't strip it. */
export function computeRank(history: readonly HeatDay[], todayScore: number, protocolComplete: boolean): Rank {
  if (protocolComplete) return RANKS[3];
  if (longestRun(history, todayScore, RANKS[2].minHeat) >= RANKS[2].days) return RANKS[2];
  if (longestRun(history, todayScore, RANKS[1].minHeat) >= RANKS[1].days) return RANKS[1];
  return RANKS[0];
}

export function nextRank(rank: Rank): Rank | null {
  const i = RANKS.findIndex((r) => r.id === rank.id);
  return i >= 0 && i < RANKS.length - 1 ? RANKS[i + 1] : null;
}

/** Today's heat against yesterday's. Null when yesterday wasn't logged. */
export function heatDelta(history: readonly HeatDay[], todayScore: number): number | null {
  const y = byDate(history).get(daysAgoIso(1));
  return y === undefined ? null : todayScore - y;
}
