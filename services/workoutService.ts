import { getDb, today } from './db';
import type { WorkoutLog, ExerciseLog, SetLog } from '../types';

export async function saveWorkoutLog(log: WorkoutLog): Promise<void> {
  const db = getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO workout_logs (id, date, session_type, session_label, duration_minutes, completed)
     VALUES (?, ?, ?, ?, ?, ?);`,
    [log.id, log.date, log.sessionType, log.sessionLabel, log.durationMinutes, log.completed ? 1 : 0]
  );

  for (const el of log.exerciseLogs) {
    const result = await db.runAsync(
      `INSERT INTO exercise_logs (workout_log_id, exercise_id, exercise_name)
       VALUES (?, ?, ?);`,
      [log.id, el.exerciseId, el.exerciseName]
    );
    const exerciseLogId = result.lastInsertRowId;

    for (const set of el.sets) {
      await db.runAsync(
        `INSERT INTO set_logs (exercise_log_id, set_number, weight, reps, completed)
         VALUES (?, ?, ?, ?, ?);`,
        [exerciseLogId, set.setNumber, set.weight, set.reps, set.completed ? 1 : 0]
      );
    }
  }
}

export async function loadWorkoutHistory(): Promise<WorkoutLog[]> {
  const db = getDb();
  const rows = await db.getAllAsync<{
    id: string;
    date: string;
    session_type: string;
    session_label: string;
    duration_minutes: number;
    completed: number;
  }>(`SELECT * FROM workout_logs ORDER BY date DESC LIMIT 50;`);

  const logs: WorkoutLog[] = [];
  for (const row of rows) {
    const exerciseRows = await db.getAllAsync<{
      id: number;
      exercise_id: string;
      exercise_name: string;
    }>(
      `SELECT id, exercise_id, exercise_name FROM exercise_logs WHERE workout_log_id = ?;`,
      [row.id]
    );

    const exerciseLogs: ExerciseLog[] = [];
    for (const er of exerciseRows) {
      const setRows = await db.getAllAsync<{
        set_number: number;
        weight: number;
        reps: number;
        completed: number;
      }>(
        `SELECT set_number, weight, reps, completed FROM set_logs WHERE exercise_log_id = ? ORDER BY set_number;`,
        [er.id]
      );
      exerciseLogs.push({
        exerciseId: er.exercise_id,
        exerciseName: er.exercise_name,
        sets: setRows.map((s) => ({
          setNumber: s.set_number,
          weight: s.weight,
          reps: s.reps,
          completed: s.completed === 1,
        })),
      });
    }

    logs.push({
      id: row.id,
      date: row.date,
      sessionType: row.session_type as WorkoutLog['sessionType'],
      sessionLabel: row.session_label,
      durationMinutes: row.duration_minutes,
      completed: row.completed === 1,
      exerciseLogs,
    });
  }

  return logs;
}

export async function loadStrengthHistory(
  exerciseId: string,
  limit = 12
): Promise<{ date: string; weight: number; reps: number }[]> {
  const db = getDb();
  // Get best set (highest weight) per workout session for a given exercise
  const rows = await db.getAllAsync<{ date: string; weight: number; reps: number }>(
    `SELECT wl.date, MAX(sl.weight) as weight, sl.reps
     FROM set_logs sl
     JOIN exercise_logs el ON el.id = sl.exercise_log_id
     JOIN workout_logs wl ON wl.id = el.workout_log_id
     WHERE el.exercise_id = ? AND sl.completed = 1 AND wl.completed = 1
     GROUP BY wl.id
     ORDER BY wl.date DESC
     LIMIT ?;`,
    [exerciseId, limit]
  );
  return rows.reverse();
}

export async function loadWorkoutDates(days = 84): Promise<string[]> {
  const db = getDb();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().split('T')[0];

  const rows = await db.getAllAsync<{ date: string }>(
    `SELECT DISTINCT date FROM workout_logs WHERE completed = 1 AND date >= ? ORDER BY date ASC;`,
    [cutoffStr]
  );
  return rows.map((r) => r.date);
}

export async function getLastSessionByType(sessionType: string): Promise<WorkoutLog | null> {
  const db = getDb();
  const row = await db.getFirstAsync<{ id: string }>(
    `SELECT id FROM workout_logs WHERE session_type = ? AND completed = 1 ORDER BY date DESC LIMIT 1;`,
    [sessionType]
  );
  if (!row) return null;

  const all = await loadWorkoutHistory();
  return all.find((l) => l.id === row.id) ?? null;
}
