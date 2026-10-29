import PerformanceKit from './NativePerformanceKit';

import type { PerformanceSnapshot } from './types';

export type { MonitorOptions, PerformanceSnapshot } from './types';

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
