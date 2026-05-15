import { create } from 'zustand';
import type { WorkoutLog, ExerciseLog, SetLog } from '../types';

interface WorkoutStore {
  activeWorkout: WorkoutLog | null;
  history: WorkoutLog[];
  startWorkout: (log: Omit<WorkoutLog, 'id' | 'durationMinutes' | 'completed'>) => void;
  logSet: (exerciseId: string, set: SetLog) => void;
  completeWorkout: (durationMinutes: number) => void;
  cancelWorkout: () => void;
  loadHistory: (logs: WorkoutLog[]) => void;
  getLastSession: (sessionType: string) => WorkoutLog | undefined;
}

export const useWorkoutStore = create<WorkoutStore>((set, get) => ({
  activeWorkout: null,
  history: [],

  startWorkout: (log) =>
    set({
      activeWorkout: {
        ...log,
        id: `workout_${Date.now()}`,
        durationMinutes: 0,
        completed: false,
      },
    }),

  logSet: (exerciseId, newSet) =>
    set((state) => {
      if (!state.activeWorkout) return state;
      const logs = state.activeWorkout.exerciseLogs.map((el) => {
        if (el.exerciseId !== exerciseId) return el;
        const existing = el.sets.findIndex((s) => s.setNumber === newSet.setNumber);
        const sets =
          existing >= 0
            ? el.sets.map((s) => (s.setNumber === newSet.setNumber ? newSet : s))
            : [...el.sets, newSet];
        return { ...el, sets };
      });
      return { activeWorkout: { ...state.activeWorkout, exerciseLogs: logs } };
    }),

  completeWorkout: (durationMinutes) =>
    set((state) => {
      if (!state.activeWorkout) return state;
      const completed = { ...state.activeWorkout, durationMinutes, completed: true };
      return {
        activeWorkout: null,
        history: [completed, ...state.history],
      };
    }),

  cancelWorkout: () => set({ activeWorkout: null }),

  loadHistory: (logs) => set({ history: logs }),

  getLastSession: (sessionType) =>
    get().history.find((h) => h.sessionType === sessionType && h.completed),
}));
