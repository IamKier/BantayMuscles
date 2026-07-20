/**
 * Online food search via Open Food Facts.
 *
 * Free, no API key, no server — the app calls it directly. Covers packaged
 * grocery products (including Philippine brands); it does NOT have restaurant
 * menu items, so Jollibee/KFC-style foods still need the bundled catalog or
 * Quick add.
 *
 * Data is licensed ODbL. Values are per 100 g, which is why every result is
 * returned with a "100 g" serving — the serving stepper scales from there.
 */

import { Food } from '@/lib/nutrition';

const ENDPOINT = 'https://search.openfoodfacts.org/search';

// Open Food Facts asks clients to identify themselves.
const USER_AGENT = 'FitTracker/1.0 (Expo app)';

type Hit = {
  code?: string;
  product_name?: string;
  brands?: string | string[];
  nutriments?: {
    'energy-kcal_100g'?: number;
    proteins_100g?: number;
    carbohydrates_100g?: number;
    fat_100g?: number;
  };
};

export type OnlineSearchResult =
  | { ok: true; foods: Food[] }
  | { ok: false; error: string };

function round(value: number | undefined): number {
  return Number.isFinite(value) ? Math.round(value as number) : 0;
}

function brandOf(brands: Hit['brands']): string {
  if (Array.isArray(brands)) return brands[0] ?? '';
  return brands ?? '';
}

export async function searchOnline(query: string): Promise<OnlineSearchResult> {
  const q = query.trim();
  if (q.length < 2) return { ok: true, foods: [] };

  const url =
    `${ENDPOINT}?q=${encodeURIComponent(q)}&page_size=25` +
    `&fields=code,product_name,brands,nutriments`;

  let payload: { hits?: Hit[] };
  try {
    const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (!response.ok) {
      return { ok: false, error: `Search is unavailable right now (${response.status}).` };
    }
    payload = await response.json();
  } catch {
    return { ok: false, error: 'Couldn’t reach the food database. Check your connection.' };
  }

  const seen = new Set<string>();
  const foods: Food[] = [];

  for (const hit of payload.hits ?? []) {
    const name = hit.product_name?.trim();
    const calories = hit.nutriments?.['energy-kcal_100g'];

    // Plenty of entries are missing nutrition data entirely — skipping them is
    // better than showing a food that logs as 0 kcal.
    if (!name || !calories) continue;

    const brand = brandOf(hit.brands).trim();
    const label = brand && !name.toLowerCase().includes(brand.toLowerCase())
      ? `${name} (${brand})`
      : name;

    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    foods.push({
      id: `off:${hit.code ?? key}`,
      name: label,
      serving: '100 g',
      calories: round(calories),
      protein: round(hit.nutriments?.proteins_100g),
      carbs: round(hit.nutriments?.carbohydrates_100g),
      fat: round(hit.nutriments?.fat_100g),
    });
  }

  return { ok: true, foods };
}

/** Online results carry a prefixed id so the UI can badge them. */
export function isOnlineFood(food: Food): boolean {
  return food.id.startsWith('off:');
}
