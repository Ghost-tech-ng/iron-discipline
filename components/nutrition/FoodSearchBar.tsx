import React from 'react';
import { View, TextInput, StyleSheet, Pressable, Text } from 'react-native';
import { Colors, Typography, Spacing } from '../../constants/theme';

interface FoodSearchBarProps {
  value: string;
  onChange: (v: string) => void;
  onClear: () => void;
}

export function FoodSearchBar({ value, onChange, onClear }: FoodSearchBarProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>⌕</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder="Search foods..."
        placeholderTextColor={Colors.muted}
        selectionColor={Colors.accent}
        autoCapitalize="none"
        returnKeyType="search"
      />
      {value.length > 0 && (
        <Pressable onPress={onClear} style={styles.clearBtn}>
          <Text style={styles.clearText}>✕</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    gap: 8,
  },
  icon: {
    fontSize: 18,
    color: Colors.muted,
  },
  input: {
    flex: 1,
    paddingVertical: 13,
    ...Typography.body,
    color: Colors.primary,
  },
  clearBtn: {
    padding: 4,
  },
  clearText: {
    ...Typography.small,
    color: Colors.muted,
  },
});
