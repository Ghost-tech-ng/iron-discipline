import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Stretch } from '../../types';
import { useColors } from '../../hooks/useColors';
import { Fonts, Radius, Spacing } from '../../constants/theme';

interface StretchSectionProps {
  title: string;
  stretches: Stretch[];
  accentColor: string;
}

export function StretchSection({ title, stretches, accentColor }: StretchSectionProps) {
  const C = useColors();
  const [expanded, setExpanded] = useState(false);

  const styles = React.useMemo(() => StyleSheet.create({
    container: {
      backgroundColor: C.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: C.border,
      borderLeftWidth: 3, overflow: 'hidden',
    },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 12, gap: 8 },
    title: { fontFamily: Fonts.display, fontSize: 16, letterSpacing: 1.6, flex: 1 },
    count: { fontFamily: Fonts.bodySemi, fontSize: 11, color: C.muted },
    list: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.border },
    item: { padding: Spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.surface2, gap: 4 },
    itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
    name: { fontFamily: Fonts.bodyBold, fontSize: 13, color: C.primary, flex: 1 },
    duration: { fontFamily: Fonts.bodyBold, fontSize: 11, color: C.accent, textAlign: 'right', flexShrink: 0 },
    description: { fontFamily: Fonts.body, fontSize: 12, color: C.secondary, lineHeight: 18 },
  }), [C]);

  return (
    <View style={[styles.container, { borderLeftColor: accentColor }]}>
      <Pressable style={styles.header} onPress={() => setExpanded((e) => !e)}>
        <Text style={[styles.title, { color: accentColor }]}>{title}</Text>
        <Text style={styles.count}>{stretches.length} stretches</Text>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={C.muted} />
      </Pressable>

      {expanded && (
        <View style={styles.list}>
          {stretches.map((s, i) => (
            <View key={i} style={styles.item}>
              <View style={styles.itemHeader}>
                <Text style={styles.name}>{s.name}</Text>
                <Text style={styles.duration}>{s.duration}</Text>
              </View>
              <Text style={styles.description}>{s.description}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
