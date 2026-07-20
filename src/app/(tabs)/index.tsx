import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, Layout } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CalorieRing } from '@/components/calorie-ring';
import { Card } from '@/components/card';
import { MacroBar } from '@/components/macro-bar';
import { Snackbar } from '@/components/snackbar';
import { StepsCard } from '@/components/steps-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MacroColors, Spacing } from '@/constants/theme';
import { usePedometer } from '@/hooks/use-pedometer';
import { useTheme } from '@/hooks/use-theme';
import { groupByMeal, useTracker } from '@/hooks/use-tracker';
import { caloriesFromSteps } from '@/lib/activity';
import { Entry, MEALS, MealType, formatDateLabel, shiftDateKey, toDateKey } from '@/lib/nutrition';

function DateHeader() {
  const theme = useTheme();
  const { selectedDate, setSelectedDate } = useTracker();
  const isToday = selectedDate === toDateKey(new Date());

  return (
    <View style={styles.dateHeader}>
      <Pressable
        onPress={() => setSelectedDate(shiftDateKey(selectedDate, -1))}
        hitSlop={16}
        accessibilityRole="button"
        accessibilityLabel="Previous day"
        android_ripple={{ color: theme.backgroundSelected, borderless: true, radius: 24 }}>
        <Ionicons name="chevron-back" size={24} color={theme.textSecondary} />
      </Pressable>

      <Pressable
        onPress={() => setSelectedDate(toDateKey(new Date()))}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel={`${formatDateLabel(selectedDate)}. Tap to jump to today.`}>
        <ThemedText type="smallBold" style={styles.dateLabel}>
          {formatDateLabel(selectedDate)}
        </ThemedText>
      </Pressable>

      <Pressable
        onPress={() => setSelectedDate(shiftDateKey(selectedDate, 1))}
        hitSlop={16}
        disabled={isToday}
        accessibilityRole="button"
        accessibilityLabel="Next day"
        accessibilityState={{ disabled: isToday }}
        android_ripple={{ color: theme.backgroundSelected, borderless: true, radius: 24 }}>
        <Ionicons
          name="chevron-forward"
          size={24}
          color={isToday ? theme.track : theme.textSecondary}
        />
      </Pressable>
    </View>
  );
}

function EntryRow({ entry, onRemove }: { entry: Entry; onRemove: () => void }) {
  const theme = useTheme();

  return (
    <Animated.View entering={FadeIn.duration(200)} layout={Layout.springify()} style={styles.entryRow}>
      <View style={styles.entryText}>
        <ThemedText type="small" numberOfLines={1}>
          {entry.name}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {entry.servings === 1 ? entry.serving : `${entry.servings} × ${entry.serving}`}
        </ThemedText>
      </View>

      <ThemedText type="smallBold">{entry.calories}</ThemedText>

      <Pressable
        onPress={onRemove}
        hitSlop={14}
        accessibilityRole="button"
        accessibilityLabel={`Remove ${entry.name}`}
        android_ripple={{ color: theme.backgroundSelected, borderless: true, radius: 20 }}>
        <Ionicons name="close" size={18} color={theme.textSecondary} />
      </Pressable>
    </Animated.View>
  );
}

function MealSection({
  meal,
  label,
  entries,
  onRemove,
}: {
  meal: MealType;
  label: string;
  entries: Entry[];
  onRemove: (entry: Entry) => void;
}) {
  const theme = useTheme();
  const calories = entries.reduce((sum, entry) => sum + entry.calories, 0);

  return (
    <Card style={styles.mealCard}>
      <View style={styles.mealHeader}>
        <ThemedText style={styles.mealTitle}>{label}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {calories > 0 ? `${calories} kcal` : '—'}
        </ThemedText>
      </View>

      {entries.map((entry) => (
        <EntryRow key={entry.id} entry={entry} onRemove={() => onRemove(entry)} />
      ))}

      <Pressable
        onPress={() => router.push({ pathname: '/add', params: { meal } })}
        style={styles.addRow}
        accessibilityRole="button"
        accessibilityLabel={`Add food to ${label}`}
        android_ripple={{ color: theme.backgroundSelected }}>
        <Ionicons name="add" size={18} color={theme.accent} />
        <ThemedText type="smallBold" style={{ color: theme.accent }}>
          Add food
        </ThemedText>
      </Pressable>
    </Card>
  );
}

