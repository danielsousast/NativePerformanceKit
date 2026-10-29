import { TurboModuleRegistry, type TurboModule } from 'react-native';

export type NativeSnapshot = {
  /** Unix epoch, milliseconds. */
  timestamp: number;
  /** Process memory in bytes; the exact metric is platform-specific. */
  memoryUsageBytes: number;
  /** Estimated frames per second, or null when unavailable. */
  fps: number | null;
};

export interface Spec extends TurboModule {
  startMonitoring(intervalMs: number): Promise<void>;
  stopMonitoring(): Promise<void>;
  isMonitoring(): boolean;
  getSnapshot(): Promise<NativeSnapshot>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('PerformanceKit');
