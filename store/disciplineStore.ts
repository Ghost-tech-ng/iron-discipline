import { create } from 'zustand';
import type { DisciplineState } from '../types';

const WEIGHTS = {
  workoutDone: 25,
  proteinHit: 20,
  calorieHit: 15,
  supplementsTaken: 15,
  waterGoalHit: 10,
  sleepLogged: 10,
  cardioLogged: 5,
} as const;

const TOTAL_SUPPLEMENTS = 6;

function computeScore(state: Omit<DisciplineState, 'score'>): number {
  let score = 0;
  if (state.workoutDone) score += WEIGHTS.workoutDone;
  if (state.proteinHit) score += WEIGHTS.proteinHit;
  if (state.calorieHit) score += WEIGHTS.calorieHit;
  score +=
    (state.supplementsTaken.length / TOTAL_SUPPLEMENTS) * WEIGHTS.supplementsTaken;
  if (state.waterGoalHit) score += WEIGHTS.waterGoalHit;
  if (state.sleepLogged) score += WEIGHTS.sleepLogged;
  if (state.cardioLogged) score += WEIGHTS.cardioLogged;
  return Math.round(Math.min(100, score));
}

const todayStr = () => new Date().toISOString().split('T')[0];

interface DisciplineStore extends DisciplineState {
  setWorkoutDone: (done: boolean) => void;
  setProteinHit: (hit: boolean) => void;
  setCalorieHit: (hit: boolean) => void;
  markSupplementTaken: (id: string) => void;
  setWaterGoalHit: (hit: boolean) => void;
  setSleepLogged: (logged: boolean) => void;
  setCardioLogged: (logged: boolean) => void;
  resetDay: () => void;
}

const initialState: Omit<DisciplineState, 'score'> = {
  date: todayStr(),
  workoutDone: false,
  proteinHit: false,
  calorieHit: false,
  supplementsTaken: [],
  waterGoalHit: false,
  sleepLogged: false,
  cardioLogged: false,
};

export const useDisciplineStore = create<DisciplineStore>((set) => ({
  ...initialState,
  score: 0,

  setWorkoutDone: (workoutDone) =>
    set((s) => {
      const next = { ...s, workoutDone };
      return { ...next, score: computeScore(next) };
    }),

  setProteinHit: (proteinHit) =>
    set((s) => {
      const next = { ...s, proteinHit };
      return { ...next, score: computeScore(next) };
    }),

  setCalorieHit: (calorieHit) =>
    set((s) => {
      const next = { ...s, calorieHit };
      return { ...next, score: computeScore(next) };
    }),

  markSupplementTaken: (id) =>
    set((s) => {
      const supplementsTaken = s.supplementsTaken.includes(id)
        ? s.supplementsTaken.filter((x) => x !== id)
        : [...s.supplementsTaken, id];
      const next = { ...s, supplementsTaken };
      return { ...next, score: computeScore(next) };
    }),

  setWaterGoalHit: (waterGoalHit) =>
    set((s) => {
      const next = { ...s, waterGoalHit };
      return { ...next, score: computeScore(next) };
    }),

  setSleepLogged: (sleepLogged) =>
    set((s) => {
      const next = { ...s, sleepLogged };
      return { ...next, score: computeScore(next) };
    }),

  setCardioLogged: (cardioLogged) =>
    set((s) => {
      const next = { ...s, cardioLogged };
      return { ...next, score: computeScore(next) };
    }),

  resetDay: () =>
    set({ ...initialState, date: todayStr(), score: 0 }),
}));
