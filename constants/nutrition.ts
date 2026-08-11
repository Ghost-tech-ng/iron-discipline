import type { FoodItem, Supplement } from '../types';
import type { DayType } from './phases';

export interface MealSlot {
  time: string;
  label: string;
  icon: string;
  why: string;
  foods: string[];
  protein: number;
  calories: number;
}

/**
 * Four meals, not three. On a cut at 210g+ protein, a 2021 review of protein
 * distribution found spreading intake across 3–6 doses beats concentrating it —
 * each dose fully activates muscle protein synthesis, and you cannot bank the
 * response. Four meals also makes 210g achievable without any single plate
 * being absurd.
 */
const TRAINING_DAY_MEALS: MealSlot[] = [
  {
    time: '9:00 AM',
    label: 'First Meal',
    icon: 'sunny-outline',
    why: 'After the fasted walk. Protein-heavy, moderate carbs — you have a full day and a training session ahead of this.',
    foods: ['5 whole eggs scrambled', '200g beans (cooked)', '2 slices wholegrain bread', '1 banana'],
    protein: 62,
    calories: 700,
  },
  {
    time: '1:00 PM',
    label: 'Pre-Workout Meal',
    icon: 'barbell-outline',
    why: 'The biggest carb meal of the day, 90 minutes before you lift. These carbs go into glycogen and get spent in the session — this is the one meal where carbs are unambiguously working for you.',
    foods: ['250g grilled chicken breast', '250g cooked white rice', '1 plantain (150g)', '150g cucumber and tomato'],
    protein: 72,
    calories: 830,
  },
  {
    time: '6:00 PM',
    label: 'Post-Workout Meal',
    icon: 'flame-outline',
    why: 'Protein and carbs after training refill glycogen and start repair. This is the second-largest meal, and on a deficit it is the one you protect.',
    foods: ['200g tilapia or mackerel (grilled)', '200g cooked rice or yam', '150g moi moi or beans', '1 tbsp groundnut oil'],
    protein: 58,
    calories: 660,
  },
  {
    time: '9:00 PM',
    label: 'Night Protein',
    icon: 'moon-outline',
    why: 'Slow protein before sleep. Overnight is the longest fasting window you have — a casein-style dose keeps amino acids available through it, which matters more in a deficit than at maintenance.',
    foods: ['250g Greek yogurt (0%)', '1 scoop whey', '20g almonds'],
    protein: 48,
    calories: 400,
  },
];

const REST_DAY_MEALS: MealSlot[] = [
  {
    time: '10:00 AM',
    label: 'First Meal',
    icon: 'sunny-outline',
    why: 'Rest day opens later — a longer fast is easier when you are not training, and it buys you bigger meals later.',
    foods: ['5 whole eggs', '1 tin sardines', '1 slice wholegrain bread', '150g spinach'],
    protein: 62,
    calories: 570,
  },
  {
    time: '2:00 PM',
    label: 'Main Meal',
    icon: 'restaurant-outline',
    why: 'Protein and volume, carbs kept low. Vegetables do the filling that rice does on a training day, at a fraction of the calories.',
    foods: ['250g grilled chicken breast', '300g mixed vegetables', '100g cooked rice', '1 tbsp olive oil'],
    protein: 82,
    calories: 690,
  },
  {
    time: '7:00 PM',
    label: 'Last Meal',
    icon: 'moon-outline',
    why: 'High protein, low carb, moderate fat. You are not refuelling anything today — you are protecting muscle while the deficit does its work.',
    foods: ['200g lean beef or mackerel', '200g broccoli', '100g beans', '1 tsp oil'],
    protein: 71,
    calories: 565,
  },
];

const REFEED_DAY_MEALS: MealSlot[] = [
  {
    time: '9:00 AM',
    label: 'Refeed Opener',
    icon: 'sunny-outline',
    why: 'Carbs first thing today. Fat stays low all day — this is a carbohydrate refeed, not a cheat day, and the two produce opposite results.',
    foods: ['150g oats (dry)', '2 scoops whey', '2 bananas', '1 tbsp honey'],
    protein: 62,
    calories: 900,
  },
  {
    time: '1:00 PM',
    label: 'Big Carb Meal',
    icon: 'barbell-outline',
    why: 'The largest carb load of the week. Muscle glycogen restores here, and leptin — which has been suppressed all week by the deficit — comes back up.',
    foods: ['250g grilled chicken breast', '400g cooked rice or jollof', '2 plantains', '150g salad, no oil'],
    protein: 78,
    calories: 1180,
  },
  {
    time: '7:00 PM',
    label: 'Refeed Close',
    icon: 'moon-outline',
    why: 'Still carb-forward, still low fat. Expect the scale up 1–1.5 kg tomorrow morning — that is glycogen pulling water in, and it is gone within 48 hours.',
    foods: ['200g white fish or tilapia', '250g yam or sweet potato', '150g beans', 'Fruit'],
    protein: 60,
    calories: 820,
  },
];

