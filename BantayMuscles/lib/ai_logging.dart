// Natural-language food logging — calls Gemini directly from the app.
//
// Personal app (you + friends), so the key lives in the app (ai_config.dart,
// gitignored) rather than behind a server. Send a free-text meal description
// (English or Tagalog) and get back foods with estimated macros.

import 'dart:convert';

import 'package:http/http.dart' as http;

import 'ai_config.dart';
import 'models/nutrition.dart';

const _model = 'gemini-2.0-flash';

/// Result of an AI parse — the foods, or a user-facing error.
class AiParseResult {
  final bool ok;
  final List<Food> foods;
  final String? error;
  const AiParseResult.success(this.foods)
      : ok = true,
        error = null;
  const AiParseResult.failure(this.error)
      : ok = false,
        foods = const [];
}

/// True when a Gemini key is configured.
bool get isAiConfigured => kGeminiApiKey.isNotEmpty;

/// AI-parsed foods carry an `ai:` id so the UI can badge them.
bool isAiFood(Food food) => food.id.startsWith('ai:');

const _systemPrompt = '''You are a nutrition assistant for a Filipino calorie tracker.
The user describes what they ate, in English or Tagalog (e.g. "2 itlog, 1 tasa kanin, adobo").
Return one entry per distinct food. For each:
- name: a short, clear food name in the user's language.
- serving: the amount the user described (e.g. "2 pcs", "1 cup (150g)"). If no amount is given, assume 1 typical serving.
- calories, protein, carbs, fat: whole-number TOTALS for that serving amount (grams for macros).
Give realistic estimates for Filipino dishes. If the text names no food, return an empty list.''';

// Structured-output schema — forces Gemini to return exactly this shape.
const _responseSchema = {
  'type': 'OBJECT',
  'properties': {
    'foods': {
      'type': 'ARRAY',
      'items': {
        'type': 'OBJECT',
        'properties': {
          'name': {'type': 'STRING'},
          'serving': {'type': 'STRING'},
          'calories': {'type': 'NUMBER'},
          'protein': {'type': 'NUMBER'},
          'carbs': {'type': 'NUMBER'},
          'fat': {'type': 'NUMBER'},
        },
        'required': ['name', 'serving', 'calories', 'protein', 'carbs', 'fat'],
      },
    },
  },
  'required': ['foods'],
};

Future<AiParseResult> parseMeal(String text) async {
  final q = text.trim();
  if (q.length < 2) return const AiParseResult.success([]);
  if (!isAiConfigured) {
    return const AiParseResult.failure('AI logging isn’t set up (missing Gemini key).');
  }

  final url = Uri.parse(
    'https://generativelanguage.googleapis.com/v1beta/models/$_model:generateContent?key=$kGeminiApiKey',
  );

  http.Response res;
  try {
    res = await http
        .post(
          url,
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'systemInstruction': {
              'parts': [
                {'text': _systemPrompt}
              ]
            },
            'contents': [
              {
                'role': 'user',
                'parts': [
                  {'text': q}
                ]
              }
            ],
            'generationConfig': {
              'temperature': 0.2,
              'responseMimeType': 'application/json',
              'responseSchema': _responseSchema,
            },
          }),
        )
        .timeout(const Duration(seconds: 20));
  } catch (_) {
    return const AiParseResult.failure('Couldn’t reach the AI service. Check your connection.');
  }

  if (res.statusCode == 429) {
    return const AiParseResult.failure('AI is busy (rate limit). Try again in a moment.');
  }
  if (res.statusCode == 400 || res.statusCode == 403) {
    return const AiParseResult.failure('AI key rejected. Check the Gemini API key.');
  }
  if (res.statusCode != 200) {
    return const AiParseResult.failure('The AI service returned an error. Try again.');
  }

  // Gemini wraps the JSON text inside candidates[0].content.parts[0].text.
  Map<String, dynamic> parsed;
  try {
    final data = jsonDecode(res.body) as Map<String, dynamic>;
    String? rawText;
    final candidates = data['candidates'];
    if (candidates is List && candidates.isNotEmpty) {
      final content = (candidates.first as Map)['content'];
      final parts = content is Map ? content['parts'] : null;
      if (parts is List && parts.isNotEmpty) {
        rawText = (parts.first as Map)['text'] as String?;
      }
    }
    parsed = jsonDecode(rawText ?? '{}') as Map<String, dynamic>;
  } catch (_) {
    return const AiParseResult.failure('Couldn’t understand the AI response. Try rephrasing.');
  }

  final raw = parsed['foods'];
  if (raw is! List) return const AiParseResult.success([]);

  final foods = <Food>[];
  for (var i = 0; i < raw.length; i++) {
    final f = raw[i];
    if (f is! Map) continue;
    final name = (f['name'] as String?)?.trim();
    if (name == null || name.isEmpty) continue;
    foods.add(Food(
      id: 'ai:$i:${name.toLowerCase()}',
      name: name,
      serving: (f['serving'] as String?)?.trim().isNotEmpty == true
          ? (f['serving'] as String).trim()
          : '1 serving',
      calories: (f['calories'] as num?)?.round() ?? 0,
      protein: (f['protein'] as num?)?.round() ?? 0,
      carbs: (f['carbs'] as num?)?.round() ?? 0,
      fat: (f['fat'] as num?)?.round() ?? 0,
    ));
  }
  return AiParseResult.success(foods);
}
