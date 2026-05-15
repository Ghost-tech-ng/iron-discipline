import type { FoodItem } from '../types';

interface OFFProduct {
  product_name?: string;
  nutriments?: {
    'energy-kcal_100g'?: number;
    'proteins_100g'?: number;
    'carbohydrates_100g'?: number;
    'fat_100g'?: number;
  };
  serving_size?: string;
  serving_quantity?: number;
}

interface OFFResponse {
  status: number;
  product?: OFFProduct;
}

export async function lookupBarcode(barcode: string): Promise<FoodItem | null> {
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
      { headers: { 'User-Agent': 'IronDiscipline/1.0' } }
    );

    if (!res.ok) return null;

    const data = (await res.json()) as OFFResponse;
    if (data.status !== 1 || !data.product) return null;

    const p = data.product;
    const n = p.nutriments ?? {};

    // Nutrients are per 100g — scale to serving size if available
    const servingG = p.serving_quantity ?? 100;
    const ratio = servingG / 100;

    const calories = Math.round((n['energy-kcal_100g'] ?? 0) * ratio);
    const protein = Math.round((n['proteins_100g'] ?? 0) * ratio * 10) / 10;
    const carbs = Math.round((n['carbohydrates_100g'] ?? 0) * ratio * 10) / 10;
    const fat = Math.round((n['fat_100g'] ?? 0) * ratio * 10) / 10;

    if (!calories && !protein) return null;

    return {
      id: `barcode_${barcode}`,
      name: p.product_name ?? `Product ${barcode}`,
      calories,
      protein,
      carbs,
      fat,
      servingSize: p.serving_size ?? `${servingG}g`,
    };
  } catch {
    return null;
  }
}
