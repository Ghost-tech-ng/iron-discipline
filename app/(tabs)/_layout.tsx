import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { SyncStatusBar } from '../../components/ui/SyncStatusBar';
import { ForgeTabBar } from '../../components/forge/ForgeTabBar';

export default function TabLayout() {
  return (
    <View style={styles.root}>
      <SyncStatusBar />
      <Tabs tabBar={(props) => <ForgeTabBar {...props} />} screenOptions={{ headerShown: false }}>
        <Tabs.Screen name="index" options={{ title: 'Forge' }} />
        <Tabs.Screen name="workouts" options={{ title: 'Train' }} />
        {/* Reached from the ⚡ quick-strike sheet, not the bar. */}
        <Tabs.Screen name="nutrition" options={{ title: 'Fuel' }} />
        <Tabs.Screen name="progress" options={{ title: 'Progress' }} />
        <Tabs.Screen name="habits" options={{ title: 'Habits' }} />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
