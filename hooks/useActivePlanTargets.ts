import { getActivePlanStatus } from '../constants/plan';
import { USER_TARGETS } from '../constants/nutrition';

export interface ActiveTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  water: number;
}

export function useActivePlanTargets(): ActiveTargets {
  const status = getActivePlanStatus();

  if (!status.isActive) {
    return {
      calories: USER_TARGETS.calories,
      protein: USER_TARGETS.protein,
      carbs: USER_TARGETS.carbs,
      fat: USER_TARGETS.fat,
      water: USER_TARGETS.waterMl,
    };
  }

  if (status.isRefeedDay) {
    return { calories: 2400, protein: 185, carbs: 340, fat: 30, water: USER_TARGETS.waterMl };
  }

  return {
    calories: status.phase.calories,
    protein: status.phase.protein,
    carbs: status.phase.carbs,
    fat: status.phase.fat,
    water: USER_TARGETS.waterMl,
  };
}
