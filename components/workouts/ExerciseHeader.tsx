import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import type { Exercise } from '../../types';
import { useColors } from '../../hooks/useColors';
import { Fonts, Spacing } from '../../constants/theme';

export interface Recommendation {
  weight: number;
  direction: 'up' | 'hold' | 'none';
}

interface ExerciseHeaderProps {
  exercise: Exercise;
  activeSwap?: string;
  imageUrl: string | null;
  completedCount: number;
  recommendation: Recommendation;
}

/** The feature band at the top of an exercise card: image, name, tags, load target. */
export function ExerciseHeader({ exercise, activeSwap, imageUrl, completedCount, recommendation }: ExerciseHeaderProps) {
  const C = useColors();
  const total = exercise.sets;
  const allDone = completedCount >= total;
  const up = recommendation.direction === 'up';

  const styles = React.useMemo(() => StyleSheet.create({
    band: { backgroundColor: C.feature },
    image: { width: '100%', height: 148, backgroundColor: C.cream },
    body: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: Spacing.md, paddingBottom: 14 },
    left: { flex: 1, gap: 5 },
    name: { fontFamily: Fonts.displayBlack, fontSize: 24, lineHeight: 26, color: C.onFeature },
    insteadOf: { fontFamily: Fonts.bodySemi, fontSize: 11, color: C.featureMuted },
    tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
    tag: {
      fontFamily: Fonts.bodyHeavy, fontSize: 9, letterSpacing: 1, color: C.featureMuted, borderWidth: 1,
      borderColor: C.featureMuted + '66', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: 'hidden',
    },
    tagHot: { color: C.accent, borderColor: C.accent + '80' },
    target: { flexDirection: 'row', alignSelf: 'flex-start', alignItems: 'center', gap: 6, marginTop: 3 },
    targetDot: { width: 7, height: 7, borderRadius: 2, transform: [{ rotate: '45deg' }] },
    targetText: { fontFamily: Fonts.bodyHeavy, fontSize: 11, letterSpacing: 0.6 },
    count: { alignItems: 'center', minWidth: 44, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8, borderWidth: 1.5 },
    countVal: { fontFamily: Fonts.display, fontSize: 20, lineHeight: 22 },
    countCap: { fontFamily: Fonts.bodyHeavy, fontSize: 7.5, letterSpacing: 1.2 },
  }), [C]);

  const countColor = allDone ? C.accent : C.featureMuted;
  const targetColor = up ? C.accent : C.featureMuted;

  return (
    <View style={styles.band}>
      {imageUrl && <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="contain" />}
      <View style={styles.body}>
        <View style={styles.left}>
          <Text style={styles.name}>{(activeSwap ?? exercise.name).toUpperCase()}</Text>
          {activeSwap && <Text style={styles.insteadOf}>instead of {exercise.name}</Text>}
          {(exercise.tempo || exercise.perSide || exercise.lengthenedPartials || exercise.isTimed) && (
            <View style={styles.tags}>
              {exercise.tempo && <Text style={styles.tag}>TEMPO {exercise.tempo}</Text>}
              {exercise.perSide && <Text style={styles.tag}>PER SIDE</Text>}
              {exercise.isTimed && <Text style={styles.tag}>HOLD FOR TIME</Text>}
              {exercise.lengthenedPartials && <Text style={[styles.tag, styles.tagHot]}>LENGTHENED PARTIALS</Text>}
            </View>
          )}
          {recommendation.direction !== 'none' && (
            <View style={styles.target}>
              <View style={[styles.targetDot, { backgroundColor: targetColor }]} />
              <Text style={[styles.targetText, { color: targetColor }]}>
                {up ? `HEAT UP · ${recommendation.weight} KG ↑` : `HOLD · ${recommendation.weight} KG`}
              </Text>
            </View>
          )}
        </View>
        <View style={[styles.count, { borderColor: countColor }]}>
          <Text style={[styles.countVal, { color: allDone ? C.accent : C.onFeature }]}>
            {completedCount}/{total}
          </Text>
          <Text style={[styles.countCap, { color: countColor }]}>{allDone ? 'FORGED' : 'SETS'}</Text>
        </View>
      </View>
    </View>
  );
}
