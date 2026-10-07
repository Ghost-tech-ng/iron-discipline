import { getDb, today } from './db';

export async function saveHabitLog(habitId: string, completed: boolean): Promise<void> {
  const db = getDb();
  await db.runAsync(
    `INSERT INTO habit_logs (date, habit_id, completed) VALUES (?, ?, ?)
     ON CONFLICT(date, habit_id) DO UPDATE SET completed = excluded.completed;`,
    [today(), habitId, completed ? 1 : 0]
  );
}
