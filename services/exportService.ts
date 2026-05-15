import {
  documentDirectory,
  writeAsStringAsync,
  EncodingType,
} from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { getDb } from './db';

function escapeCSV(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function row(...values: (string | number | null | undefined)[]): string {
  return values.map(escapeCSV).join(',');
}

export async function exportAllData(): Promise<void> {
  const db = getDb();
  const sections: string[] = [];

  // --- Workout logs ---
  const workouts = await db.getAllAsync<{
    date: string; session_label: string; duration_minutes: number; completed: number;
  }>(`SELECT date, session_label, duration_minutes, completed FROM workout_logs ORDER BY date;`);

  sections.push('WORKOUTS');
  sections.push(row('Date', 'Session', 'Duration (min)', 'Completed'));
  workouts.forEach((w) =>
    sections.push(row(w.date, w.session_label, w.duration_minutes, w.completed ? 'Yes' : 'No'))
  );

  // --- Meal entries ---
  const meals = await db.getAllAsync<{
    date: string; category: string; food_name: string;
    food_calories: number; food_protein: number; food_carbs: number; food_fat: number; quantity: number;
  }>(`SELECT date, category, food_name, food_calories, food_protein, food_carbs, food_fat, quantity FROM meal_entries ORDER BY date;`);

  sections.push('');
  sections.push('NUTRITION');
  sections.push(row('Date', 'Category', 'Food', 'Calories', 'Protein (g)', 'Carbs (g)', 'Fat (g)', 'Servings'));
  meals.forEach((m) =>
    sections.push(row(
      m.date, m.category, m.food_name,
      Math.round(m.food_calories * m.quantity),
      Math.round(m.food_protein * m.quantity * 10) / 10,
      Math.round(m.food_carbs * m.quantity * 10) / 10,
      Math.round(m.food_fat * m.quantity * 10) / 10,
      m.quantity,
    ))
  );

  // --- Weekly check-ins ---
  const checkins = await db.getAllAsync<{
    date: string; week_number: number; weight_kg: number; waist_cm: number | null; notes: string | null;
  }>(`SELECT date, week_number, weight_kg, waist_cm, notes FROM weekly_checkins ORDER BY date;`);

  sections.push('');
  sections.push('WEEKLY CHECK-INS');
  sections.push(row('Date', 'Week', 'Weight (kg)', 'Waist (cm)', 'Notes'));
  checkins.forEach((c) =>
    sections.push(row(c.date, c.week_number, c.weight_kg, c.waist_cm, c.notes))
  );

  // --- Discipline history ---
  const discipline = await db.getAllAsync<{
    date: string; score: number; workout_done: number; protein_hit: number; calorie_hit: number;
  }>(`SELECT date, score, workout_done, protein_hit, calorie_hit FROM discipline_history ORDER BY date;`);

  sections.push('');
  sections.push('DISCIPLINE SCORES');
  sections.push(row('Date', 'Score', 'Workout', 'Protein Hit', 'Calories Hit'));
  discipline.forEach((d) =>
    sections.push(row(
      d.date, d.score,
      d.workout_done ? 'Yes' : 'No',
      d.protein_hit ? 'Yes' : 'No',
      d.calorie_hit ? 'Yes' : 'No',
    ))
  );

  const csv = sections.join('\n');
  const filename = `iron-discipline-export-${new Date().toISOString().split('T')[0]}.csv`;
  const path = `${documentDirectory}${filename}`;

  await writeAsStringAsync(path, csv, {
    encoding: EncodingType.UTF8,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) throw new Error('Sharing not available on this device');

  await Sharing.shareAsync(path, {
    mimeType: 'text/csv',
    dialogTitle: 'Export Iron Discipline Data',
    UTI: 'public.comma-separated-values-text',
  });
}
