import { useEffect, useState } from 'react';

import {
  DEFAULT_INTERVAL_MS,
  getSnapshot,
  startMonitoring,
  stopMonitoring,
} from './api';
import { normalizeError, type PerformanceKitError } from './errors';

import type { MonitorOptions, PerformanceSnapshot } from './types';

export type UsePerformanceMonitorOptions = MonitorOptions & {
  /** When false the hook does nothing and monitoring is not started. Defaults to true. */
  enabled?: boolean;
};

export type PerformanceMonitorState = {
  /** Latest snapshot, or null before the first successful read. */
  snapshot: PerformanceSnapshot | null;
  /** Latest failure (start or read), cleared by the next successful read. */
  error: PerformanceKitError | null;
};

// The native session is shared, so it only stops when the last enabled hook unmounts.
let activeHooks = 0;

/**
 * Runs monitoring while the component is mounted and enabled, and polls the latest snapshot once
 * per interval. Hooks share one native session: the interval of the most recent start wins.
 */
export function usePerformanceMonitor({
  intervalMs,
  enabled = true,
}: UsePerformanceMonitorOptions = {}): PerformanceMonitorState {
  const [state, setState] = useState<PerformanceMonitorState>({
    snapshot: null,
    error: null,
  });

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }
    let active = true;
    let timer: ReturnType<typeof setInterval> | undefined;

    const fail = (error: unknown) => {
      if (active) {
        setState((prev) => ({ ...prev, error: normalizeError(error) }));
      }
    };
    const poll = () => {
      getSnapshot().then((snapshot) => {
        if (active) {
          setState({ snapshot, error: null });
        }
      }, fail);
    };

    activeHooks++;
    startMonitoring({ intervalMs }).then(() => {
      if (active) {
        poll();
        timer = setInterval(poll, intervalMs ?? DEFAULT_INTERVAL_MS);
      }
    }, fail);

    return () => {
      active = false;
      clearInterval(timer);
      if (--activeHooks === 0) {
        stopMonitoring().catch(() => {});
      }
    };
  }, [enabled, intervalMs]);

  return state;
}
