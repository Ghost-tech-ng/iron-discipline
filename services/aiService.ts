import type { FoodItem } from '../types';

const BASE_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

async function callGemini(parts: object[]): Promise<string> {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your-key-here') {
    throw new Error('Gemini API key not configured in .env.local');
  }

  const res = await fetch(`${BASE_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: { responseMimeType: 'application/json' },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
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
  const prompt = `You are a sports nutritionist. Estimate the nutritional content of this meal.
Meal: "${description}"
Be realistic with typical home or restaurant portion sizes.
Return JSON only — no markdown, no explanation — with exactly this shape:
{"name":"...","calories":0,"protein":0,"carbs":0,"fat":0,"servingSize":"..."}
All macros in grams, calories in kcal as integers.`;

  const text = await callGemini([{ text: prompt }]);
  return JSON.parse(text) as MealEstimate;
}

export async function estimateMealFromPhoto(
  base64: string,
  mimeType = 'image/jpeg'
): Promise<MealEstimate> {
  const prompt = `You are a sports nutritionist. Look at this food photo and estimate its nutritional content.
Base estimates on typical portion sizes visible in the photo.
Return JSON only — no markdown, no explanation — with exactly this shape:
{"name":"...","calories":0,"protein":0,"carbs":0,"fat":0,"servingSize":"..."}
All macros in grams, calories in kcal as integers.`;

  const text = await callGemini([
    { inline_data: { mime_type: mimeType, data: base64 } },
    { text: prompt },
  ]);
  return JSON.parse(text) as MealEstimate;
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
  const prompt = `You are a no-nonsense fitness coach. Write 2-3 sentences of daily feedback.
Today's data:
- Discipline score: ${data.score}/100
- Protein: ${data.protein}g of ${data.proteinGoal}g goal
- Calories: ${data.calories} of ${data.calorieGoal} kcal goal
- Workout done: ${data.workoutDone ? 'yes' : 'not yet'}
- Streak: ${data.streak} days
- Weight trend: ${data.weightTrend}

Rules: Be direct and honest. No filler words. Acknowledge what's good, flag what needs fixing. Sound like a coach, not a chatbot.
Return JSON only: {"message":"..."}`;

  const text = await callGemini([{ text: prompt }]);
  const parsed = JSON.parse(text) as { message: string };
  return parsed.message ?? '';
}
