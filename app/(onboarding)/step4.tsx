import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { PressableScale } from '../../components/ui/PressableScale';
import { DEFAULT_SUPPLEMENTS } from '../../constants/nutrition';
import { useColors } from '../../hooks/useColors';
import { Colors, Spacing, Typography } from '../../constants/theme';

export default function Step4Screen() {
  const Colors = useColors();
  const [enabled, setEnabled] = useState<string[]>(
    DEFAULT_SUPPLEMENTS.map((s) => s.id)
  );

  function toggle(id: string) {
    Haptics.selectionAsync();
    setEnabled((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  const styles = React.useMemo(() => StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.base },
    content: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.xl,
      gap: Spacing.md,
      paddingBottom: 40,
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
    suppCard: { padding: 0, overflow: 'hidden' },
    suppRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingVertical: 14,
      paddingHorizontal: Spacing.md,
    },
    toggle: {
      width: 40,
      height: 24,
      borderRadius: 12,
      backgroundColor: Colors.surface2,
      borderWidth: 1,
      borderColor: Colors.border,
      justifyContent: 'center',
      paddingHorizontal: 3,
      alignItems: 'flex-start',
    },
    toggleOn: {
      backgroundColor: Colors.accent + '30',
      borderColor: Colors.accent,
      alignItems: 'flex-end',
    },
    toggleKnob: {
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: Colors.muted,
    },
    toggleKnobOn: {
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: Colors.accent,
    },
    suppInfo: { flex: 1, gap: 2 },
    suppName: {
      ...Typography.body,
      color: Colors.primary,
      fontWeight: '500',
    },
    dimmed: { color: Colors.muted },
    suppDetail: {
      ...Typography.caption,
      color: Colors.muted,
    },
    sep: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: Colors.border,
      marginLeft: 66,
    },
    footnote: {
      ...Typography.caption,
      color: Colors.muted,
      textAlign: 'center',
    },
  }), [Colors]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.step}>4 of 5</Text>
          <Text style={styles.title}>Supplements</Text>
          <Text style={styles.subtitle}>
            Tap to enable. Only add what you actually take — the system will remind and track these daily.
          </Text>
        </View>

        <Card style={styles.suppCard}>
          {DEFAULT_SUPPLEMENTS.map((supp, idx) => {
            const on = enabled.includes(supp.id);
            return (
              <React.Fragment key={supp.id}>
                <PressableScale onPress={() => toggle(supp.id)}>
                  <View style={styles.suppRow}>
                    <View style={[styles.toggle, on && styles.toggleOn]}>
                      {on && <View style={styles.toggleKnobOn} />}
                      {!on && <View style={styles.toggleKnob} />}
                    </View>
                    <View style={styles.suppInfo}>
                      <Text style={[styles.suppName, !on && styles.dimmed]}>
                        {supp.name}
                      </Text>
                      <Text style={styles.suppDetail}>
                        {supp.dose} · {supp.timing}
                      </Text>
                    </View>
                  </View>
                </PressableScale>
                {idx < DEFAULT_SUPPLEMENTS.length - 1 && (
                  <View style={styles.sep} />
                )}
              </React.Fragment>
            );
          })}
        </Card>

        <Text style={styles.footnote}>
          You can add or remove supplements at any time in Settings.
        </Text>

        <Button
          label={`Confirm ${enabled.length} supplements →`}
          variant="primary"
          fullWidth
          onPress={() => router.push('/(onboarding)/step5')}
        />

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
