/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0A0C0F',
    background: '#F4F6F8',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#EBEEF2',
    textSecondary: '#697586',
    border: '#EDEFF3',
    accent: '#10B981',
    accentMuted: '#D6F5E6',
    track: '#EAEDF1',
    danger: '#EF4444',
  },
  dark: {
    text: '#F4F6FA',
    background: '#0A0B0E',
    backgroundElement: '#15171B',
    backgroundSelected: '#24272E',
    textSecondary: '#98A0AD',
    border: '#22252B',
    accent: '#34D399',
    accentMuted: '#0D2B20',
    track: '#22252B',
    danger: '#F87171',
  },
} as const;

/**
 * Soft card elevation. On light backgrounds the shadow does the lifting; on
 * dark, shadows are invisible so the card's border defines its edge instead.
 */
export const CardShadow = Platform.select({
  ios: {
    shadowColor: '#0A0C0F',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  android: {
    elevation: 3,
  },
  default: {},
});

/** Macro colors are intentionally scheme-independent so charts stay recognizable. */
export const MacroColors = {
  protein: '#3B82F6',
  carbs: '#F59E0B',
  fat: '#EC4899',
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
