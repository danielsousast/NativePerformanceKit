# Changelog

## 0.1.0 (unreleased)

Initial version.

- Turbo Native Module (Codegen) with Android (Kotlin) and iOS (Swift) collectors.
- `startMonitoring`, `stopMonitoring`, `isMonitoring`, `getSnapshot` and `usePerformanceMonitor`.
- Memory: total PSS on Android, `phys_footprint` on iOS.
- FPS: observed display cadence over a 1 s window, `null` when unavailable.
- One shared native monitoring session; minimum sampling interval 100 ms, default 1000 ms.
- Known gaps: no physical-device validation and no overhead measurements yet.
