import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { StyleSheet, Switch, TextInput, View } from 'react-native';

import { Card } from '@/components/card';
import { ThemedText } from '@/components/themed-text';
import { MacroColors, Spacing } from '@/constants/theme';
import { updateProfile, useProfile } from '@/hooks/use-store';
import { useTheme } from '@/hooks/use-theme';
import { calorieGoal, macroGoals } from '@/lib/nutrition';

/**
 * Lets the user override the calculated calorie target with their own number
 * (e.g. from a coach or their own plan). Macros re-derive from it automatically,
 * since macroGoals is built on calorieGoal, which honours customCalories.
 */
export function CustomTargetCard() {
  const theme = useTheme();
  const profile = useProfile();

  const enabled = profile.customCalories != null;
  // The calculated target with any override removed — the sensible starting value.
  const calculated = calorieGoal({ ...profile, customCalories: undefined });
  const [draft, setDraft] = useState(String(profile.customCalories ?? calculated));

  function toggle(on: boolean) {
    void Haptics.selectionAsync();
    if (on) {
      const start = Number(draft) > 0 ? Math.round(Number(draft)) : calculated;
      setDraft(String(start));
      updateProfile({ customCalories: start });
    } else {
      updateProfile({ customCalories: undefined });
    }
  }

  function onChange(text: string) {
    setDraft(text);
    const parsed = Number(text.replace(/[^0-9]/g, ''));
    if (Number.isFinite(parsed) && parsed >= 1000) updateProfile({ customCalories: parsed });
  }

  // Preview the macros the entered target produces.
  const preview = enabled ? macroGoals(profile) : null;

  return (
    <Card>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <ThemedText style={styles.title}>Custom calorie target</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {enabled ? 'Overriding the calculated target' : `Calculated: ${calculated.toLocaleString()} kcal`}
          </ThemedText>
        </View>
        <Switch
          value={enabled}
          onValueChange={toggle}
          trackColor={{ true: theme.accent, false: theme.track }}
          thumbColor="#FFFFFF"
        />
      </View>

      {enabled ? (
        <>
          <View style={[styles.input, { borderColor: theme.border }]}>
            <TextInput
              value={draft}
              onChangeText={onChange}
              keyboardType="number-pad"
              placeholder={String(calculated)}
              placeholderTextColor={theme.textSecondary}
              style={[styles.inputText, { color: theme.text }]}
            />
            <ThemedText type="small" themeColor="textSecondary">
              kcal/day
            </ThemedText>
          </View>

          {Number(draft) < 1000 ? (
            <ThemedText type="small" themeColor="danger">
              Use at least 1,000 kcal.
            </ThemedText>
          ) : preview ? (
            <ThemedText type="small" themeColor="textSecondary">
              Macros:{' '}
              <ThemedText type="small" style={{ color: MacroColors.protein }}>
                {preview.protein}g P
              </ThemedText>
              {' · '}
              <ThemedText type="small" style={{ color: MacroColors.carbs }}>
                {preview.carbs}g C
              </ThemedText>
              {' · '}
              <ThemedText type="small" style={{ color: MacroColors.fat }}>
                {preview.fat}g F
              </ThemedText>
            </ThemedText>
          ) : null}
        </>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    height: 48,
  },
  inputText: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    padding: 0,
  },
});
