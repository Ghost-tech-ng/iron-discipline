import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FoodItem } from '../types';

const KEY = 'custom_foods_v1';

interface CustomFoodStore {
  foods: FoodItem[];
  addFood: (food: FoodItem) => Promise<void>;
  removeFood: (id: string) => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useCustomFoodStore = create<CustomFoodStore>((set, get) => ({
  foods: [],

  addFood: async (food) => {
    const next = [{ ...food, id: `my_${Date.now()}` }, ...get().foods];
    set({ foods: next });
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  },

  removeFood: async (id) => {
    const next = get().foods.filter((f) => f.id !== id);
    set({ foods: next });
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  },

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) set({ foods: JSON.parse(raw) as FoodItem[] });
    } catch {}
  },
}));
