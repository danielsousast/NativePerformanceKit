import PerformanceKit from './NativePerformanceKit';

export function multiply(a: number, b: number): number {
  return PerformanceKit.multiply(a, b);
}
