import { useEffect, useState } from 'react';
import { loadDisciplineHistory } from '../services/disciplineService';
import type { HeatDay } from '../utils/heat';

/** Last 90 days of discipline scores. Reloads whenever today's score moves, since that write lands in the same table. */
export function useHeatHistory(score: number): HeatDay[] {
  const [history, setHistory] = useState<HeatDay[]>([]);

  useEffect(() => {
    let cancelled = false;
    loadDisciplineHistory()
      .then((rows) => {
        if (!cancelled) setHistory(rows);
      })
      .catch((e) => console.warn('Heat history load failed:', e));
    return () => {
      cancelled = true;
    };
  }, [score]);

  return history;
}