export function getMealPlan(dayType: DayType): MealSlot[] {
  if (dayType === 'refeed') return REFEED_DAY_MEALS;
  if (dayType === 'rest') return REST_DAY_MEALS;
  return TRAINING_DAY_MEALS;
}

/** Default view. Screens should prefer getMealPlan(dayType). */
export const DAILY_MEAL_PLAN: MealSlot[] = TRAINING_DAY_MEALS;

/**
 * Fallback targets used only when the protocol is not running (before the start
 * date, or after week 22). Live day-to-day targets come from the phase engine
 * via useActivePlanTargets — do not use these for daily scoring.
 */
export const USER_TARGETS = {
  calories: 2400,
  protein: 210,   // 2.36 g/kg at 89kg. Cutting range is 2.2–3.0 g/kg (higher the leaner you get).
                  // Same number the phase engine uses, so off-protocol days do not shift the habit.
  carbs: 239,     // macros sum to 2,399 kcal — the calorie line is not an independent number
  fat: 67,        // ~0.75 g/kg floor — below this, hormonal output suffers
  waterMl: 4000,  // up from 3500: higher protein raises urea load, and you are training 5x
  goalWeightKg: 82,
  startWeightKg: 89,
  weeklyGoalKg: 0.6,
  /** Waist at the navel. This is the real target — the scale is a proxy. */
  startWaistCm: 92,
  goalWaistCm: 80,
};

export const FOOD_LIBRARY: FoodItem[] = [
  // Proteins
  {
    id: 'chicken_breast',
    name: 'Grilled Chicken Breast',
    calories: 165,
    protein: 31,
    carbs: 0,
    fat: 3.6,
    servingSize: '100g',
  },
  {
    id: 'eggs_whole',
    name: 'Whole Eggs',
    calories: 155,
    protein: 13,
    carbs: 1.1,
    fat: 11,
    servingSize: '2 large eggs (100g)',
  },
  {
    id: 'egg_whites',
    name: 'Egg Whites',
    calories: 52,
    protein: 11,
    carbs: 0.7,
    fat: 0.2,
    servingSize: '100g',
  },
  {
    id: 'whey_protein',
    name: 'Whey Protein Shake',
    calories: 120,
    protein: 25,
    carbs: 3,
    fat: 1.5,
    servingSize: '1 scoop (30g)',
  },
  {
    id: 'lean_beef',
    name: 'Lean Beef Mince (90%)',
    calories: 176,
    protein: 26,
    carbs: 0,
    fat: 8,
    servingSize: '100g',
  },
  {
    id: 'tuna_can',
    name: 'Canned Tuna (in water)',
    calories: 116,
    protein: 26,
    carbs: 0,
    fat: 1,
    servingSize: '100g',
  },
  {
    id: 'greek_yogurt',
    name: 'Greek Yogurt (0% fat)',
    calories: 59,
    protein: 10,
    carbs: 3.6,
    fat: 0.4,
    servingSize: '100g',
  },
  {
    id: 'cottage_cheese',
    name: 'Cottage Cheese (low fat)',
    calories: 72,
    protein: 12,
    carbs: 2.7,
    fat: 1,
    servingSize: '100g',
  },
  // Carbs
  {
    id: 'white_rice',
    name: 'White Rice (cooked)',
    calories: 130,
    protein: 2.7,
    carbs: 28,
    fat: 0.3,
    servingSize: '100g',
  },
  {
    id: 'oats',
    name: 'Rolled Oats (dry)',
    calories: 389,
    protein: 17,
    carbs: 66,
    fat: 7,
    servingSize: '100g',
  },
  {
    id: 'sweet_potato',
    name: 'Sweet Potato (baked)',
    calories: 103,
    protein: 2.3,
    carbs: 24,
    fat: 0.1,
    servingSize: '100g',
  },
  {
    id: 'banana',
    name: 'Banana',
    calories: 89,
    protein: 1.1,
    carbs: 23,
    fat: 0.3,
    servingSize: '1 medium (100g)',
  },
  {
    id: 'bread_whole',
    name: 'Wholegrain Bread',
    calories: 247,
    protein: 13,
    carbs: 41,
    fat: 3.4,
    servingSize: '100g',
  },
  // Fats
  {
    id: 'olive_oil',
    name: 'Olive Oil',
    calories: 119,
    protein: 0,
    carbs: 0,
    fat: 13.5,
    servingSize: '1 tbsp (13.5g)',
  },
  {
    id: 'peanut_butter',
    name: 'Peanut Butter (natural)',
    calories: 94,
    protein: 4,
    carbs: 3.5,
    fat: 8,
    servingSize: '1 tbsp (16g)',
  },
  {
    id: 'almonds',
    name: 'Almonds',
    calories: 164,
    protein: 6,
    carbs: 6,
    fat: 14,
    servingSize: '28g (small handful)',
  },
  // Vegetables
  {
    id: 'spinach',
    name: 'Spinach (raw)',
    calories: 23,
    protein: 2.9,
    carbs: 3.6,
    fat: 0.4,
    servingSize: '100g',
  },
  {
    id: 'broccoli',
    name: 'Broccoli (steamed)',
    calories: 35,
    protein: 2.4,
    carbs: 7.2,
    fat: 0.4,
    servingSize: '100g',
  },
  {
    id: 'cucumber',
    name: 'Cucumber',
    calories: 15,
    protein: 0.7,
    carbs: 3.6,
    fat: 0.1,
    servingSize: '100g',
  },
  // Meals (composite)
  // Budget proteins
  {
    id: 'chicken_thighs',
    name: 'Chicken Thighs (boneless)',
    calories: 209,
    protein: 26,
    carbs: 0,
    fat: 11,
    servingSize: '100g',
  },
  {
    id: 'sardines_can',
    name: 'Canned Sardines (in oil, drained)',
    calories: 208,
    protein: 25,
    carbs: 0,
    fat: 12,
    servingSize: '1 tin (100g)',
  },
  {
    id: 'lentils_cooked',
    name: 'Lentils (cooked)',
    calories: 116,
    protein: 9,
    carbs: 20,
    fat: 0.4,
    servingSize: '100g',
  },
  {
    id: 'full_fat_milk',
    name: 'Full-Fat Milk',
    calories: 61,
    protein: 3.2,
    carbs: 4.8,
    fat: 3.3,
    servingSize: '100ml',
  },
  {
    id: 'beans_black',
    name: 'Black Beans (cooked)',
    calories: 132,
    protein: 8.9,
    carbs: 24,
    fat: 0.5,
    servingSize: '100g',
  },
  // Meals (composite)
  {
    id: 'chicken_salad',
    name: 'Chicken Salad (optimal)',
    calories: 435,
    protein: 52,
    carbs: 12,
    fat: 18,
    servingSize: '1 serving (200g chicken + veg + dressing)',
  },
  {
    id: 'rice_chicken_broccoli',
    name: 'Rice + Chicken + Broccoli',
    calories: 540,
    protein: 48,
    carbs: 55,
    fat: 8,
    servingSize: '1 plate (150g rice + 200g chicken + 150g broccoli)',
  },
  {
    id: 'oats_whey_banana',
    name: 'Oats + Whey + Banana',
    calories: 520,
    protein: 38,
    carbs: 72,
    fat: 9,
    servingSize: '100g oats + 1 scoop whey + 1 banana',
  },
  {
    id: 'budget_protein_plate',
    name: 'Thighs + Rice + Lentils',
    calories: 580,
    protein: 46,
    carbs: 58,
    fat: 12,
    servingSize: '150g thighs + 100g rice + 100g lentils',
  },
  {
    id: 'eggs_sardines_toast',
    name: 'Eggs + Sardines + Bread',
    calories: 490,
    protein: 42,
    carbs: 36,
    fat: 18,
    servingSize: '3 eggs + 1 sardine tin + 2 slices bread',
  },
];

