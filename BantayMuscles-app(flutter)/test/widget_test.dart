import 'package:flutter_test/flutter_test.dart';

import 'package:bantaymuscles/models/nutrition.dart';

void main() {
  test('macro goals derive from the profile and stay sane', () {
    const p = Profile();
    final g = macroGoals(p);
    expect(g.calories, greaterThanOrEqualTo(1200));
    expect(g.protein, greaterThan(0));
    expect(g.carbs, greaterThanOrEqualTo(0));
    expect(g.fat, greaterThan(0));
  });

  test('a custom target overrides the calculated one', () {
    final p = const Profile().copyWith(customCalories: 2500);
    expect(calorieGoal(p), 2500);
  });

  test('bmi categories', () {
    expect(bmiCategory(17), 'Underweight');
    expect(bmiCategory(22), 'Normal');
    expect(bmiCategory(27), 'Overweight');
    expect(bmiCategory(32), 'Obese');
  });

  test('date keys shift correctly', () {
    expect(shiftDateKey('2026-01-01', -1), '2025-12-31');
    expect(shiftDateKey('2026-02-28', 1), '2026-03-01');
  });
}
