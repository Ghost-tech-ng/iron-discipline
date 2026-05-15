import { useEffect } from 'react';
import { router } from 'expo-router';
import { useUserStore } from '../store/userStore';

export default function Index() {
  const { profile, hydrated } = useUserStore();

  useEffect(() => {
    if (!hydrated) return;
    router.replace(profile.onboardingComplete ? '/(tabs)' : '/(onboarding)');
  }, [hydrated]);

  return null;
}
