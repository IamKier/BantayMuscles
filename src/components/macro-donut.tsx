import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { MacroColors, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type MacroDonutProps = {
  protein: number;
  carbs: number;
  fat: number;
  size?: number;
  strokeWidth?: number;
};

const CALORIES_PER_GRAM = { protein: 4, carbs: 4, fat: 9 };

/**
 * Donut showing the share of calories coming from each macro. Grams are
 * converted to calories first (4/4/9) so the segments reflect energy, not mass —
 * which is what "macro balance" actually means.
 */
export function MacroDonut({ protein, carbs, fat, size = 132, strokeWidth = 18 }: MacroDonutProps) {
  const theme = useTheme();

  const kcal = {
    protein: protein * CALORIES_PER_GRAM.protein,
    carbs: carbs * CALORIES_PER_GRAM.carbs,
    fat: fat * CALORIES_PER_GRAM.fat,
  };
  const total = kcal.protein + kcal.carbs + kcal.fat;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const segments =
    total > 0
      ? [
          { key: 'protein', color: MacroColors.protein, fraction: kcal.protein / total },
          { key: 'carbs', color: MacroColors.carbs, fraction: kcal.carbs / total },
          { key: 'fat', color: MacroColors.fat, fraction: kcal.fat / total },
        ]
      : [];

  const pct = (part: number) => (total > 0 ? Math.round((part / total) * 100) : 0);

  let offset = 0;

  const legend = [
    { label: 'Protein', grams: protein, color: MacroColors.protein, percent: pct(kcal.protein) },
    { label: 'Carbs', grams: carbs, color: MacroColors.carbs, percent: pct(kcal.carbs) },
    { label: 'Fat', grams: fat, color: MacroColors.fat, percent: pct(kcal.fat) },
  ];

  return (
    <View style={styles.container}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size} style={styles.svg}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={theme.track}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {segments.map((segment) => {
            const length = segment.fraction * circumference;
            const circle = (
              <Circle
                key={segment.key}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={segment.color}
                strokeWidth={strokeWidth}
                strokeLinecap="butt"
                strokeDasharray={`${length} ${circumference - length}`}
                strokeDashoffset={-offset}
                fill="none"
              />
            );
            offset += length;
            return circle;
          })}
        </Svg>
        <View style={styles.center}>
          <ThemedText style={styles.centerValue}>{Math.round(total).toLocaleString()}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            avg kcal
          </ThemedText>
        </View>
      </View>

      <View style={styles.legend}>
        {legend.map((row) => (
          <View key={row.label} style={styles.legendRow}>
            <View style={[styles.dot, { backgroundColor: row.color }]} />
            <ThemedText type="small" style={styles.legendLabel}>
              {row.label}
            </ThemedText>
            <ThemedText type="smallBold">{row.percent}%</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.legendGrams}>
              {row.grams}g
            </ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.four,
  },
  svg: {
    position: 'absolute',
    transform: [{ rotate: '-90deg' }],
  },
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerValue: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  legend: {
    flex: 1,
    gap: Spacing.two,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    flex: 1,
  },
  legendGrams: {
    minWidth: 40,
    textAlign: 'right',
  },
});
