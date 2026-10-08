import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PressableScale } from '../ui/PressableScale';
import { useColors } from '../../hooks/useColors';
import { Fonts, Spacing } from '../../constants/theme';

interface SectionHeaderProps {
  title: string;
  link?: string;
  onLink?: () => void;
}

export function SectionHeader({ title, link, onLink }: SectionHeaderProps) {
  const C = useColors();
  const styles = React.useMemo(() => StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: Spacing.lg, marginBottom: Spacing.sm },
    title: { fontFamily: Fonts.display, fontSize: 17, letterSpacing: 1.6, color: C.primary },
    rule: { flex: 1, height: 1, backgroundColor: C.border },
    link: { fontFamily: Fonts.bodyBold, fontSize: 11, color: C.accent },
  }), [C]);

  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.rule} />
      {link && onLink && (
        <PressableScale onPress={onLink} hitSlop={8}>
          <Text style={styles.link}>{link}</Text>
        </PressableScale>
      )}
    </View>
  );
}
