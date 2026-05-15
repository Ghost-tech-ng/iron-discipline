import React from 'react';
import { Text, StyleSheet, type ViewStyle, ActivityIndicator } from 'react-native';
import { PressableScale } from './PressableScale';
import { Colors, Radius, Spacing, Typography } from '../../constants/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  icon?: React.ReactNode;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  fullWidth = false,
  loading = false,
  disabled = false,
  style,
  icon,
}: ButtonProps) {
  const variantStyle = VARIANTS[variant];

  return (
    <PressableScale
      onPress={!disabled && !loading ? onPress : undefined}
      style={[
        styles.base,
        variantStyle.container,
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variantStyle.textColor} size="small" />
      ) : (
        <>
          {icon}
          <Text style={[styles.label, { color: variantStyle.textColor }]}>
            {label}
          </Text>
        </>
      )}
    </PressableScale>
  );
}

const VARIANTS = {
  primary: {
    container: { backgroundColor: Colors.primary },
    textColor: Colors.base,
  },
  secondary: {
    container: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: Colors.border,
    },
    textColor: Colors.primary,
  },
  ghost: {
    container: { backgroundColor: 'transparent' },
    textColor: Colors.secondary,
  },
  danger: {
    container: { backgroundColor: Colors.accentRed },
    textColor: '#ffffff',
  },
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
  },
  fullWidth: {
    width: '100%',
  },
  label: {
    ...Typography.body,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  disabled: {
    opacity: 0.4,
  },
});
