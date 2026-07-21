/**
 * Selector hooks over the app store.
 *
 * Each hook subscribes to a single slice, so a component only re-renders when
 * the data it actually reads changes. Derived values (goals, per-day entries and
 * totals) are computed with useMemo in the hook — never inside the store's
 * getSnapshot, which must return a stable reference.
 */

import { useCallback, useMemo, useSyncExternalStore } from 'react';

import { Macros, macroGoals, sumMacros } from '@/lib/nutrition';
import * as store from '@/lib/store';

export function useReady() {
  return useSyncExternalStore(store.subscribe, store.getReady);
}

export function useOnboarded() {
  return useSyncExternalStore(store.subscribe, store.getOnboarded);
}

export function useProfile() {
  return useSyncExternalStore(store.subscribe, store.getProfile);
}

export function useFoods() {
  return useSyncExternalStore(store.subscribe, store.getFoods);
}

export function useSavedFoods() {
  return useSyncExternalStore(store.subscribe, store.getSavedFoods);
}

export function useWeights() {
  return useSyncExternalStore(store.subscribe, store.getWeights);
}

export function useSelectedDate() {
  return useSyncExternalStore(store.subscribe, store.getSelectedDate);
}

/** Per-date primitive snapshot: only re-renders consumers of *this* date. */
export function useSteps(date: string) {
  const getSnapshot = useCallback(() => store.getStepsFor(date), [date]);
  return useSyncExternalStore(store.subscribe, getSnapshot);
}

export function useGoals(): Macros {
  const profile = useProfile();
  return useMemo(() => macroGoals(profile), [profile]);
}

/** The full entry list. Prefer useDayEntries unless you need multiple days. */
export function useEntries() {
  return useSyncExternalStore(store.subscribe, store.getEntries);
}

export function useDayEntries(date: string) {
  const entries = useEntries();
  return useMemo(() => entries.filter((entry) => entry.date === date), [entries, date]);
}

export function useDayTotals(date: string): Macros {
  const dayEntries = useDayEntries(date);
  return useMemo(() => sumMacros(dayEntries), [dayEntries]);
}

/** Recently-logged foods, newest first, de-duplicated — for quick re-logging. */
export function useRecentFoods(limit = 8) {
  const entries = useEntries();
  return useMemo(() => {
    const seen = new Set<string>();
    const recents: { name: string; serving: string; calories: number; protein: number; carbs: number; fat: number }[] = [];
    for (let i = entries.length - 1; i >= 0 && recents.length < limit; i--) {
      const e = entries[i];
      const key = `${e.name}|${e.serving}`;
      if (seen.has(key)) continue;
      seen.add(key);
      recents.push({
        name: e.name,
        serving: e.serving,
        calories: Math.round(e.calories / e.servings),
        protein: Math.round(e.protein / e.servings),
        carbs: Math.round(e.carbs / e.servings),
        fat: Math.round(e.fat / e.servings),
      });
    }
    return recents;
  }, [entries, limit]);
}

// Actions are stable module functions — re-export so screens have one import.
export const {
  addEntry,
  removeEntry,
  updateEntryServings,
  updateProfile,
  setStepsFor,
  setWeightFor,
  addSavedFood,
  completeOnboarding,
  setSelectedDate,
  exportData,
  importData,
} = store;