/** Shown before anything is logged, so the first screen isn't four empty cards. */
function EmptyDay() {
  const theme = useTheme();

  return (
    <Card style={styles.emptyCard}>
      <View style={[styles.emptyIcon, { backgroundColor: theme.accentMuted }]}>
        <Ionicons name="restaurant-outline" size={22} color={theme.accent} />
      </View>
      <ThemedText style={styles.emptyTitle}>Nothing logged yet</ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.emptyBody}>
        Add what you ate and the ring above fills up. Search saved foods, look one up online, or
        type the numbers in yourself.
      </ThemedText>
    </Card>
  );
}

export default function TodayScreen() {
  const {
    selectedDate,
    entriesFor,
    totalsFor,
    goals,
    ready,
    addEntry,
    removeEntry,
    profile,
    stepsFor,
    setStepsFor,
  } = useTracker();
  const pedometerStatus = usePedometer();
  const [undo, setUndo] = useState<Entry | null>(null);

  const entries = ready ? entriesFor(selectedDate) : [];
  const totals = ready ? totalsFor(selectedDate) : { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const byMeal = groupByMeal(entries);

  const steps = stepsFor(selectedDate);
  const burned = caloriesFromSteps(steps, profile.weightKg);

  /**
   * Delete is one tap on a small target, so make it recoverable rather than
   * putting a confirmation dialog in front of every removal.
   */
  function handleRemove(entry: Entry) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    removeEntry(entry.id);
    setUndo(entry);
  }

  function handleUndo() {
    if (!undo) return;
    const { id: _id, ...rest } = undo;
    addEntry(rest);
    setUndo(null);
  }

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <DateHeader />

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Card style={styles.summaryCard}>
            <CalorieRing consumed={totals.calories} goal={goals.calories} burned={burned} />

            <View style={styles.macroRow}>
              <MacroBar
                label="Protein"
                value={totals.protein}
                goal={goals.protein}
                color={MacroColors.protein}
              />
              <MacroBar
                label="Carbs"
                value={totals.carbs}
                goal={goals.carbs}
                color={MacroColors.carbs}
              />
              <MacroBar label="Fat" value={totals.fat} goal={goals.fat} color={MacroColors.fat} />
            </View>
          </Card>

          <StepsCard
            steps={steps}
            weightKg={profile.weightKg}
            heightCm={profile.heightCm}
            status={pedometerStatus}
            onSetSteps={(value) => setStepsFor(selectedDate, value)}
          />

          {entries.length === 0 && ready ? <EmptyDay /> : null}

          {MEALS.map(({ key, label }) => (
            <MealSection
              key={key}
              meal={key}
              label={label}
              entries={byMeal[key]}
              onRemove={handleRemove}
            />
          ))}
        </ScrollView>
      </SafeAreaView>

      {undo ? (
        <Snackbar
          message={`Removed ${undo.name}`}
          actionLabel="Undo"
          onAction={handleUndo}
          onDismiss={() => setUndo(null)}
        />
      ) : null}
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
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  dateLabel: {
    fontSize: 18,
  },
  content: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.five,
    gap: Spacing.three,
  },
  summaryCard: {
    alignItems: 'center',
    paddingVertical: Spacing.four,
    gap: Spacing.four,
  },
  macroRow: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    gap: Spacing.three,
  },
  mealCard: {
    gap: Spacing.two,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  entryText: {
    flex: 1,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.two,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: Spacing.four,
    gap: Spacing.two,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyBody: {
    textAlign: 'center',
  },
});
