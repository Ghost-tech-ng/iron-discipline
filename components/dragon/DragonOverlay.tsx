import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useDisciplineStore } from '../../store/disciplineStore';
import { useUserStore } from '../../store/userStore';
import { useDragonStore } from '../../store/dragonStore';
import { useHeatHistoryState } from '../../hooks/useHeatHistory';
import { useDragonCheers } from '../../hooks/useDragonCheers';
import { getProtocolStatus } from '../../constants/phases';
import { RANKS, computeRank, computeStreak, currentRun } from '../../utils/heat';
import { EVOLVE_TEXT, STAGE_ORDER, dragonMood, dragonSize, dragonStage, nudgeText } from '../../utils/dragon';
import { DragonActor } from './DragonActor';

function useHour(): number {
  const [hour, setHour] = useState(() => new Date().getHours());
  useEffect(() => {
    const interval = setInterval(() => setHour(new Date().getHours()), 60000);
    return () => clearInterval(interval);
  }, []);
  return hour;
}

function useDragonHydrated(): boolean {
  const [ready, setReady] = useState(() => useDragonStore.persist.hasHydrated());
  useEffect(() => {
    if (useDragonStore.persist.hasHydrated()) setReady(true);
    return useDragonStore.persist.onFinishHydration(() => setReady(true));
  }, []);
  return ready;
}

function DragonCompanion() {
  const score = useDisciplineStore((s) => s.score);
  const workoutDone = useDisciplineStore((s) => s.workoutDone);
  const proteinHit = useDisciplineStore((s) => s.proteinHit);
  const { history, loaded } = useHeatHistoryState(score);
  const hour = useHour();

  const { stage, size, crack } = useMemo(() => {
    const ps = getProtocolStatus();
    const st = dragonStage(computeRank(history, score, ps.isActive && ps.dayNumber >= ps.totalDays).id);
    const tempered = RANKS[1];
    return {
      stage: st,
      size: dragonSize(st, computeStreak(history)),
      crack: Math.min(1, currentRun(history, score, tempered.minHeat) / tempered.days),
    };
  }, [history, score]);
  const mood = dragonMood(score, hour);

  useEffect(() => {
    if (!loaded) return;
    const { lastStage, setLastStage, cheerFor } = useDragonStore.getState();
    if (lastStage === stage) return;
    if (lastStage && STAGE_ORDER.indexOf(stage) > STAGE_ORDER.indexOf(lastStage)) cheerFor(EVOLVE_TEXT[stage], true);
    setLastStage(stage);
  }, [loaded, stage]);

  // Until history lands every user looks Raw, which would flash an egg.
  if (!loaded) return null;
  return <DragonActor stage={stage} mood={mood} size={size} crack={crack} nudge={nudgeText(mood, hour, { workoutDone, proteinHit })} />;
}

/** Full-screen layer above the tabs that never takes a touch. */
export function DragonOverlay() {
  const hydrated = useUserStore((s) => s.hydrated);
  const dragonReady = useDragonHydrated();
  const hidden = useDragonStore((s) => s.hidden);
  useDragonCheers(hydrated);

  if (!hydrated || !dragonReady || hidden) return null;
  return (
    <View style={styles.layer}>
      <DragonCompanion />
    </View>
  );
}

const styles = StyleSheet.create({
  layer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' },
});
