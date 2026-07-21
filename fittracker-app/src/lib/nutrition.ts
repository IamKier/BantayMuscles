/**
 * Core nutrition domain: food data, diary types, and the calorie/macro math.
 * Everything here is pure so screens and storage stay easy to reason about.
 */

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export const MEALS: { key: MealType; label: string; icon: string }[] = [
  { key: 'breakfast', label: 'Breakfast', icon: 'sunny-outline' },
  { key: 'lunch', label: 'Lunch', icon: 'restaurant-outline' },
  { key: 'dinner', label: 'Dinner', icon: 'moon-outline' },
  { key: 'snack', label: 'Snacks', icon: 'nutrition-outline' },
];

export type Macros = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type Food = Macros & {
  id: string;
  name: string;
  /** Human-readable amount the macros above describe, e.g. "1 cup (158g)". */
  serving: string;
};

export type Entry = Macros & {
  id: string;
  /** Local calendar day, YYYY-MM-DD. */
  date: string;
  meal: MealType;
  name: string;
  serving: string;
  servings: number;
};

export type Sex = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'athlete';
export type Goal = 'lose' | 'maintain' | 'gain';

export type Profile = {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activity: ActivityLevel;
  goal: Goal;
  /** When set, overrides the calculated daily calorie target. */
  customCalories?: number;
};

export const DEFAULT_PROFILE: Profile = {
  sex: 'male',
  age: 30,
  heightCm: 170,
  weightKg: 70,
  activity: 'light',
  goal: 'maintain',
};

export const ACTIVITY_LEVELS: { key: ActivityLevel; label: string; hint: string; factor: number }[] =
  [
    { key: 'sedentary', label: 'Sedentary', hint: 'Desk job, little exercise', factor: 1.2 },
    { key: 'light', label: 'Light', hint: 'Exercise 1-3 days/week', factor: 1.375 },
    { key: 'moderate', label: 'Moderate', hint: 'Exercise 3-5 days/week', factor: 1.55 },
    { key: 'active', label: 'Active', hint: 'Exercise 6-7 days/week', factor: 1.725 },
    { key: 'athlete', label: 'Athlete', hint: 'Hard training, physical job', factor: 1.9 },
  ];

export const GOALS: { key: Goal; label: string; hint: string; delta: number }[] = [
  { key: 'lose', label: 'Lose weight', hint: '-500 kcal/day (~0.5 kg/week)', delta: -500 },
  { key: 'maintain', label: 'Maintain', hint: 'Stay at your current weight', delta: 0 },
  { key: 'gain', label: 'Gain muscle', hint: '+300 kcal/day surplus', delta: 300 },
];

/** Mifflin-St Jeor basal metabolic rate, the standard for consumer trackers. */
export function bmr({ sex, age, heightCm, weightKg }: Profile): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
}

export function tdee(profile: Profile): number {
  const factor = ACTIVITY_LEVELS.find((a) => a.key === profile.activity)?.factor ?? 1.2;
  return bmr(profile) * factor;
}

/** Daily calorie target, floored at 1200 so an aggressive goal can't get unsafe. */
export function calorieGoal(profile: Profile): number {
  if (profile.customCalories) return profile.customCalories;
  const delta = GOALS.find((g) => g.key === profile.goal)?.delta ?? 0;
  return Math.max(1200, Math.round((tdee(profile) + delta) / 10) * 10);
}

/**
 * Macro targets: protein scales with body weight (1.6-2.2 g/kg depending on goal),
 * fat takes 25% of calories, carbs fill the remainder.
 */
export function macroGoals(profile: Profile): Macros {
  const calories = calorieGoal(profile);
  const proteinPerKg = profile.goal === 'lose' ? 2.2 : profile.goal === 'gain' ? 2.0 : 1.6;
  const protein = Math.round(profile.weightKg * proteinPerKg);
  const fat = Math.round((calories * 0.25) / 9);
  const carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));
  return { calories, protein, carbs, fat };
}

/** Body Mass Index (kg/m²). */
export function bmi(profile: Profile): number {
  const meters = profile.heightCm / 100;
  if (meters <= 0) return 0;
  return profile.weightKg / (meters * meters);
}

export function bmiCategory(value: number): string {
  if (value < 18.5) return 'Underweight';
  if (value < 25) return 'Normal';
  if (value < 30) return 'Overweight';
  return 'Obese';
}

export type TdeeTarget = {
  key: string;
  label: string;
  /** Weekly weight change this pace implies, in kg (negative = loss). */
  weeklyKg: number;
  calories: number;
};

/**
 * Calorie targets for a range of paces around maintenance, the way a TDEE
 * calculator presents them. ~7700 kcal ≈ 1 kg, so 0.5 kg/week ≈ 550 kcal/day —
 * rounded to the familiar 250 / 500 / 1000 steps. Floored at 1200 kcal so an
 * aggressive deficit can't drop into unsafe territory.
 */
export function tdeeTargets(profile: Profile): TdeeTarget[] {
  const maintenance = Math.round(tdee(profile));
  const floor = (kcal: number) => Math.max(1200, kcal);
  return [
    { key: 'loss-1', label: 'Fast loss', weeklyKg: -1, calories: floor(maintenance - 1000) },
    { key: 'loss-0.5', label: 'Weight loss', weeklyKg: -0.5, calories: floor(maintenance - 500) },
    { key: 'loss-0.25', label: 'Mild loss', weeklyKg: -0.25, calories: floor(maintenance - 250) },
    { key: 'maintain', label: 'Maintain', weeklyKg: 0, calories: maintenance },
    { key: 'gain-0.25', label: 'Mild gain', weeklyKg: 0.25, calories: maintenance + 250 },
    { key: 'gain-0.5', label: 'Weight gain', weeklyKg: 0.5, calories: maintenance + 500 },
  ];
}

export const EMPTY_MACROS: Macros = { calories: 0, protein: 0, carbs: 0, fat: 0 };

export function sumMacros(items: Macros[]): Macros {
  return items.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      protein: acc.protein + item.protein,
      carbs: acc.carbs + item.carbs,
      fat: acc.fat + item.fat,
    }),
    EMPTY_MACROS
  );
}

/** Scale a food's macros by a serving count, rounded to whole numbers for display. */
export function scaleMacros(food: Macros, servings: number): Macros {
  return {
    calories: Math.round(food.calories * servings),
    protein: Math.round(food.protein * servings),
    carbs: Math.round(food.carbs * servings),
    fat: Math.round(food.fat * servings),
  };
}

/** Local YYYY-MM-DD — never use toISOString(), it shifts the day across timezones. */
export function toDateKey(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function groupByMeal(entries: Entry[]): Record<MealType, Entry[]> {
  return {
    breakfast: entries.filter((entry) => entry.meal === 'breakfast'),
    lunch: entries.filter((entry) => entry.meal === 'lunch'),
    dinner: entries.filter((entry) => entry.meal === 'dinner'),
    snack: entries.filter((entry) => entry.meal === 'snack'),
  };
}

export function shiftDateKey(key: string, days: number): string {
  const [year, month, day] = key.split('-').map(Number);
  return toDateKey(new Date(year, month - 1, day + days));
}

export function formatDateLabel(key: string): string {
  const today = toDateKey(new Date());
  if (key === today) return 'Today';
  if (key === shiftDateKey(today, -1)) return 'Yesterday';
  if (key === shiftDateKey(today, 1)) return 'Tomorrow';

  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}
