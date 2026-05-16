import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { Button } from '../../components/ui/Button';
import { useUserStore } from '../../store/userStore';
import { useColors } from '../../hooks/useColors';
import { Colors, Spacing, Typography } from '../../constants/theme';

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  autoCapitalize = 'none',
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  keyboardType?: any;
  autoCapitalize?: any;
}) {
  const Colors = useColors();
  const styles = React.useMemo(() => StyleSheet.create({
    container: { gap: 6 },
    label: {
      ...Typography.small,
      color: Colors.secondary,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    input: {
      backgroundColor: Colors.surface,
      borderWidth: 1,
      borderColor: Colors.border,
      borderRadius: 12,
      paddingHorizontal: Spacing.md,
      paddingVertical: 14,
      ...Typography.body,
      color: Colors.primary,
    },
  }), [Colors]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.muted}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        style={styles.input}
        selectionColor={Colors.accent}
      />
    </View>
  );
}

export default function Step1Screen() {
  const Colors = useColors();
  const { profile, setProfile } = useUserStore();
  const [name, setName] = useState(profile.name);
  const [height, setHeight] = useState(profile.heightCm.toString());
  const [weight, setWeight] = useState(profile.weightKg.toString());

  function handleNext() {
    if (!name.trim()) return;
    setProfile({
      name: name.trim(),
      heightCm: parseFloat(height) || 191,
      weightKg: parseFloat(weight) || 95,
    });
    router.push('/(onboarding)/step2');
  }

  const styles = React.useMemo(() => StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.base },
    kav: { flex: 1 },
    content: {
      flex: 1,
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.xl,
      paddingBottom: Spacing.xl,
      justifyContent: 'space-between',
      gap: Spacing.xl,
    },
    header: { gap: 8 },
    step: {
      ...Typography.label,
      color: Colors.muted,
      letterSpacing: 1.5,
    },
    title: {
      ...Typography.h1,
      color: Colors.primary,
      fontWeight: '700',
      letterSpacing: -1,
    },
    subtitle: {
      ...Typography.body,
      color: Colors.secondary,
      lineHeight: 22,
    },
    fields: { gap: Spacing.md, flex: 1 },
    infoBox: {
      backgroundColor: Colors.surface,
      borderRadius: 12,
      padding: Spacing.md,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    infoText: {
      ...Typography.small,
      color: Colors.secondary,
      lineHeight: 20,
    },
  }), [Colors]);

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.step}>1 of 5</Text>
            <Text style={styles.title}>Who are you?</Text>
            <Text style={styles.subtitle}>
              This data stays on your phone. It sets your targets.
            </Text>
          </View>

          <View style={styles.fields}>
            <Field
              label="Your name"
              value={name}
              onChangeText={setName}
              placeholder="Your first name"
              autoCapitalize="words"
            />
            <Field
              label="Height (cm)"
              value={height}
              onChangeText={setHeight}
              placeholder="191"
              keyboardType="decimal-pad"
            />
            <Field
              label="Current weight (kg)"
              value={weight}
              onChangeText={setWeight}
              placeholder="95"
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              At{' '}
              <Text style={{ color: Colors.primary, fontWeight: '600' }}>
                {parseFloat(weight) || 95}kg
              </Text>
              {' '}your daily protein target will be set to{' '}
              <Text style={{ color: Colors.accent, fontWeight: '700' }}>
                {Math.round((parseFloat(weight) || 95) * 2.1)}g
              </Text>
              .
            </Text>
          </View>

          <Button
            label="Continue →"
            variant="primary"
            fullWidth
            onPress={handleNext}
            disabled={!name.trim()}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
