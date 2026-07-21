/**
 * Nutrition-label OCR via OCR.space.
 *
 * Cloud OCR over plain HTTP — no native module, so it works in Expo Go. The
 * result only ever *pre-fills* the Quick Add form; the user confirms the numbers
 * before anything is saved, so imperfect OCR can't silently log wrong data.
 *
 * The free "helloworld" key is heavily rate-limited — register a free key at
 * ocr.space and set EXPO_PUBLIC_OCR_SPACE_KEY for real use.
 */

const OCR_ENDPOINT = 'https://api.ocr.space/parse/image';
const OCR_KEY = process.env.EXPO_PUBLIC_OCR_SPACE_KEY || 'helloworld';

export type LabelResult = {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
};

export type ReadLabelResult =
  | { ok: true; result: LabelResult }
  | { ok: false; error: string };

async function ocrImage(base64Jpeg: string): Promise<string> {
  const body = new FormData();
  body.append('base64Image', `data:image/jpeg;base64,${base64Jpeg}`);
  body.append('apikey', OCR_KEY);
  body.append('language', 'eng');
  // Engine 2 handles the small, dense text of a nutrition panel better.
  body.append('OCREngine', '2');
  body.append('scale', 'true');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(OCR_ENDPOINT, {
      method: 'POST',
      body,
      signal: controller.signal,
    });
    const json = (await response.json()) as {
      IsErroredOnProcessing?: boolean;
      ErrorMessage?: string | string[];
      ParsedResults?: { ParsedText?: string }[];
    };
    if (json.IsErroredOnProcessing) {
      const msg = Array.isArray(json.ErrorMessage) ? json.ErrorMessage[0] : json.ErrorMessage;
      throw new Error(msg ?? 'OCR failed');
    }
    return json.ParsedResults?.[0]?.ParsedText ?? '';
  } finally {
    clearTimeout(timer);
  }
}

function firstNumber(text: string, patterns: RegExp[]): number | undefined {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const value = Math.round(Number(match[1].replace(/,/g, '')));
      if (Number.isFinite(value) && value >= 0) return value;
    }
  }
  return undefined;
}

/** Heuristic parse of an OCR'd nutrition panel. Best-effort; the user confirms. */
export function parseNutrition(text: string): LabelResult {
  const t = text.toLowerCase().replace(/\s+/g, ' ');
  return {
    calories: firstNumber(t, [
      /(?:energy|calories?)[^\d]{0,12}(\d[\d.,]*)\s*k?cal/,
      /(\d[\d.,]*)\s*kcal/,
      /(?:calories?|energy)[^\d]{0,12}(\d[\d.,]*)/,
    ]),
    protein: firstNumber(t, [/protein[^\d]{0,12}(\d[\d.]*)\s*g/]),
    carbs: firstNumber(t, [
      /(?:total carbohydrate|carbohydrates?|total carb\w*|carbs?)[^\d]{0,15}(\d[\d.]*)\s*g/,
    ]),
    fat: firstNumber(t, [/(?:total fat|fat)[^\d]{0,12}(\d[\d.]*)\s*g/]),
  };
}

export async function readLabel(base64Jpeg: string): Promise<ReadLabelResult> {
  let text: string;
  try {
    text = await ocrImage(base64Jpeg);
  } catch {
    return { ok: false, error: 'Couldn’t reach the reader. Check your connection and try again.' };
  }

  if (!text.trim()) {
    return { ok: false, error: 'No text found — fill the frame with the nutrition label and retry.' };
  }

  const result = parseNutrition(text);
  const foundSomething =
    result.calories != null ||
    result.protein != null ||
    result.carbs != null ||
    result.fat != null;

  if (!foundSomething) {
    return {
      ok: false,
      error: 'Couldn’t read the numbers. Try better lighting, or tap Quick add to type them.',
    };
  }

  return { ok: true, result };
}
