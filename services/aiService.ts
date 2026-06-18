import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MealSlot } from '../constants/nutrition';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const TEXT_MODEL = 'llama-3.3-70b-versatile';
const VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

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
      content: 'You are a Nigerian sports nutritionist based in Abuja. You know local food portions precisely. Always respond with valid JSON only, no markdown.',
    },
    {
      role: 'user',
      content: `Estimate the nutritional content of this meal: "${description}".

Context: The person is in Abuja, Nigeria. Use these realistic local portion references:
- "one portion of rice" at a local restaurant = ~350-400g cooked rice (~470-530 kcal, ~9-11g protein)
- "one plate of rice and stew" = rice + tomato stew + small protein (total ~600-750 kcal)
- "one portion of jollof rice" = ~300-350g (~400-470 kcal)
- "one wrap of moi moi" = ~150g (~160 kcal, 10g protein)
- "one plate of eba and soup" = ~200g eba + ~250ml soup with protein (~550-700 kcal)
- "one stick of suya" = ~80-100g meat (~180-220 kcal, 20-25g protein)
- Chicken Republic: full chicken leg = ~250g (~350 kcal, 30g protein); 1 piece chicken = ~120g
- Mr Biggs / fast food: standard plate = ~600-800 kcal
- "one wrap / one pack" = single serve from street food vendor
- Indomie (one pack 70g dry): ~330 kcal, 8g protein, 55g carbs, 11g fat
- Nigerian bread slice = ~40g (~110 kcal, 3g protein)
- Groundnut (small pack ~50g): ~280 kcal, 13g protein, 12g fat

If the description is vague (e.g. "one portion"), use the HIGHER end of the range to avoid underestimating.
Be accurate — this person is tracking their macros for body recomposition.

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
            text: `You are a Nigerian sports nutritionist based in Abuja. Estimate the nutritional content of the food in this photo.
The person is in Abuja, Nigeria — recognize Nigerian foods (jollof rice, eba, egusi, suya, moi moi, plantain, etc.) and use realistic Nigerian portion sizes.
If you see a plate of rice, a typical Nigerian restaurant portion is 350-400g cooked. If you see a wrapped food item, estimate accordingly.
Do not underestimate — use the higher end of your estimate range.
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
- icon: one of "sunny-outline", "restaurant-outline", "barbell-outline", "moon-outline", "cafe-outline"
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
    const slots = JSON.parse(raw) as (MealSlot & { emoji?: string })[];
    // Migrate old emoji field to icon
    return slots.map((s) => ({
      ...s,
      icon: s.icon ?? 'restaurant-outline',
    }));
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

export async function askCoach(question: string, data: CoachingData): Promise<string> {
  const text = await callGroq(TEXT_MODEL, [
    {
      role: 'system',
      content: 'You are a direct, no-nonsense fitness and nutrition coach. Always respond with valid JSON only, no markdown.',
    },
    {
      role: 'user',
      content: `User context: ${data.protein}g protein (goal: ${data.proteinGoal}g), ${data.calories} kcal (goal: ${data.calorieGoal}), workout ${data.workoutDone ? 'done' : 'not done'}, ${data.streak}-day streak, discipline score: ${data.score}/100, weight trend: ${data.weightTrend}.

Question: "${question}"

Answer in 2-4 sentences. Be specific and direct. Reference their data where relevant. No filler.
Return JSON: {"answer":"..."}`,
    },
  ]);
  const parsed = JSON.parse(text) as { answer: string };
  return parsed.answer ?? '';
}

export async function suggestMealsForRemaining(
  consumed: { calories: number; protein: number; carbs: number; fat: number },
  targets: { calories: number; protein: number; carbs: number; fat: number },
  mealLabel: string
): Promise<MealEstimate[]> {
  const remCal = Math.max(0, targets.calories - consumed.calories);
  const remProtein = Math.max(0, targets.protein - consumed.protein);
  const remCarbs = Math.max(0, targets.carbs - consumed.carbs);
  const remFat = Math.max(0, targets.fat - consumed.fat);

  const text = await callGroq(TEXT_MODEL, [
    {
      role: 'system',
      content: 'You are a Nigerian sports nutritionist. Always respond with valid JSON only, no markdown.',
    },
    {
      role: 'user',
      content: `The user has eaten ${consumed.calories} kcal and ${consumed.protein}g protein today.
Remaining targets: ${remCal} kcal, ${remProtein}g protein, ${remCarbs}g carbs, ${remFat}g fat.
This is for their ${mealLabel}.

Suggest exactly 3 different meal options that fit this remaining budget. Use Nigerian foods (rice, beans, plantain, yam, chicken, fish, eggs, etc.) in realistic portion sizes. Each option should cover a sensible portion of the remaining budget — not necessarily all of it if multiple meals remain in the day.

Return JSON: {"suggestions":[{"name":"...","calories":0,"protein":0,"carbs":0,"fat":0,"servingSize":"..."},...]}`
    },
  ]);

  const parsed = JSON.parse(text) as { suggestions: MealEstimate[] };
  return parsed.suggestions ?? [];
}

export interface AdvisorContext {
  goals: { calories: number; protein: number; carbs: number; fat: number };
  todayConsumed: { calories: number; protein: number; carbs: number; fat: number };
  question: string;
}

export interface AdvisorResult {
  verdict: 'eat' | 'avoid' | 'moderate' | 'compare';
  headline: string;
  reasoning: string;
  recommendation: string;
  macroNote?: string;
  winner?: string;
}

export async function adviseOnFood(
  images: { base64: string; mimeType?: string }[],
  ctx: AdvisorContext
): Promise<AdvisorResult> {
  const remCal = Math.max(0, ctx.goals.calories - ctx.todayConsumed.calories);
  const remProtein = Math.max(0, ctx.goals.protein - ctx.todayConsumed.protein);

  const imageContent = images.map((img) => ({
    type: 'image_url',
    image_url: { url: `data:${img.mimeType ?? 'image/jpeg'};base64,${img.base64}` },
  }));

  const comparing = images.length > 1;

  const systemPrompt = `You are a no-nonsense Nigerian fitness coach and nutritionist based in Abuja.
You help a 95kg male doing body recomposition — losing fat while building muscle.
Goal: 2500 kcal/day, 200g protein/day, minimize junk, high protein efficiency.
Always respond with valid JSON only, no markdown.`;

  const userPrompt = `${comparing ? 'The user is comparing these ' + images.length + ' products/foods.' : 'The user wants to know if they should eat/buy this food or product.'}

Today so far: ${ctx.todayConsumed.calories} kcal eaten, ${ctx.todayConsumed.protein}g protein consumed.
Remaining budget: ${remCal} kcal, ${remProtein}g protein still needed.
User's question: "${ctx.question}"

${comparing
  ? 'Analyze both items in the image(s). Compare their nutritional value, protein content, ingredients quality, and suitability for body recomposition. Pick the better one and explain why clearly.'
  : 'Analyze the food/product in the image. Check if it fits the remaining daily budget and supports the recomposition goal.'}

Be direct and honest. Nigerian foods and products are valid — do not be biased toward Western products.
If it is a packaged product, read the nutrition label if visible.

Return JSON exactly:
{
  "verdict": "eat" | "avoid" | "moderate" | "compare",
  "headline": "one short sentence summary",
  "reasoning": "2-3 sentences on nutritional content and why it does or doesn't fit the goal",
  "recommendation": "specific action — how much to eat, when, what to pair with it, or which to buy",
  "macroNote": "optional — how this fits today's remaining budget",
  ${comparing ? '"winner": "describe which item wins and why in one sentence"' : '"winner": null'}
}`;

  const text = await callGroq(
    VISION_MODEL,
    [
      {
        role: 'user',
        content: [
          ...imageContent,
          { type: 'text', text: userPrompt },
        ],
      },
    ],
    false
  );

  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Could not parse advisor response');
  return JSON.parse(match[0]) as AdvisorResult;
}

export interface DietAuditResult {
  summary: string;
  wins: string[];
  cuts: { item: string; reason: string }[];
  adds: { item: string; reason: string }[];
}

export async function generateWeeklyDietAudit(
  entries: { date: string; name: string; calories: number; protein: number; carbs: number; fat: number; quantity: number }[],
  targets: { calories: number; protein: number; carbs: number; fat: number }
): Promise<DietAuditResult> {
  const foodList = entries
    .map((e) => `${e.date}: ${e.name} (${Math.round(e.calories * e.quantity)} kcal, ${Math.round(e.protein * e.quantity)}g protein)`)
    .join('\n');

  const text = await callGroq(TEXT_MODEL, [
    {
      role: 'system',
      content: 'You are a direct, no-nonsense Nigerian sports nutritionist based in Abuja reviewing a client\'s actual week of eating. Always respond with valid JSON only, no markdown.',
    },
    {
      role: 'user',
      content: `Here is everything this person ate over the last 7 days:
${foodList}

Daily targets: ${targets.calories} kcal, ${targets.protein}g protein, ${targets.carbs}g carbs, ${targets.fat}g fat.

Review this like a coach doing a weekly check-in. Be specific and reference actual foods they ate by name — don't give generic advice.
Identify:
1. wins: 1-3 things they did well (specific foods/patterns that supported the goal)
2. cuts: 1-3 specific foods/patterns to cut or reduce, with a concrete reason (e.g. oversized single meals, low-protein-density choices, repeated splurges)
3. adds: 1-3 specific Nigerian-available foods or swaps to add, with a concrete reason tied to what they're missing (protein density, fiber, micronutrients)

Return JSON exactly:
{"summary":"one direct sentence on the week overall","wins":["..."],"cuts":[{"item":"...","reason":"..."}],"adds":[{"item":"...","reason":"..."}]}`,
    },
  ]);

  return JSON.parse(text) as DietAuditResult;
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
