import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
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
 * Material-3 style bar: a filled pill slides behind the active icon, icons swap
 * to their filled variant, and the whole bar respects the gesture-nav inset
 * instead of assuming a fixed height.
 */
export function AppTabBar({ state, navigation }: TabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: theme.backgroundElement,
          borderTopColor: theme.border,
          // Sit above the gesture bar rather than under it.
          paddingBottom: Math.max(insets.bottom, Spacing.two),
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
            android_ripple={{ color: theme.backgroundSelected, borderless: true, radius: 40 }}>
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
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.two,
    paddingHorizontal: Spacing.two,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.half,
    // Comfortably above the 48dp Android minimum touch target.
    paddingVertical: Spacing.one,
  },
  pillSlot: {
    width: 64,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    ...StyleSheet.absoluteFill,
    borderRadius: 16,
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
  },
});
