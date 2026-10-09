import { useEffect } from 'react';
import { useDisciplineStore } from '../store/disciplineStore';
import { useHabitStore } from '../store/habitStore';
import { useDragonStore } from '../store/dragonStore';

const FLAG_CHEERS = [
  { key: 'workoutDone', text: 'SESSION DONE', big: true },
  { key: 'proteinHit', text: 'PROTEIN HIT', big: true },
  { key: 'calorieHit', text: 'ON TARGET', big: false },
  { key: 'cardioLogged', text: 'CARDIO IN', big: false },
  { key: 'waterGoalHit', text: 'HYDRATED', big: false },
  { key: 'sleepLogged', text: 'WELL RESTED', big: false },
] as const;

/**
 * Hydration flips flags from false to true too, so listening only starts a
 * beat after `armed` — by then the startup writes have all landed and every
 * remaining transition is the user doing something.
 */
export function useDragonCheers(armed: boolean): void {
  useEffect(() => {
    if (!armed) return;
    let live = false;
    const timer = setTimeout(() => {
      live = true;
    }, 1500);
    const cheer = useDragonStore.getState().cheerFor;

    const unsubDiscipline = useDisciplineStore.subscribe((s, prev) => {
      if (!live || s.date !== prev.date) return;
      const flag = FLAG_CHEERS.find((f) => s[f.key] && !prev[f.key]);
      if (flag) cheer(flag.text, flag.big);
      else if (s.supplementsTaken.length > prev.supplementsTaken.length) cheer('STACKED', false);
    });

    const unsubHabits = useHabitStore.subscribe((s, prev) => {
      if (!live || s.date !== prev.date) return;
      const done = s.habits.filter((h) => h.completed).length;
      const before = prev.habits.filter((h) => h.completed).length;
      if (done <= before) return;
      if (done === s.habits.length) cheer('ALL HABITS LIT', true);
      else cheer(`${done}/${s.habits.length} HABITS`, false);
    });

    return () => {
      clearTimeout(timer);
      unsubDiscipline();
      unsubHabits();
    };
  }, [armed]);
}
