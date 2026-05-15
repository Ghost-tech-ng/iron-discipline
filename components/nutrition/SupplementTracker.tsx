import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useDisciplineStore } from '../../store/disciplineStore';
import { saveSupplementLog } from '../../services/nutritionService';
import { DEFAULT_SUPPLEMENTS } from '../../constants/nutrition';
import { useColors } from '../../hooks/useColors';
import { Typography, Spacing } from '../../constants/theme';

function SupplementRow({
  id,
  name,
  dose,
  timing,
  taken,
  onToggle,
}: {
  id: string;
  name: string;
  dose: string;
  timing: string;
  taken: boolean;
  onToggle: () => void;
}) {
  const Colors = useColors();
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  function handlePress() {
    scale.value = withSequence(
      withSpring(0.9, { damping: 12 }),
      withSpring(1, { damping: 14 })
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle();
  }

  const suppStyles = React.useMemo(() => StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: Spacing.md,
    },
    rowDone: { opacity: 0.5 },
    check: {
      width: 24,
      height: 24,
      borderRadius: 6,
      borderWidth: 1.5,
      borderColor: Colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkDone: {
      backgroundColor: Colors.accentGreen,
      borderColor: Colors.accentGreen,
    },
    checkMark: {
      fontSize: 13,
      color: '#000',
      fontWeight: '700',
    },
    info: { flex: 1, gap: 2 },
    name: {
      ...Typography.body,
      color: Colors.primary,
      fontWeight: '500',
    },
    nameDone: {
      textDecorationLine: 'line-through',
      color: Colors.secondary,
    },
    detail: {
      ...Typography.caption,
      color: Colors.muted,
    },
  }), [Colors]);

  return (
    <Pressable onPress={handlePress}>
      <Animated.View style={[suppStyles.row, taken && suppStyles.rowDone, style]}>
        <View style={[suppStyles.check, taken && suppStyles.checkDone]}>
          {taken && <Text style={suppStyles.checkMark}>✓</Text>}
        </View>
        <View style={suppStyles.info}>
          <Text style={[suppStyles.name, taken && suppStyles.nameDone]}>{name}</Text>
          <Text style={suppStyles.detail}>{dose} · {timing}</Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

export function SupplementTracker() {
  const Colors = useColors();
  const { supplementsTaken, markSupplementTaken } = useDisciplineStore();
  const doneCount = supplementsTaken.length;
  const total = DEFAULT_SUPPLEMENTS.length;

  async function handleToggle(id: string) {
    markSupplementTaken(id);
    const nowTaken = !supplementsTaken.includes(id);
    await saveSupplementLog(id, nowTaken);
  }

  const styles = React.useMemo(() => StyleSheet.create({
    container: {
      backgroundColor: Colors.surface,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: Colors.border,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: Colors.border,
    },
    headerLabel: {
      ...Typography.label,
      color: Colors.muted,
      letterSpacing: 1.5,
    },
    count: {
      ...Typography.small,
      color: Colors.secondary,
      fontWeight: '700',
    },
    sep: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: Colors.border,
      marginLeft: 52,
    },
  }), [Colors]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerLabel}>SUPPLEMENTS</Text>
        <Text style={[
          styles.count,
          doneCount === total && { color: Colors.accentGreen }
        ]}>
          {doneCount}/{total}
        </Text>
      </View>

      {DEFAULT_SUPPLEMENTS.map((supp, idx) => (
        <React.Fragment key={supp.id}>
          <SupplementRow
            id={supp.id}
            name={supp.name}
            dose={supp.dose}
            timing={supp.timing}
            taken={supplementsTaken.includes(supp.id)}
            onToggle={() => handleToggle(supp.id)}
          />
          {idx < DEFAULT_SUPPLEMENTS.length - 1 && (
            <View style={styles.sep} />
          )}
        </React.Fragment>
      ))}
    </View>
  );
}
