import AsyncStorage from '@react-native-async-storage/async-storage';
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

const MEAL_PLAN_CACHE_KEY = 'ai_meal_plan_v3';

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
      content: `Design a 3-meal day plan for a ${weightKg}kg Nigerian male doing 5-day strength training (push/pull/legs split) targeting body recomposition (losing fat, keeping/building muscle).

Eating window: 10:00 AM to 7:00 PM (16:8 intermittent fasting). This is evidence-based — 3 large protein meals produce equal or greater muscle protein synthesis over 24h compared to 6 small meals (Trommelen et al. 2023).

Goals: ${proteinGoal}g protein, ${calorieGoal} kcal — spread across exactly 3 meals. Each meal must have roughly ${Math.round(proteinGoal / 3)}g protein.

IMPORTANT — use foods commonly available in Nigeria: rice, beans, plantain, yam, oats, eggs, chicken, fish (tilapia, catfish, mackerel), beef, sardines, groundnut, pap (akamu), moi moi, suya, bread, peanut butter, milk. Mix Nigerian staples with simple global foods (eggs, oats, whey protein shake).

Return exactly 3 meals as a JSON array. Meals should be at 10:00 AM, 2:00 PM, and 6:30 PM. The 2:00 PM meal doubles as pre-workout fuel if training in the afternoon. The 6:30 PM meal is post-workout recovery.

Each meal must have:
- time: string e.g. "10:00 AM"
- label: short name e.g. "First Meal"
- emoji: one relevant emoji
- why: 1-2 sentences on WHY this meal and timing matters for the goal
- foods: array of 3-5 items with exact amounts e.g. ["200g grilled chicken breast", "250g cooked white rice", "2 boiled eggs"]
- protein: integer — calculate from amounts using: chicken breast 31g/100g, chicken thigh 26g/100g, beef 26g/100g, egg 6g each, tilapia 26g/100g, mackerel 19g/100g, sardines 25g/100g, beans cooked 9g/100g, moi moi 7g/100g, rice cooked 2.7g/100g, oats dry 17g/100g, plantain 1.3g/100g, yam 1.5g/100g, peanut butter 25g/100g, milk 3.4g/100ml, whey 25g per 30g scoop
- calories: integer — calculate from amounts using: chicken breast 165kcal/100g, chicken thigh 209kcal/100g, beef 250kcal/100g, egg 78kcal each, tilapia 128kcal/100g, mackerel 205kcal/100g, sardines 208kcal/100g, beans 132kcal/100g, moi moi 100kcal/100g, rice cooked 130kcal/100g, oats dry 389kcal/100g, plantain fried 220kcal/100g, plantain boiled 122kcal/100g, yam 118kcal/100g, peanut butter 588kcal/100g, milk 61kcal/100ml, whey 120kcal per 30g scoop

The total across all 3 meals must land within 10g of ${proteinGoal}g protein and within 100kcal of ${calorieGoal} kcal. Vary protein sources across the 3 meals.
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
