import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BarcodeScanner } from '@/components/barcode-scanner';
import { Card } from '@/components/card';
import { LabelScanner } from '@/components/label-scanner';
import { QuickAddSheet, type QuickAddValues } from '@/components/quick-add-sheet';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MacroColors, Spacing } from '@/constants/theme';
import {
  addEntry,
  addSavedFood,
  useFoods,
  useRecentFoods,
  useSavedFoods,
  useSelectedDate,
} from '@/hooks/use-store';
import { useTheme } from '@/hooks/use-theme';
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

/**
 * Memoized: without this, every keystroke in the search box re-renders all 55+
 * rows, and that synchronous work per character makes the Android keyboard
 * flicker. `onPress` is passed as a stable callback so the memo actually holds.
 */
const FoodRow = memo(function FoodRow({
  food,
  onPress,
}: {
  food: Food;
  onPress: (food: Food) => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={() => onPress(food)}
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
});

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

/**
 * Isolated search field. It owns the live text and only reports a *debounced*
 * query up to the parent, so keystrokes re-render this small component — never
 * the food list. That's what stops the keyboard from lagging while searching.
 */
const SearchBar = memo(function SearchBar({
  onQuery,
  onSubmit,
}: {
  onQuery: (query: string) => void;
  onSubmit: (text: string) => void;
}) {
  const theme = useTheme();
  const [value, setValue] = useState('');

  // Kept in a ref so the debounce timer doesn't reset when the parent passes a
  // new callback identity between renders.
  const onQueryRef = useRef(onQuery);
  onQueryRef.current = onQuery;

  useEffect(() => {
    const handle = setTimeout(() => onQueryRef.current(value.trim()), 200);
    return () => clearTimeout(handle);
  }, [value]);

  return (
    <View
      style={[
        styles.searchBox,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
      ]}>
      <Ionicons name="search" size={18} color={theme.textSecondary} />
      <TextInput
        value={value}
        onChangeText={setValue}
        placeholder="Search foods"
        placeholderTextColor={theme.textSecondary}
        style={[styles.searchInput, { color: theme.text }]}
        returnKeyType="search"
        autoCorrect={false}
        onSubmitEditing={() => onSubmit(value)}
      />
      {value.length > 0 && (
        <Pressable onPress={() => setValue('')} hitSlop={10} accessibilityLabel="Clear search">
          <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
        </Pressable>
      )}
    </View>
  );
});

export default function AddScreen() {
  const theme = useTheme();
  const selectedDate = useSelectedDate();
  const catalog = useFoods();
  const savedFoods = useSavedFoods();
  const recents = useRecentFoods();
  // User's saved foods rank ahead of the shared catalog in search.
  const foods = useMemo(() => [...savedFoods, ...catalog], [savedFoods, catalog]);
  const params = useLocalSearchParams<{ meal?: MealType }>();

  const [meal, setMeal] = useState<MealType>(params.meal ?? 'breakfast');
  // `query` is the *debounced* search term, set by the isolated SearchBar. The
  // live keystrokes never reach this component, so typing doesn't re-render the
  // food list — that's what keeps the keyboard smooth.
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<Food | null>(null);
  const [quickAdd, setQuickAdd] = useState(false);
  const [quickAddInitial, setQuickAddInitial] = useState<Partial<QuickAddValues> | undefined>();
  const [scanning, setScanning] = useState(false);
  const [labelScanning, setLabelScanning] = useState(false);
  const [online, setOnline] = useState<Food[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const local = useMemo(() => filterFoods(foods, query), [foods, query]);
  const results = useMemo(() => [...local, ...online], [local, online]);

  const runOnlineSearch = useCallback(
    async (term: string) => {
      const q = term.trim();
      if (q.length < 2 || searching) return;
      setSearching(true);
      setSearchError(null);

      const result = await searchOnline(q);
      setSearching(false);

      if (!result.ok) {
        setSearchError(result.error);
        return;
      }
      // Drop anything already in the local catalog so the list doesn't repeat itself.
      const known = new Set(filterFoods(foods, q).map((food) => food.name.toLowerCase()));
      setOnline(result.foods.filter((food) => !known.has(food.name.toLowerCase())));
    },
    [foods, searching]
  );

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    // Online results belong to the previous query — drop them.
    setOnline((current) => (current.length ? [] : current));
    setSearchError(null);
  }, []);

  const handlePick = useCallback((food: Food) => setPicked(food), []);

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
    // Keep a named custom food so it can be searched and re-logged later.
    if (values.name !== 'Quick add') {
      addSavedFood({
        id: `custom:${values.name.toLowerCase()}`,
        name: values.name,
        serving: 'custom entry',
        calories: values.calories,
        protein: values.protein,
        carbs: values.carbs,
        fat: values.fat,
      });
    }
    setQuickAdd(false);
    router.navigate('/');
  }

  function handleScanned(food: Food) {
    setScanning(false);
    // Drop straight into the serving picker so the amount can be confirmed.
    setPicked(food);
  }

  function handleLabelRead(values: { calories?: number; protein?: number; carbs?: number; fat?: number }) {
    setLabelScanning(false);
    // Pre-fill Quick add with whatever OCR found; the user reviews before saving.
    setQuickAddInitial({ name: 'Scanned label', ...values });
    setQuickAdd(true);
  }

  function closeQuickAdd() {
    setQuickAdd(false);
    setQuickAddInitial(undefined);
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
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <ThemedText style={styles.heading}>Add food</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Logging to {formatDateLabel(selectedDate).toLowerCase()}
            </ThemedText>
          </View>

          <View style={styles.headerActions}>
            <Pressable
              onPress={() => setLabelScanning(true)}
              style={[styles.iconButton, { borderColor: theme.accent }]}
              accessibilityRole="button"
              accessibilityLabel="Scan nutrition label"
              android_ripple={{ color: theme.backgroundSelected, borderless: true, radius: 22 }}>
              <Ionicons name="reader-outline" size={20} color={theme.accent} />
            </Pressable>

            <Pressable
              onPress={() => setScanning(true)}
              style={[styles.iconButton, { borderColor: theme.accent }]}
              accessibilityRole="button"
              accessibilityLabel="Scan barcode"
              android_ripple={{ color: theme.backgroundSelected, borderless: true, radius: 22 }}>
              <Ionicons name="barcode-outline" size={20} color={theme.accent} />
            </Pressable>

            <Pressable
              onPress={() => setQuickAdd(true)}
              style={[styles.iconButton, { borderColor: theme.accent }]}
              accessibilityRole="button"
              accessibilityLabel="Quick add by numbers"
              android_ripple={{ color: theme.backgroundSelected, borderless: true, radius: 22 }}>
              <Ionicons name="create-outline" size={20} color={theme.accent} />
            </Pressable>
          </View>
        </View>

        <View style={styles.headerBody}>
          <SearchBar onQuery={handleQueryChange} onSubmit={runOnlineSearch} />
          <MealChips value={meal} onChange={setMeal} />
        </View>

        <FlatList
          data={results}
          keyExtractor={(food) => food.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <FoodRow food={item} onPress={handlePick} />}
          ListHeaderComponent={
            query.length === 0 && recents.length > 0 ? (
              <View style={styles.recents}>
                <ThemedText type="smallBold" themeColor="textSecondary" style={styles.recentsLabel}>
                  Recent
                </ThemedText>
                {recents.map((r) => {
                  const food: Food = {
                    id: `recent:${r.name}|${r.serving}`,
                    name: r.name,
                    serving: r.serving,
                    calories: r.calories,
                    protein: r.protein,
                    carbs: r.carbs,
                    fat: r.fat,
                  };
                  return <FoodRow key={food.id} food={food} onPress={handlePick} />;
                })}
                <ThemedText type="smallBold" themeColor="textSecondary" style={styles.recentsLabel}>
                  All foods
                </ThemedText>
              </View>
            ) : null
          }
          ListFooterComponent={
            query.length >= 2 ? (
              <View style={styles.footer}>
                {searchError ? (
                  <ThemedText type="small" themeColor="danger" style={styles.footerText}>
                    {searchError}
                  </ThemedText>
                ) : null}

                {online.length === 0 && !searchError ? (
                  <Pressable
                    onPress={() => runOnlineSearch(query)}
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
        </KeyboardAvoidingView>
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
        <QuickAddSheet
          onClose={closeQuickAdd}
          onConfirm={handleQuickAdd}
          initial={quickAddInitial}
        />
      )}

      {scanning && (
        <BarcodeScanner onClose={() => setScanning(false)} onFound={handleScanned} />
      )}

      {labelScanning && (
        <LabelScanner onClose={() => setLabelScanning(false)} onRead={handleLabelRead} />
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
  flex: {
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
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
  recents: {
    gap: Spacing.one,
  },
  recentsLabel: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingTop: Spacing.two,
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
