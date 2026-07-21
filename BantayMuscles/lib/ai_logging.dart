// Natural-language food logging.
//
// Sends a free-text meal description to the `parse-meal` Supabase Edge Function,
// which calls Gemini server-side (the API key never ships in the app) and returns
// foods with estimated macros. Falls back to a clear error on any failure.

import 'dart:convert';

import 'package:http/http.dart' as http;

import 'models/nutrition.dart';
import 'remote_config.dart';

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

/// True when Supabase (and therefore the AI function) is configured.
bool get isAiConfigured => kSupabaseUrl.isNotEmpty && kSupabaseAnonKey.isNotEmpty;

Future<AiParseResult> parseMeal(String text) async {
  final q = text.trim();
  if (q.length < 2) return const AiParseResult.success([]);
  if (!isAiConfigured) {
    return const AiParseResult.failure('AI logging isn’t configured.');
  }

  final url = Uri.parse('$kSupabaseUrl/functions/v1/parse-meal');

  http.Response res;
  try {
    res = await http
        .post(
          url,
          headers: {
            'Content-Type': 'application/json',
            'apikey': kSupabaseAnonKey,
            'Authorization': 'Bearer $kSupabaseAnonKey',
          },
          body: jsonEncode({'text': q}),
        )
        .timeout(const Duration(seconds: 20));
  } catch (_) {
    return const AiParseResult.failure('Couldn’t reach the AI service. Check your connection.');
  }

  Map<String, dynamic> body;
  try {
    body = jsonDecode(res.body) as Map<String, dynamic>;
  } catch (_) {
    return const AiParseResult.failure('The AI service returned an unexpected response.');
  }

  if (res.statusCode != 200) {
    final msg = (body['error'] as String?) ?? 'The AI service returned an error.';
    return AiParseResult.failure(msg);
  }

  final raw = body['foods'];
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

/// AI-parsed foods carry an `ai:` id so the UI can badge them.
bool isAiFood(Food food) => food.id.startsWith('ai:');
