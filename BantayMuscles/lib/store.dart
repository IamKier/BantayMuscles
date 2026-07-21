import 'dart:async';
import 'dart:convert';
import 'dart:math';

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'foods.dart';
import 'models/nutrition.dart';
import 'remote.dart';

String createId() {
  final t = DateTime.now().microsecondsSinceEpoch.toRadixString(36);
  final r = Random().nextInt(1 << 20).toRadixString(36);
  return '$t-$r';
}

/// Single source of truth. Mirrors the Expo app's store: profile, diary entries,
/// steps, the selected day, and the theme preference — all persisted locally.
class AppStore extends ChangeNotifier {
  Profile _profile = const Profile();
  List<Entry> _entries = [];
  Map<String, int> _steps = {};
  Map<String, double> _weights = {};
  List<Food> _foods = List.of(kFoods);
  String _selectedDate = toDateKey(DateTime.now());
  ThemeMode _themeMode = ThemeMode.system;
  bool _ready = false;

  Profile get profile => _profile;
  bool get ready => _ready;
  String get selectedDate => _selectedDate;
  ThemeMode get themeMode => _themeMode;
  Macros get goals => macroGoals(_profile);
  List<Entry> get allEntries => List.unmodifiable(_entries);

  /// Logged body weights by day (YYYY-MM-DD → kg), oldest first.
  Map<String, double> get weights => Map.unmodifiable(_weights);

  /// The most recently logged weight, or null if none has been recorded.
  double? get latestWeight {
    if (_weights.isEmpty) return null;
    final latestKey = (_weights.keys.toList()..sort()).last;
    return _weights[latestKey];
  }

  /// The food catalog — the remote Supabase list once synced, else the bundled one.
  List<Food> get foods => List.unmodifiable(_foods);

  /// Case-insensitive name search over the catalog. Empty query returns all.
  List<Food> searchCatalog(String query) {
    final q = query.trim().toLowerCase();
    if (q.isEmpty) return _foods;
    return _foods.where((f) => f.name.toLowerCase().contains(q)).toList();
  }

  List<Entry> entriesForDate(String date) =>
      _entries.where((e) => e.date == date).toList();

  Macros totalsForDate(String date) => sumMacros(entriesForDate(date).map(
        (e) => Macros(calories: e.calories, protein: e.protein, carbs: e.carbs, fat: e.fat),
      ));

  Map<MealType, List<Entry>> groupedForDate(String date) {
    final out = {for (final m in MealType.values) m: <Entry>[]};
    for (final e in entriesForDate(date)) {
      out[e.meal]!.add(e);
    }
    return out;
  }

  int stepsForDate(String date) => _steps[date] ?? 0;

  static const _kEntries = 'bm.entries.v1';
  static const _kProfile = 'bm.profile.v1';
  static const _kSteps = 'bm.steps.v1';
  static const _kWeights = 'bm.weights.v1';
  static const _kTheme = 'bm.theme.v1';

  Future<void> hydrate() async {
    final prefs = await SharedPreferences.getInstance();
    try {
      final pr = prefs.getString(_kProfile);
      if (pr != null) _profile = Profile.fromJson(jsonDecode(pr) as Map<String, dynamic>);

      final en = prefs.getString(_kEntries);
      if (en != null) {
        _entries = (jsonDecode(en) as List)
            .map((j) => Entry.fromJson(j as Map<String, dynamic>))
            .toList();
      }

      final st = prefs.getString(_kSteps);
      if (st != null) {
        _steps = (jsonDecode(st) as Map).map((k, v) => MapEntry(k as String, (v as num).toInt()));
      }

      final wt = prefs.getString(_kWeights);
      if (wt != null) {
        _weights = (jsonDecode(wt) as Map)
            .map((k, v) => MapEntry(k as String, (v as num).toDouble()));
      }

      final th = prefs.getString(_kTheme);
      if (th != null) {
        _themeMode = ThemeMode.values.firstWhere((m) => m.name == th, orElse: () => ThemeMode.system);
      }
    } catch (_) {
      // Corrupt storage shouldn't brick startup — begin fresh.
    }
    _ready = true;
    notifyListeners();

    // Pull the shared catalog in the background; the UI is already usable on the
    // bundled list, so a slow or failed fetch just leaves that in place.
    unawaited(_syncFoods());
  }

