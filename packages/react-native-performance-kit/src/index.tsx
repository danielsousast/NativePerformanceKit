import PerformanceKit from './NativePerformanceKit';

export type { MonitorOptions, PerformanceSnapshot } from './types';

export function isMonitoring(): boolean {
  return PerformanceKit.isMonitoring();
}
