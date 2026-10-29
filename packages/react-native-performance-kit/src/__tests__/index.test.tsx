import { expect, it, jest } from '@jest/globals';
import type { NativeSnapshot } from '../NativePerformanceKit';
import type { PerformanceSnapshot } from '../types';
import {
  PerformanceKitError,
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

it('returns the native snapshot, keeping a null fps', async () => {
  const snapshot = {
    timestamp: 1_700_000_000_123,
    memoryUsageBytes: 2048,
    fps: null,
  };
  mockGetSnapshot.mockResolvedValue(snapshot);
  await expect(getSnapshot()).resolves.toEqual(snapshot);
});

it('maps a non-finite native fps to null', async () => {
  mockGetSnapshot.mockResolvedValue({
    timestamp: 1,
    memoryUsageBytes: 1,
    fps: Number.NaN,
  });
  await expect(getSnapshot()).resolves.toMatchObject({ fps: null });
});

it('normalizes native errors to PerformanceKitError with a code', async () => {
  mockGetSnapshot.mockRejectedValue(
    Object.assign(new Error('no memory'), { code: 'E_MEMORY_UNAVAILABLE' })
  );
  const error = await getSnapshot().catch((e: unknown) => e);
  expect(error).toBeInstanceOf(PerformanceKitError);
  expect(error).toMatchObject({
    code: 'E_MEMORY_UNAVAILABLE',
    message: 'no memory',
  });

  mockGetSnapshot.mockRejectedValue(new Error('boom'));
  await expect(getSnapshot()).rejects.toMatchObject({
    name: 'PerformanceKitError',
    code: 'E_UNKNOWN',
    message: 'boom',
  });
});

it('starts monitoring with the 1000 ms default or the given interval', async () => {
  mockStart.mockResolvedValue(undefined);
  await startMonitoring();
  expect(mockStart).toHaveBeenLastCalledWith(1000);
  await startMonitoring({ intervalMs: 250 });
  expect(mockStart).toHaveBeenLastCalledWith(250);
});

it.each([99, 0, -5, Number.NaN, Number.POSITIVE_INFINITY])(
  'rejects interval %p without calling native',
  async (intervalMs) => {
    mockStart.mockClear();
    await expect(startMonitoring({ intervalMs })).rejects.toMatchObject({
      code: 'E_INVALID_INTERVAL',
    });
    expect(mockStart).not.toHaveBeenCalled();
  }
);

it('accepts the 100 ms minimum', async () => {
  mockStart.mockResolvedValue(undefined);
  await expect(startMonitoring({ intervalMs: 100 })).resolves.toBeUndefined();
});

it('normalizes a native interval rejection', async () => {
  mockStart.mockRejectedValue(
    Object.assign(new Error('bad'), { code: 'E_INVALID_INTERVAL' })
  );
  await expect(startMonitoring({ intervalMs: 500 })).rejects.toMatchObject({
    code: 'E_INVALID_INTERVAL',
  });
});

it('stops monitoring through the native module', async () => {
  mockStop.mockResolvedValue(undefined);
  await expect(stopMonitoring()).resolves.toBeUndefined();
  expect(mockStop).toHaveBeenCalledTimes(1);
});
