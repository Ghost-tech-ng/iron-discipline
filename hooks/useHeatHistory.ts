import { useEffect, useState } from 'react';
import { loadDisciplineHistory } from '../services/disciplineService';
import type { HeatDay } from '../utils/heat';

/** Last 90 days of discipline scores, plus whether the first load has landed. Reloads whenever today's score moves. */
export function useHeatHistoryState(score: number): { history: HeatDay[]; loaded: boolean } {
  const [state, setState] = useState<{ history: HeatDay[]; loaded: boolean }>({ history: [], loaded: false });

  useEffect(() => {
    let cancelled = false;
    loadDisciplineHistory()
      .then((rows) => {
        if (!cancelled) setState({ history: rows, loaded: true });
      })
      .catch((e) => console.warn('Heat history load failed:', e));
    return () => {
      cancelled = true;
    };
  }, [score]);

  return state;
}

export function useHeatHistory(score: number): HeatDay[] {
  return useHeatHistoryState(score).history;
}
