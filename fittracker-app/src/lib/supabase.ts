import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Null when the env vars are absent. The app then runs fully offline against the
 * bundled food list and AsyncStorage — no sign-in, no sync. Every call site must
 * handle null so a missing .env degrades instead of crashing.
 */
export const supabase =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: {
          storage: AsyncStorage,
          persistSession: true,
          autoRefreshToken: true,
          // No URL-based session detection in a native app.
          detectSessionInUrl: false,
        },
      })
    : null;

export const isSupabaseConfigured = supabase !== null;

// Refresh the access token only while the app is in the foreground; leaving the
// timer running in the background burns battery and fails without network.
if (supabase) {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      void supabase.auth.startAutoRefresh();
    } else {
      void supabase.auth.stopAutoRefresh();
    }
  });
}
