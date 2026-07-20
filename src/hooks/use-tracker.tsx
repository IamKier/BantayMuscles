import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import { FOODS } from '@/lib/foods';
import {
  DEFAULT_PROFILE,
  Entry,
  Food,
  Macros,
  MealType,
  Profile,
  macroGoals,
  sumMacros,
  toDateKey,
} from '@/lib/nutrition';
import { fetchFoods } from '@/lib/remote';
import {
  loadEntries,
  loadProfile,
  loadSteps,
  saveEntries,
  saveProfile,
  saveSteps,
  type StepsByDate,
} from '@/lib/storage';

type TrackerValue = {
  /** False until local state has been read — screens show empty totals meanwhile. */
  ready: boolean;
  profile: Profile;
  updateProfile: (patch: Partial<Profile>) => void;
  /** Day the whole app is currently viewing/logging against (YYYY-MM-DD). */
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  entriesFor: (date: string) => Entry[];
  totalsFor: (date: string) => Macros;
  addEntry: (entry: Omit<Entry, 'id'>) => void;
  removeEntry: (id: string) => void;
  goals: Macros;
  /** Catalog from Supabase when reachable, else the bundled list. */
  foods: Food[];
  stepsFor: (date: string) => number;
  /** Replaces the count for a day — used by the manual editor. */
  setStepsFor: (date: string, steps: number) => void;
  /** Adds newly-sensed steps to a day. Ignores non-positive deltas. */
  addSteps: (date: string, delta: number) => void;
};

const TrackerContext = createContext<TrackerValue | null>(null);

function createId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function TrackerProvider({ children }: PropsWithChildren) {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [foods, setFoods] = useState<Food[]>(FOODS);
  const [steps, setSteps] = useState<StepsByDate>({});
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [storedProfile, storedEntries, storedSteps] = await Promise.all([
        loadProfile(),
        loadEntries(),
        loadSteps(),
      ]);
      if (cancelled) return;
      setProfile(storedProfile);
      setEntries(storedEntries);
      setSteps(storedSteps);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Remote catalog is a bonus, never a requirement — the bundled list already works.
  useEffect(() => {
    let cancelled = false;
    void fetchFoods().then((remote) => {
      if (!cancelled && remote && remote.length > 0) setFoods(remote);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const updateProfile = useCallback((patch: Partial<Profile>) => {
    setProfile((current) => {
      const next = { ...current, ...patch };
      void saveProfile(next);
      return next;
    });
  }, []);

  const addEntry = useCallback((entry: Omit<Entry, 'id'>) => {
    setEntries((current) => {
      const next = [...current, { ...entry, id: createId() }];
      void saveEntries(next);
      return next;
    });
  }, []);

  const removeEntry = useCallback((id: string) => {
    setEntries((current) => {
      const next = current.filter((entry) => entry.id !== id);
      void saveEntries(next);
      return next;
    });
  }, []);

  const stepsFor = useCallback((date: string) => steps[date] ?? 0, [steps]);

  const setStepsFor = useCallback((date: string, value: number) => {
    setSteps((current) => {
      const next = { ...current, [date]: Math.max(0, Math.round(value)) };
      void saveSteps(next);
      return next;
    });
  }, []);

  const addSteps = useCallback((date: string, delta: number) => {
    if (delta <= 0) return;
    setSteps((current) => {
      const next = { ...current, [date]: (current[date] ?? 0) + Math.round(delta) };
      void saveSteps(next);
      return next;
    });
  }, []);

  const entriesFor = useCallback(
    (date: string) => entries.filter((entry) => entry.date === date),
    [entries]
  );

  const totalsFor = useCallback((date: string) => sumMacros(entriesFor(date)), [entriesFor]);

  const goals = useMemo(() => macroGoals(profile), [profile]);

  const value = useMemo(
    () => ({
      ready,
      profile,
      updateProfile,
      selectedDate,
      setSelectedDate,
      entriesFor,
      totalsFor,
      addEntry,
      removeEntry,
      goals,
      foods,
      stepsFor,
      setStepsFor,
      addSteps,
    }),
    [
      ready,
      profile,
      updateProfile,
      selectedDate,
      entriesFor,
      totalsFor,
      addEntry,
      removeEntry,
      goals,
      foods,
      stepsFor,
      setStepsFor,
      addSteps,
    ]
  );

  return <TrackerContext.Provider value={value}>{children}</TrackerContext.Provider>;
}

export function useTracker() {
  const context = useContext(TrackerContext);
  if (!context) throw new Error('useTracker must be used inside <TrackerProvider>');
  return context;
}

export function groupByMeal(entries: Entry[]): Record<MealType, Entry[]> {
  return {
    breakfast: entries.filter((e) => e.meal === 'breakfast'),
    lunch: entries.filter((e) => e.meal === 'lunch'),
    dinner: entries.filter((e) => e.meal === 'dinner'),
    snack: entries.filter((e) => e.meal === 'snack'),
  };
}
