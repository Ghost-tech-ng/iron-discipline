import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '../../hooks/useColors';
import { Fonts } from '../../constants/theme';

const SEGMENTS = 18;

interface StrikeBarProps {
  done: number;
  total: number;
}

/** Session progress as 18 strikes: the lit share matches the share of sets logged. */
export function StrikeBar({ done, total }: StrikeBarProps) {
  const C = useColors();
  const lit = total > 0 ? Math.round((Math.min(done, total) / total) * SEGMENTS) : 0;

  const styles = React.useMemo(() => StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    segs: { flex: 1, flexDirection: 'row', gap: 3 },
    seg: { flex: 1, height: 8, borderRadius: 2, backgroundColor: C.surface2, transform: [{ skewX: '-14deg' }] },
    segLit: { backgroundColor: C.accent },
    segHead: {
      backgroundColor: C.heatPeak, shadowColor: C.accent, shadowOpacity: 0.9, shadowRadius: 6,
      shadowOffset: { width: 0, height: 0 }, elevation: 3,
    },
    count: { fontFamily: Fonts.display, fontSize: 15, color: C.primary, minWidth: 44, textAlign: 'right' },
    countOf: { color: C.muted },
  }), [C]);

  return (
    <View style={styles.row}>
      <View style={styles.segs}>
        {Array.from({ length: SEGMENTS }, (_, i) => (
          <View
            key={i}
            style={[styles.seg, i < lit && styles.segLit, i === lit - 1 && lit < SEGMENTS && styles.segHead]}
          />
        ))}
      </View>
      <Text style={styles.count}>
        {done}<Text style={styles.countOf}>/{total}</Text>
      </Text>
    </View>
  );
}
