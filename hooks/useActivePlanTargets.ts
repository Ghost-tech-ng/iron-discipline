import { getProtocolStatus, type DayType, type Phase } from '../constants/phases';
import { USER_TARGETS } from '../constants/nutrition';

export interface ActiveTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  water: number;
  dayType: DayType;
  dayLabel: string;
  phase: Phase;
  week: number;
  isDeloadWeek: boolean;
  /** Why today's numbers look the way they do. */
  rationale: string;
}

const DAY_LABELS: Record<DayType, string> = {
  training: 'TRAINING DAY',
  rest: 'REST DAY',
  refeed: 'REFEED DAY',
};

function rationaleFor(dayType: DayType, phase: Phase): string {
  if (dayType === 'refeed') {
    return phase.id === 'finish'
      ? 'Full carb refeed — the second one this week. Restores muscle glycogen and pushes leptin back up, which is what keeps training output up this late into a steep cut.'
      : 'Full carb refeed. Restores muscle glycogen and pushes leptin back up after a run of deficit days — this is why the next training week feels strong instead of flat.';
  }
  if (dayType === 'rest') {
    return 'Carbs are low because you are not training. The week averages out; the carbs you skip today land on the days you actually use them.';
  }
  return 'Training day. Higher carbs fuel the work and get partitioned toward muscle, not stored — this is the point of cycling.';
}

/**
 * Today's macro targets. Driven entirely by the Sculpt Protocol phase engine:
 * which phase you are in, and whether today is a training, rest or refeed day.
 * Weekly averages hit the phase baseline by construction.
 */
export function useActivePlanTargets(): ActiveTargets {
  const s = getProtocolStatus();

  if (!s.isActive) {
    return {
      calories: USER_TARGETS.calories,
      protein: USER_TARGETS.protein,
      carbs: USER_TARGETS.carbs,
      fat: USER_TARGETS.fat,
      water: USER_TARGETS.waterMl,
      dayType: 'training',
      dayLabel: 'OFF PROTOCOL',
      phase: s.phase,
      week: s.week,
      isDeloadWeek: false,
      rationale: 'No active phase. Running on maintenance defaults.',
    };
  }

  return {
    calories: s.targets.calories,
    protein: s.targets.protein,
    carbs: s.targets.carbs,
    fat: s.targets.fat,
    water: s.dayType === 'refeed' ? USER_TARGETS.waterMl + 500 : USER_TARGETS.waterMl,
    dayType: s.dayType,
    dayLabel: DAY_LABELS[s.dayType],
    phase: s.phase,
    week: s.week,
    isDeloadWeek: s.isDeloadWeek,
    rationale: rationaleFor(s.dayType, s.phase),
  };
}
