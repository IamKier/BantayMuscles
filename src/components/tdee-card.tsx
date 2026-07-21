import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useProfile } from '@/hooks/use-store';
import { useTheme } from '@/hooks/use-theme';
import { bmi, bmiCategory, bmr, tdee, tdeeTargets } from '@/lib/nutrition';

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <View style={styles.stat}>
      <ThemedText style={styles.statValue}>{value}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      {hint ? (
        <ThemedText type="small" themeColor="accent">
          {hint}
        </ThemedText>
      ) : null}
    </View>
  );
}

/**
 * A full TDEE breakdown — BMR, maintenance, BMI, and calorie targets for a range
 * of paces — like a standalone TDEE calculator, driven by the profile above it.
 */
export function TdeeCard() {
  const theme = useTheme();
  const profile = useProfile();

  const basal = Math.round(bmr(profile));
  const maintenance = Math.round(tdee(profile));
  const bmiValue = bmi(profile);
  const targets = tdeeTargets(profile);

  return (
    <Card>
      <ThemedText style={styles.title}>TDEE calculator</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Mifflin-St Jeor BMR × your activity level. This is where your daily target comes from.
      </ThemedText>

      <View style={styles.statRow}>
        <Stat label="BMR" value={basal.toLocaleString()} />
        <Stat label="Maintenance" value={maintenance.toLocaleString()} hint="kcal/day" />
        <Stat label="BMI" value={bmiValue.toFixed(1)} hint={bmiCategory(bmiValue)} />
      </View>

      <View style={[styles.table, { borderTopColor: theme.border }]}>
        {targets.map((target) => {
          const isMaintain = target.weeklyKg === 0;
          const weekly = isMaintain
            ? 'hold weight'
            : `${target.weeklyKg > 0 ? '+' : '−'}${Math.abs(target.weeklyKg)} kg/week`;
          return (
            <View key={target.key} style={[styles.row, { borderBottomColor: theme.border }]}>
              <View style={styles.rowText}>
                <ThemedText type="small" style={{ fontWeight: isMaintain ? '700' : '500' }}>
                  {target.label}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {weekly}
                </ThemedText>
              </View>
              <ThemedText
                type="smallBold"
                style={{ color: isMaintain ? theme.accent : theme.text }}>
                {target.calories.toLocaleString()} kcal
              </ThemedText>
            </View>
          );
        })}
      </View>

      <ThemedText type="small" themeColor="textSecondary">
        Estimates only — roughly 7,700 kcal per kg. Adjust your goal above to set which target the
        app tracks against.
      </ThemedText>
    </Card>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  statRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    paddingTop: Spacing.one,
  },
  stat: {
    flex: 1,
    gap: Spacing.half,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
  },
  table: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowText: {
    gap: Spacing.half,
  },
});
