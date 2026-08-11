import { create } from 'zustand';
import type { UserProfile } from '../types';
import { USER_TARGETS } from '../constants/nutrition';
import { setProtocolStartOverride, todayIso } from '../constants/phases';
import { saveProtocolStartOverride } from '../services/userService';

interface UserStore {
  profile: UserProfile;
  hydrated: boolean;
  protocolStartOverride: string | null;
  setProfile: (profile: Partial<UserProfile>) => void;
  loadProfile: (profile: UserProfile) => void;
  completeOnboarding: () => void;
  updateWeight: (weightKg: number) => void;
  setHydrated: () => void;
  hydrateProtocolStart: (iso: string | null) => void;
  startProtocol: () => void;
}

const defaults: UserProfile = {
  name: '',
  heightCm: 191,
  weightKg: USER_TARGETS.startWeightKg,
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
  hydrated: false,
  protocolStartOverride: null,

  setProfile: (updates) =>
    set((state) => ({ profile: { ...state.profile, ...updates } })),

  loadProfile: (profile) => set({ profile }),

  completeOnboarding: () =>
    set((state) => ({
      profile: { ...state.profile, onboardingComplete: true },
    })),

  updateWeight: (weightKg) =>
    set((state) => ({ profile: { ...state.profile, weightKg } })),

  setHydrated: () => set({ hydrated: true }),

  hydrateProtocolStart: (iso) => {
    setProtocolStartOverride(iso);
    set({ protocolStartOverride: iso });
  },

  startProtocol: () => {
    const iso = todayIso();
    setProtocolStartOverride(iso);
    set({ protocolStartOverride: iso });
    saveProtocolStartOverride(iso).catch((e) => console.warn('Failed to save protocol start:', e));
  },
}));
