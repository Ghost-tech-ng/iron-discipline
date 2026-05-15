import { useEffect } from 'react';
import { router } from 'expo-router';
import { useUserStore } from '../store/userStore';

export default function Index() {
  const { profile } = useUserStore();

  useEffect(() => {
    router.replace(profile.onboardingComplete ? '/(tabs)' : '/(onboarding)');
  }, []);

  return null;
}
