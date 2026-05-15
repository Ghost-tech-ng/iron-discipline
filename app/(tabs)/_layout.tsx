import React from 'react';
import { Tabs } from 'expo-router';
import { Platform, View, StyleSheet, Text } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { Colors, Spacing } from '../../constants/theme';
import { useColors } from '../../hooks/useColors';
import { BlurView } from 'expo-blur';
import { SyncStatusBar } from '../../components/ui/SyncStatusBar';

// Minimal custom icons to avoid icon lib dependency in Phase 1
function HomeIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9.5L12 3L21 9.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Path d="M9 21V12h6v9" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
    </Svg>
  );
}

function DumbbellIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6.5 6.5h11M6.5 17.5h11M4 9v6M8 7v10M16 7v10M20 9v6"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function ForkIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8 3v5a4 4 0 004 4v9M16 3v18M12 3v4"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChartIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 18l5-6 4 3 5-8 4 5"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="5" width="18" height="14" rx="2" stroke={color} strokeWidth={1.8} />
      <Path d="M7 12l3 3 7-6" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export default function TabLayout() {
  const C = useColors();

  const styles = React.useMemo(() => StyleSheet.create({
    tabBar: {
      position: 'absolute',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: C.border,
      backgroundColor: Platform.OS === 'android' ? C.base + 'ee' : 'transparent',
      height: Platform.OS === 'ios' ? 84 : 64,
      paddingBottom: Platform.OS === 'ios' ? 28 : 8,
      paddingTop: 8,
      elevation: 0,
    },
    tabBarAndroid: {
      backgroundColor: C.base + 'f0',
    },
    label: {
      fontSize: 10,
      fontWeight: '500',
      letterSpacing: 0.3,
      marginTop: 2,
    },
    tabItem: {
      gap: 2,
    },
  }), [C]);

  return (
    <View style={{ flex: 1 }}>
      <SyncStatusBar />
      <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarBackground: () => (
          Platform.OS === 'ios' ? (
            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.tabBarAndroid]} />
          )
        ),
        tabBarActiveTintColor: C.primary,
        tabBarInactiveTintColor: C.muted,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.label,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ color }) => <HomeIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="workouts"
        options={{
          title: 'Train',
          tabBarIcon: ({ color }) => <DumbbellIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{
          title: 'Fuel',
          tabBarIcon: ({ color }) => <ForkIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color }) => <ChartIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="habits"
        options={{
          title: 'Habits',
          tabBarIcon: ({ color }) => <CheckIcon color={color} />,
        }}
      />
      </Tabs>
    </View>
  );
}
