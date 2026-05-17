import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FoodItem } from '../types';
import type { MealSlot } from '../constants/nutrition';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const TEXT_MODEL = 'llama-3.3-70b-versatile';
const VISION_MODEL = 'llama-3.2-11b-vision-preview';

function getKey(): string {
  const key = process.env.EXPO_PUBLIC_GROQ_API_KEY ?? '';
  if (!key || key === 'your-key-here') {
    throw new Error('Groq API key not configured in .env.local');
  }
  return key;
}

async function callGroq(
  model: string,
  messages: object[],
  jsonMode = true
): Promise<string> {
  const body: Record<string, unknown> = {
    model,
    messages,
    temperature: 0.3,
  };
  if (jsonMode) body.response_format = { type: 'json_object' };

  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getKey()}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

export interface MealEstimate {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
}

export async function estimateMealFromText(description: string): Promise<MealEstimate> {
  const text = await callGroq(TEXT_MODEL, [
    {
      role: 'system',
      content:
        'You are a sports nutritionist. Always respond with valid JSON only, no markdown.',
    },
    {
      role: 'user',
      content: `Estimate the nutritional content of this meal: "${description}".
Use realistic home or restaurant portion sizes.
Return JSON with exactly this shape:
{"name":"...","calories":0,"protein":0,"carbs":0,"fat":0,"servingSize":"..."}
All macros in grams, calories in kcal as integers.`,
    },
  ]);
  return JSON.parse(text) as MealEstimate;
}

export async function estimateMealFromPhoto(
  base64: string,
  mimeType = 'image/jpeg'
): Promise<MealEstimate> {
  const text = await callGroq(
    VISION_MODEL,
    [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: `data:${mimeType};base64,${base64}` },
          },
          {
            type: 'text',
            text: `You are a sports nutritionist. Estimate the nutritional content of the food in this photo.
Base estimates on typical portion sizes visible.
Return JSON only, no markdown, with exactly this shape:
{"name":"...","calories":0,"protein":0,"carbs":0,"fat":0,"servingSize":"..."}
All macros in grams, calories in kcal as integers.`,
          },
        ],
      },
    ],
    false // vision model doesn't support json_object mode
  );

  // Extract JSON from response even if model wraps it in text
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Could not parse nutrition from photo');
  return JSON.parse(match[0]) as MealEstimate;
}

const MEAL_PLAN_CACHE_KEY = 'ai_meal_plan_v1';

export async function generateMealPlan(
  weightKg: number,
  proteinGoal: number,
  calorieGoal: number
): Promise<MealSlot[]> {
  const text = await callGroq(TEXT_MODEL, [
    {
      role: 'system',
      content: 'You are an elite sports nutritionist. Always respond with valid JSON only, no markdown.',
    },
    {
      role: 'user',
      content: `Design a single day meal plan for a ${weightKg}kg male doing 5-day strength training (push/pull/legs split) targeting body recomposition.
Goals: ${proteinGoal}g protein, ${calorieGoal} kcal per day.

Return exactly 6 meals as a JSON array. Each meal must have:
- time: meal time as string e.g. "7:00 AM"
- label: short meal name e.g. "Breakfast"
- emoji: one relevant emoji
- why: 1-2 sentences explaining WHY this meal at this time (the science/logic)
- foods: array of 3-4 specific food items with amounts e.g. ["200g grilled chicken", "250g cooked rice"]
- protein: integer grams for this meal
- calories: integer kcal for this meal

Spread protein evenly. Include a pre-workout meal around 4-5 PM and a casein-rich meal before bed. Vary the protein sources (eggs, chicken, beef, fish, dairy). Make it practical and affordable.
Return JSON: {"meals": [...]}`,
    },
  ]);

  const parsed = JSON.parse(text) as { meals: MealSlot[] };
  const plan = parsed.meals ?? [];
  await AsyncStorage.setItem(MEAL_PLAN_CACHE_KEY, JSON.stringify(plan));
  return plan;
}

export async function loadCachedMealPlan(): Promise<MealSlot[] | null> {
  try {
    const raw = await AsyncStorage.getItem(MEAL_PLAN_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as MealSlot[];
  } catch {
    return null;
  }
}

export interface CoachingData {
  score: number;
  protein: number;
  proteinGoal: number;
  calories: number;
  calorieGoal: number;
  workoutDone: boolean;
  streak: number;
  weightTrend: 'losing' | 'gaining' | 'stable' | 'unknown';
}

export async function generateDailyCoaching(data: CoachingData): Promise<string> {
  const text = await callGroq(TEXT_MODEL, [
    {
      role: 'system',
      content:
        'You are a no-nonsense fitness coach. Always respond with valid JSON only, no markdown.',
    },
    {
      role: 'user',
      content: `Write 2-3 sentences of daily feedback based on this data:
- Discipline score: ${data.score}/100
- Protein: ${data.protein}g of ${data.proteinGoal}g goal
- Calories: ${data.calories} of ${data.calorieGoal} kcal goal
- Workout done: ${data.workoutDone ? 'yes' : 'not yet'}
- Streak: ${data.streak} days
- Weight trend: ${data.weightTrend}

Be direct and honest. No filler words. Acknowledge what's good, flag what needs fixing. Sound like a coach, not a chatbot.
Return JSON: {"message":"..."}`,
    },
  ]);

  const parsed = JSON.parse(text) as { message: string };
  return parsed.message ?? '';
}
