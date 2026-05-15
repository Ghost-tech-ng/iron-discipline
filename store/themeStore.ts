import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeStore {
  isDark: boolean;
  hydrated: boolean;
  toggleTheme: () => void;
  loadTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  isDark: true,
  hydrated: false,

  toggleTheme: () => {
    const next = !get().isDark;
    set({ isDark: next });
    AsyncStorage.setItem('theme', next ? 'dark' : 'light').catch(() => {});
  },

  loadTheme: async () => {
    try {
      const saved = await AsyncStorage.getItem('theme');
      set({ isDark: saved !== 'light', hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },
}));
