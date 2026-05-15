import React from 'react';
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useColors } from '../../hooks/useColors';
import { Radius, Spacing } from '../../constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  glow?: string;
  padding?: number;
}

export function Card({ children, style, glow, padding = Spacing.md }: CardProps) {
  const Colors = useColors();
  const styles = React.useMemo(() => StyleSheet.create({
    card: {
      backgroundColor: Colors.surface,
      borderRadius: Radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: Colors.border,
    },
  }), [Colors]);

  return (
    <View
      style={[
        styles.card,
        { padding },
        glow && {
          shadowColor: glow,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: 8,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
