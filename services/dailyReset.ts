import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveDisciplineScore, loadWeeklyCheckIns } from './disciplineService';
import { sendImmediateNotification } from './notificationService';
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

  await checkWeighInOverdue();
}

async function checkWeighInOverdue(): Promise<void> {
  try {
    const checkIns = await loadWeeklyCheckIns();
    if (checkIns.length === 0) return;
    const lastDate = new Date(checkIns[0].date + 'T00:00:00');
    const daysSince = Math.floor((Date.now() - lastDate.getTime()) / 86400000);
    if (daysSince === 8 || daysSince === 10 || daysSince === 14) {
      await sendImmediateNotification(
        'Weigh-in overdue',
        `${daysSince} days since your last check-in. Log your weight now — you can't manage what you don't measure.`
      );
    }
  } catch {
    // Non-fatal
  }
}
