import React from 'react';
import { Stack } from 'expo-router';
import { Colors } from '../../constants/theme';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.base },
        animation: 'slide_from_right',
      }}
    />
  );
}
