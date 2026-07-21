import Ionicons from '@expo/vector-icons/Ionicons';
import { Component, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';

type Props = { children: ReactNode };
type State = { error: Error | null };

/**
 * Catches render/runtime errors anywhere below it so a single bad component
 * shows a recovery screen instead of a blank white app. Error boundaries have
 * to be class components — there is no hook equivalent.
 *
 * Uses the light palette directly rather than the theme hook, because the hook
 * relies on context that may be part of what failed.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const c = Colors.light;

    return (
      <ThemedView style={styles.screen}>
        <View style={styles.content}>
          <View style={[styles.icon, { backgroundColor: c.accentMuted }]}>
            <Ionicons name="alert-circle-outline" size={28} color={c.accent} />
          </View>
          <ThemedText style={styles.title}>Something went wrong</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.body}>
            The app hit an unexpected error. Your saved data is safe. Try again — if it keeps
            happening, reload the app.
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.detail}>
            {error.message}
          </ThemedText>

          <Pressable
            onPress={this.reset}
            style={[styles.button, { backgroundColor: c.accent }]}
            accessibilityRole="button"
            android_ripple={{ color: '#00000022' }}>
            <ThemedText style={styles.buttonText}>Try again</ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    );
  }
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    gap: Spacing.two,
  },
  icon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  body: {
    textAlign: 'center',
  },
  detail: {
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: Spacing.one,
  },
  button: {
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
    marginTop: Spacing.four,
    overflow: 'hidden',
  },
  buttonText: {
    color: '#04120A',
    fontSize: 16,
    fontWeight: '700',
  },
});
