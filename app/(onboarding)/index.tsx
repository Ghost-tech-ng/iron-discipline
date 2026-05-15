import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { Button } from '../../components/ui/Button';
import { Colors, Spacing, Typography } from '../../constants/theme';

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <View style={styles.top}>
          <Text style={styles.logo}>IRON</Text>
          <Text style={styles.logoSub}>DISCIPLINE</Text>
          <View style={styles.line} />
          <Text style={styles.tagline}>
            No social feed. No noise.{'\n'}One outcome.
          </Text>
        </View>

        <View style={styles.pillars}>
          {[
            { label: 'Train', desc: '5-day PPL split, progressive overload' },
            { label: 'Fuel', desc: '200g protein, 2,500 kcal, tracked daily' },
            { label: 'Recover', desc: 'Sleep, water, habits — scored every day' },
            { label: 'Progress', desc: 'Weekly weigh-ins, photos, analytics' },
          ].map((p) => (
            <View key={p.label} style={styles.pillar}>
              <Text style={styles.pillarLabel}>{p.label}</Text>
              <Text style={styles.pillarDesc}>{p.desc}</Text>
            </View>
          ))}
        </View>

        <View style={styles.bottom}>
          <Button
            label="Begin Setup"
            variant="primary"
            fullWidth
            onPress={() => router.push('/(onboarding)/step1')}
          />
          <Text style={styles.disclaimer}>
            Private. Offline. Built for one.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.base },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    justifyContent: 'space-between',
  },
  top: { alignItems: 'center', gap: 8, paddingTop: Spacing.xl },
  logo: {
    fontSize: 64,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: -3,
    lineHeight: 68,
  },
  logoSub: {
    fontSize: 18,
    fontWeight: '400',
    color: Colors.secondary,
    letterSpacing: 10,
    marginTop: -4,
  },
  line: {
    width: 40,
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 16,
  },
  tagline: {
    ...Typography.body,
    color: Colors.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  pillars: {
    gap: 12,
  },
  pillar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
  },
  pillarLabel: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '700',
    width: 68,
    letterSpacing: -0.2,
  },
  pillarDesc: {
    ...Typography.small,
    color: Colors.secondary,
    flex: 1,
    lineHeight: 18,
  },
  bottom: { gap: 12 },
  disclaimer: {
    ...Typography.caption,
    color: Colors.muted,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});
