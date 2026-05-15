import { create } from 'zustand';
import type { HabitItem } from '../types';

const DEFAULT_HABITS: HabitItem[] = [
  { id: 'steps', label: '8,000+ Steps', completed: false, weight: 20 },
  { id: 'sleep', label: '7–8 Hours Sleep', completed: false, weight: 20 },
  { id: 'no_junk', label: 'No Junk Food', completed: false, weight: 20 },
  { id: 'water', label: 'Water Goal (3.5L)', completed: false, weight: 20 },
  { id: 'cardio', label: 'Cardio / Active Rest', completed: false, weight: 20 },
];

interface HabitStore {
  habits: HabitItem[];
  toggleHabit: (id: string) => void;
  resetHabits: () => void;
  completionPercent: () => number;
}

export const useHabitStore = create<HabitStore>((set, get) => ({
  habits: DEFAULT_HABITS,

  toggleHabit: (id) =>
    set((state) => ({
      habits: state.habits.map((h) =>
        h.id === id ? { ...h, completed: !h.completed } : h
      ),
    })),

  resetHabits: () =>
    set({
      habits: DEFAULT_HABITS.map((h) => ({ ...h, completed: false })),
    }),

  completionPercent: () => {
    const { habits } = get();
    const done = habits.filter((h) => h.completed).length;
    return Math.round((done / habits.length) * 100);
  },
}));
