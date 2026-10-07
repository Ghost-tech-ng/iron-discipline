import { getDb } from './db';

export async function loadExerciseSwaps(): Promise<Record<string, string>> {
  const db = getDb();
  const rows = await db.getAllAsync<{ exercise_id: string; swap_name: string }>(
    'SELECT exercise_id, swap_name FROM exercise_swaps;'
  );
  return Object.fromEntries(rows.map((r) => [r.exercise_id, r.swap_name]));
}

/** `swapName` null goes back to the prescribed exercise. */
export async function saveExerciseSwap(exerciseId: string, swapName: string | null): Promise<void> {
  const db = getDb();
  if (swapName === null) {
    await db.runAsync('DELETE FROM exercise_swaps WHERE exercise_id = ?;', [exerciseId]);
    return;
  }
  await db.runAsync(
    `INSERT INTO exercise_swaps (exercise_id, swap_name) VALUES (?, ?)
     ON CONFLICT(exercise_id) DO UPDATE SET swap_name = excluded.swap_name;`,
    [exerciseId, swapName]
  );
}
