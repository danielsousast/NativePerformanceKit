import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import type { NativeSnapshot } from '../NativePerformanceKit';
import {
  usePerformanceMonitor,
  type PerformanceMonitorState,
  type UsePerformanceMonitorOptions,
} from '../index';

const mockStart = jest.fn<(intervalMs: number) => Promise<void>>();
const mockStop = jest.fn<() => Promise<void>>();
const mockGetSnapshot = jest.fn<() => Promise<NativeSnapshot>>();

jest.mock('../NativePerformanceKit', () => ({
  __esModule: true,
  default: {
    startMonitoring: (intervalMs: number) => mockStart(intervalMs),
    stopMonitoring: () => mockStop(),
    isMonitoring: () => false,
    getSnapshot: () => mockGetSnapshot(),
  },
}));

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const snapshot: NativeSnapshot = {
  timestamp: 1,
  memoryUsageBytes: 2048,
  fps: 60,
};

let latest: PerformanceMonitorState;
let mounted: ReactTestRenderer[] = [];

function Probe(props: UsePerformanceMonitorOptions) {
  latest = usePerformanceMonitor(props);
  return null;
}

async function mount(props: UsePerformanceMonitorOptions = {}) {
  let renderer!: ReactTestRenderer;
  await act(async () => {
    renderer = create(<Probe {...props} />);
  });
  mounted.push(renderer);
  return renderer;
}

async function unmount(renderer: ReactTestRenderer) {
  await act(async () => {
    renderer.unmount();
  });
}

beforeEach(() => {
  jest.useFakeTimers();
  mockStart.mockReset().mockResolvedValue(undefined);
  mockStop.mockReset().mockResolvedValue(undefined);
  mockGetSnapshot.mockReset().mockResolvedValue(snapshot);
});

afterEach(async () => {
  for (const renderer of mounted) {
    await unmount(renderer);
  }
  mounted = [];
  jest.useRealTimers();
});

it('does nothing while disabled', async () => {
  await mount({ enabled: false });
  expect(mockStart).not.toHaveBeenCalled();
  expect(mockGetSnapshot).not.toHaveBeenCalled();
  expect(latest).toEqual({ snapshot: null, error: null });
});

it('starts, publishes snapshots on each interval, and stops on unmount', async () => {
  const renderer = await mount({ intervalMs: 500 });
  expect(mockStart).toHaveBeenCalledWith(500);
  expect(latest.snapshot).toEqual(snapshot);

  mockGetSnapshot.mockResolvedValue({ ...snapshot, timestamp: 2 });
  await act(async () => {
    jest.advanceTimersByTime(500);
  });
  expect(latest.snapshot?.timestamp).toBe(2);

  await unmount(renderer);
  mounted = [];
  expect(mockStop).toHaveBeenCalledTimes(1);
  mockGetSnapshot.mockClear();
  await act(async () => {
    jest.advanceTimersByTime(5000);
  });
  expect(mockGetSnapshot).not.toHaveBeenCalled();
});

it('surfaces a normalized start error and does not poll', async () => {
  mockStart.mockRejectedValue(new Error('nope'));
  await mount({ intervalMs: 500 });
  expect(latest.error).toMatchObject({ code: 'E_UNKNOWN', message: 'nope' });
  expect(mockGetSnapshot).not.toHaveBeenCalled();
});

it('keeps the last snapshot on a read failure and clears the error on recovery', async () => {
  await mount({ intervalMs: 500 });
  mockGetSnapshot.mockRejectedValueOnce(
    Object.assign(new Error('x'), { code: 'E_MEMORY_UNAVAILABLE' })
  );
  await act(async () => {
    jest.advanceTimersByTime(500);
  });
  expect(latest.snapshot).toEqual(snapshot);
  expect(latest.error?.code).toBe('E_MEMORY_UNAVAILABLE');
  await act(async () => {
    jest.advanceTimersByTime(500);
  });
  expect(latest.error).toBeNull();
});

it('stops the shared session only when the last hook unmounts', async () => {
  const a = await mount();
  const b = await mount();
  await unmount(a);
  expect(mockStop).not.toHaveBeenCalled();
  await unmount(b);
  mounted = [];
  expect(mockStop).toHaveBeenCalledTimes(1);
});

it('does not publish state when unmounted before start resolves', async () => {
  let resolveStart!: () => void;
  mockStart.mockReturnValue(
    new Promise<void>((resolve) => {
      resolveStart = resolve;
    })
  );
  const renderer = await mount();
  await unmount(renderer);
  mounted = [];
  await act(async () => {
    resolveStart();
  });
  expect(mockGetSnapshot).not.toHaveBeenCalled();
  expect(latest.snapshot).toBeNull();
});
