import { expect, it, jest } from '@jest/globals';
import type { NativeSnapshot } from '../NativePerformanceKit';
import type { PerformanceSnapshot } from '../types';
import { getSnapshot, isMonitoring } from '../index';

const mockIsMonitoring = jest.fn<() => boolean>();
const mockGetSnapshot = jest.fn<() => Promise<NativeSnapshot>>();

jest.mock('../NativePerformanceKit', () => ({
  __esModule: true,
  default: {
    isMonitoring: () => mockIsMonitoring(),
    getSnapshot: () => mockGetSnapshot(),
  },
}));

// Compile-time check: the native contract must be assignable to the public type.
export type NativeMatchesPublic = NativeSnapshot extends PerformanceSnapshot
  ? true
  : never;

it('delegates isMonitoring to the native module', () => {
  mockIsMonitoring.mockReturnValue(false);
  expect(isMonitoring()).toBe(false);
  mockIsMonitoring.mockReturnValue(true);
  expect(isMonitoring()).toBe(true);
});

it('returns the native snapshot unchanged, keeping a null fps', async () => {
  const snapshot = {
    timestamp: 1_700_000_000_123,
    memoryUsageBytes: 2048,
    fps: null,
  };
  mockGetSnapshot.mockResolvedValue(snapshot);
  await expect(getSnapshot()).resolves.toEqual(snapshot);
});

it('propagates native measurement failures', async () => {
  mockGetSnapshot.mockRejectedValue(new Error('E_MEMORY_UNAVAILABLE'));
  await expect(getSnapshot()).rejects.toThrow('E_MEMORY_UNAVAILABLE');
});
