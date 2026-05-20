import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveDisciplineScore } from './disciplineService';
import { useDisciplineStore } from '../store/disciplineStore';
import { useHabitStore } from '../store/habitStore';
import { useNutritionStore } from '../store/nutritionStore';

const LAST_RESET_KEY = 'iron_last_reset_date';

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export async function checkAndRunDailyReset(): Promise<void> {
  const today = todayStr();
  let lastReset: string | null = null;

  try {
    lastReset = await AsyncStorage.getItem(LAST_RESET_KEY);
  } catch {
    // AsyncStorage unavailable — proceed as fresh day
  }

  if (lastReset === today) return;

  // Save yesterday's score to SQLite before wiping state
  if (lastReset !== null) {
    const ds = useDisciplineStore.getState();
    if (ds.score > 0) {
      try {
        await saveDisciplineScore(ds.score, {
          workoutDone: ds.workoutDone,
          proteinHit: ds.proteinHit,
          calorieHit: ds.calorieHit,
          waterHit: ds.waterGoalHit,
          sleepLogged: ds.sleepLogged,
          cardioLogged: ds.cardioLogged,
        });
      } catch {
        // Don't block reset if save fails
      }
    }
  }

  // Reset all daily state via Zustand store actions (works outside React)
  useDisciplineStore.getState().resetDay();
  useHabitStore.getState().resetHabits();
  useNutritionStore.getState().resetDay(today);

  try {
    await AsyncStorage.setItem(LAST_RESET_KEY, today);
  } catch {
    // Non-fatal
  }
}
