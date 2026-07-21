import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MacroColors, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Macros } from '@/lib/nutrition';

export type QuickAddValues = Macros & { name: string };

type QuickAddSheetProps = {
  onClose: () => void;
  onConfirm: (values: QuickAddValues) => void;
  /** Pre-fills the fields, e.g. from a scanned nutrition label. */
  initial?: Partial<QuickAddValues>;
};

/** Parses a typed number, treating blank/garbage as 0 rather than NaN. */
function toNumber(text: string): number {
  const parsed = Number(text.replace(/[^0-9.]/g, ''));
  return Number.isFinite(parsed) ? Math.round(parsed) : 0;
}

function NumberInput({
  label,
  value,
  onChangeText,
  color,
  autoFocus,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  color?: string;
  autoFocus?: boolean;
}) {
  const theme = useTheme();

  return (
    <View style={styles.numberField}>
      <ThemedText type="small" style={{ color: color ?? theme.textSecondary }}>
        {label}
      </ThemedText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType="numeric"
        placeholder="0"
        placeholderTextColor={theme.textSecondary}
        autoFocus={autoFocus}
        selectTextOnFocus
        style={[
          styles.numberInput,
          { color: theme.text, borderColor: theme.border, backgroundColor: theme.background },
        ]}
      />
    </View>
  );
}

/**
 * Logs a food that isn't in the catalog by typing the numbers straight in.
 * Only calories are required — macros default to 0 so a rough entry stays quick.
 */
const numOrEmpty = (value: number | undefined) => (value != null ? String(value) : '');

export function QuickAddSheet({ onClose, onConfirm, initial }: QuickAddSheetProps) {
  const theme = useTheme();

  const [name, setName] = useState(initial?.name ?? '');
  const [calories, setCalories] = useState(numOrEmpty(initial?.calories));
  const [protein, setProtein] = useState(numOrEmpty(initial?.protein));
  const [carbs, setCarbs] = useState(numOrEmpty(initial?.carbs));
  const [fat, setFat] = useState(numOrEmpty(initial?.fat));
  const [error, setError] = useState<string | null>(null);

  function confirm() {
    const kcal = toNumber(calories);
    if (kcal <= 0) {
      setError('Enter how many calories this was.');
      return;
    }
    onConfirm({
      name: name.trim() || 'Quick add',
      calories: kcal,
      protein: toNumber(protein),
      carbs: toNumber(carbs),
      fat: toNumber(fat),
    });
  }

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ThemedView style={[styles.sheet, { borderColor: theme.border }]}>
          <View style={[styles.grabber, { backgroundColor: theme.track }]} />

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <ThemedText style={styles.title}>Quick add</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
              Type the numbers off a label or receipt. Only calories are required.
            </ThemedText>

            <View style={styles.nameField}>
              <ThemedText type="small" themeColor="textSecondary">
                Name (optional)
              </ThemedText>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. Lunch at the canteen"
                placeholderTextColor={theme.textSecondary}
                style={[
                  styles.nameInput,
                  { color: theme.text, borderColor: theme.border, backgroundColor: theme.background },
                ]}
                returnKeyType="next"
              />
            </View>

            <View style={styles.caloriesRow}>
              <NumberInput
                label="Calories (kcal)"
                value={calories}
                onChangeText={(value) => {
                  setCalories(value);
                  if (error) setError(null);
                }}
                color={theme.accent}
                autoFocus
              />
            </View>

            <View style={styles.macroRow}>
              <NumberInput
                label="Protein (g)"
                value={protein}
                onChangeText={setProtein}
                color={MacroColors.protein}
              />
              <NumberInput
                label="Carbs (g)"
                value={carbs}
                onChangeText={setCarbs}
                color={MacroColors.carbs}
              />
              <NumberInput label="Fat (g)" value={fat} onChangeText={setFat} color={MacroColors.fat} />
            </View>

            {error ? (
              <View style={styles.error}>
                <Ionicons name="alert-circle-outline" size={16} color={theme.danger} />
                <ThemedText type="small" themeColor="danger">
                  {error}
                </ThemedText>
              </View>
            ) : null}

            <Pressable
              onPress={confirm}
              style={[styles.button, { backgroundColor: theme.accent }]}
              android_ripple={{ color: '#00000022' }}>
              <ThemedText style={styles.buttonText}>Add to diary</ThemedText>
            </Pressable>
          </ScrollView>
        </ThemedView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    maxHeight: '90%',
  },
  grabber: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.three,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: Spacing.one,
    marginBottom: Spacing.three,
  },
  nameField: {
    gap: Spacing.one,
    marginBottom: Spacing.three,
  },
  nameInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    height: 48,
    fontSize: 15,
  },
  caloriesRow: {
    marginBottom: Spacing.three,
  },
  macroRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  numberField: {
    flex: 1,
    gap: Spacing.one,
  },
  numberInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    height: 48,
    fontSize: 17,
    fontWeight: '600',
  },
  error: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingTop: Spacing.three,
  },
  button: {
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.four,
    overflow: 'hidden',
  },
  buttonText: {
    color: '#04120A',
    fontSize: 16,
    fontWeight: '700',
  },
});
