import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/card';
import { QuickAddSheet, type QuickAddValues } from '@/components/quick-add-sheet';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MacroColors, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTracker } from '@/hooks/use-tracker';
import { filterFoods } from '@/lib/foods';
import { Food, MEALS, MealType, formatDateLabel, scaleMacros } from '@/lib/nutrition';
import { isOnlineFood, searchOnline } from '@/lib/online-search';

const SERVING_STEP = 0.5;

function MealChips({
  value,
  onChange,
}: {
  value: MealType;
  onChange: (meal: MealType) => void;
}) {
  const theme = useTheme();

  return (
    <View style={styles.chipRow}>
      {MEALS.map(({ key, label }) => {
        const selected = key === value;
        return (
          <Pressable
            key={key}
            onPress={() => {
              void Haptics.selectionAsync();
              onChange(key);
            }}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={label}
            style={[
              styles.chip,
              {
                backgroundColor: selected ? theme.accentMuted : theme.backgroundElement,
                borderColor: selected ? theme.accent : theme.border,
              },
            ]}
            android_ripple={{ color: theme.backgroundSelected }}>
            <ThemedText
              type="small"
              style={{ color: selected ? theme.accent : theme.textSecondary, fontWeight: '600' }}>
              {label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

function FoodRow({ food, onPress }: { food: Food; onPress: () => void }) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${food.name}, ${food.calories} calories per ${food.serving}`}
      style={[styles.foodRow, { borderBottomColor: theme.border }]}
      android_ripple={{ color: theme.backgroundSelected }}>
      <View style={styles.foodText}>
        <View style={styles.foodNameRow}>
          <ThemedText type="small" numberOfLines={1} style={styles.foodName}>
            {food.name}
          </ThemedText>
          {isOnlineFood(food) && (
            <Ionicons name="globe-outline" size={13} color={theme.textSecondary} />
          )}
        </View>
        <ThemedText type="small" themeColor="textSecondary">
          {food.serving} · P{food.protein} C{food.carbs} F{food.fat}
        </ThemedText>
      </View>
      <ThemedText type="smallBold">{food.calories}</ThemedText>
      <Ionicons name="add-circle" size={22} color={theme.accent} />
    </Pressable>
  );
}

/** Serving picker shown after tapping a food; confirms the exact amount before logging. */
function ServingSheet({
  food,
  meal,
  onClose,
  onConfirm,
}: {
  food: Food;
  meal: MealType;
  onClose: () => void;
  onConfirm: (servings: number) => void;
}) {
  const theme = useTheme();
  const [servings, setServings] = useState(1);
  const scaled = scaleMacros(food, servings);

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <ThemedView style={[styles.sheet, { borderColor: theme.border }]}>
        <View style={[styles.grabber, { backgroundColor: theme.track }]} />

        <ThemedText style={styles.sheetTitle}>{food.name}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {food.serving} · {MEALS.find((m) => m.key === meal)?.label}
        </ThemedText>

        <View style={styles.stepper}>
          <Pressable
            onPress={() => {
              void Haptics.selectionAsync();
              setServings((s) => Math.max(SERVING_STEP, s - SERVING_STEP));
            }}
            accessibilityRole="button"
            accessibilityLabel="Decrease servings"
            style={[styles.stepperButton, { borderColor: theme.border }]}
            android_ripple={{ color: theme.backgroundSelected, borderless: true, radius: 28 }}>
            <Ionicons name="remove" size={22} color={theme.text} />
          </Pressable>

          <View style={styles.stepperValue}>
            <ThemedText style={styles.servingsText}>{servings}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {servings === 1 ? 'serving' : 'servings'}
            </ThemedText>
          </View>

          <Pressable
            onPress={() => {
              void Haptics.selectionAsync();
              setServings((s) => s + SERVING_STEP);
            }}
            accessibilityRole="button"
            accessibilityLabel="Increase servings"
            style={[styles.stepperButton, { borderColor: theme.border }]}
            android_ripple={{ color: theme.backgroundSelected, borderless: true, radius: 28 }}>
            <Ionicons name="add" size={22} color={theme.text} />
          </Pressable>
        </View>

        <View style={styles.macroSummary}>
          <MacroPill label="kcal" value={scaled.calories} color={theme.accent} />
          <MacroPill label="protein" value={`${scaled.protein}g`} color={MacroColors.protein} />
          <MacroPill label="carbs" value={`${scaled.carbs}g`} color={MacroColors.carbs} />
          <MacroPill label="fat" value={`${scaled.fat}g`} color={MacroColors.fat} />
        </View>

        <Pressable
          onPress={() => onConfirm(servings)}
          style={[styles.primaryButton, { backgroundColor: theme.accent }]}
          android_ripple={{ color: '#00000022' }}>
          <ThemedText style={styles.primaryButtonText}>Add to diary</ThemedText>
        </Pressable>
      </ThemedView>
    </Modal>
  );
}

function MacroPill({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <View style={styles.pill}>
      <ThemedText style={[styles.pillValue, { color }]}>{value}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
    </View>
  );
}

export default function AddScreen() {
  const theme = useTheme();
  const { addEntry, selectedDate, foods } = useTracker();
  const params = useLocalSearchParams<{ meal?: MealType }>();

  const [meal, setMeal] = useState<MealType>(params.meal ?? 'breakfast');
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<Food | null>(null);
  const [quickAdd, setQuickAdd] = useState(false);
  const [online, setOnline] = useState<Food[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const local = useMemo(() => filterFoods(foods, query), [foods, query]);
  const results = useMemo(() => [...local, ...online], [local, online]);

  async function runOnlineSearch() {
    if (searching) return;
    setSearching(true);
    setSearchError(null);

    const result = await searchOnline(query);
    setSearching(false);

    if (!result.ok) {
      setSearchError(result.error);
      return;
    }
    // Drop anything already in the local catalog so the list doesn't repeat itself.
    const known = new Set(local.map((food) => food.name.toLowerCase()));
    setOnline(result.foods.filter((food) => !known.has(food.name.toLowerCase())));
  }

  function updateQuery(value: string) {
    setQuery(value);
    // Online results belong to the previous query — drop them.
    setOnline([]);
    setSearchError(null);
  }

  function handleQuickAdd(values: QuickAddValues) {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addEntry({
      date: selectedDate,
      meal,
      name: values.name,
      serving: 'custom entry',
      servings: 1,
      calories: values.calories,
      protein: values.protein,
      carbs: values.carbs,
      fat: values.fat,
    });
    setQuickAdd(false);
    router.navigate('/');
  }

  function handleConfirm(servings: number) {
    if (!picked) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addEntry({
      date: selectedDate,
      meal,
      name: picked.name,
      serving: picked.serving,
      servings,
      ...scaleMacros(picked, servings),
    });
    setPicked(null);
    // navigate (not push) so switching to the Today tab doesn't stack history.
    router.navigate('/');
  }

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <ThemedText style={styles.heading}>Add food</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Logging to {formatDateLabel(selectedDate).toLowerCase()}
            </ThemedText>
          </View>

          <Pressable
            onPress={() => setQuickAdd(true)}
            style={[styles.quickAddButton, { borderColor: theme.accent }]}
            android_ripple={{ color: theme.backgroundSelected }}>
            <Ionicons name="create-outline" size={16} color={theme.accent} />
            <ThemedText type="smallBold" style={{ color: theme.accent }}>
              Quick add
            </ThemedText>
          </Pressable>
        </View>

        <View style={styles.headerBody}>
          <View
            style={[
              styles.searchBox,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}>
            <Ionicons name="search" size={18} color={theme.textSecondary} />
            <TextInput
              value={query}
              onChangeText={updateQuery}
              placeholder="Search foods"
              placeholderTextColor={theme.textSecondary}
              style={[styles.searchInput, { color: theme.text }]}
              returnKeyType="search"
              onSubmitEditing={runOnlineSearch}
            />
            {query.length > 0 && (
              <Pressable onPress={() => updateQuery('')} hitSlop={10}>
                <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
              </Pressable>
            )}
          </View>

          <MealChips value={meal} onChange={setMeal} />
        </View>

        <FlatList
          data={results}
          keyExtractor={(food) => food.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <FoodRow food={item} onPress={() => setPicked(item)} />}
          ListFooterComponent={
            query.trim().length >= 2 ? (
              <View style={styles.footer}>
                {searchError ? (
                  <ThemedText type="small" themeColor="danger" style={styles.footerText}>
                    {searchError}
                  </ThemedText>
                ) : null}

                {online.length === 0 && !searchError ? (
                  <Pressable
                    onPress={runOnlineSearch}
                    disabled={searching}
                    style={[styles.footerButton, { borderColor: theme.border }]}
                    android_ripple={{ color: theme.backgroundSelected }}>
                    {searching ? (
                      <ActivityIndicator size="small" color={theme.accent} />
                    ) : (
                      <Ionicons name="globe-outline" size={18} color={theme.accent} />
                    )}
                    <ThemedText type="smallBold" style={{ color: theme.accent }}>
                      {searching ? 'Searching…' : 'Search the online food database'}
                    </ThemedText>
                  </Pressable>
                ) : null}

                {online.length > 0 ? (
                  <ThemedText type="small" themeColor="textSecondary" style={styles.footerText}>
                    Online results are per 100 g from Open Food Facts. Packaged products only —
                    restaurant meals need Quick add.
                  </ThemedText>
                ) : null}

                <Pressable
                  onPress={() => setQuickAdd(true)}
                  style={styles.emptyAction}
                  android_ripple={{ color: theme.backgroundSelected }}>
                  <Ionicons name="create-outline" size={18} color={theme.accent} />
                  <ThemedText type="smallBold" style={{ color: theme.accent }}>
                    Enter the numbers yourself
                  </ThemedText>
                </Pressable>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <Card style={styles.empty}>
              <ThemedText type="small" themeColor="textSecondary">
                No saved foods match “{query}”.
              </ThemedText>
            </Card>
          }
        />
      </SafeAreaView>

      {picked && (
        <ServingSheet
          food={picked}
          meal={meal}
          onClose={() => setPicked(null)}
          onConfirm={handleConfirm}
        />
      )}

      {quickAdd && (
        <QuickAddSheet onClose={() => setQuickAdd(false)} onConfirm={handleQuickAdd} />
      )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
  },
  headerText: {
    flex: 1,
  },
  quickAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    overflow: 'hidden',
  },
  heading: {
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 32,
  },
  headerBody: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    gap: Spacing.three,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    paddingHorizontal: Spacing.three,
    height: 46,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  chipRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  chip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  list: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.five,
  },
  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  foodText: {
    flex: 1,
  },
  foodNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  foodName: {
    flexShrink: 1,
  },
  footer: {
    paddingTop: Spacing.three,
    gap: Spacing.two,
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    height: 48,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  footerText: {
    paddingHorizontal: Spacing.one,
  },
  empty: {
    marginTop: Spacing.three,
  },
  emptyAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
  backdrop: {
    flex: 1,
    backgroundColor: '#00000080',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.four,
    paddingBottom: Spacing.five,
    gap: Spacing.two,
  },
  grabber: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.three,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.four,
    paddingVertical: Spacing.three,
  },
  stepperButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    alignItems: 'center',
    minWidth: 90,
  },
  servingsText: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 38,
  },
  macroSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two,
  },
  pill: {
    alignItems: 'center',
    flex: 1,
  },
  pillValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  primaryButton: {
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
    overflow: 'hidden',
  },
  primaryButtonText: {
    color: '#04120A',
    fontSize: 16,
    fontWeight: '700',
  },
});
