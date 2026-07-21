import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MacroColors, Spacing } from '@/constants/theme';
import { completeOnboarding } from '@/hooks/use-store';
import { useTheme } from '@/hooks/use-theme';
import {
  ACTIVITY_LEVELS,
  ActivityLevel,
  DEFAULT_PROFILE,
  GOALS,
  Goal,
  Profile,
  Sex,
  calorieGoal,
  macroGoals,
} from '@/lib/nutrition';

function Field({
  label,
  value,
  unit,
  onChange,
}: {
  label: string;
  value: string;
  unit: string;
  onChange: (v: string) => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.field}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <View style={[styles.input, { borderColor: theme.border }]}>
        <TextInput
          value={value}
          onChangeText={onChange}
          keyboardType="number-pad"
          placeholder="0"
          placeholderTextColor={theme.textSecondary}
          style={[styles.inputText, { color: theme.text }]}
        />
        <ThemedText type="small" themeColor="textSecondary">
          {unit}
        </ThemedText>
      </View>
    </View>
  );
}

function Choice<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { key: T; label: string; hint?: string }[];
  value: T;
  onChange: (key: T) => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.choiceGroup}>
      {options.map((option) => {
        const selected = option.key === value;
        return (
          <Pressable
            key={option.key}
            onPress={() => {
              void Haptics.selectionAsync();
              onChange(option.key);
            }}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            style={[
              styles.choice,
              {
                backgroundColor: selected ? theme.accentMuted : 'transparent',
                borderColor: selected ? theme.accent : theme.border,
              },
            ]}
            android_ripple={{ color: theme.backgroundSelected }}>
            <ThemedText
              type="small"
              style={{ color: selected ? theme.accent : theme.text, fontWeight: '600' }}>
              {option.label}
            </ThemedText>
            {option.hint ? (
              <ThemedText type="small" themeColor="textSecondary">
                {option.hint}
              </ThemedText>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

/** Full-screen first-run setup shown until the profile has been entered once. */
export function Onboarding() {
  const theme = useTheme();

  const [sex, setSex] = useState<Sex>(DEFAULT_PROFILE.sex);
  const [age, setAge] = useState(String(DEFAULT_PROFILE.age));
  const [heightCm, setHeightCm] = useState(String(DEFAULT_PROFILE.heightCm));
  const [weightKg, setWeightKg] = useState(String(DEFAULT_PROFILE.weightKg));
  const [activity, setActivity] = useState<ActivityLevel>(DEFAULT_PROFILE.activity);
  const [goal, setGoal] = useState<Goal>(DEFAULT_PROFILE.goal);

  function buildProfile(): Profile {
    const num = (text: string, fallback: number) => {
      const n = Number(text);
      return Number.isFinite(n) && n > 0 ? n : fallback;
    };
    return {
      sex,
      age: num(age, DEFAULT_PROFILE.age),
      heightCm: num(heightCm, DEFAULT_PROFILE.heightCm),
      weightKg: num(weightKg, DEFAULT_PROFILE.weightKg),
      activity,
      goal,
    };
  }

  // Live preview so the numbers mean something before you commit.
  const preview = buildProfile();
  const kcal = calorieGoal(preview);
  const macros = macroGoals(preview);

  function finish() {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    completeOnboarding(buildProfile());
  }

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <View style={[styles.badge, { backgroundColor: theme.accentMuted }]}>
              <Ionicons name="barbell-outline" size={28} color={theme.accent} />
            </View>
            <ThemedText style={styles.title}>Welcome to BantayMuscles</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
              A few details so your calorie and macro targets fit you. You can change these anytime
              in Profile.
            </ThemedText>

            <ThemedText type="smallBold" style={styles.sectionLabel}>
              Sex
            </ThemedText>
            <Choice<Sex>
              options={[
                { key: 'male', label: 'Male' },
                { key: 'female', label: 'Female' },
              ]}
              value={sex}
              onChange={setSex}
            />

            <View style={styles.fieldRow}>
              <Field label="Age" value={age} unit="yrs" onChange={setAge} />
              <Field label="Height" value={heightCm} unit="cm" onChange={setHeightCm} />
              <Field label="Weight" value={weightKg} unit="kg" onChange={setWeightKg} />
            </View>

            <ThemedText type="smallBold" style={styles.sectionLabel}>
              Activity level
            </ThemedText>
            <Choice<ActivityLevel>
              options={ACTIVITY_LEVELS.map((a) => ({ key: a.key, label: a.label, hint: a.hint }))}
              value={activity}
              onChange={setActivity}
            />

            <ThemedText type="smallBold" style={styles.sectionLabel}>
              Goal
            </ThemedText>
            <Choice<Goal>
              options={GOALS.map((g) => ({ key: g.key, label: g.label, hint: g.hint }))}
              value={goal}
              onChange={setGoal}
            />

            <View style={[styles.preview, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <ThemedText type="small" themeColor="textSecondary">
                Your daily target
              </ThemedText>
              <ThemedText style={[styles.previewValue, { color: theme.accent }]}>
                {kcal.toLocaleString()} kcal
              </ThemedText>
              <View style={styles.previewMacros}>
                <ThemedText type="small" style={{ color: MacroColors.protein }}>
                  {macros.protein}g protein
                </ThemedText>
                <ThemedText type="small" style={{ color: MacroColors.carbs }}>
                  {macros.carbs}g carbs
                </ThemedText>
                <ThemedText type="small" style={{ color: MacroColors.fat }}>
                  {macros.fat}g fat
                </ThemedText>
              </View>
            </View>

            <Pressable
              onPress={finish}
              style={[styles.button, { backgroundColor: theme.accent }]}
              accessibilityRole="button"
              android_ripple={{ color: '#00000022' }}>
              <ThemedText style={styles.buttonText}>Get started</ThemedText>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    gap: Spacing.three,
  },
  badge: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
  },
  subtitle: {
    marginTop: -Spacing.two,
  },
  sectionLabel: {
    marginTop: Spacing.two,
  },
  choiceGroup: {
    gap: Spacing.two,
  },
  choice: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.half,
    overflow: 'hidden',
  },
  fieldRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  field: {
    flex: 1,
    gap: Spacing.one,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    height: 46,
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    padding: 0,
  },
  preview: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: Spacing.three,
    gap: Spacing.one,
    marginTop: Spacing.two,
  },
  previewValue: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
  },
  previewMacros: {
    flexDirection: 'row',
    gap: Spacing.three,
    flexWrap: 'wrap',
  },
  button: {
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
    overflow: 'hidden',
  },
  buttonText: {
    color: '#04120A',
    fontSize: 16,
    fontWeight: '700',
  },
});
