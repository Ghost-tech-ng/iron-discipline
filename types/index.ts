export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'triceps'
  | 'biceps'
  | 'legs'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'core';

export type SessionType = 'push' | 'pull' | 'legs' | 'upper' | 'lower' | 'rest';

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface Exercise {
  id: string;
  name: string;
  muscleGroups: MuscleGroup[];
  sets: number;
  repsMin: number;
  repsMax: number;
  restSeconds: number;
  notes?: string;
  bodyweight?: boolean;
}

export interface Stretch {
  name: string;
  duration: string;
  description: string;
}

export interface WorkoutSession {
  id: string;
  type: SessionType;
  label: string;
  exercises: Exercise[];
  warmUp: Stretch[];
  coolDown: Stretch[];
}

export interface SetLog {
  setNumber: number;
  weight: number;
  reps: number;
  completed: boolean;
}

export interface ExerciseLog {
  exerciseId: string;
  exerciseName: string;
  sets: SetLog[];
}

export interface WorkoutLog {
  id: string;
  date: string;
  sessionType: SessionType;
  sessionLabel: string;
  exerciseLogs: ExerciseLog[];
  durationMinutes: number;
  completed: boolean;
}

export type MealCategory = 'breakfast' | 'lunch' | 'dinner' | 'post_workout' | 'snack';

export interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
}

export interface MealEntry {
  id: string;
  date: string;
  category: MealCategory;
  foodItem: FoodItem;
  quantity: number;
  time?: string;
}

export interface DailyNutrition {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  entries: MealEntry[];
}

export interface Supplement {
  id: string;
  name: string;
  dose: string;
  timing: string;
  taken: boolean;
  notificationTime?: string;
}

export interface HabitItem {
  id: string;
  label: string;
  completed: boolean;
  weight: number;
}

export interface WeeklyCheckIn {
  id: string;
  week: number;
  date: string;
  weightKg: number;
  waistCm?: number;
  photoUri?: string;
  notes?: string;
}

export interface UserProfile {
  name: string;
  heightCm: number;
  weightKg: number;
  goalWeightKg: number;
  goalCalories: number;
  goalProtein: number;
  goalCarbs: number;
  goalFat: number;
  goalWaterMl: number;
  onboardingComplete: boolean;
}

export interface DisciplineState {
  date: string;
  workoutDone: boolean;
  proteinHit: boolean;
  calorieHit: boolean;
  supplementsTaken: string[];
  waterGoalHit: boolean;
  sleepLogged: boolean;
  cardioLogged: boolean;
  score: number;
}
