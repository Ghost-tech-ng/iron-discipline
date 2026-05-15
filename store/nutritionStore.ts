import { create } from 'zustand';
import type { MealEntry, DailyNutrition } from '../types';
import { USER_TARGETS } from '../constants/nutrition';
import { useDisciplineStore } from './disciplineStore';

interface NutritionStore {
  today: DailyNutrition;
  history: DailyNutrition[];
  waterMl: number;
  addMeal: (entry: MealEntry) => void;
  removeMeal: (entryId: string) => void;
  addWater: (ml: number) => void;
  resetDay: (date: string) => void;
  loadHistory: (history: DailyNutrition[]) => void;
  getTotals: () => { calories: number; protein: number; carbs: number; fat: number };
}

const emptyDay = (date: string): DailyNutrition => ({
  date,
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  entries: [],
});

const todayStr = new Date().toISOString().split('T')[0];

export const useNutritionStore = create<NutritionStore>((set, get) => ({
  today: emptyDay(todayStr),
  history: [],
  waterMl: 0,

  addMeal: (entry) =>
    set((state) => {
      const { foodItem, quantity } = entry;
      const ratio = quantity;
      const newProtein = state.today.protein + foodItem.protein * ratio;
      const newCalories = state.today.calories + foodItem.calories * ratio;

      const discipline = useDisciplineStore.getState();
      if (newProtein >= USER_TARGETS.protein) discipline.setProteinHit(true);
      const calLow = USER_TARGETS.calories * 0.9;
      const calHigh = USER_TARGETS.calories * 1.1;
      discipline.setCalorieHit(newCalories >= calLow && newCalories <= calHigh);

      return {
        today: {
          ...state.today,
          calories: newCalories,
          protein: newProtein,
          carbs: state.today.carbs + foodItem.carbs * ratio,
          fat: state.today.fat + foodItem.fat * ratio,
          entries: [...state.today.entries, entry],
        },
      };
    }),

  removeMeal: (entryId) =>
    set((state) => {
      const entry = state.today.entries.find((e) => e.id === entryId);
      if (!entry) return state;
      const { foodItem, quantity } = entry;
      const newProtein = state.today.protein - foodItem.protein * quantity;
      const newCalories = state.today.calories - foodItem.calories * quantity;

      const discipline = useDisciplineStore.getState();
      if (newProtein < USER_TARGETS.protein) discipline.setProteinHit(false);
      const calLow = USER_TARGETS.calories * 0.9;
      const calHigh = USER_TARGETS.calories * 1.1;
      discipline.setCalorieHit(newCalories >= calLow && newCalories <= calHigh);

      return {
        today: {
          ...state.today,
          calories: newCalories,
          protein: newProtein,
          carbs: state.today.carbs - foodItem.carbs * quantity,
          fat: state.today.fat - foodItem.fat * quantity,
          entries: state.today.entries.filter((e) => e.id !== entryId),
        },
      };
    }),

  addWater: (ml) => set((state) => ({ waterMl: state.waterMl + ml })),

  resetDay: (date) => set({ today: emptyDay(date), waterMl: 0 }),

  loadHistory: (history) => set({ history }),

  getTotals: () => {
    const { today } = get();
    return {
      calories: Math.round(today.calories),
      protein: Math.round(today.protein),
      carbs: Math.round(today.carbs),
      fat: Math.round(today.fat),
    };
  },
}));
