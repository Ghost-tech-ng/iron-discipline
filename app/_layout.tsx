import '../global.css';
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { initDatabase } from '../services/db';
import { requestNotificationPermissions, scheduleAllNotifications } from '../services/notificationService';
import { checkAndRunDailyReset } from '../services/dailyReset';
import { loadUserProfile } from '../services/userService';
import { loadTodayMeals, loadTodayWater, loadTodaySupplements } from '../services/nutritionService';
import { loadTodayDisciplineState, loadWeeklyCheckIns } from '../services/disciplineService';
import { useUserStore } from '../store/userStore';
import { useNutritionStore } from '../store/nutritionStore';
import { useDisciplineStore } from '../store/disciplineStore';
import { useProgressStore } from '../store/progressStore';
import { Colors } from '../constants/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const { loadProfile } = useUserStore();

  useEffect(() => {
    async function prepare() {
      try {
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

        useNutritionStore.getState().hydrateToday(meals, waterMl);
        useDisciplineStore.getState().hydrateSupplements(supplements);
        if (disciplineState) useDisciplineStore.getState().hydrateFlags(disciplineState);
        useProgressStore.getState().loadCheckIns(checkIns);

        await checkAndRunDailyReset();

        const granted = await requestNotificationPermissions();
        if (granted) {
          await scheduleAllNotifications();
        }
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

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.base }}>
      <StatusBar style="light" backgroundColor={Colors.base} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.base } }}>
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
