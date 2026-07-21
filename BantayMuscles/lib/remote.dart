// Remote food catalog (Supabase).
//
// The diary and profile live entirely on the device — the only thing fetched
// remotely is the shared food catalog, which is world-readable and needs no
// account. Uses Supabase's REST endpoint directly over HTTP (no SDK). Returns
// null on any failure so the caller falls back to the bundled list rather than
// surfacing an error.
//
// Port of the Expo app's remote.ts + supabase.ts.

import 'dart:convert';

import 'package:http/http.dart' as http;

import 'models/nutrition.dart';
import 'remote_config.dart';

/// True only when both a URL and an anon key are configured.
bool get isRemoteConfigured => kSupabaseUrl.isNotEmpty && kSupabaseAnonKey.isNotEmpty;

Future<List<Food>?> fetchRemoteFoods() async {
  if (!isRemoteConfigured) return null;

  final url = Uri.parse(
    '$kSupabaseUrl/rest/v1/foods'
    '?select=id,name,serving,calories,protein,carbs,fat&order=name',
  );

  try {
    final res = await http.get(url, headers: {
      'apikey': kSupabaseAnonKey,
      'Authorization': 'Bearer $kSupabaseAnonKey',
      'Accept': 'application/json',
    }).timeout(const Duration(seconds: 12));
    if (res.statusCode != 200) return null;

    final data = jsonDecode(res.body);
    if (data is! List) return null;

    final foods = <Food>[];
    for (final row in data) {
      if (row is! Map) continue;
      final name = row['name'] as String?;
      if (name == null || name.isEmpty) continue;
      foods.add(Food(
        id: row['id'].toString(),
        name: name,
        serving: (row['serving'] as String?) ?? '',
        calories: (row['calories'] as num?)?.round() ?? 0,
        protein: (row['protein'] as num?)?.round() ?? 0,
        carbs: (row['carbs'] as num?)?.round() ?? 0,
        fat: (row['fat'] as num?)?.round() ?? 0,
      ));
    }
    return foods.isEmpty ? null : foods;
  } catch (_) {
    return null;
  }
}
