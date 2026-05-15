import { create } from 'zustand';
import type { WeeklyCheckIn } from '../types';

interface ProgressStore {
  checkIns: WeeklyCheckIn[];
  addCheckIn: (checkIn: WeeklyCheckIn) => void;
  loadCheckIns: (checkIns: WeeklyCheckIn[]) => void;
  latestWeight: () => number | null;
  totalLost: () => number | null;
}

export const useProgressStore = create<ProgressStore>((set, get) => ({
  checkIns: [],

  addCheckIn: (checkIn) =>
    set((state) => ({
      checkIns: [checkIn, ...state.checkIns].sort((a, b) => b.week - a.week),
    })),

  loadCheckIns: (checkIns) => set({ checkIns }),

  latestWeight: () => {
    const { checkIns } = get();
    return checkIns.length > 0 ? checkIns[0].weightKg : null;
  },

  totalLost: () => {
    const { checkIns } = get();
    if (checkIns.length < 2) return null;
    const latest = checkIns[0].weightKg;
    const first = checkIns[checkIns.length - 1].weightKg;
    return Math.round((first - latest) * 10) / 10;
  },
}));
