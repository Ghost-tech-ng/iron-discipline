import '../global.css';
import React, { useEffect, useRef } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Network from 'expo-network';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { initDatabase, getUserId } from '../services/db';
import { requestNotificationPermissions, scheduleAllNotifications } from '../services/notificationService';
import { checkAndRunDailyReset } from '../services/dailyReset';
import { loadUserProfile } from '../services/userService';
import { loadTodayMeals, loadTodayWater, loadTodaySupplements } from '../services/nutritionService';
import { loadTodayDisciplineState, loadWeeklyCheckIns } from '../services/disciplineService';
import { syncToCloud, isOnline } from '../services/syncService';
import { isMongoConfigured } from '../services/mongoService';
import { useUserStore } from '../store/userStore';
import { useNutritionStore } from '../store/nutritionStore';
import { useDisciplineStore } from '../store/disciplineStore';
import { useProgressStore } from '../store/progressStore';
import { useSyncStore } from '../store/syncStore';
import { useThemeStore } from '../store/themeStore';
import { useColors } from '../hooks/useColors';
import { Colors } from '../constants/theme';

SplashScreen.preventAutoHideAsync();

async function runSync() {
  if (!isMongoConfigured()) return;
  const { setSyncing, setLastSynced, setError } = useSyncStore.getState();
  setSyncing(true);
  try {
    const userId = await getUserId();
    await syncToCloud(userId);
    setLastSynced(new Date().toISOString());
  } catch (e) {
    setError(e instanceof Error ? e.message : 'Sync failed');
  } finally {
    setSyncing(false);
  }
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const { loadProfile } = useUserStore();
  const wasOnlineRef = useRef(false);

  useEffect(() => {
    async function prepare() {
      try {
        await useThemeStore.getState().loadTheme();
        await initDatabase();

        const [savedProfile, meals, waterMl, supplements, disciplineState, checkIns] =
          await Promise.all([
            loadUserProfile(),
            loadTodayMeals(),
            loadTodayWater(),
            loadTodaySupplements(),
            loadTodayDisciplineState(),
            loadWeeklyCheckIns(),
          ]);

        if (savedProfile) loadProfile(savedProfile);
        useUserStore.getState().setHydrated();

        useNutritionStore.getState().hydrateToday(meals, waterMl);
        useDisciplineStore.getState().hydrateSupplements(supplements);
        if (disciplineState) useDisciplineStore.getState().hydrateFlags(disciplineState);
        useProgressStore.getState().loadCheckIns(checkIns);

        await checkAndRunDailyReset();

        const granted = await requestNotificationPermissions();
        if (granted) {
          await scheduleAllNotifications();
        }

        // Auto-sync on startup if online
        const online = await isOnline();
        wasOnlineRef.current = online;
        useSyncStore.getState().setOnline(online);
        if (online) runSync();
      } catch (e) {
        console.warn('App init error:', e);
      } finally {
        if (fontsLoaded) {
          await SplashScreen.hideAsync();
        }
      }
    }
    prepare();
  }, [fontsLoaded]);

  // Poll every 30 seconds for connectivity — sync when we come back online
  useEffect(() => {
    const interval = setInterval(async () => {
      const online = await isOnline();
      useSyncStore.getState().setOnline(online);
      if (online && !wasOnlineRef.current) {
        runSync();
      }
      wasOnlineRef.current = online;
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  if (!fontsLoaded) return null;

  return (
    <RootLayoutInner />
  );
}

function RootLayoutInner() {
  const C = useColors();
  const { isDark } = useThemeStore();

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: C.base }}>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={C.base} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.base } }}>
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="workout/[id]"
          options={{
            presentation: 'fullScreenModal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="meal/log"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="progress/weigh-in"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="meal/scan"
          options={{
            presentation: 'fullScreenModal',
            animation: 'slide_from_bottom',
          }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}
