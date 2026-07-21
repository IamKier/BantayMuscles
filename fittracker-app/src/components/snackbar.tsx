import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Height of the floating island tab bar above the safe-area inset. */
const TAB_BAR_HEIGHT = 80;

type SnackbarProps = {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss: () => void;
  /** Auto-dismiss delay. Long enough to actually read and react to. */
  duration?: number;
};

/**
 * Transient message with an optional action, floating above the tab bar.
 * Used to make destructive actions recoverable instead of asking to confirm
 * every single one.
 */
export function Snackbar({
  message,
  actionLabel,
  onAction,
  onDismiss,
  duration = 4000,
}: SnackbarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onDismiss]);

  return (
    <Animated.View
      entering={FadeInDown.duration(180)}
      exiting={FadeOutDown.duration(140)}
      style={[
        styles.container,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: theme.border,
          bottom: insets.bottom + TAB_BAR_HEIGHT + Spacing.two,
        },
      ]}>
      <ThemedText type="small" numberOfLines={2} style={styles.message}>
        {message}
      </ThemedText>

      {actionLabel && onAction ? (
        <Pressable
          onPress={() => {
            onAction();
            onDismiss();
          }}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          style={styles.action}
          android_ripple={{ color: theme.backgroundSelected }}>
          <ThemedText type="smallBold" style={{ color: theme.accent }}>
            {actionLabel}
          </ThemedText>
        </Pressable>
      ) : null}

      <Pressable
        onPress={onDismiss}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Dismiss">
        <Ionicons name="close" size={18} color={theme.textSecondary} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: Spacing.three,
    right: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    // Sits above the tab bar and any card content.
    elevation: 6,
  },
  message: {
    flex: 1,
  },
  action: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
});
