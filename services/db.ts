import * as SQLite from 'expo-sqlite';

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
      weight_kg REAL NOT NULL DEFAULT 95,
      goal_weight_kg REAL NOT NULL DEFAULT 89,
      goal_calories INTEGER NOT NULL DEFAULT 2500,
      goal_protein INTEGER NOT NULL DEFAULT 200,
      goal_carbs INTEGER NOT NULL DEFAULT 240,
      goal_fat INTEGER NOT NULL DEFAULT 72,
      goal_water_ml INTEGER NOT NULL DEFAULT 3500,
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
  return new Date().toISOString().split('T')[0];
}
