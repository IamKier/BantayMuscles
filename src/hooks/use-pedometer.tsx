import { Pedometer } from 'expo-sensors';
import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { useTracker } from '@/hooks/use-tracker';
import { toDateKey } from '@/lib/nutrition';

export type PedometerStatus = 'checking' | 'active' | 'denied' | 'unavailable';

/**
 * Counts steps from the phone's hardware pedometer.
 *
 * Android limitation, straight from the Expo docs: step updates are NOT
 * delivered while the app is backgrounded, and `getStepCountAsync` (historical
 * data) is iOS-only. So this can only count steps taken with FitTracker open.
 * That's why the steps card also accepts a manual figure — copy the day's total
 * from your phone's built-in health app and the estimate stays honest.
 */
export function usePedometer(): PedometerStatus {
  const { addSteps } = useTracker();
  const [status, setStatus] = useState<PedometerStatus>('checking');

  // The sensor reports a running total since subscription, not a delta, so we
  // track the last value we saw and bank only the difference.
  const lastTotal = useRef(0);

  useEffect(() => {
    let subscription: { remove: () => void } | null = null;
    let cancelled = false;

    async function subscribe() {
      const available = await Pedometer.isAvailableAsync().catch(() => false);
      if (cancelled) return;
      if (!available) {
        setStatus('unavailable');
        return;
      }

      const { granted } = await Pedometer.requestPermissionsAsync().catch(() => ({
        granted: false,
      }));
      if (cancelled) return;
      if (!granted) {
        setStatus('denied');
        return;
      }

      lastTotal.current = 0;
      subscription = Pedometer.watchStepCount((result) => {
        const delta = result.steps - lastTotal.current;
        lastTotal.current = result.steps;
        // Always bank against today — a walk can't retroactively belong to the
        // day the user happens to be viewing.
        addSteps(toDateKey(new Date()), delta);
      });
      setStatus('active');
    }

    void subscribe();

    // Re-subscribing on foreground resets the sensor baseline; without this the
    // first reading after a background stint would be counted as one huge delta.
    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        subscription?.remove();
        subscription = null;
        void subscribe();
      } else {
        subscription?.remove();
        subscription = null;
      }
    });

    return () => {
      cancelled = true;
      subscription?.remove();
      appStateSub.remove();
    };
  }, [addSteps]);

  return status;
}
