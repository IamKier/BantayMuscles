import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * expo-router re-exports its own bottom-tabs types, which are structurally
 * incompatible with `@react-navigation/bottom-tabs`. Derive the props from the
 * actual `Tabs` component so this can't drift.
 */
type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

type TabMeta = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
};

const TABS: Record<string, TabMeta> = {
  index: { label: 'Today', icon: 'today-outline', activeIcon: 'today' },
  add: { label: 'Add', icon: 'add-circle-outline', activeIcon: 'add-circle' },
  progress: { label: 'Progress', icon: 'stats-chart-outline', activeIcon: 'stats-chart' },
  profile: { label: 'Profile', icon: 'person-outline', activeIcon: 'person' },
};

/**
 * Floating "island" tab bar: a rounded, shadowed pill inset from the screen
 * edges. The outer container matches the screen background so the side gaps read
 * as the island floating over it. It still occupies layout height (rather than
 * overlapping content), so nothing is hidden behind it.
 *
 * A filled pill slides behind the active icon, and icons swap to their filled
 * variant when selected.
 */
export function AppTabBar({ state, navigation }: TabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.outer,
        {
          backgroundColor: theme.background,
          // Float it clearly above the very bottom, like the reference pill.
          paddingBottom: Math.max(insets.bottom, Spacing.four),
        },
      ]}>
      <View
        style={[
          styles.island,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: theme.border,
            shadowColor: '#000',
          },
        ]}>
        {state.routes.map((route, index) => {
          const meta = TABS[route.name];
          if (!meta) return null;

          const focused = state.index === index;

          function onPress() {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (focused || event.defaultPrevented) return;
            void Haptics.selectionAsync();
            navigation.navigate(route.name);
          }

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={meta.label}
              style={styles.tab}
              android_ripple={{ color: theme.backgroundSelected, borderless: true, radius: 36 }}>
              <View style={styles.pillSlot}>
                {focused && (
                  <Animated.View
                    entering={FadeIn.duration(160)}
                    style={[styles.pill, { backgroundColor: theme.accentMuted }]}
                  />
                )}
                <Ionicons
                  name={focused ? meta.activeIcon : meta.icon}
                  size={22}
                  color={focused ? theme.accent : theme.textSecondary}
                />
              </View>

              <ThemedText
                type="small"
                style={[
                  styles.label,
                  {
                    color: focused ? theme.accent : theme.textSecondary,
                    fontWeight: focused ? '700' : '500',
                  },
                ]}>
                {meta.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    // Wider side gaps so the pill reads as detached from the screen edges.
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
  },
  island: {
    flexDirection: 'row',
    // Fully rounded pill ends, matching the reference.
    borderRadius: 36,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
    // Lift it off the background.
    ...Platform.select({
      android: { elevation: 8 },
      default: {
        shadowOpacity: 0.14,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 6 },
      },
    }),
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.half,
    paddingVertical: Spacing.one,
    borderRadius: 20,
  },
  pillSlot: {
    width: 56,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    ...StyleSheet.absoluteFill,
    borderRadius: 15,
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
  },
});
