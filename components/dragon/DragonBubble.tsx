import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeOut, ZoomIn } from 'react-native-reanimated';
import { useColors } from '../../hooks/useColors';
import { Fonts } from '../../constants/theme';

const LANE = 200;

/** Speech bubble above the dragon. `side` keeps it on screen: 'left' grows rightwards from the sprite. */
export function DragonBubble({ text, big, side, size }: { text: string; big: boolean; side: 'left' | 'right'; size: number }) {
  const C = useColors();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        lane: { position: 'absolute', bottom: size + 4, width: LANE },
        bubble: {
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderRadius: 12,
          backgroundColor: big ? C.accent : C.feature,
          borderWidth: 1,
          borderColor: big ? C.accentHeat : C.accent,
        },
        text: { color: big ? C.onAccent : C.onFeature, fontFamily: Fonts.bodyHeavy, fontSize: 11, letterSpacing: 0.8 },
        tail: {
          position: 'absolute',
          bottom: -4,
          width: 8,
          height: 8,
          transform: [{ rotate: '45deg' }],
          backgroundColor: big ? C.accent : C.feature,
        },
      }),
    [C, big, size]
  );

  const left = side === 'left';
  return (
    <View style={[styles.lane, left ? { left: 0, alignItems: 'flex-start' } : { right: 0, alignItems: 'flex-end' }]}>
      <Animated.View entering={ZoomIn.duration(220)} exiting={FadeOut.duration(200)} style={styles.bubble}>
        <Text style={styles.text}>{text}</Text>
        <View style={[styles.tail, left ? { left: Math.min(size / 2, 24) } : { right: Math.min(size / 2, 24) }]} />
      </Animated.View>
    </View>
  );
}
