import { expect, it, jest } from '@jest/globals';
import type { NativeSnapshot } from '../NativePerformanceKit';
import type { PerformanceSnapshot } from '../types';
import { isMonitoring } from '../index';

const mockIsMonitoring = jest.fn<() => boolean>();

jest.mock('../NativePerformanceKit', () => ({
  __esModule: true,
  default: { isMonitoring: () => mockIsMonitoring() },
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
