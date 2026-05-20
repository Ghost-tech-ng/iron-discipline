import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Platform, View, StyleSheet, Text, Pressable, Dimensions } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { useColors } from '../../hooks/useColors';
import { BlurView } from 'expo-blur';
import { SyncStatusBar } from '../../components/ui/SyncStatusBar';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const SCREEN_W = Dimensions.get('window').width;
const BAR_MARGIN = 16;
const BAR_W = SCREEN_W - BAR_MARGIN * 2;
const BAR_H = 62;
const BOTTOM = Platform.OS === 'ios' ? 28 : 20;

function HomeIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9.5L12 3L21 9.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
      <Path d="M9 21V12h6v9" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
    </Svg>
  );
}

function DumbbellIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M6.5 6.5h11M6.5 17.5h11M4 9v6M8 7v10M16 7v10M20 9v6" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function ForkIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M8 3v5a4 4 0 004 4v9M16 3v18M12 3v4" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChartIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M3 18l5-6 4 3 5-8 4 5" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
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

const TAB_DEFS = [
  { name: 'index',     title: 'Today',    Icon: HomeIcon },
  { name: 'workouts',  title: 'Train',    Icon: DumbbellIcon },
  { name: 'nutrition', title: 'Fuel',     Icon: ForkIcon },
  { name: 'progress',  title: 'Progress', Icon: ChartIcon },
  { name: 'habits',    title: 'Habits',   Icon: CheckIcon },
];

const TAB_W = BAR_W / TAB_DEFS.length;
const INDICATOR_INSET = 6;
const INDICATOR_H = BAR_H - INDICATOR_INSET * 2;

function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const C = useColors();
  const translateX = useSharedValue(state.index * TAB_W);

  useEffect(() => {
    translateX.value = withSpring(state.index * TAB_W, {
      damping: 22,
      stiffness: 200,
      mass: 0.8,
    });
  }, [state.index]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={barStyles.outer}>
      <View style={barStyles.pill}>
        {/* Blur or solid background */}
        {Platform.OS === 'ios' ? (
          <BlurView intensity={75} tint="dark" style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: C.surface + 'f5' }]} />
        )}

        {/* Hairline border */}
        <View style={[StyleSheet.absoluteFill, barStyles.pillBorder]} pointerEvents="none" />

        {/* Sliding active pill */}
        <Animated.View
          style={[
            barStyles.indicator,
            indicatorStyle,
            { backgroundColor: C.accent + '22', borderColor: C.accent + '40' },
          ]}
          pointerEvents="none"
        />

        {/* Tab buttons */}
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const def = TAB_DEFS.find((t) => t.name === route.name);
          const color = isFocused ? C.accent : C.muted;

          return (
            <Pressable
              key={route.key}
              onPress={() => { if (!isFocused) navigation.navigate(route.name as never); }}
              style={barStyles.tabItem}
              android_ripple={null}
            >
              {def && <def.Icon color={color} />}
              <Text style={[barStyles.label, { color }]}>
                {descriptors[route.key].options.title ?? def?.title}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const barStyles = StyleSheet.create({
  outer: {
    position: 'absolute',
    bottom: BOTTOM,
    left: BAR_MARGIN,
    right: BAR_MARGIN,
    height: BAR_H,
    // Shadow (iOS)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 28,
    // Android elevation
    elevation: 20,
  },
  pill: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: BAR_H / 2,
    overflow: 'hidden',
  },
  pillBorder: {
    borderRadius: BAR_H / 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  indicator: {
    position: 'absolute',
    top: INDICATOR_INSET,
    width: TAB_W,
    height: INDICATOR_H,
    borderRadius: INDICATOR_H / 2,
    borderWidth: 1,
  },
  tabItem: {
    width: TAB_W,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  label: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});

export default function TabLayout() {
  return (
    <View style={{ flex: 1 }}>
      <SyncStatusBar />
      <Tabs
        tabBar={(props) => <FloatingTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tabs.Screen name="index"     options={{ title: 'Today' }} />
        <Tabs.Screen name="workouts"  options={{ title: 'Train' }} />
        <Tabs.Screen name="nutrition" options={{ title: 'Fuel' }} />
        <Tabs.Screen name="progress"  options={{ title: 'Progress' }} />
        <Tabs.Screen name="habits"    options={{ title: 'Habits' }} />
      </Tabs>
    </View>
  );
}
