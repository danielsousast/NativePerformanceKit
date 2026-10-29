export type MonitorOptions = {
  /** Sampling interval in milliseconds. Defaults to 1000. */
  intervalMs?: number;
};

export type PerformanceSnapshot = {
  /** Unix epoch, milliseconds. */
  timestamp: number;
  /** Process memory in bytes; the exact metric is platform-specific. */
  memoryUsageBytes: number;
  /** Estimated frames per second, or null when unavailable. */
  fps: number | null;
};
