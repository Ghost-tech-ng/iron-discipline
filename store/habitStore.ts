import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { HabitItem } from '../types';

const todayStr = () => new Date().toISOString().split('T')[0];

const DEFAULT_HABITS: HabitItem[] = [
  { id: 'steps', label: '8,000+ Steps', completed: false, weight: 17 },
  { id: 'sleep', label: '7–8 Hours Sleep', completed: false, weight: 17 },
  { id: 'no_junk', label: 'No Junk Food', completed: false, weight: 17 },
  { id: 'water', label: 'Water Goal (3.5L)', completed: false, weight: 17 },
  { id: 'cardio', label: 'Cardio / Active Rest', completed: false, weight: 16 },
  { id: 'core', label: '2-Min Core', completed: false, weight: 16 },
];

interface HabitStore {
  habits: HabitItem[];
  date: string;
  toggleHabit: (id: string) => void;
  resetHabits: () => void;
  completionPercent: () => number;
  checkNewDay: () => void;
}

export const useHabitStore = create<HabitStore>()(
  persist(
    (set, get) => ({
      habits: DEFAULT_HABITS,
      date: todayStr(),

      toggleHabit: (id) =>
        set((state) => ({
          habits: state.habits.map((h) =>
            h.id === id ? { ...h, completed: !h.completed } : h
          ),
        })),

      resetHabits: () =>
        set({
          habits: DEFAULT_HABITS.map((h) => ({ ...h, completed: false })),
          date: todayStr(),
        }),

      completionPercent: () => {
        const { habits } = get();
        const done = habits.filter((h) => h.completed).length;
        return Math.round((done / habits.length) * 100);
      },

      checkNewDay: () => {
        const today = todayStr();
        if (get().date !== today) {
          set({
            habits: DEFAULT_HABITS.map((h) => ({ ...h, completed: false })),
            date: today,
          });
        }
      },
    }),
    {
      name: 'habit-store-v2',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
