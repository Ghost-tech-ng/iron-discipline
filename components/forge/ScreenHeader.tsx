import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '../../hooks/useColors';
import { Fonts } from '../../constants/theme';

interface ScreenHeaderProps {
  eyebrow: string;
  title: string;
  sub?: React.ReactNode;
  right?: React.ReactNode;
}

/** Tab-screen header in the forge style: red-ruled eyebrow, heavy display title, one-line sub. */
export function ScreenHeader({ eyebrow, title, sub, right }: ScreenHeaderProps) {
  const C = useColors();

  const styles = React.useMemo(() => StyleSheet.create({
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    left: { flex: 1 },
    tag: { borderLeftWidth: 2, borderLeftColor: C.accent, paddingLeft: 10, alignSelf: 'flex-start' },
    tagText: { fontFamily: Fonts.bodyBold, fontSize: 9, letterSpacing: 2.7, color: C.secondary },
    title: { fontFamily: Fonts.displayBlack, fontSize: 48, lineHeight: 50, color: C.primary, marginTop: 8 },
    sub: { fontFamily: Fonts.bodySemi, fontSize: 12, color: C.secondary },
  }), [C]);

  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <View style={styles.tag}>
          <Text style={styles.tagText}>{eyebrow}</Text>
        </View>
        <Text style={styles.title}>{title}</Text>
        {typeof sub === 'string' ? <Text style={styles.sub}>{sub}</Text> : sub}
      </View>
      {right}
    </View>
  );
}
