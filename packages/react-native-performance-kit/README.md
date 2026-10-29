# react-native-performance-kit

Native process memory and FPS snapshots for React Native

## Installation


```sh
npm install react-native-performance-kit
```


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

The hook starts monitoring while mounted and enabled, polls the latest snapshot once per
interval, and stops monitoring when the last enabled hook unmounts. The native session is shared:
with several hooks (or manual calls) the most recent interval wins. When `enabled` turns false the
last snapshot is kept.

### Metrics

- `memoryUsageBytes`: total PSS on Android, `phys_footprint` on iOS. Not interchangeable with each
  other, RSS or heap.
- `fps`: observed display cadence over a 1 s window, or `null`. An idle app reads about the refresh
  rate; it does not prove React Native rendered every frame.


## Contributing

- [Development workflow](../../CONTRIBUTING.md#development-workflow)
- [Sending a pull request](../../CONTRIBUTING.md#sending-a-pull-request)
- [Code of conduct](../../CODE_OF_CONDUCT.md)

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
