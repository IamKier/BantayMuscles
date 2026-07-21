import { Pedometer } from 'expo-sensors';
import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { toDateKey } from '@/lib/nutrition';
import { addSteps } from '@/lib/store';

export type PedometerStatus = 'checking' | 'active' | 'denied' | 'unavailable';

/** How often accumulated steps are flushed to the store. */
const FLUSH_MS = 2000;

/**
 * Counts steps from the phone's hardware pedometer.
 *
 * Android limitation, straight from the Expo docs: step updates are NOT
 * delivered while the app is backgrounded, and `getStepCountAsync` (historical
 * data) is iOS-only. So this only counts steps taken with FitTracker open, which
 * is why the steps card also accepts a manual figure.
 *
 * Raw sensor updates can fire many times a second; writing each one to the store
 * would re-render and hit storage constantly. Deltas are accumulated in a ref
 * and flushed on an interval instead.
 */
export function usePedometer(): PedometerStatus {
  const [status, setStatus] = useState<PedometerStatus>('checking');

  // Running total the sensor last reported, and steps not yet flushed to the store.
  const lastTotal = useRef(0);
  const pending = useRef(0);

  useEffect(() => {
    let subscription: { remove: () => void } | null = null;
    let cancelled = false;

    function flush() {
      if (pending.current <= 0) return;
      addSteps(toDateKey(new Date()), pending.current);
      pending.current = 0;
    }

    const flushTimer = setInterval(flush, FLUSH_MS);

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
        // The sensor reports a running total since subscription, not a delta.
        const delta = result.steps - lastTotal.current;
        lastTotal.current = result.steps;
        if (delta > 0) pending.current += delta;
      });
      setStatus('active');
    }

    void subscribe();

    // Re-subscribing on foreground resets the sensor baseline; flush what we have
    // before tearing down so no steps are lost across a background stint.
    const appStateSub = AppState.addEventListener('change', (next) => {
      if (next === 'active') {
        subscription?.remove();
        subscription = null;
        void subscribe();
      } else {
        flush();
        subscription?.remove();
        subscription = null;
      }
    });

    return () => {
      cancelled = true;
      flush();
      clearInterval(flushTimer);
      subscription?.remove();
      appStateSub.remove();
    };
  }, []);

  return status;
}
