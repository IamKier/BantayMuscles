/**
 * Resolves the active color palette.
 *
 * Reads the user's saved preference (system / light / dark) rather than the OS
 * scheme directly, so the in-app switcher on the Profile tab wins over the
 * device setting. See use-theme-preference.tsx.
 */

import { Colors } from '@/constants/theme';
import { useThemePreference } from '@/hooks/use-theme-preference';

export function useTheme() {
  const { scheme } = useThemePreference();
  return Colors[scheme];
}
