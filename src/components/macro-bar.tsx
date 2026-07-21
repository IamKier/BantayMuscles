import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

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
  const target = goal > 0 ? Math.min(1, value / goal) : 0;
  const over = goal > 0 && value > goal;

  // Fill animates to match the calorie ring, so logging a food nudges every bar
  // rather than snapping.
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(target, { duration: 500, easing: Easing.out(Easing.cubic) });
  }, [target, progress]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <ThemedText type="smallBold">{label}</ThemedText>
        <ThemedText type="small" themeColor={over ? 'danger' : 'textSecondary'}>
          {Math.round(value)} / {goal}
          {unit}
        </ThemedText>
      </View>
      <View style={[styles.track, { backgroundColor: theme.track }]}>
        <Animated.View
          style={[styles.fill, fillStyle, { backgroundColor: over ? theme.danger : color }]}
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
