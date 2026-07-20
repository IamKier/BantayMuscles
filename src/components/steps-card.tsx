import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Card } from '@/components/card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { PedometerStatus } from '@/hooks/use-pedometer';
import { useTheme } from '@/hooks/use-theme';
import { DEFAULT_STEP_GOAL, caloriesFromSteps, distanceFromSteps } from '@/lib/activity';

type StepsCardProps = {
  steps: number;
  weightKg: number;
  heightCm: number;
  status: PedometerStatus;
  onSetSteps: (steps: number) => void;
};

function StatusNote({ status }: { status: PedometerStatus }) {
  const message =
    status === 'denied'
      ? 'Motion permission denied — enter steps manually, or allow physical activity in Settings.'
      : status === 'unavailable'
        ? 'No step sensor detected on this device — enter steps manually.'
        : // 'active' still gets a note: Android stops delivering updates in the background.
          'Counted while the app is open. For a full day, copy the total from your phone’s health app.';

  return (
    <ThemedText type="small" themeColor="textSecondary">
      {message}
    </ThemedText>
  );
}

/** Sheet for typing a step count read off another app. */
function StepEditor({
  initial,
  onClose,
  onSave,
}: {
  initial: number;
  onClose: () => void;
  onSave: (steps: number) => void;
}) {
  const theme = useTheme();
  const [value, setValue] = useState(initial > 0 ? String(initial) : '');

  function save() {
    const parsed = Number(value.replace(/[^0-9]/g, ''));
    onSave(Number.isFinite(parsed) ? parsed : 0);
    onClose();
  }

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <ThemedView style={[styles.sheet, { borderColor: theme.border }]}>
        <View style={[styles.grabber, { backgroundColor: theme.track }]} />

        <ThemedText style={styles.sheetTitle}>Set steps</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Replaces today’s count with the number you enter.
        </ThemedText>

        <TextInput
          value={value}
          onChangeText={setValue}
          keyboardType="number-pad"
          placeholder="e.g. 8500"
          placeholderTextColor={theme.textSecondary}
          autoFocus
          selectTextOnFocus
          style={[
            styles.input,
            { color: theme.text, borderColor: theme.border, backgroundColor: theme.background },
          ]}
          onSubmitEditing={save}
          returnKeyType="done"
        />

        <Pressable
          onPress={save}
          accessibilityRole="button"
          style={[styles.button, { backgroundColor: theme.accent }]}
          android_ripple={{ color: '#00000022' }}>
          <ThemedText style={styles.buttonText}>Save</ThemedText>
        </Pressable>
      </ThemedView>
    </Modal>
  );
}

export function StepsCard({ steps, weightKg, heightCm, status, onSetSteps }: StepsCardProps) {
  const theme = useTheme();
  const [editing, setEditing] = useState(false);

  const burned = caloriesFromSteps(steps, weightKg);
  const km = distanceFromSteps(steps, heightCm);
  const progress = Math.min(1, steps / DEFAULT_STEP_GOAL);

  return (
    <>
      <Card>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <ThemedText style={styles.title}>Steps</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Goal {DEFAULT_STEP_GOAL.toLocaleString()}
            </ThemedText>
          </View>

          <Pressable
            onPress={() => {
              void Haptics.selectionAsync();
              setEditing(true);
            }}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Set step count manually"
            style={[styles.editButton, { borderColor: theme.border }]}
            android_ripple={{ color: theme.backgroundSelected }}>
            <Ionicons name="create-outline" size={16} color={theme.accent} />
          </Pressable>
        </View>

        <View style={styles.figures}>
          <View style={styles.figure}>
            <ThemedText style={styles.value}>{steps.toLocaleString()}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              steps
            </ThemedText>
          </View>
          <View style={styles.figure}>
            <ThemedText style={[styles.value, { color: theme.accent }]}>{burned}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              kcal burned
            </ThemedText>
          </View>
          <View style={styles.figure}>
            <ThemedText style={styles.value}>{km.toFixed(1)}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              km
            </ThemedText>
          </View>
        </View>

        <View
          style={[styles.track, { backgroundColor: theme.track }]}
          accessibilityRole="progressbar"
          accessibilityLabel={`${steps} of ${DEFAULT_STEP_GOAL} steps`}>
          <View
            style={[styles.fill, { backgroundColor: theme.accent, width: `${progress * 100}%` }]}
          />
        </View>

        <StatusNote status={status} />
      </Card>

      {editing && (
        <StepEditor initial={steps} onClose={() => setEditing(false)} onSave={onSetSteps} />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  figures: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  figure: {
    flex: 1,
  },
  value: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
  },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
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
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    height: 52,
    fontSize: 20,
    fontWeight: '600',
    marginTop: Spacing.two,
  },
  button: {
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.three,
    overflow: 'hidden',
  },
  buttonText: {
    color: '#04120A',
    fontSize: 16,
    fontWeight: '700',
  },
});
