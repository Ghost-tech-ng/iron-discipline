import { create } from 'zustand';
import type { DisciplineState } from '../types';
import { saveDisciplineScore } from '../services/disciplineService';

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
  hydrateSupplements: (ids: string[]) => void;
  hydrateFlags: (flags: {
    workoutDone: boolean; proteinHit: boolean; calorieHit: boolean;
    waterHit: boolean; sleepLogged: boolean; cardioLogged: boolean; score: number;
  }) => void;
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

function persist(state: DisciplineStore) {
  saveDisciplineScore(state.score, {
    workoutDone: state.workoutDone,
    proteinHit: state.proteinHit,
    calorieHit: state.calorieHit,
    waterHit: state.waterGoalHit,
    sleepLogged: state.sleepLogged,
    cardioLogged: state.cardioLogged,
  }).catch(() => {});
}

export const useDisciplineStore = create<DisciplineStore>((set, get) => ({
  ...initialState,
  score: 0,

  setWorkoutDone: (workoutDone) =>
    set((s) => {
      const next = { ...s, workoutDone };
      const result = { ...next, score: computeScore(next) };
      persist({ ...get(), ...result });
      return result;
    }),

  setProteinHit: (proteinHit) =>
    set((s) => {
      const next = { ...s, proteinHit };
      const result = { ...next, score: computeScore(next) };
      persist({ ...get(), ...result });
      return result;
    }),

  setCalorieHit: (calorieHit) =>
    set((s) => {
      const next = { ...s, calorieHit };
      const result = { ...next, score: computeScore(next) };
      persist({ ...get(), ...result });
      return result;
    }),

  markSupplementTaken: (id) =>
    set((s) => {
      const supplementsTaken = s.supplementsTaken.includes(id)
        ? s.supplementsTaken.filter((x) => x !== id)
        : [...s.supplementsTaken, id];
      const next = { ...s, supplementsTaken };
      const result = { ...next, score: computeScore(next) };
      persist({ ...get(), ...result });
      return result;
    }),

  setWaterGoalHit: (waterGoalHit) =>
    set((s) => {
      const next = { ...s, waterGoalHit };
      const result = { ...next, score: computeScore(next) };
      persist({ ...get(), ...result });
      return result;
    }),

  setSleepLogged: (sleepLogged) =>
    set((s) => {
      const next = { ...s, sleepLogged };
      const result = { ...next, score: computeScore(next) };
      persist({ ...get(), ...result });
      return result;
    }),

  setCardioLogged: (cardioLogged) =>
    set((s) => {
      const next = { ...s, cardioLogged };
      const result = { ...next, score: computeScore(next) };
      persist({ ...get(), ...result });
      return result;
    }),

  resetDay: () =>
    set({ ...initialState, date: todayStr(), score: 0 }),

  hydrateSupplements: (ids) =>
    set((s) => {
      const next = { ...s, supplementsTaken: ids };
      return { ...next, score: computeScore(next) };
    }),

  hydrateFlags: (flags) =>
    set((s) => {
      const next = {
        ...s,
        workoutDone: flags.workoutDone,
        proteinHit: flags.proteinHit,
        calorieHit: flags.calorieHit,
        waterGoalHit: flags.waterHit,
        sleepLogged: flags.sleepLogged,
        cardioLogged: flags.cardioLogged,
      };
      return { ...next, score: computeScore(next) };
    }),
}));
