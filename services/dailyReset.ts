import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadWeeklyCheckIns } from './disciplineService';
import { sendImmediateNotification } from './notificationService';
import { useDisciplineStore } from '../store/disciplineStore';
import { useHabitStore } from '../store/habitStore';
import { useNutritionStore } from '../store/nutritionStore';
import { localIso } from '../utils/date';

const LAST_RESET_KEY = 'iron_last_reset_date';

let lastResetCache: string | null = null;

/**
 * Wipes in-memory daily state when the calendar day has changed. Safe to call
 * often (startup, app resume, a timer) — after the first read it is a string
 * compare. Yesterday's score needs no saving here: the discipline store writes
 * it to SQLite on every change. Returns true if a reset happened.
 */
export async function checkAndRunDailyReset(): Promise<boolean> {
  const today = localIso();
  if (lastResetCache === today) return false;

  if (lastResetCache === null) {
    try {
      lastResetCache = await AsyncStorage.getItem(LAST_RESET_KEY);
    } catch {
      // AsyncStorage unavailable — proceed as fresh day
    }
    if (lastResetCache === today) return false;
  }

  useDisciplineStore.getState().resetDay();
  useHabitStore.getState().resetHabits();
  useNutritionStore.getState().resetDay(today);

  lastResetCache = today;
  try {
    await AsyncStorage.setItem(LAST_RESET_KEY, today);
  } catch {
    // Non-fatal
  }

  await checkWeighInOverdue();
  return true;
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
