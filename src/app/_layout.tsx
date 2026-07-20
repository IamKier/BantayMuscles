import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemePreferenceProvider, useThemePreference } from '@/hooks/use-theme-preference';
import { TrackerProvider, useTracker } from '@/hooks/use-tracker';

SplashScreen.preventAutoHideAsync();

/**
 * Holds the splash until the diary and the theme preference have both been read
 * — hiding earlier would flash the wrong theme for a frame.
 */
function SplashGate() {
  const { ready: trackerReady } = useTracker();
  const { ready: themeReady } = useThemePreference();

  useEffect(() => {
    if (trackerReady && themeReady) void SplashScreen.hideAsync();
  }, [trackerReady, themeReady]);

  return null;
}

/** Inside the provider so navigation chrome follows the chosen theme, not the OS. */
function ThemedApp() {
  const { scheme } = useThemePreference();
  const dark = scheme === 'dark';

  return (
    <ThemeProvider value={dark ? DarkTheme : DefaultTheme}>
      <TrackerProvider>
        <StatusBar style={dark ? 'light' : 'dark'} />
        <SplashGate />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
        </Stack>
      </TrackerProvider>
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
