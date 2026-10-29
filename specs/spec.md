# NativePerformanceKit — Technical Specification

## 1. Overview

NativePerformanceKit is a native performance monitoring library for React Native applications on Android and iOS.

It provides a typed TypeScript API backed by native platform implementations, allowing developers to inspect process memory usage and frame-rate behavior with minimal instrumentation overhead.

## 2. Goals

- Provide a stable, typed public API.
- Use Turbo Native Modules and React Native Codegen.
- Implement platform-specific collectors using Kotlin and Swift.
- Expose memory and FPS measurements with explicit semantics.
- Support controlled monitoring sessions and configurable sampling.
- Minimize resource consumption and avoid duplicate collectors.
- Provide automated tests and a runnable example application.

## 3. Non-Goals

The initial release will not include:

- Remote telemetry or analytics ingestion.
- Crash reporting or crash symbolication.
- GPU profiling.
- Battery consumption attribution.
- Automatic production data uploads.
- Guaranteed background monitoring.
- Full React component render profiling.
- Exact equivalence between Android and iOS metrics.

## 4. Supported Platforms

- Android: Kotlin.
- iOS: Swift for platform-specific collectors and native integration.
- React Native: Turbo Native Modules with Codegen.
- TypeScript: public API and developer-facing types.

The initial release must document the React Native versions and operating-system versions actually tested.

## 5. Core Features

### 5.1 Memory Monitoring

Expose process memory usage in bytes.

The implementation must document the exact metric used by each platform. Resident memory, proportional set size (PSS), and managed heap size must not be treated as interchangeable.

If a measurement is unavailable, return an explicit unsupported or unavailable result rather than a fabricated value.

### 5.2 Frame-Rate Monitoring

Expose an estimated frame rate in frames per second.

- Android: use an appropriate frame callback mechanism, such as Choreographer.
- iOS: use CADisplayLink or another suitable platform API.
- Calculate FPS over a defined measurement window.
- Handle invalid or unavailable samples.
- Stop callbacks and release resources when monitoring ends.

The metric represents observed frame cadence, not a guarantee that every React Native frame was rendered successfully.

### 5.3 Monitoring Lifecycle

The SDK must support:

- Starting monitoring.
- Stopping monitoring.
- Checking monitoring status.
- Reading a snapshot.
- Configuring the sampling interval.
- Handling repeated start and stop calls safely.

The initial implementation should have one shared native monitoring session rather than creating a collector for every consumer.

### 5.4 Snapshot Model

A snapshot contains:

- timestamp: Unix epoch in milliseconds.
- memoryUsageBytes: documented process-memory measurement.
- fps: estimated frames per second, or null when unavailable.

The implementation must keep JavaScript types and native Codegen specifications consistent.

## 6. Public API

Proposed TypeScript API:

    type MonitorOptions = {
      intervalMs?: number;
    };

    type PerformanceSnapshot = {
      timestamp: number;
      memoryUsageBytes: number;
      fps: number | null;
    };

    startMonitoring(options?: MonitorOptions): Promise<void>;
    stopMonitoring(): Promise<void>;
    isMonitoring(): boolean;
    getSnapshot(): Promise<PerformanceSnapshot>;

The exact native specification must use types supported by the selected React Native Codegen version. If the native layer cannot represent an optional metric as nullable, adapt the schema and normalize the result in the TypeScript wrapper.

Default sampling interval: 1000 ms.

The library should reject invalid intervals and document any minimum supported interval.

## 7. Architecture

### TypeScript Layer

Responsibilities:
- Public API.
- Input validation.
- Typed snapshots.
- Error normalization.
- Optional React hook.

### TurboModule Layer

Responsibilities:
- Define the native contract.
- Register the module.
- Expose asynchronous operations where appropriate.
- Emit events if event-based sampling is introduced.

### Android Layer

Responsibilities:
- Collect process memory metrics.
- Collect frame callbacks.
- Manage sampling lifecycle.
- Release resources on stop and module invalidation.

### iOS Layer

Responsibilities:
- Collect process memory metrics.
- Observe display refresh callbacks.
- Manage sampling lifecycle.
- Invalidate timers and release resources.

### Example Application

Responsibilities:
- Display live measurements.
- Show a bounded sample history.
- Demonstrate memory pressure and frame drops.
- Provide start and stop controls.
- Show unavailable metrics and errors clearly.

## 8. Performance and Reliability Requirements

- Do not create unbounded timers or event queues.
- Keep sample history bounded.
- Avoid unnecessary bridge traffic.
- Ensure repeated start/stop calls are safe.
- Release native resources when monitoring stops.
- Handle native measurement failures.
- Avoid blocking the UI thread with expensive collection work.
- Measure instrumentation overhead before publishing performance claims.

## 9. Testing Requirements

### TypeScript
- API input validation.
- Default options.
- Error handling.
- Hook cleanup.
- Lifecycle behavior.

### Android
- Memory unit conversion.
- Snapshot construction.
- Collector lifecycle.
- Repeated start/stop.
- Resource cleanup.

### iOS
- Memory unit conversion.
- Snapshot construction.
- Display-link lifecycle.
- Measurement failures.
- Resource cleanup.

### Integration
- Android compilation.
- iOS compilation.
- Codegen and autolinking.
- Example application execution.
- Device-level validation.

## 10. Acceptance Criteria

The MVP is complete when:

1. The TurboModule builds on both platforms.
2. Codegen and autolinking work without manual post-install patches.
3. The TypeScript API returns valid snapshots.
4. Memory measurements use documented units and semantics.
5. FPS is reported when supported and null when unavailable.
6. Monitoring can be started and stopped repeatedly.
7. Native resources are released correctly.
8. Unit and integration tests pass.
9. The example application demonstrates live measurements.
10. README documentation describes limitations and verified compatibility.

## 11. Privacy

The SDK must not transmit telemetry, collect personal information, or upload measurements by default.

All metrics remain local to the application unless a consuming application explicitly implements its own export mechanism.

## 12. Future Enhancements

- Configurable metric selection.
- Frame-time percentiles.
- Dropped-frame counters.
- Memory warning events.
- Optional bounded in-memory history.
- MetricKit integration.
- Performance regression benchmarks.
- Optional integrations with external observability platforms.