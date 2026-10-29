import PerformanceKit from './NativePerformanceKit';

import type { MonitorOptions, PerformanceSnapshot } from './types';

export type { MonitorOptions, PerformanceSnapshot } from './types';

const DEFAULT_INTERVAL_MS = 1000;

/**
 * Starts the single shared native monitoring session, sampling every `intervalMs` (default 1000,
 * native minimum 100; a lower or non-finite value rejects with `E_INVALID_INTERVAL`). Calling it
 * while monitoring keeps one session and only replaces the interval. While monitoring,
 * `getSnapshot()` returns the latest sample.
 */
export function startMonitoring(options: MonitorOptions = {}): Promise<void> {
  return PerformanceKit.startMonitoring(
    options.intervalMs ?? DEFAULT_INTERVAL_MS
  );
}

/** Stops monitoring and releases native timers. Safe to call when not monitoring. */
export function stopMonitoring(): Promise<void> {
  return PerformanceKit.stopMonitoring();
}

export function isMonitoring(): boolean {
  return PerformanceKit.isMonitoring();
}

/**
 * Reads one snapshot. Memory is `memoryUsageBytes`: PSS on Android, `phys_footprint` on iOS (not
 * interchangeable). Rejects with `E_MEMORY_UNAVAILABLE` when the platform cannot measure it.
 * `fps` is always null until Phase 5.
 */
export function getSnapshot(): Promise<PerformanceSnapshot> {
  return PerformanceKit.getSnapshot();
}
