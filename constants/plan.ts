/**
 * Compatibility layer over the Sculpt Protocol phase engine.
 * The 21-day push plan (Jul 14 – Aug 3 2026) is finished; everything here now
 * delegates to constants/phases.ts. Kept so older call sites keep compiling.
 */
import {
  PROTOCOL_START,
  PROTOCOL_WEEKS,
  getProtocolStatus,
  getVolumeModifier,
  weekStartDate,
  type Phase,
} from './phases';

export const PLAN_START = PROTOCOL_START;
export const PLAN_WEEKS = PROTOCOL_WEEKS;

export type PlanStatus = ReturnType<typeof getProtocolStatus>;

export function getActivePlanStatus(): PlanStatus {
  return getProtocolStatus();
}

export function getExtraCompoundSets(): number {
  return getVolumeModifier().extraSets;
}

export { getVolumeModifier, weekStartDate };
export type { Phase };
