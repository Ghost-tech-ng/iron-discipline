import { getDb, today } from './db';
import type { MealEntry, DailyNutrition } from '../types';

export async function saveMealEntry(entry: MealEntry): Promise<void> {
  const db = getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO meal_entries
       (id, date, time, category, food_id, food_name, food_calories, food_protein, food_carbs, food_fat, quantity)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      entry.id,
      entry.date,
      entry.time ?? null,
      entry.category,
      entry.foodItem.id,
      entry.foodItem.name,
      entry.foodItem.calories,
      entry.foodItem.protein,
      entry.foodItem.carbs,
      entry.foodItem.fat,
      entry.quantity,
    ]
  );
}

export async function deleteMealEntry(entryId: string): Promise<void> {
  const db = getDb();
  await db.runAsync(`DELETE FROM meal_entries WHERE id = ?;`, [entryId]);
}

export async function loadTodayMeals(): Promise<MealEntry[]> {
  return loadMealsForDate(today());
}

export async function loadMealsForDate(date: string): Promise<MealEntry[]> {
  const db = getDb();
  const rows = await db.getAllAsync<{
    id: string;
    date: string;
    time: string | null;
    category: string;
    food_id: string;
    food_name: string;
    food_calories: number;
    food_protein: number;
    food_carbs: number;
    food_fat: number;
    quantity: number;
  }>(`SELECT * FROM meal_entries WHERE date = ? ORDER BY rowid ASC;`, [date]);

  return rows.map((r) => ({
    id: r.id,
    date: r.date,
    time: r.time ?? undefined,
    category: r.category as MealEntry['category'],
    quantity: r.quantity,
    foodItem: {
      id: r.food_id,
      name: r.food_name,
      calories: r.food_calories,
      protein: r.food_protein,
      carbs: r.food_carbs,
      fat: r.food_fat,
      servingSize: '1 serving',
    },
  }));
}

export async function logWater(ml: number): Promise<void> {
  const db = getDb();
  await db.runAsync(
    `INSERT INTO water_logs (date, amount_ml) VALUES (?, ?);`,
    [today(), ml]
  );
}

export async function loadTodayWater(): Promise<number> {
  const db = getDb();
  const row = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(amount_ml), 0) as total FROM water_logs WHERE date = ?;`,
    [today()]
  );
  return row?.total ?? 0;
}

export async function saveSupplementLog(supplementId: string, taken: boolean): Promise<void> {
  const db = getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO supplement_logs (date, supplement_id, taken) VALUES (?, ?, ?);`,
    [today(), supplementId, taken ? 1 : 0]
  );
}

export async function loadDailyCalorieHistory(
  days = 30
): Promise<{ date: string; calories: number }[]> {
  const db = getDb();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days + 1);
  const cutoffStr = cutoff.toISOString().split('T')[0];

  const rows = await db.getAllAsync<{ date: string; calories: number }>(
    `SELECT date, ROUND(SUM(food_calories * quantity)) as calories
     FROM meal_entries
     WHERE date >= ?
     GROUP BY date
     ORDER BY date ASC;`,
    [cutoffStr]
  );
  return rows;
}

export async function loadTodaySupplements(): Promise<string[]> {
  const db = getDb();
  const rows = await db.getAllAsync<{ supplement_id: string }>(
    `SELECT supplement_id FROM supplement_logs WHERE date = ? AND taken = 1;`,
    [today()]
  );
  return rows.map((r) => r.supplement_id);
}
