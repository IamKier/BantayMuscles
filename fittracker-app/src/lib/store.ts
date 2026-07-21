/**
 * App data store.
 *
 * A single source of truth held outside React and read through
 * `useSyncExternalStore` (see hooks/use-store.ts). Each slice — profile,
 * entries, steps, foods, selectedDate — keeps a stable reference that only
 * changes when that slice changes, so a step tick re-renders the steps card and
 * nothing else. This replaces the old context where every change re-rendered
 * every screen.
 */

import { FOODS } from '@/lib/foods';
import {
  DEFAULT_PROFILE,
  Entry,
  Food,
  Profile,
  toDateKey,
} from '@/lib/nutrition';
import {
  loadEntries,
  loadOnboarded,
  loadProfile,
  loadSavedFoods,
  loadSteps,
  loadWeights,
  saveEntries,
  saveOnboarded,
  saveProfile,
  saveSavedFoods,
  saveSteps,
  saveWeights,
  type StepsByDate,
  type WeightsByDate,
} from '@/lib/storage';

type State = {
  ready: boolean;
  onboarded: boolean;
  profile: Profile;
  entries: Entry[];
  steps: StepsByDate;
  weights: WeightsByDate;
  /** User-created foods, kept so a Quick-add can be logged again later. */
  savedFoods: Food[];
  foods: Food[];
  selectedDate: string;
};

let state: State = {
  ready: false,
  onboarded: false,
  profile: DEFAULT_PROFILE,
  entries: [],
  steps: {},
  weights: {},
  savedFoods: [],
  foods: FOODS,
  selectedDate: toDateKey(new Date()),
};

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function set(patch: Partial<State>) {
  state = { ...state, ...patch };
  emit();
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// --- Snapshot getters. Each returns a STABLE reference so useSyncExternalStore
//     only re-renders subscribers when that specific slice actually changes. ---
export const getReady = () => state.ready;
export const getOnboarded = () => state.onboarded;
export const getProfile = () => state.profile;
export const getEntries = () => state.entries;
export const getFoods = () => state.foods;
export const getSavedFoods = () => state.savedFoods;
export const getWeights = () => state.weights;
export const getSelectedDate = () => state.selectedDate;
export const getStepsFor = (date: string) => state.steps[date] ?? 0;

function createId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

// --- Actions. Stable module functions — screens import them directly, so they
//     never appear in a dependency array or trigger a re-render by identity. ---

export function addEntry(entry: Omit<Entry, 'id'>) {
  const next = [...state.entries, { ...entry, id: createId() }];
  set({ entries: next });
  void saveEntries(next);
}

export function removeEntry(id: string) {
  const next = state.entries.filter((entry) => entry.id !== id);
  set({ entries: next });
  void saveEntries(next);
}

/** Re-scales an existing entry to a new serving count. */
export function updateEntryServings(id: string, servings: number, macros: Omit<Entry, 'id' | 'date' | 'meal' | 'name' | 'serving' | 'servings'>) {
  const next = state.entries.map((entry) =>
    entry.id === id ? { ...entry, servings, ...macros } : entry
  );
  set({ entries: next });
  void saveEntries(next);
}

export function updateProfile(patch: Partial<Profile>) {
  const next = { ...state.profile, ...patch };
  set({ profile: next });
  void saveProfile(next);
}

export function setStepsFor(date: string, value: number) {
  const next = { ...state.steps, [date]: Math.max(0, Math.round(value)) };
  set({ steps: next });
  void saveSteps(next);
}

export function addSteps(date: string, delta: number) {
  if (delta <= 0) return;
  const next = { ...state.steps, [date]: (state.steps[date] ?? 0) + Math.round(delta) };
  set({ steps: next });
  void saveSteps(next);
}

export function setWeightFor(date: string, kg: number) {
  const next = { ...state.weights, [date]: Math.round(kg * 10) / 10 };
  set({ weights: next });
  void saveWeights(next);
  // The profile weight — used for goals and burned-calorie math — tracks the
  // latest logged weight so the two never silently disagree.
  const latest = Object.keys(next).sort().at(-1);
  if (latest === date) updateProfile({ weightKg: next[date] });
}

export function addSavedFood(food: Food) {
  // De-dupe by id so re-saving the same custom food doesn't stack up.
  const next = [food, ...state.savedFoods.filter((f) => f.id !== food.id)].slice(0, 100);
  set({ savedFoods: next });
  void saveSavedFoods(next);
}

export function completeOnboarding(profile: Profile) {
  set({ profile, onboarded: true });
  void saveProfile(profile);
  void saveOnboarded(true);
}

export function setSelectedDate(date: string) {
  set({ selectedDate: date });
}

export function setFoods(foods: Food[]) {
  set({ foods });
}

/** A portable snapshot of everything the user has entered, for backup. */
export type Backup = {
  version: 1;
  exportedAt: string;
  profile: Profile;
  entries: Entry[];
  steps: StepsByDate;
  weights: WeightsByDate;
  savedFoods: Food[];
};

export function exportData(): Backup {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    profile: state.profile,
    entries: state.entries,
    steps: state.steps,
    weights: state.weights,
    savedFoods: state.savedFoods,
  };
}

/** Replaces local data with a backup. Returns false if the payload isn't valid. */
export function importData(raw: string): boolean {
  let parsed: Partial<Backup>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return false;
  }
  if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.entries)) return false;

  const profile = { ...DEFAULT_PROFILE, ...parsed.profile };
  const entries = parsed.entries;
  const steps = parsed.steps ?? {};
  const weights = parsed.weights ?? {};
  const savedFoods = parsed.savedFoods ?? [];

  set({ profile, entries, steps, weights, savedFoods, onboarded: true });
  void saveProfile(profile);
  void saveEntries(entries);
  void saveSteps(steps);
  void saveWeights(weights);
  void saveSavedFoods(savedFoods);
  void saveOnboarded(true);
  return true;
}

/** Reads persisted state once at startup. Safe to call more than once. */
export async function hydrate() {
  const [profile, entries, steps, weights, savedFoods, onboarded] = await Promise.all([
    loadProfile(),
    loadEntries(),
    loadSteps(),
    loadWeights(),
    loadSavedFoods(),
    loadOnboarded(),
  ]);
  set({ profile, entries, steps, weights, savedFoods, onboarded, ready: true });
}
