import * as Network from 'expo-network';
import { getDb } from './db';
import { isMongoConfigured, upsertMany, upsertOne } from './mongoService';

export async function isOnline(): Promise<boolean> {
  try {
    const state = await Network.getNetworkStateAsync();
    return !!(state.isConnected && state.isInternetReachable);
  } catch {
    return false;
  }
}

export async function syncToCloud(userId: string): Promise<void> {
  if (!isMongoConfigured()) throw new Error('MongoDB not configured — add credentials to .env.local');

  const db = getDb();

  const [meals, supplements, discipline, checkIns, workouts] = await Promise.all([
    db.getAllAsync<Record<string, unknown>>('SELECT * FROM meal_entries;'),
    db.getAllAsync<Record<string, unknown>>('SELECT * FROM supplement_logs;'),
    db.getAllAsync<Record<string, unknown>>('SELECT * FROM discipline_history;'),
    db.getAllAsync<Record<string, unknown>>('SELECT * FROM weekly_checkins;'),
    db.getAllAsync<Record<string, unknown>>('SELECT * FROM workout_logs;'),
  ]);

  // Water: aggregate by date (no stable row ID)
  const waterRows = await db.getAllAsync<{ date: string; total: number }>(
    'SELECT date, SUM(amount_ml) as total FROM water_logs GROUP BY date;'
  );

  // User profile
  const profile = await db.getFirstAsync<Record<string, unknown>>(
    'SELECT * FROM user_profile WHERE id = 1;'
  );

  const tag = (doc: Record<string, unknown>) => ({ ...doc, userId });

  await Promise.all([
    upsertMany('meal_entries', meals.map(tag)),
    upsertMany('supplement_logs', supplements.map((s) => ({
      ...tag(s),
      id: `${userId}_${s.date}_${s.supplement_id}`,
    }))),
    upsertMany('discipline_history', discipline.map((d) => ({
      ...tag(d),
      id: `${userId}_${d.date}`,
    }))),
    upsertMany('weekly_checkins', checkIns.map(tag)),
    upsertMany('workout_logs', workouts.map(tag)),
    upsertMany('water_logs', waterRows.map((w) => ({
      ...tag(w as unknown as Record<string, unknown>),
      id: `${userId}_${w.date}`,
    }))),
    profile
      ? upsertOne('user_profile', { id: `${userId}_profile` }, { ...tag(profile), id: `${userId}_profile` })
      : Promise.resolve(),
  ]);
}
