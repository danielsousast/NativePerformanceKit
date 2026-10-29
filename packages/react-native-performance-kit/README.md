# react-native-performance-kit

Native process memory and FPS snapshots for React Native, exposed through a Turbo Native Module
with a typed TypeScript API. Android is implemented in Kotlin, iOS in Swift (called from an
Objective-C++ module). All metrics stay in the app: the library makes no network calls and
collects no personal data.

> Status: version 0.1.0, not published to npm yet. Device-level validation and overhead
> measurements are still pending (see [Verified compatibility](#verified-compatibility) and
> [Performance](#performance)).

## Installation

```sh
npm install react-native-performance-kit
# or
yarn add react-native-performance-kit
```

The library contains native code and needs the New Architecture (Turbo Modules + Codegen).
Autolinking and Codegen register it; no manual edits to `MainApplication` or the Podfile are needed.

- Bare React Native: rebuild the app after installing (`pod install` on iOS).
- Expo: use a development build (`npx expo run:ios|android` or EAS Build). Expo Go cannot load
  custom native code.

### Supported versions

| | Requirement |
|---|---|
| React Native | Developed and tested against 0.88.1 (`react`/`react-native` are `*` peer dependencies; other versions are untested) |
| React | 19.3.0 tested |
| Android | `minSdkVersion` 24; default `compileSdkVersion` 36 (the host app's value overrides it) |
| iOS | The minimum iOS version of your React Native version (15.1 for 0.88) |
| Platforms | Android and iOS only; there is no web implementation |

## Usage

```ts
import {
  startMonitoring,
  stopMonitoring,
  isMonitoring,
  getSnapshot,
  PerformanceKitError,
} from 'react-native-performance-kit';

try {
  await startMonitoring({ intervalMs: 500 }); // default 1000, minimum 100
  const { timestamp, memoryUsageBytes, fps } = await getSnapshot();
  // fps is null when it cannot be measured (for example when not monitoring)
} catch (e) {
  if (e instanceof PerformanceKitError) {
    console.warn(e.code, e.message); // E_INVALID_INTERVAL | E_MEMORY_UNAVAILABLE | E_UNKNOWN
  }
} finally {
  await stopMonitoring(); // safe when not monitoring
}
```

### React hook

```tsx
import { usePerformanceMonitor } from 'react-native-performance-kit';

function Overlay({ enabled }: { enabled: boolean }) {
  const { snapshot, error } = usePerformanceMonitor({ intervalMs: 1000, enabled });
  // snapshot: PerformanceSnapshot | null, error: PerformanceKitError | null
}
```

The hook starts monitoring while mounted and enabled, polls the latest snapshot once per interval,
and stops monitoring when the last enabled hook unmounts. When `enabled` turns false the last
snapshot is kept.

## API

| Function | Description |
|---|---|
| `startMonitoring(options?: { intervalMs?: number }): Promise<void>` | Starts the shared native session. Same interval while running: no-op. Different interval: replaces the sampler. Rejects `E_INVALID_INTERVAL` for a non-finite value or one below 100 ms, leaving a running session untouched. |
| `stopMonitoring(): Promise<void>` | Stops sampling and releases timers and frame callbacks. Safe to call when stopped. |
| `isMonitoring(): boolean` | Whether the session is running. |
| `getSnapshot(): Promise<PerformanceSnapshot>` | While monitoring, the latest sample; otherwise a fresh memory read with `fps: null`. |
| `usePerformanceMonitor(options?)` | Hook returning `{ snapshot, error }`; `options` is `{ intervalMs?, enabled? }`. |

```ts
type PerformanceSnapshot = {
  timestamp: number; // Unix epoch, milliseconds
  memoryUsageBytes: number;
  fps: number | null;
};
```

Errors are always `PerformanceKitError` with a `code`: `E_INVALID_INTERVAL`,
`E_MEMORY_UNAVAILABLE` or `E_UNKNOWN`.

There is one native session per app. With several hooks or manual calls, the most recently started
interval wins, and the session stops only when the last enabled hook unmounts or `stopMonitoring()`
is called. The module also stops the session when it is invalidated (for example on reload).

## Metrics and limitations

### Memory (`memoryUsageBytes`)

| Platform | Metric | Source |
|---|---|---|
| Android | Total PSS (proportional set size) of the process, in bytes | `Debug.MemoryInfo.totalPss` (KB x 1024) |
| iOS | Physical footprint, in bytes | `phys_footprint` from `task_info` (`TASK_VM_INFO`) |

- The two values are not comparable across platforms, and neither is RSS or JS/native heap size.
  Compare readings only on the same platform and device.
- If a read fails or returns a non-positive value, the call rejects `E_MEMORY_UNAVAILABLE`; no
  value is invented. A failed sample while monitoring does not stop the session.
- On Android, `getMemoryInfo` is not free; the library calls it on a background sampler thread
  while monitoring.

### FPS (`fps`)

- Observed display frame cadence over a 1 second sliding window: `(frames - 1) / span`, using
  Choreographer on Android and `CADisplayLink` on iOS.
- It is not a guarantee that React Native rendered each frame. An idle app reads about the display
  refresh rate (60, 90, 120 Hz...).
- `null` when unavailable: not monitoring, fewer than 2 frames, the window is not yet filled
  (span under 0.5 s, including right after start or an interval change), or no frame in the last
  second (app in the background, or main thread blocked).
- While monitoring, the frame observer keeps the display ticking, which costs some power.
- Per-frame JS or UI thread work is not attributed: use a profiler for that.

### Other limits

- Sampling is best-effort and not guaranteed in the background.
- Minimum interval is 100 ms (enforced in TypeScript and natively); history is not kept by the
  library, only the latest sample. Keep your own bounded history if you need one.
- Not included: telemetry, crash reporting, GPU or battery metrics, render profiling.

## Verified compatibility

Last verified 2026-10-29.

- Toolchain: React Native 0.88.1, Expo SDK 58 (example), React 19.3.0, TypeScript 6.0, Node 24,
  Yarn 4.18.1, JDK 17, Xcode 26.6.
- Automated: Jest (TypeScript), Android JUnit and iOS XCTest unit tests, package install into a
  clean project, and Android/iOS example builds configured in CI (`.github/workflows/ci.yml`; not yet run on GitHub).
- Runtime: the iOS registration was exercised in the iOS simulator. Validation on physical Android
  and iOS devices is **not done yet**, and no Android/iOS OS versions beyond the build
  minimums are claimed.

## Performance

The overhead of the sampler and frame observer has not been measured yet, so no performance
claims are made. Benchmarks are planned (see `specs/plan.md`, Phase 9).

## Architecture

See [ARCHITECTURE.md](../../ARCHITECTURE.md) for the layers (TypeScript wrapper, Turbo Module,
shared native session, collectors) and design decisions.

## Contributing

- [Development workflow](../../CONTRIBUTING.md#development-workflow)
- [Sending a pull request](../../CONTRIBUTING.md#sending-a-pull-request)
- [Code of conduct](../../CODE_OF_CONDUCT.md)

## License

MIT, see [LICENSE](./LICENSE). Changes are listed in [CHANGELOG.md](./CHANGELOG.md).

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