export const DEFAULT_SUPPLEMENTS: Supplement[] = [
  {
    id: 'creatine',
    name: 'Creatine Monohydrate',
    dose: '5g',
    timing: 'Any time — consistency matters, timing does not',
    taken: false,
    notificationTime: '08:00',
  },
  {
    id: 'whey',
    name: 'Whey Protein',
    dose: '30–40g',
    timing: 'Post-workout, and again at night if protein is short',
    taken: false,
    notificationTime: undefined,
  },
  {
    id: 'caffeine',
    name: 'Caffeine (pre-workout)',
    dose: '200mg, 45 min pre-session',
    timing: 'Training days only — never after 3 PM',
    taken: false,
    notificationTime: '12:15',
  },
  {
    id: 'electrolytes',
    name: 'Electrolytes (sodium + potassium)',
    dose: '1 serving',
    timing: 'Rest days and fasted-walk mornings',
    taken: false,
    notificationTime: '07:00',
  },
  {
    id: 'omega3',
    name: 'Omega-3 (Fish Oil)',
    dose: '2–3g EPA+DHA',
    timing: 'With food',
    taken: false,
    notificationTime: '13:00',
  },
  {
    id: 'vitamin_d',
    name: 'Vitamin D3',
    dose: '2,000–4,000 IU',
    timing: 'Morning with food',
    taken: false,
    notificationTime: '08:00',
  },
  {
    id: 'magnesium',
    name: 'Magnesium Glycinate',
    dose: '300–400mg',
    timing: 'Before sleep',
    taken: false,
    notificationTime: '22:00',
  },
  {
    id: 'minoxidil',
    name: 'Minoxidil',
    dose: 'Per prescription',
    timing: 'As scheduled',
    taken: false,
    notificationTime: '08:00',
  },
];
