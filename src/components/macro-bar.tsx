import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type MacroBarProps = {
  label: string;
  value: number;
  goal: number;
  color: string;
  unit?: string;
};

export function MacroBar({ label, value, goal, color, unit = 'g' }: MacroBarProps) {
  const theme = useTheme();
  const progress = goal > 0 ? Math.min(1, value / goal) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <ThemedText type="smallBold">{label}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {Math.round(value)} / {goal}
          {unit}
        </ThemedText>
      </View>
      <View style={[styles.track, { backgroundColor: theme.track }]}>
        <View
          style={[styles.fill, { backgroundColor: color, width: `${progress * 100}%` }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: Spacing.two,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: Spacing.two,
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
});
