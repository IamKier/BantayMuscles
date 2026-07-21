import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/card';
import { MacroDonut } from '@/components/macro-donut';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WeightCard } from '@/components/weight-card';
import { Spacing } from '@/constants/theme';
import { useEntries, useGoals } from '@/hooks/use-store';
import { useTheme } from '@/hooks/use-theme';
import { shiftDateKey, sumMacros, toDateKey } from '@/lib/nutrition';

const DAYS = 7;
const CHART_HEIGHT = 140;

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <View style={styles.stat}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText style={styles.statValue}>{value}</ThemedText>
      {hint ? (
        <ThemedText type="small" themeColor="textSecondary">
          {hint}
        </ThemedText>
      ) : null}
    </View>
  );
}

export default function ProgressScreen() {
  const theme = useTheme();
  const goals = useGoals();
  const entries = useEntries();

  const today = toDateKey(new Date());
  // Bucket the week's entries by date once, then total each day — cheaper than
  // scanning the whole list seven times, and only recomputes when entries change.
  const days = useMemo(() => {
    const byDate = new Map<string, typeof entries>();
    for (const entry of entries) {
      const bucket = byDate.get(entry.date);
      if (bucket) bucket.push(entry);
      else byDate.set(entry.date, [entry]);
    }
    return Array.from({ length: DAYS }, (_, index) => {
      const date = shiftDateKey(today, index - (DAYS - 1));
      const [year, month, day] = date.split('-').map(Number);
      return {
        date,
        label: new Date(year, month - 1, day).toLocaleDateString(undefined, { weekday: 'narrow' }),
        totals: sumMacros(byDate.get(date) ?? []),
      };
    });
  }, [entries, today]);

  const logged = days.filter((day) => day.totals.calories > 0);
  const average = logged.length
    ? Math.round(logged.reduce((sum, day) => sum + day.totals.calories, 0) / logged.length)
    : 0;
  const onTarget = logged.filter(
    (day) => Math.abs(day.totals.calories - goals.calories) <= goals.calories * 0.1
  ).length;
  const weekMacros = logged.length
    ? {
        protein: Math.round(
          logged.reduce((sum, day) => sum + day.totals.protein, 0) / logged.length
        ),
        carbs: Math.round(logged.reduce((sum, day) => sum + day.totals.carbs, 0) / logged.length),
        fat: Math.round(logged.reduce((sum, day) => sum + day.totals.fat, 0) / logged.length),
      }
    : { protein: 0, carbs: 0, fat: 0 };

  // The logged day closest to the calorie goal — a small "you nailed it" moment.
  const bestDay = logged.length
    ? logged.reduce((best, day) =>
        Math.abs(day.totals.calories - goals.calories) <
        Math.abs(best.totals.calories - goals.calories)
          ? day
          : best
      )
    : null;
  const bestDayLabel = bestDay
    ? (() => {
        const [year, month, day] = bestDay.date.split('-').map(Number);
        return new Date(year, month - 1, day).toLocaleDateString(undefined, { weekday: 'long' });
      })()
    : null;

  // Scale bars against the goal line unless a day blew past it.
  const peak = Math.max(goals.calories, ...days.map((day) => day.totals.calories));
  const goalLineOffset = CHART_HEIGHT * (1 - goals.calories / peak);

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <ThemedText style={styles.heading}>Progress</ThemedText>

          <WeightCard />

          <Card>
            <View style={styles.cardHeader}>
              <ThemedText style={styles.cardTitle}>Last 7 days</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Goal {goals.calories.toLocaleString()} kcal
              </ThemedText>
            </View>

            <View style={[styles.chart, { height: CHART_HEIGHT }]}>
              <View
                style={[styles.goalLine, { top: goalLineOffset, borderColor: theme.textSecondary }]}
              />

              {days.map((day) => {
                const height = peak > 0 ? (day.totals.calories / peak) * CHART_HEIGHT : 0;
                const over = day.totals.calories > goals.calories;
                return (
                  <View key={day.date} style={styles.barColumn}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: Math.max(day.totals.calories > 0 ? 4 : 0, height),
                          backgroundColor: over ? theme.danger : theme.accent,
                        },
                      ]}
                    />
                  </View>
                );
              })}
            </View>

            <View style={styles.axis}>
              {days.map((day) => (
                <ThemedText
                  key={day.date}
                  type="small"
                  themeColor="textSecondary"
                  style={styles.axisLabel}>
                  {day.label}
                </ThemedText>
              ))}
            </View>
          </Card>

          <Card>
            <ThemedText style={styles.cardTitle}>This week</ThemedText>
            <View style={styles.statRow}>
              <Stat
                label="Avg calories"
                value={average ? average.toLocaleString() : '—'}
                hint="per logged day"
              />
              <Stat label="On target" value={`${onTarget}/${logged.length || 0}`} hint="within 10%" />
              <Stat label="Logged" value={`${logged.length}/${DAYS}`} hint="days" />
            </View>

            {bestDay ? (
              <View style={[styles.bestDay, { borderTopColor: theme.border }]}>
                <Ionicons name="trophy-outline" size={16} color={theme.accent} />
                <ThemedText type="small" themeColor="textSecondary" style={styles.bestDayText}>
                  Closest to goal:{' '}
                  <ThemedText type="smallBold" themeColor="text">
                    {bestDayLabel}
                  </ThemedText>{' '}
                  at {bestDay.totals.calories.toLocaleString()} kcal
                </ThemedText>
              </View>
            ) : null}
          </Card>

          <Card>
            <ThemedText style={styles.cardTitle}>Macro balance</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Share of your average calories from each macro.
            </ThemedText>
            {logged.length ? (
              <MacroDonut
                protein={weekMacros.protein}
                carbs={weekMacros.carbs}
                fat={weekMacros.fat}
              />
            ) : (
              <ThemedText type="small" themeColor="textSecondary">
                Log some food this week to see your split.
              </ThemedText>
            )}
          </Card>
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
  },
  goalLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    opacity: 0.5,
  },
  barColumn: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  bar: {
    borderRadius: 6,
    width: '100%',
  },
  axis: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  axisLabel: {
    flex: 1,
    textAlign: 'center',
  },
  statRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  stat: {
    flex: 1,
    gap: Spacing.half,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 30,
  },
  bestDay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.three,
  },
  bestDayText: {
    flex: 1,
  },
});
