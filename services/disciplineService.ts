import { getDb, today } from './db';

export async function saveDisciplineScore(
  score: number,
  flags: {
    workoutDone: boolean;
    proteinHit: boolean;
    calorieHit: boolean;
    waterHit: boolean;
    sleepLogged: boolean;
    cardioLogged: boolean;
  }
): Promise<void> {
  const db = getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO discipline_history
       (date, score, workout_done, protein_hit, calorie_hit, water_hit, sleep_logged, cardio_logged)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      today(),
      score,
      flags.workoutDone ? 1 : 0,
      flags.proteinHit ? 1 : 0,
      flags.calorieHit ? 1 : 0,
      flags.waterHit ? 1 : 0,
      flags.sleepLogged ? 1 : 0,
      flags.cardioLogged ? 1 : 0,
    ]
  );
}

export async function loadDisciplineHistory(): Promise<
  { date: string; score: number }[]
> {
  const db = getDb();
  const rows = await db.getAllAsync<{ date: string; score: number }>(
    `SELECT date, score FROM discipline_history ORDER BY date DESC LIMIT 90;`
  );
  return rows;
}

export async function saveWeeklyCheckIn(
  id: string,
  week: number,
  weightKg: number,
  waistCm: number | null,
  photoUri: string | null,
  notes: string | null
): Promise<void> {
  const db = getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO weekly_checkins (id, week_number, date, weight_kg, waist_cm, photo_uri, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?);`,
    [id, week, today(), weightKg, waistCm, photoUri, notes]
  );
}

export async function loadTodayDisciplineState(): Promise<{
  workoutDone: boolean;
  proteinHit: boolean;
  calorieHit: boolean;
  waterHit: boolean;
  sleepLogged: boolean;
  cardioLogged: boolean;
  score: number;
} | null> {
  const db = getDb();
  const row = await db.getFirstAsync<{
    score: number;
    workout_done: number;
    protein_hit: number;
    calorie_hit: number;
    water_hit: number;
    sleep_logged: number;
    cardio_logged: number;
  }>(`SELECT * FROM discipline_history WHERE date = ?;`, [today()]);
  if (!row) return null;
  return {
    workoutDone: row.workout_done === 1,
    proteinHit: row.protein_hit === 1,
    calorieHit: row.calorie_hit === 1,
    waterHit: row.water_hit === 1,
    sleepLogged: row.sleep_logged === 1,
    cardioLogged: row.cardio_logged === 1,
    score: row.score,
  };
}

export async function loadWeeklyCheckIns(): Promise<
  {
    id: string;
    week: number;
    date: string;
    weightKg: number;
    waistCm?: number;
    photoUri?: string;
    notes?: string;
  }[]
> {
  const db = getDb();
  const rows = await db.getAllAsync<{
    id: string;
    week_number: number;
    date: string;
    weight_kg: number;
    waist_cm: number | null;
    photo_uri: string | null;
    notes: string | null;
  }>(`SELECT * FROM weekly_checkins ORDER BY week_number DESC;`);

  return rows.map((r) => ({
    id: r.id,
    week: r.week_number,
    date: r.date,
    weightKg: r.weight_kg,
    waistCm: r.waist_cm ?? undefined,
    photoUri: r.photo_uri ?? undefined,
    notes: r.notes ?? undefined,
  }));
}
