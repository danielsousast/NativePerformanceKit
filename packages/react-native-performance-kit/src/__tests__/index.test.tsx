import { expect, it, jest } from '@jest/globals';
import type { NativeSnapshot } from '../NativePerformanceKit';
import type { PerformanceSnapshot } from '../types';
import {
  getSnapshot,
  isMonitoring,
  startMonitoring,
  stopMonitoring,
} from '../index';

const mockIsMonitoring = jest.fn<() => boolean>();
const mockStart = jest.fn<(intervalMs: number) => Promise<void>>();
const mockStop = jest.fn<() => Promise<void>>();
const mockGetSnapshot = jest.fn<() => Promise<NativeSnapshot>>();

jest.mock('../NativePerformanceKit', () => ({
  __esModule: true,
  default: {
    startMonitoring: (intervalMs: number) => mockStart(intervalMs),
    stopMonitoring: () => mockStop(),
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

it('starts monitoring with the 1000 ms default or the given interval', async () => {
  mockStart.mockResolvedValue(undefined);
  await startMonitoring();
  expect(mockStart).toHaveBeenLastCalledWith(1000);
  await startMonitoring({ intervalMs: 250 });
  expect(mockStart).toHaveBeenLastCalledWith(250);
});

it('propagates a native interval rejection', async () => {
  mockStart.mockRejectedValue(new Error('E_INVALID_INTERVAL'));
  await expect(startMonitoring({ intervalMs: 1 })).rejects.toThrow(
    'E_INVALID_INTERVAL'
  );
});

it('stops monitoring through the native module', async () => {
  mockStop.mockResolvedValue(undefined);
  await expect(stopMonitoring()).resolves.toBeUndefined();
  expect(mockStop).toHaveBeenCalledTimes(1);
});
