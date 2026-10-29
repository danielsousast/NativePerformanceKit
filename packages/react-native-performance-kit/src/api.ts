import PerformanceKit from './NativePerformanceKit';
import { PerformanceKitError, normalizeError } from './errors';

import type { MonitorOptions, PerformanceSnapshot } from './types';

export const DEFAULT_INTERVAL_MS = 1000;
export const MIN_INTERVAL_MS = 100;

/**
 * Starts the single shared native monitoring session, sampling every `intervalMs` (default 1000,
 * minimum 100). A non-finite or lower value rejects with `E_INVALID_INTERVAL` and leaves a running
 * session untouched. Calling it while monitoring keeps one session and only replaces the interval.
 * While monitoring, `getSnapshot()` returns the latest sample.
 */
export async function startMonitoring(
  options: MonitorOptions = {}
): Promise<void> {
  const intervalMs = options.intervalMs ?? DEFAULT_INTERVAL_MS;
  if (
    typeof intervalMs !== 'number' ||
    !Number.isFinite(intervalMs) ||
    intervalMs < MIN_INTERVAL_MS
  ) {
    throw new PerformanceKitError(
      'E_INVALID_INTERVAL',
      `intervalMs must be a finite number >= ${MIN_INTERVAL_MS}, got ${String(intervalMs)}`
    );
  }
  try {
    await PerformanceKit.startMonitoring(intervalMs);
  } catch (error) {
    throw normalizeError(error);
  }
}

/** Stops monitoring and releases native timers and frame callbacks. Safe when not monitoring. */
export async function stopMonitoring(): Promise<void> {
  try {
    await PerformanceKit.stopMonitoring();
  } catch (error) {
    throw normalizeError(error);
  }
}

export function isMonitoring(): boolean {
  try {
    return PerformanceKit.isMonitoring();
  } catch (error) {
    throw normalizeError(error);
  }
}

/**
 * Reads one snapshot. `memoryUsageBytes` is PSS on Android and `phys_footprint` on iOS (not
 * interchangeable). `fps` is the observed display cadence over a 1 s window, or null when it
 * cannot be measured (for example when not monitoring). Rejects with `E_MEMORY_UNAVAILABLE` when
 * the platform cannot measure memory.
 */
export async function getSnapshot(): Promise<PerformanceSnapshot> {
  try {
    const { timestamp, memoryUsageBytes, fps } =
      await PerformanceKit.getSnapshot();
    return {
      timestamp,
      memoryUsageBytes,
      fps: typeof fps === 'number' && Number.isFinite(fps) ? fps : null,
    };
  } catch (error) {
    throw normalizeError(error);
  }
}
