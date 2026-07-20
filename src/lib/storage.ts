import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEFAULT_PROFILE, Entry, Profile } from '@/lib/nutrition';

const ENTRIES_KEY = 'fittracker.entries.v1';
const PROFILE_KEY = 'fittracker.profile.v1';
const STEPS_KEY = 'fittracker.steps.v1';
const THEME_KEY = 'fittracker.theme.v1';

/** Mirrors ThemePreference in use-theme-preference; kept local to avoid a cycle. */
type StoredTheme = 'system' | 'light' | 'dark';

/** Steps keyed by local date (YYYY-MM-DD). */
export type StepsByDate = Record<string, number>;

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    // Corrupt or unreadable storage shouldn't brick the app — start fresh.
    return fallback;
  }
}

export function loadEntries(): Promise<Entry[]> {
  return readJson<Entry[]>(ENTRIES_KEY, []);
}

export function saveEntries(entries: Entry[]): Promise<void> {
  return AsyncStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
}

export async function loadProfile(): Promise<Profile> {
  const stored = await readJson<Partial<Profile>>(PROFILE_KEY, {});
  return { ...DEFAULT_PROFILE, ...stored };
}

export function saveProfile(profile: Profile): Promise<void> {
  return AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function loadSteps(): Promise<StepsByDate> {
  return readJson<StepsByDate>(STEPS_KEY, {});
}

export function saveSteps(steps: StepsByDate): Promise<void> {
  return AsyncStorage.setItem(STEPS_KEY, JSON.stringify(steps));
}

export async function loadThemePreference(): Promise<StoredTheme> {
  const stored = await readJson<StoredTheme | null>(THEME_KEY, null);
  return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
}

export function saveThemePreference(preference: StoredTheme): Promise<void> {
  return AsyncStorage.setItem(THEME_KEY, JSON.stringify(preference));
}
