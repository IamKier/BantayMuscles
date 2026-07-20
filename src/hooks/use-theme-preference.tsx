import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';

import { loadThemePreference, saveThemePreference } from '@/lib/storage';

export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedScheme = 'light' | 'dark';

export const THEME_OPTIONS: { key: ThemePreference; label: string; icon: string }[] = [
  { key: 'system', label: 'System', icon: 'phone-portrait-outline' },
  { key: 'light', label: 'Light', icon: 'sunny-outline' },
  { key: 'dark', label: 'Dark', icon: 'moon-outline' },
];

type ThemePreferenceValue = {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  /** What the app should actually render — 'system' already resolved. */
  scheme: ResolvedScheme;
  /** False until the stored preference has been read. */
  ready: boolean;
};

const ThemePreferenceContext = createContext<ThemePreferenceValue | null>(null);

export function ThemePreferenceProvider({ children }: PropsWithChildren) {
  const systemScheme = useSystemColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void loadThemePreference().then((stored) => {
      if (cancelled) return;
      setPreferenceState(stored);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    void saveThemePreference(next);
  }, []);

  // 'unspecified' shows up on Android when the OS reports no preference.
  const resolvedSystem: ResolvedScheme = systemScheme === 'dark' ? 'dark' : 'light';
  const scheme: ResolvedScheme = preference === 'system' ? resolvedSystem : preference;

  const value = useMemo(
    () => ({ preference, setPreference, scheme, ready }),
    [preference, setPreference, scheme, ready]
  );

  return (
    <ThemePreferenceContext.Provider value={value}>{children}</ThemePreferenceContext.Provider>
  );
}

export function useThemePreference() {
  const context = useContext(ThemePreferenceContext);
  if (!context) {
    throw new Error('useThemePreference must be used inside <ThemePreferenceProvider>');
  }
  return context;
}
