import * as SQLite from 'expo-sqlite';
import { USER_TARGETS } from '../constants/nutrition';
import { localIso } from '../utils/date';

let db: SQLite.SQLiteDatabase;

export function getDb(): SQLite.SQLiteDatabase {
  if (!db) {
    db = SQLite.openDatabaseSync('iron_discipline.db');
  }
  return db;
}

export async function initDatabase(): Promise<void> {
  const database = getDb();

  await database.execAsync(`PRAGMA journal_mode = WAL;`);
  // Off by default in SQLite, per connection — without it the ON DELETE CASCADEs never fire.
  await database.execAsync(`PRAGMA foreign_keys = ON;`);

  // Schema version table
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER PRIMARY KEY
    );
  `);

  const result = await database.getFirstAsync<{ version: number }>(
    'SELECT version FROM schema_version ORDER BY version DESC LIMIT 1;'
  );
  const currentVersion = result?.version ?? 0;

  if (currentVersion < 1) {
    await runMigration1(database);
    await database.runAsync('INSERT INTO schema_version (version) VALUES (1);');
  }

  if (currentVersion < 2) {
    await runMigration2(database);
    await database.runAsync('INSERT INTO schema_version (version) VALUES (2);');
  }

  if (currentVersion < 3) {
    await runMigration3(database);
    await database.runAsync('INSERT INTO schema_version (version) VALUES (3);');
  }

  if (currentVersion < 4) {
    await runMigration4(database);
    await database.runAsync('INSERT INTO schema_version (version) VALUES (4);');
  }
  if (currentVersion < 5) {
    await runMigration5(database);
    await database.runAsync('INSERT INTO schema_version (version) VALUES (5);');
  }
  if (currentVersion < 6) {
    await runMigration6(database);
    await database.runAsync('INSERT INTO schema_version (version) VALUES (6);');
  }
  if (currentVersion < 7) {
    await runMigration7(database);
    await database.runAsync('INSERT INTO schema_version (version) VALUES (7);');
  }
  if (currentVersion < 8) {
    await runMigration8(database);
    await database.runAsync('INSERT INTO schema_version (version) VALUES (8);');
  }
  if (currentVersion < 9) {
    await runMigration9(database);
    await database.runAsync('INSERT INTO schema_version (version) VALUES (9);');
  }
  if (currentVersion < 10) {
    await runMigration10(database);
    await database.runAsync('INSERT INTO schema_version (version) VALUES (10);');
  }
}

export async function getUserId(): Promise<string> {
  const db = getDb();
  const row = await db.getFirstAsync<{ user_id: string | null }>(
    'SELECT user_id FROM user_profile WHERE id = 1;'
  );
  if (row?.user_id) return row.user_id;
  const id = generateUUID();
  await db.runAsync('UPDATE user_profile SET user_id = ? WHERE id = 1;', [id]);
  return id;
}

export async function resetAllData(): Promise<void> {
  const db = getDb();
  await db.execAsync(`
    DELETE FROM set_logs;
    DELETE FROM exercise_logs;
    DELETE FROM workout_logs;
    DELETE FROM meal_entries;
    DELETE FROM water_logs;
    DELETE FROM supplement_logs;
    DELETE FROM discipline_history;
    DELETE FROM weekly_checkins;
    DELETE FROM habit_logs;
    DELETE FROM sync_state;
    UPDATE user_profile SET
      name = '',
      weight_kg = 89,
      goal_weight_kg = 84,
      goal_calories = 2700,
      goal_protein = 210,
      goal_carbs = 320,
      goal_fat = 63,
      goal_water_ml = 4000,
      onboarding_complete = 0,
      protocol_start_override = NULL
    WHERE id = 1;
  `);
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * The profile row was created with the old 95kg default and never corrected, so
 * the app has been showing 95kg and sizing the fallback targets against it.
 * Actual bodyweight after the first three months is 89kg.
 *
 * Only the profile row is touched — the guard means a weight that was genuinely
 * entered by hand is left alone. No logs, meals or check-ins are read or written.
 */
async function runMigration5(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.runAsync(
    `UPDATE user_profile SET weight_kg = ? WHERE id = 1 AND weight_kg = 95;`,
    [USER_TARGETS.startWeightKg]
  );
  await db.runAsync(
    `UPDATE user_profile SET
       goal_weight_kg = ?, goal_calories = ?, goal_protein = ?,
       goal_carbs = ?, goal_fat = ?, goal_water_ml = ?
     WHERE id = 1;`,
    [
      USER_TARGETS.goalWeightKg, USER_TARGETS.calories, USER_TARGETS.protein,
      USER_TARGETS.carbs, USER_TARGETS.fat, USER_TARGETS.waterMl,
    ]
  );
}

/**
 * The 87kg floor / recomposition redesign moved goal_weight_kg from 82 to 87
 * and the fallback macro targets from the ATTACK/FINISH cut numbers to the
 * ATTACK/BUILD ones. Migration 5 already ran on installed devices, so it will
 * not re-fire to pick this up — only the profile row is touched here, same
 * guard-free UPDATE-by-id pattern as migration 5. No logs, meals or check-ins
 * are read or written.
 */
async function runMigration6(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.runAsync(
    `UPDATE user_profile SET
       goal_weight_kg = ?, goal_calories = ?, goal_protein = ?,
       goal_carbs = ?, goal_fat = ?, goal_water_ml = ?
     WHERE id = 1;`,
    [
      USER_TARGETS.goalWeightKg, USER_TARGETS.calories, USER_TARGETS.protein,
      USER_TARGETS.carbs, USER_TARGETS.fat, USER_TARGETS.waterMl,
    ]
  );
}

/**
 * The Sculpt Protocol's start date used to be a hardcoded constant, so every
 * day between install and whenever the user actually began training read as a
 * missed session. NULL here means "not started yet" — the app sets this to
 * today's date the moment the user taps Start Protocol.
 */
async function runMigration7(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`ALTER TABLE user_profile ADD COLUMN protocol_start_override TEXT;`);
}

/**
 * supplement_logs and habit_logs had no uniqueness on (date, id), so every
 * INSERT OR REPLACE appended a row instead of replacing — un-ticking a
 * supplement left the earlier taken=1 row behind. Keep the newest row per
 * day/item, then enforce one row going forward.
 *
 * Also drops exercise/set rows orphaned while foreign keys were off, and adds
 * sync_state so cloud sync only uploads rows that changed.
 */
async function runMigration8(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    DELETE FROM supplement_logs WHERE id NOT IN (
      SELECT MAX(id) FROM supplement_logs GROUP BY date, supplement_id
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_supplement_logs_day
      ON supplement_logs(date, supplement_id);

    DELETE FROM habit_logs WHERE id NOT IN (
      SELECT MAX(id) FROM habit_logs GROUP BY date, habit_id
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_habit_logs_day
      ON habit_logs(date, habit_id);

    DELETE FROM exercise_logs WHERE workout_log_id NOT IN (SELECT id FROM workout_logs);
    DELETE FROM set_logs WHERE exercise_log_id NOT IN (SELECT id FROM exercise_logs);

    CREATE TABLE IF NOT EXISTS sync_state (
      collection TEXT NOT NULL,
      doc_id TEXT NOT NULL,
      hash TEXT NOT NULL,
      PRIMARY KEY (collection, doc_id)
    );
  `);
}

