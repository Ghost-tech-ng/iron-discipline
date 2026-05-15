import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useSyncStore } from '../../store/syncStore';
import { useColors } from '../../hooks/useColors';
import { Typography } from '../../constants/theme';

function formatAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return 'just now';
  if (mins === 1) return '1 min ago';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  return hrs === 1 ? '1 hr ago' : `${hrs} hrs ago`;
}

export function SyncStatusBar() {
  const Colors = useColors();
  const { isSyncing, lastSynced, error, isOnline } = useSyncStore();
  const spinAnim = useRef(new Animated.Value(0)).current;
  const [, forceRender] = React.useReducer((n) => n + 1, 0);

  // Rotate animation for syncing dot
  useEffect(() => {
    if (isSyncing) {
      Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        })
      ).start();
    } else {
      spinAnim.stopAnimation();
      spinAnim.setValue(0);
    }
  }, [isSyncing]);

  // Refresh "X min ago" label every minute
  useEffect(() => {
    const t = setInterval(forceRender, 60_000);
    return () => clearInterval(t);
  }, []);

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  let dotColor: string;
  let label: string;

  if (!isOnline) {
    dotColor = Colors.muted;
    label = 'Offline · data saved locally';
  } else if (isSyncing) {
    dotColor = '#f59e0b';
    label = 'Syncing to cloud…';
  } else if (error) {
    dotColor = '#ef4444';
    label = 'Sync failed · tap Upload to retry';
  } else if (lastSynced) {
    dotColor = Colors.accentGreen;
    label = `Synced ${formatAgo(lastSynced)}`;
  } else {
    dotColor = '#f59e0b';
    label = 'Online · not yet synced';
  }

  const styles = React.useMemo(() => StyleSheet.create({
    bar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 5,
      backgroundColor: Colors.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: Colors.border,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    label: {
      ...Typography.caption,
      color: Colors.muted,
      fontSize: 11,
      letterSpacing: 0.2,
    },
  }), [Colors]);

  return (
    <View style={styles.bar}>
      <Animated.View
        style={[
          styles.dot,
          { backgroundColor: dotColor },
          isSyncing && { transform: [{ rotate: spin }] },
        ]}
      />
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}
