import 'dart:convert';
import 'dart:math';

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'models/nutrition.dart';

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
  String _selectedDate = toDateKey(DateTime.now());
  ThemeMode _themeMode = ThemeMode.system;
  bool _ready = false;

  Profile get profile => _profile;
  bool get ready => _ready;
  String get selectedDate => _selectedDate;
  ThemeMode get themeMode => _themeMode;
  Macros get goals => macroGoals(_profile);
  List<Entry> get allEntries => List.unmodifiable(_entries);

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

      final th = prefs.getString(_kTheme);
      if (th != null) {
        _themeMode = ThemeMode.values.firstWhere((m) => m.name == th, orElse: () => ThemeMode.system);
      }
    } catch (_) {
      // Corrupt storage shouldn't brick startup — begin fresh.
    }
    _ready = true;
    notifyListeners();
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

  void setThemeMode(ThemeMode mode) {
    _themeMode = mode;
    notifyListeners();
    _persist(_kTheme, mode.name);
  }
}
