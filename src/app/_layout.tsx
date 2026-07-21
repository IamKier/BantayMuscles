import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ErrorBoundary } from '@/components/error-boundary';
import { Onboarding } from '@/components/onboarding';
import { useOnboarded, useReady } from '@/hooks/use-store';
import { ThemePreferenceProvider, useThemePreference } from '@/hooks/use-theme-preference';
import { fetchFoods } from '@/lib/remote';
import { hydrate, setFoods } from '@/lib/store';

SplashScreen.preventAutoHideAsync();

/** Reads persisted state once and pulls the remote food catalog in the background. */
function StoreHydrator() {
  useEffect(() => {
    void hydrate();
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fetchFoods().then((remote) => {
      if (!cancelled && remote && remote.length > 0) setFoods(remote);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}

/** Holds the splash until both persisted state and the theme preference are read. */
function SplashGate() {
  const storeReady = useReady();
  const { ready: themeReady } = useThemePreference();

  useEffect(() => {
    if (storeReady && themeReady) void SplashScreen.hideAsync();
  }, [storeReady, themeReady]);

  return null;
}

function AppContent() {
  const ready = useReady();
  const onboarded = useOnboarded();

  // Keep the tree stable during hydration; the splash covers this frame.
  if (!ready) return null;
  if (!onboarded) return <Onboarding />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

function ThemedApp() {
  const { scheme } = useThemePreference();
  const dark = scheme === 'dark';

  return (
    <ThemeProvider value={dark ? DarkTheme : DefaultTheme}>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <StoreHydrator />
      <SplashGate />
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemePreferenceProvider>
        <ThemedApp />
      </ThemePreferenceProvider>
    </SafeAreaProvider>
  );
}
