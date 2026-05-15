import { getDb } from './db';
import type { UserProfile } from '../types';

interface DBRow {
  name: string;
  height_cm: number;
  weight_kg: number;
  goal_weight_kg: number;
  goal_calories: number;
  goal_protein: number;
  goal_carbs: number;
  goal_fat: number;
  goal_water_ml: number;
  onboarding_complete: number;
}

export async function loadUserProfile(): Promise<UserProfile | null> {
  const db = getDb();
  const row = await db.getFirstAsync<DBRow>(
    'SELECT * FROM user_profile WHERE id = 1;'
  );
  if (!row) return null;

  return {
    name: row.name,
    heightCm: row.height_cm,
    weightKg: row.weight_kg,
    goalWeightKg: row.goal_weight_kg,
    goalCalories: row.goal_calories,
    goalProtein: row.goal_protein,
    goalCarbs: row.goal_carbs,
    goalFat: row.goal_fat,
    goalWaterMl: row.goal_water_ml,
    onboardingComplete: row.onboarding_complete === 1,
  };
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  const db = getDb();
  await db.runAsync(
    `UPDATE user_profile SET
      name = ?,
      height_cm = ?,
      weight_kg = ?,
      goal_weight_kg = ?,
      goal_calories = ?,
      goal_protein = ?,
      goal_carbs = ?,
      goal_fat = ?,
      goal_water_ml = ?,
      onboarding_complete = ?
    WHERE id = 1;`,
    [
      profile.name,
      profile.heightCm,
      profile.weightKg,
      profile.goalWeightKg,
      profile.goalCalories,
      profile.goalProtein,
      profile.goalCarbs,
      profile.goalFat,
      profile.goalWaterMl,
      profile.onboardingComplete ? 1 : 0,
    ]
  );
}
