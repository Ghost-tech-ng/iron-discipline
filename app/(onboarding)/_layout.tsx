import React from 'react';
import { Stack } from 'expo-router';
import { useColors } from '../../hooks/useColors';

export default function OnboardingLayout() {
  const Colors = useColors();
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
