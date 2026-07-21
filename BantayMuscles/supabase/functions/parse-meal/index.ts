// parse-meal — natural-language food logging via Gemini.
//
// The app sends a free-text meal description (English or Filipino/Tagalog) and
// gets back a list of foods with estimated macros. The Gemini API key never
// leaves the server: it's read from the GEMINI_API_KEY secret. Deploy with:
//
//   supabase functions deploy parse-meal
//   supabase secrets set GEMINI_API_KEY=your_key_from_aistudio
//
// Deployed with --no-verify-jwt (see deploy notes): the app authenticates with
// its Supabase anon/publishable key in the apikey header; this function exposes
// no data, only a bounded Gemini proxy.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const GEMINI_MODEL = "gemini-2.0-flash";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// Structured-output schema — forces Gemini to return exactly this shape.
const responseSchema = {
  type: "OBJECT",
  properties: {
    foods: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          serving: { type: "STRING" }, // the amount described, e.g. "2 pcs", "1 cup"
          calories: { type: "NUMBER" },
          protein: { type: "NUMBER" },
          carbs: { type: "NUMBER" },
          fat: { type: "NUMBER" },
        },
        required: ["name", "serving", "calories", "protein", "carbs", "fat"],
      },
    },
  },
  required: ["foods"],
};

const SYSTEM_PROMPT = `You are a nutrition assistant for a Filipino calorie tracker.
The user describes what they ate, in English or Tagalog (e.g. "2 itlog, 1 tasa kanin, adobo").
Return one entry per distinct food. For each:
- name: a short, clear food name in the user's language.
- serving: the amount the user described (e.g. "2 pcs", "1 cup (150g)"). If no amount is given, assume 1 typical serving.
- calories, protein, carbs, fat: whole-number TOTALS for that serving amount (grams for macros).
Give realistic estimates for Filipino dishes. If the text names no food, return an empty list.`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    return json(
      { error: "AI is not configured yet. Set the GEMINI_API_KEY secret." },
      503,
    );
  }

  let text = "";
  try {
    const body = await req.json();
    text = (body?.text ?? "").toString().trim();
  } catch {
    return json({ error: "Invalid request body." }, 400);
  }
  if (text.length < 2) return json({ foods: [] });

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  let geminiRes: Response;
  try {
    geminiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: "user", parts: [{ text }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
          responseSchema,
        },
      }),
    });
  } catch {
    return json({ error: "Couldn’t reach the AI service. Try again." }, 502);
  }

  if (!geminiRes.ok) {
    const detail = await geminiRes.text().catch(() => "");
    console.error("Gemini error", geminiRes.status, detail);
    // 429 = rate limited on the free tier; surface a friendly message.
    const msg = geminiRes.status === 429
      ? "AI is busy (rate limit). Try again in a moment."
      : "The AI service returned an error. Try again.";
    return json({ error: msg }, 502);
  }

  let parsed: { foods?: unknown };
  try {
    const data = await geminiRes.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
    parsed = JSON.parse(rawText);
  } catch {
    return json({ error: "Couldn’t understand the AI response. Try rephrasing." }, 502);
  }

  const foods = Array.isArray(parsed.foods)
    ? parsed.foods
      .filter((f: Record<string, unknown>) => f && typeof f.name === "string" && f.name.trim())
      .map((f: Record<string, unknown>) => ({
        name: String(f.name).trim(),
        serving: (f.serving ? String(f.serving) : "1 serving").trim(),
        calories: Math.max(0, Math.round(Number(f.calories) || 0)),
        protein: Math.max(0, Math.round(Number(f.protein) || 0)),
        carbs: Math.max(0, Math.round(Number(f.carbs) || 0)),
        fat: Math.max(0, Math.round(Number(f.fat) || 0)),
      }))
    : [];

  return json({ foods });
});
