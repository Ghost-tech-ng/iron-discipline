import { create } from 'zustand';
import { loadExerciseSwaps, saveExerciseSwap } from '../services/swapService';

interface SwapStore {
  /** exercise id → substitute name the user picked. Absent = prescribed exercise. */
  swaps: Record<string, string>;
  loaded: boolean;
  load: () => Promise<void>;
  setSwap: (exerciseId: string, swapName: string | null) => Promise<void>;
}

export const useSwapStore = create<SwapStore>()((set, get) => ({
  swaps: {},
  loaded: false,

  load: async () => {
    if (get().loaded) return;
    try {
      set({ swaps: await loadExerciseSwaps(), loaded: true });
    } catch (e) {
      console.warn('[swaps] load failed', e);
    }
  },

  setSwap: async (exerciseId, swapName) => {
    await saveExerciseSwap(exerciseId, swapName);
    const next = { ...get().swaps };
    if (swapName === null) delete next[exerciseId];
    else next[exerciseId] = swapName;
    set({ swaps: next });
  },
}));
