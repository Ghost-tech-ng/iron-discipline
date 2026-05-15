import { create } from 'zustand';
import type { UserProfile } from '../types';
import { USER_TARGETS } from '../constants/nutrition';

interface UserStore {
  profile: UserProfile;
  setProfile: (profile: Partial<UserProfile>) => void;
  completeOnboarding: () => void;
  updateWeight: (weightKg: number) => void;
}

const defaults: UserProfile = {
  name: '',
  heightCm: 191,
  weightKg: 95,
  goalWeightKg: USER_TARGETS.goalWeightKg,
  goalCalories: USER_TARGETS.calories,
  goalProtein: USER_TARGETS.protein,
  goalCarbs: USER_TARGETS.carbs,
  goalFat: USER_TARGETS.fat,
  goalWaterMl: USER_TARGETS.waterMl,
  onboardingComplete: false,
};

export const useUserStore = create<UserStore>((set) => ({
  profile: defaults,

  setProfile: (updates) =>
    set((state) => ({ profile: { ...state.profile, ...updates } })),

  completeOnboarding: () =>
    set((state) => ({
      profile: { ...state.profile, onboardingComplete: true },
    })),

  updateWeight: (weightKg) =>
    set((state) => ({ profile: { ...state.profile, weightKg } })),
}));
