import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useThemeStore } from '../../store/themeStore';

export function ThemeToggle() {
  const { isDark, toggleTheme } = useThemeStore();
  const progress = useSharedValue(isDark ? 0 : 1);

  function handleToggle() {
    progress.value = withSpring(isDark ? 1 : 0, { damping: 15, stiffness: 150 });
    toggleTheme();
  }

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: withSpring(isDark ? 2 : 22, { damping: 15 }) }],
    backgroundColor: isDark ? '#f5f5f5' : '#0a0a0a',
  }));

  return (
    <Pressable
      onPress={handleToggle}
      style={[styles.track, { backgroundColor: isDark ? '#2a2a2a' : '#ddd9d2' }]}
    >
      <View style={styles.icons}>
        <Animated.Text style={styles.icon}>🌙</Animated.Text>
        <Animated.Text style={styles.icon}>☀️</Animated.Text>
      </View>
      <Animated.View style={[styles.thumb, thumbStyle]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 52,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    position: 'relative',
  },
  icons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
  },
  icon: { fontSize: 11 },
  thumb: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    top: 2,
  },
});
