import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useColors } from '../../hooks/useColors';
import { useDragonStore } from '../../store/dragonStore';

/** Shows or hides the dragon companion. */
export function DragonToggle() {
  const C = useColors();
  const hidden = useDragonStore((s) => s.hidden);
  const toggleHidden = useDragonStore((s) => s.toggleHidden);
  const styles = useMemo(
    () =>
      StyleSheet.create({
        btn: {
          width: 30,
          height: 30,
          borderRadius: 15,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: C.surface2,
          borderWidth: 1,
          borderColor: hidden ? C.surface2 : C.accent,
        },
        icon: { fontSize: 15, opacity: hidden ? 0.35 : 1 },
      }),
    [C, hidden]
  );

  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        toggleHidden();
      }}
      hitSlop={8}
      accessibilityRole="switch"
      accessibilityState={{ checked: !hidden }}
      accessibilityLabel="Dragon companion"
      style={styles.btn}
    >
      <Text style={styles.icon}>🐉</Text>
    </Pressable>
  );
}