/**
 * Remembers which substitute the user picked when their gym lacks the
 * prescribed machine, so the same swap is pre-selected every week.
 */
async function runMigration9(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS exercise_swaps (
      exercise_id TEXT PRIMARY KEY,
      swap_name TEXT NOT NULL
    );
  `);
}

/**
 * Goal changed from the 87kg floor to 12% body fat (~84kg). Only the profile
 * row's goal weight moves, and only if it still holds the old default, so a
 * goal entered by hand is left alone. No logs, meals or check-ins are touched.
 */
async function runMigration10(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.runAsync(
    'UPDATE user_profile SET goal_weight_kg = ? WHERE id = 1 AND goal_weight_kg = 87;',
    [USER_TARGETS.goalWeightKg]
  );
}

/**
 * Sculpt Protocol needs more than weight. Waist at the navel is the metric that
 * actually tracks flank/lower-ab fat, and waist:hip separates "losing fat" from
 * "losing everything". Chest is the counterweight — it should hold or grow while
 * the waist falls.
 */
async function runMigration4(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`ALTER TABLE weekly_checkins ADD COLUMN waist_narrow_cm REAL;`);
  await db.execAsync(`ALTER TABLE weekly_checkins ADD COLUMN hip_cm REAL;`);
  await db.execAsync(`ALTER TABLE weekly_checkins ADD COLUMN chest_cm REAL;`);
}

async function runMigration3(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`ALTER TABLE user_profile ADD COLUMN user_id TEXT;`);
}

async function runMigration2(db: SQLite.SQLiteDatabase): Promise<void> {
  // Add time column to meal_entries for existing installs
  await db.execAsync(`ALTER TABLE meal_entries ADD COLUMN time TEXT;`);
  // Correct default goal weight to 85kg
  await db.execAsync(`UPDATE user_profile SET goal_weight_kg = 85 WHERE goal_weight_kg = 89;`);
}

async function runMigration1(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    -- User profile
    CREATE TABLE IF NOT EXISTS user_profile (
      id INTEGER PRIMARY KEY DEFAULT 1,
      name TEXT NOT NULL DEFAULT '',
      height_cm REAL NOT NULL DEFAULT 191,
      weight_kg REAL NOT NULL DEFAULT 89,
      goal_weight_kg REAL NOT NULL DEFAULT 82,
      goal_calories INTEGER NOT NULL DEFAULT 2400,
      goal_protein INTEGER NOT NULL DEFAULT 210,
      goal_carbs INTEGER NOT NULL DEFAULT 239,
      goal_fat INTEGER NOT NULL DEFAULT 67,
      goal_water_ml INTEGER NOT NULL DEFAULT 4000,
      onboarding_complete INTEGER NOT NULL DEFAULT 0
    );

    INSERT OR IGNORE INTO user_profile (id) VALUES (1);

    -- Workout logs
    CREATE TABLE IF NOT EXISTS workout_logs (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      session_type TEXT NOT NULL,
      session_label TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL DEFAULT 0,
      completed INTEGER NOT NULL DEFAULT 0
    );

    -- Exercise logs per workout
    CREATE TABLE IF NOT EXISTS exercise_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workout_log_id TEXT NOT NULL,
      exercise_id TEXT NOT NULL,
      exercise_name TEXT NOT NULL,
      FOREIGN KEY (workout_log_id) REFERENCES workout_logs(id) ON DELETE CASCADE
    );

    -- Set logs per exercise
    CREATE TABLE IF NOT EXISTS set_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exercise_log_id INTEGER NOT NULL,
      set_number INTEGER NOT NULL,
      weight REAL NOT NULL DEFAULT 0,
      reps INTEGER NOT NULL DEFAULT 0,
      completed INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (exercise_log_id) REFERENCES exercise_logs(id) ON DELETE CASCADE
    );

    -- Daily nutrition
    CREATE TABLE IF NOT EXISTS meal_entries (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      category TEXT NOT NULL,
      food_id TEXT NOT NULL,
      food_name TEXT NOT NULL,
      food_calories REAL NOT NULL,
      food_protein REAL NOT NULL,
      food_carbs REAL NOT NULL,
      food_fat REAL NOT NULL,
      quantity REAL NOT NULL DEFAULT 1
    );

    -- Daily water intake
    CREATE TABLE IF NOT EXISTS water_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      amount_ml INTEGER NOT NULL
    );

    -- Supplement logs
    CREATE TABLE IF NOT EXISTS supplement_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      supplement_id TEXT NOT NULL,
      taken INTEGER NOT NULL DEFAULT 0
    );

    -- Habit logs
    CREATE TABLE IF NOT EXISTS habit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      habit_id TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0
    );

    -- Discipline score history
    CREATE TABLE IF NOT EXISTS discipline_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      score INTEGER NOT NULL DEFAULT 0,
      workout_done INTEGER DEFAULT 0,
      protein_hit INTEGER DEFAULT 0,
      calorie_hit INTEGER DEFAULT 0,
      water_hit INTEGER DEFAULT 0,
      sleep_logged INTEGER DEFAULT 0,
      cardio_logged INTEGER DEFAULT 0
    );

    -- Weekly check-ins (weight, waist, photos)
    CREATE TABLE IF NOT EXISTS weekly_checkins (
      id TEXT PRIMARY KEY,
      week_number INTEGER NOT NULL,
      date TEXT NOT NULL,
      weight_kg REAL NOT NULL,
      waist_cm REAL,
      photo_uri TEXT,
      notes TEXT
    );

    -- Indexes for fast date queries
    CREATE INDEX IF NOT EXISTS idx_workout_logs_date ON workout_logs(date);
    CREATE INDEX IF NOT EXISTS idx_meal_entries_date ON meal_entries(date);
    CREATE INDEX IF NOT EXISTS idx_habit_logs_date ON habit_logs(date);
    CREATE INDEX IF NOT EXISTS idx_discipline_history_date ON discipline_history(date);
  `);
}

// Helper: get today's date string
export function today(): string {
  return localIso();
}
