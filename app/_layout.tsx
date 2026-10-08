import '../global.css';
import React, { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Network from 'expo-network';
import { useFonts } from 'expo-font';
import { BigShoulders_800ExtraBold, BigShoulders_900Black } from '@expo-google-fonts/big-shoulders';
import {
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { initDatabase, getUserId } from '../services/db';
import { requestNotificationPermissions, scheduleAllNotifications } from '../services/notificationService';
import { checkAndRunDailyReset } from '../services/dailyReset';
import { loadUserProfile, getProtocolStartOverride } from '../services/userService';
import { loadTodayMeals, loadTodayWater, loadTodaySupplements } from '../services/nutritionService';
import { loadTodayDisciplineState, loadWeeklyCheckIns } from '../services/disciplineService';
import { syncToCloud, isOnline } from '../services/syncService';
import { isCloudConfigured } from '../services/firestoreService';
import { getActivePlanStatus } from '../constants/plan';
import { useUserStore } from '../store/userStore';
import { useNutritionStore } from '../store/nutritionStore';
import { useDisciplineStore } from '../store/disciplineStore';
import { useProgressStore } from '../store/progressStore';
import { useSyncStore } from '../store/syncStore';
import { useThemeStore } from '../store/themeStore';
import { useCustomFoodStore } from '../store/customFoodStore';
import { useColors } from '../hooks/useColors';
import { Colors } from '../constants/theme';

SplashScreen.preventAutoHideAsync();

async function scheduleReminders() {
  const granted = await requestNotificationPermissions();
  if (!granted) return;
  const ps = getActivePlanStatus();
  const goal = ps.isActive ? ps.targets.protein : useUserStore.getState().profile.goalProtein;
  await scheduleAllNotifications(goal, useDisciplineStore.getState().workoutDone);
}

/** Startup only covers a cold launch — this catches the app being left open or resumed across midnight. */
async function handlePossibleNewDay() {
  try {
    if (await checkAndRunDailyReset()) await scheduleReminders();
  } catch (e) {
    console.warn('Day change handling failed:', e);
  }
}

async function runSync() {
  if (!isCloudConfigured()) return;
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
    BigShoulders_800ExtraBold,
    BigShoulders_900Black,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });
  const { loadProfile } = useUserStore();
  const wasOnlineRef = useRef(false);

  useEffect(() => {
    async function prepare() {
      try {
        await useThemeStore.getState().loadTheme();
        await initDatabase();

        // Reset daily state before loading so hydrateToday always wins
        await checkAndRunDailyReset();

        const [savedProfile, meals, waterMl, supplements, disciplineState, checkIns, protocolStartOverride] =
          await Promise.all([
            loadUserProfile(),
            loadTodayMeals(),
            loadTodayWater(),
            loadTodaySupplements(),
            loadTodayDisciplineState(),
            loadWeeklyCheckIns(),
            getProtocolStartOverride(),
          ]);

        if (savedProfile) loadProfile(savedProfile);
        useUserStore.getState().hydrateProtocolStart(protocolStartOverride);
        useUserStore.getState().setHydrated();

        useDisciplineStore.getState().hydrateSupplements(supplements);
        if (disciplineState) useDisciplineStore.getState().hydrateFlags(disciplineState);
        useNutritionStore.getState().hydrateToday(meals, waterMl);
        useProgressStore.getState().loadCheckIns(checkIns);
        useCustomFoodStore.getState().hydrate();

        await scheduleReminders();

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

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') handlePossibleNewDay();
    });
    return () => sub.remove();
  }, []);

  // Poll every 30 seconds for connectivity (sync when we come back online) and midnight rollover
  useEffect(() => {
    const interval = setInterval(async () => {
      handlePossibleNewDay();
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
      <StatusBar style={isDark ? 'light' : 'dark'} />
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
