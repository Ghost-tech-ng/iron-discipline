import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useColors } from '../../hooks/useColors';
import { Typography, Spacing } from '../../constants/theme';

interface SwapPickerProps {
  originalName: string;
  swaps: string[];
  activeSwap?: string;
  onSwap: (swapName: string | null) => void;
}

export function SwapPicker({ originalName, swaps, activeSwap, onSwap }: SwapPickerProps) {
  const Colors = useColors();
  const [open, setOpen] = useState(false);

  const styles = useMemo(() => StyleSheet.create({
    wrap: {
      paddingHorizontal: Spacing.md,
      paddingVertical: 10,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: Colors.border,
      gap: 8,
    },
    toggle: { ...Typography.caption, color: Colors.accent, fontWeight: '700', letterSpacing: 0.6 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    chip: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor: Colors.surface2,
    },
    chipActive: { borderColor: Colors.accent, backgroundColor: Colors.accent + '18' },
    chipText: { ...Typography.caption, color: Colors.secondary, fontWeight: '600' },
    chipTextActive: { color: Colors.accent },
    hint: { ...Typography.caption, color: Colors.muted, fontStyle: 'italic' },
  }), [Colors]);

  function pick(name: string | null) {
    onSwap(name);
    setOpen(false);
  }

  return (
    <View style={styles.wrap}>
      <Pressable onPress={() => setOpen((o) => !o)} hitSlop={8}>
        <Text style={styles.toggle}>
          {open ? 'HIDE SWAPS ▲' : activeSwap ? 'CHANGE SWAP ▼' : 'NO MACHINE? SWAP FOR ▼'}
        </Text>
      </Pressable>
      {open && (
        <>
          <View style={styles.chips}>
            {activeSwap && (
              <Pressable style={styles.chip} onPress={() => pick(null)}>
                <Text style={styles.chipText}>↺ Back to {originalName}</Text>
              </Pressable>
            )}
            {swaps.map((name) => {
              const active = name === activeSwap;
              return (
                <Pressable
                  key={name}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => pick(active ? null : name)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{name}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.hint}>
            Remembered for future sessions. Same sets and reps; weights are tracked separately.
          </Text>
        </>
      )}
    </View>
  );
}