  Future<void> _syncFoods() async {
    final remote = await fetchRemoteFoods();
    if (remote != null && remote.isNotEmpty) {
      _foods = remote;
      notifyListeners();
    }
  }

  Future<void> _persist(String key, String value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(key, value);
  }

  String get _entriesJson => jsonEncode(_entries.map((e) => e.toJson()).toList());

  void setSelectedDate(String date) {
    _selectedDate = date;
    notifyListeners();
  }

  void shiftDate(int days) => setSelectedDate(shiftDateKey(_selectedDate, days));

  void addEntry(Entry entry) {
    _entries = [..._entries, entry];
    notifyListeners();
    _persist(_kEntries, _entriesJson);
  }

  void removeEntry(String id) {
    _entries = _entries.where((e) => e.id != id).toList();
    notifyListeners();
    _persist(_kEntries, _entriesJson);
  }

  void updateProfile(Profile profile) {
    _profile = profile;
    notifyListeners();
    _persist(_kProfile, jsonEncode(profile.toJson()));
  }

  void setStepsForDate(String date, int steps) {
    _steps = {..._steps, date: steps < 0 ? 0 : steps};
    notifyListeners();
    _persist(_kSteps, jsonEncode(_steps));
  }

  /// Adds a delta to a day's step count — used by the hardware pedometer, which
  /// reports incremental steps taken while the app is open.
  void addStepsForDate(String date, int delta) {
    if (delta <= 0) return;
    _steps = {..._steps, date: (_steps[date] ?? 0) + delta};
    notifyListeners();
    _persist(_kSteps, jsonEncode(_steps));
  }

  void setThemeMode(ThemeMode mode) {
    _themeMode = mode;
    notifyListeners();
    _persist(_kTheme, mode.name);
  }

  /// Records a body weight for a day (kg, one decimal). The profile weight — used
  /// for goal and burned-calorie math — tracks the latest logged weight so the
  /// two never silently disagree.
  void setWeightForDate(String date, double kg) {
    if (kg <= 0) return;
    _weights = {..._weights, date: (kg * 10).round() / 10};
    notifyListeners();
    _persist(_kWeights, jsonEncode(_weights));

    final latestKey = (_weights.keys.toList()..sort()).last;
    if (latestKey == date) updateProfile(_profile.copyWith(weightKg: _weights[date]));
  }

  void removeWeightForDate(String date) {
    if (!_weights.containsKey(date)) return;
    _weights = {..._weights}..remove(date);
    notifyListeners();
    _persist(_kWeights, jsonEncode(_weights));
  }

  // --- Backup ---------------------------------------------------------------

  /// A portable JSON snapshot of everything the user has entered.
  String exportData() => jsonEncode({
        'version': 1,
        'exportedAt': DateTime.now().toIso8601String(),
        'profile': _profile.toJson(),
        'entries': _entries.map((e) => e.toJson()).toList(),
        'steps': _steps,
        'weights': _weights,
      });

  /// Replaces local data with a backup. Returns false if the payload is invalid.
  bool importData(String raw) {
    Map<String, dynamic> parsed;
    try {
      parsed = jsonDecode(raw) as Map<String, dynamic>;
    } catch (_) {
      return false;
    }
    if (parsed['version'] != 1 || parsed['entries'] is! List) return false;

    try {
      _profile = Profile.fromJson(parsed['profile'] as Map<String, dynamic>);
      _entries = (parsed['entries'] as List)
          .map((j) => Entry.fromJson(j as Map<String, dynamic>))
          .toList();
      _steps = (parsed['steps'] as Map? ?? {})
          .map((k, v) => MapEntry(k as String, (v as num).toInt()));
      _weights = (parsed['weights'] as Map? ?? {})
          .map((k, v) => MapEntry(k as String, (v as num).toDouble()));
    } catch (_) {
      return false;
    }

    notifyListeners();
    _persist(_kProfile, jsonEncode(_profile.toJson()));
    _persist(_kEntries, _entriesJson);
    _persist(_kSteps, jsonEncode(_steps));
    _persist(_kWeights, jsonEncode(_weights));
    return true;
  }
}
