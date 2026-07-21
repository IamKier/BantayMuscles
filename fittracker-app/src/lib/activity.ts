/**
 * Step tracking and the calories burned from it.
 *
 * Everything here is an estimate. Step-to-calorie conversion depends on stride,
 * pace, terrain and fitness, none of which a phone pedometer knows — treat the
 * output as a rough figure, not a measurement.
 */

export const DEFAULT_STEP_GOAL = 10000;

/**
 * Calories burned walking, scaled by body weight.
 *
 * Uses the common ~0.0005 kcal per step per kg approximation: a 70 kg person
 * burns roughly 35 kcal per 1,000 steps, so 10,000 steps ≈ 350 kcal. That lands
 * in the usual 300-500 kcal range quoted for 10k steps at average weight.
 *
 * This counts only walking. It deliberately does NOT try to subtract the
 * baseline calories you'd burn anyway while sitting — those are already inside
 * the BMR figure the daily target is built from, so subtracting them again
 * would double-count.
 */
export function caloriesFromSteps(steps: number, weightKg: number): number {
  if (steps <= 0 || weightKg <= 0) return 0;
  return Math.round(steps * weightKg * 0.0005);
}

/** Rough distance, for display only. Average stride ≈ 0.415 × height. */
export function distanceFromSteps(steps: number, heightCm: number): number {
  const strideMeters = (heightCm * 0.415) / 100;
  return (steps * strideMeters) / 1000;
}
