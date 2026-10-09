import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DragonStage } from '../utils/dragon';

export interface DragonCheer {
  id: number;
  text: string;
  big: boolean;
}

interface DragonStore {
  hidden: boolean;
  /** Last stage the dragon was seen at, so an evolution is celebrated exactly once. */
  lastStage: DragonStage | null;
  cheer: DragonCheer | null;
  toggleHidden: () => void;
  setLastStage: (stage: DragonStage) => void;
  cheerFor: (text: string, big: boolean) => void;
}

let cheerSeq = 0;

export const useDragonStore = create<DragonStore>()(
  persist(
    (set) => ({
      hidden: false,
      lastStage: null,
      cheer: null,
      toggleHidden: () => set((s) => ({ hidden: !s.hidden })),
      setLastStage: (lastStage) => set({ lastStage }),
      cheerFor: (text, big) => set({ cheer: { id: ++cheerSeq, text, big } }),
    }),
    {
      name: 'dragon',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ hidden: s.hidden, lastStage: s.lastStage }),
    }
  )
);
