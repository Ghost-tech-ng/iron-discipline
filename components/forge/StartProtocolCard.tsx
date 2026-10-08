import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from '../ui/Button';
import { useColors } from '../../hooks/useColors';
import { Fonts, Radius, Spacing } from '../../constants/theme';
import { PROTOCOL_WEEKS } from '../../constants/phases';

export function StartProtocolCard({ onStart }: { onStart: () => void }) {
  const C = useColors();
  const styles = React.useMemo(() => StyleSheet.create({
    card: {
      marginTop: Spacing.md, backgroundColor: C.surface, borderRadius: Radius.xl,
      borderWidth: 1, borderColor: C.border, borderLeftWidth: 3, borderLeftColor: C.accent,
      padding: Spacing.md, gap: Spacing.sm,
    },
    cap: { fontFamily: Fonts.bodyHeavy, fontSize: 10, letterSpacing: 2.2, color: C.accent },
    title: { fontFamily: Fonts.display, fontSize: 24, lineHeight: 26, letterSpacing: 0.5, color: C.primary },
    body: { fontFamily: Fonts.body, fontSize: 13, lineHeight: 19, color: C.secondary, marginBottom: 4 },
  }), [C]);

  return (
    <View style={styles.card}>
      <Text style={styles.cap}>THE SCULPT PROTOCOL</Text>
      <Text style={styles.title}>THE STEEL IS READY</Text>
      <Text style={styles.body}>
        {PROTOCOL_WEEKS} weeks: cut to 12% body fat, then build. Nothing counts against you until you tap start —
        whenever that is, that day becomes Day 1.
      </Text>
      <Button label="Start Protocol" onPress={onStart} />
    </View>
  );
}
