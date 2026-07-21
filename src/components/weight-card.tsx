import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Card } from '@/components/card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { setWeightFor, useProfile, useWeights } from '@/hooks/use-store';
import { useTheme } from '@/hooks/use-theme';
import { toDateKey } from '@/lib/nutrition';

const CHART_POINTS = 14;
const CHART_HEIGHT = 64;

function WeightEditor({
  initial,
  onClose,
}: {
  initial: number;
  onClose: () => void;
}) {
  const theme = useTheme();
  const [value, setValue] = useState(initial > 0 ? String(initial) : '');

  function save() {
    const kg = Number(value.replace(/[^0-9.]/g, ''));
    if (Number.isFinite(kg) && kg > 0) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setWeightFor(toDateKey(new Date()), kg);
    }
    onClose();
  }

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <ThemedView style={[styles.sheet, { borderColor: theme.border }]}>
        <View style={[styles.grabber, { backgroundColor: theme.track }]} />
        <ThemedText style={styles.sheetTitle}>Log today’s weight</ThemedText>
        <View style={[styles.inputRow, { borderColor: theme.border }]}>
          <TextInput
            value={value}
            onChangeText={setValue}
            keyboardType="decimal-pad"
            placeholder="0.0"
            placeholderTextColor={theme.textSecondary}
            autoFocus
            selectTextOnFocus
            style={[styles.input, { color: theme.text }]}
            onSubmitEditing={save}
            returnKeyType="done"
          />
          <ThemedText type="small" themeColor="textSecondary">
            kg
          </ThemedText>
        </View>
        <Pressable
          onPress={save}
          style={[styles.button, { backgroundColor: theme.accent }]}
          accessibilityRole="button"
          android_ripple={{ color: '#00000022' }}>
          <ThemedText style={styles.buttonText}>Save</ThemedText>
        </Pressable>
      </ThemedView>
    </Modal>
  );
}

export function WeightCard() {
  const theme = useTheme();
  const weights = useWeights();
  const profile = useProfile();
  const [editing, setEditing] = useState(false);

  // Most recent logged points, oldest → newest, for the trend line.
  const points = Object.keys(weights)
    .sort()
    .slice(-CHART_POINTS)
    .map((date) => weights[date]);

  const current = points.at(-1) ?? profile.weightKg;
  const first = points[0];
  const change = points.length >= 2 && first !== undefined ? current - first : null;

  const min = points.length ? Math.min(...points) : current;
  const max = points.length ? Math.max(...points) : current;
  const span = max - min || 1;

  return (
    <>
      <Card>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <ThemedText style={styles.title}>Weight</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {points.length >= 2
                ? `Last ${points.length} entries`
                : 'Log regularly to see a trend'}
            </ThemedText>
          </View>
          <Pressable
            onPress={() => {
              void Haptics.selectionAsync();
              setEditing(true);
            }}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Log today's weight"
            style={[styles.logButton, { borderColor: theme.accent }]}
            android_ripple={{ color: theme.backgroundSelected }}>
            <Ionicons name="add" size={16} color={theme.accent} />
            <ThemedText type="smallBold" style={{ color: theme.accent }}>
              Log
            </ThemedText>
          </Pressable>
        </View>

        <View style={styles.figures}>
          <ThemedText style={styles.current}>{current.toFixed(1)} kg</ThemedText>
          {change !== null ? (
            <View style={styles.change}>
              <Ionicons
                name={change > 0 ? 'arrow-up' : change < 0 ? 'arrow-down' : 'remove'}
                size={14}
                color={change === 0 ? theme.textSecondary : theme.accent}
              />
              <ThemedText type="small" themeColor={change === 0 ? 'textSecondary' : 'accent'}>
                {Math.abs(change).toFixed(1)} kg
              </ThemedText>
            </View>
          ) : null}
        </View>

        {points.length >= 2 ? (
          <View style={[styles.chart, { height: CHART_HEIGHT }]}>
            {points.map((kg, index) => {
              const height = 6 + ((kg - min) / span) * (CHART_HEIGHT - 6);
              return (
                <View key={index} style={styles.barSlot}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height,
                        backgroundColor: index === points.length - 1 ? theme.accent : theme.track,
                      },
                    ]}
                  />
                </View>
              );
            })}
          </View>
        ) : null}
      </Card>

      {editing && <WeightEditor initial={current} onClose={() => setEditing(false)} />}
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
  logButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    overflow: 'hidden',
  },
  figures: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.three,
  },
  current: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
  },
  change: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.half,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.one,
  },
  barSlot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  bar: {
    borderRadius: 3,
    width: '100%',
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
    gap: Spacing.three,
  },
  grabber: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    paddingHorizontal: Spacing.three,
    height: 56,
  },
  input: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    padding: 0,
  },
  button: {
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  buttonText: {
    color: '#04120A',
    fontSize: 16,
    fontWeight: '700',
  },
});
