import type { RankId } from './heat';

export type DragonStage = 'egg' | 'hatchling' | 'drake' | 'dragon';
export type DragonMood = 'blazing' | 'content' | 'sluggish' | 'sleeping';

export const STAGE_ORDER: readonly DragonStage[] = ['egg', 'hatchling', 'drake', 'dragon'];

const STAGE_BY_RANK: Record<RankId, DragonStage> = {
  raw: 'egg',
  tempered: 'hatchling',
  forged: 'drake',
  damascus: 'dragon',
};

const BASE_SIZE: Record<DragonStage, number> = { egg: 38, hatchling: 50, drake: 62, dragon: 74 };

export const EVOLVE_TEXT: Record<DragonStage, string> = {
  egg: 'AN EGG APPEARS',
  hatchling: 'I HATCHED!',
  drake: 'I GREW WINGS!',
  dragon: 'DAMASCUS FORM',
};

export function dragonStage(rank: RankId): DragonStage {
  return STAGE_BY_RANK[rank];
}

/** The hallmark streak grows it within a stage, topping out at +25% on a 30-day run. */
export function dragonSize(stage: DragonStage, streak: number): number {
  return Math.round(BASE_SIZE[stage] * (1 + Math.min(streak, 30) / 120));
}

export function dragonMood(score: number, hour: number): DragonMood {
  if (hour >= 22 || hour < 6) return 'sleeping';
  if (score >= 70) return 'blazing';
  // Every day starts at 0°, so only call it sluggish once the afternoon has gone by.
  if (score < 30 && hour >= 15) return 'sluggish';
  return 'content';
}

export function canFly(stage: DragonStage): boolean {
  return stage === 'drake' || stage === 'dragon';
}

/** Idle chatter when nothing has happened for a while. Null = stay quiet. */
export function nudgeText(mood: DragonMood, hour: number, flags: { workoutDone: boolean; proteinHit: boolean }): string | null {
  if (mood === 'sleeping') return null;
  if (!flags.workoutDone && hour >= 16) return 'TRAIN TODAY?';
  if (!flags.proteinHit && hour >= 18) return 'PROTEIN…';
  if (mood === 'sluggish') return 'FEED THE FIRE';
  if (mood === 'blazing') return 'RED-HOT';
  return null;
}
