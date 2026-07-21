import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { ScrollView, StyleSheet, TextInput, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackupCard } from '@/components/backup-card';
import { Card } from '@/components/card';
import { CustomTargetCard } from '@/components/custom-target-card';
import { TdeeCard } from '@/components/tdee-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MacroColors, Spacing } from '@/constants/theme';
import { updateProfile, useGoals, useProfile } from '@/hooks/use-store';
import { useTheme } from '@/hooks/use-theme';
import { THEME_OPTIONS, useThemePreference } from '@/hooks/use-theme-preference';
import { ACTIVITY_LEVELS, GOALS, Sex } from '@/lib/nutrition';

function NumberField({
  label,
  value,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  unit: string;
  onChange: (value: number) => void;
}) {
  const theme = useTheme();

  return (
    <View style={styles.field}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <View style={[styles.input, { borderColor: theme.border }]}>
        <TextInput
          defaultValue={String(value)}
          keyboardType="number-pad"
          onChangeText={(text) => {
            const parsed = Number(text);
            if (Number.isFinite(parsed) && parsed > 0) onChange(parsed);
          }}
          style={[styles.inputText, { color: theme.text }]}
        />
        <ThemedText type="small" themeColor="textSecondary">
          {unit}
        </ThemedText>
      </View>
    </View>
  );
}

function OptionRow({
  label,
  hint,
  selected,
  onPress,
}: {
  label: string;
  hint: string;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={styles.optionRow}
      android_ripple={{ color: theme.backgroundSelected }}>
      <View style={styles.optionText}>
        <ThemedText type="small" style={{ fontWeight: selected ? '700' : '500' }}>
          {label}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {hint}
        </ThemedText>
      </View>
      <Ionicons
        name={selected ? 'radio-button-on' : 'radio-button-off'}
        size={20}
        color={selected ? theme.accent : theme.textSecondary}
      />
    </Pressable>
  );
}

/** Segmented System / Light / Dark control. */
function AppearancePicker() {
  const theme = useTheme();
  const { preference, setPreference } = useThemePreference();

  return (
    <View style={[styles.segment, { borderColor: theme.border }]}>
      {THEME_OPTIONS.map(({ key, label, icon }) => {
        const selected = preference === key;
        return (
          <Pressable
            key={key}
            onPress={() => {
              void Haptics.selectionAsync();
              setPreference(key);
            }}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={`${label} theme`}
            style={[
              styles.segmentItem,
              selected && { backgroundColor: theme.accentMuted },
            ]}
            android_ripple={{ color: theme.backgroundSelected }}>
            <Ionicons
              name={icon as keyof typeof Ionicons.glyphMap}
              size={18}
              color={selected ? theme.accent : theme.textSecondary}
            />
            <ThemedText
              type="small"
              style={{
                color: selected ? theme.accent : theme.textSecondary,
                fontWeight: selected ? '700' : '500',
              }}>
              {label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function ProfileScreen() {
  const theme = useTheme();
  const profile = useProfile();
  const goals = useGoals();

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <ThemedText style={styles.heading}>Profile</ThemedText>

          <Card style={styles.targetCard}>
            <ThemedText type="small" themeColor="textSecondary">
              Daily target
            </ThemedText>
            <ThemedText style={[styles.target, { color: theme.accent }]}>
              {goals.calories.toLocaleString()} kcal
            </ThemedText>
            <View style={styles.macroGoalRow}>
              <ThemedText type="small" style={{ color: MacroColors.protein }}>
                {goals.protein}g protein
              </ThemedText>
              <ThemedText type="small" style={{ color: MacroColors.carbs }}>
                {goals.carbs}g carbs
              </ThemedText>
              <ThemedText type="small" style={{ color: MacroColors.fat }}>
                {goals.fat}g fat
              </ThemedText>
            </View>
          </Card>

          <TdeeCard />

          <Card>
            <ThemedText style={styles.cardTitle}>About you</ThemedText>

            <View style={styles.sexRow}>
              {(['male', 'female'] as Sex[]).map((sex) => {
                const selected = profile.sex === sex;
                return (
                  <Pressable
                    key={sex}
                    onPress={() => updateProfile({ sex })}
                    style={[
                      styles.sexChip,
                      {
                        backgroundColor: selected ? theme.accentMuted : 'transparent',
                        borderColor: selected ? theme.accent : theme.border,
                      },
                    ]}
                    android_ripple={{ color: theme.backgroundSelected }}>
                    <ThemedText
                      type="small"
                      style={{
                        color: selected ? theme.accent : theme.textSecondary,
                        fontWeight: '600',
                        textTransform: 'capitalize',
                      }}>
                      {sex}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.fieldRow}>
              <NumberField
                label="Age"
                value={profile.age}
                unit="yrs"
                onChange={(age) => updateProfile({ age })}
              />
              <NumberField
                label="Height"
                value={profile.heightCm}
                unit="cm"
                onChange={(heightCm) => updateProfile({ heightCm })}
              />
              <NumberField
                label="Weight"
                value={profile.weightKg}
                unit="kg"
                onChange={(weightKg) => updateProfile({ weightKg })}
              />
            </View>
          </Card>

          <Card style={styles.optionCard}>
            <ThemedText style={styles.cardTitle}>Activity level</ThemedText>
            {ACTIVITY_LEVELS.map(({ key, label, hint }) => (
              <OptionRow
                key={key}
                label={label}
                hint={hint}
                selected={profile.activity === key}
                onPress={() => updateProfile({ activity: key })}
              />
            ))}
          </Card>

          <Card style={styles.optionCard}>
            <ThemedText style={styles.cardTitle}>Goal</ThemedText>
            {GOALS.map(({ key, label, hint }) => (
              <OptionRow
                key={key}
                label={label}
                hint={hint}
                selected={profile.goal === key}
                onPress={() => updateProfile({ goal: key })}
              />
            ))}
          </Card>

          <CustomTargetCard />

          <Card>
            <ThemedText style={styles.cardTitle}>Appearance</ThemedText>
            <AppearancePicker />
          </Card>

          <BackupCard />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.five,
    gap: Spacing.three,
  },
  heading: {
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 32,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  targetCard: {
    gap: Spacing.one,
  },
  target: {
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 40,
  },
  macroGoalRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    flexWrap: 'wrap',
    paddingVertical: Spacing.one,
  },
  sexRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  sexChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
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
  optionCard: {
    gap: Spacing.one,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  optionText: {
    flex: 1,
  },
  segment: {
    flexDirection: 'row',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    overflow: 'hidden',
  },
  segmentItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
  },
});
