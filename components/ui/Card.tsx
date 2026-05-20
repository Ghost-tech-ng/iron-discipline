import React from 'react';
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '../../hooks/useColors';
import { Radius, Spacing } from '../../constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  glow?: string;
  padding?: number;
  accentColor?: string;
  gradient?: boolean;
}

export function Card({
  children,
  style,
  glow,
  padding = Spacing.md,
  accentColor,
  gradient,
}: CardProps) {
  const Colors = useColors();

  const containerStyle: StyleProp<ViewStyle> = [
    {
      backgroundColor: Colors.surface,
      borderRadius: Radius.lg,
      overflow: 'hidden',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: Colors.border,
      borderTopWidth: accentColor ? 2 : StyleSheet.hairlineWidth,
      borderTopColor: accentColor ?? Colors.border,
      padding,
    },
    glow
      ? {
          shadowColor: glow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 18,
          elevation: 12,
        }
      : undefined,
    style,
  ];

  return (
    <View style={containerStyle}>
      {gradient && (
        <LinearGradient
          colors={[Colors.surface2, Colors.surface]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}
      {children}
    </View>
  );
}
