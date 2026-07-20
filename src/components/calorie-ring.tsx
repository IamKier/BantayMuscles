import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type CalorieRingProps = {
  consumed: number;
  goal: number;
  /** Calories burned by activity, added to the day's allowance. */
  burned?: number;
  size?: number;
  strokeWidth?: number;
};

export function CalorieRing({
  consumed,
  goal: baseGoal,
  burned = 0,
  size = 200,
  strokeWidth = 16,
}: CalorieRingProps) {
  const theme = useTheme();

  // Activity earns calories back, the way every mainstream tracker works.
  const goal = baseGoal + burned;
  const remaining = goal - consumed;
  const over = remaining < 0;
  const target = goal > 0 ? Math.min(1, consumed / goal) : 0;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Animating the arc makes each logged food visibly move the ring, which reads
  // as feedback rather than the number silently changing.
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(target, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
  }, [target, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  return (
    <View
      style={[styles.container, { width: size, height: size }]}
      accessibilityRole="progressbar"
      accessibilityLabel={
        over
          ? `${Math.abs(remaining)} calories over your ${goal} calorie goal`
          : `${remaining} calories left of your ${goal} calorie goal`
      }>
      {/* Rotated so progress starts at 12 o'clock instead of 3 o'clock. */}
      <Svg width={size} height={size} style={styles.svg}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.track}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={over ? theme.danger : theme.accent}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          fill="none"
        />
      </Svg>

      <View style={styles.center}>
        <ThemedText style={styles.value} themeColor={over ? 'danger' : 'text'}>
          {Math.abs(remaining).toLocaleString()}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {over ? 'kcal over' : 'kcal left'}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.detail}>
          {consumed.toLocaleString()} of {goal.toLocaleString()}
        </ThemedText>
        {burned > 0 ? (
          <ThemedText type="small" style={{ color: theme.accent }}>
            {baseGoal.toLocaleString()} + {burned.toLocaleString()} burned
          </ThemedText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    position: 'absolute',
    transform: [{ rotate: '-90deg' }],
  },
  center: {
    alignItems: 'center',
  },
  value: {
    fontSize: 44,
    lineHeight: 50,
    fontWeight: '700',
  },
  detail: {
    marginTop: Spacing.one,
  },
});
