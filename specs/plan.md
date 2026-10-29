# NativePerformanceKit — Implementation Plan

## Development Principles

- Build incrementally and keep the project compiling.
- Follow the generated TurboModule template instead of manually inventing registration code.
- Validate Android and iOS independently.
- Define metric semantics before implementing collectors.
- Do not merge a feature without tests.
- Measure instrumentation overhead before making performance claims.

## Phase 1 — Project Foundation

### Tasks

- [x] Inspect the generated library template.
- [x] Confirm the React Native and Codegen versions.
- [x] Confirm Android and iOS support.
- [x] Identify the generated native base classes and registration mechanisms.
- [x] Build the untouched example application.
- [x] Run the existing test suite.
- [x] Document the development environment.

### Deliverables

- A reproducible development environment.
- A working example application.
- A baseline commit with successful builds.

### Exit Criteria

The original generated library compiles before custom implementation begins.

## Phase 2 — TurboModule Contract

### Tasks

- [ ] Define the native specification.
- [ ] Define snapshot and configuration types.
- [ ] Configure Codegen using the template's existing conventions.
- [ ] Implement the smallest possible native method.
- [ ] Verify Android registration.
- [ ] Verify iOS registration.
- [ ] Verify TypeScript-to-native communication.

### Deliverables

- Working TurboModule.
- Generated native interfaces.
- Documented public API.

### Exit Criteria

The example application can invoke a native method on both platforms.

## Phase 3 — Memory Collector

### Tasks

- [ ] Define the memory metric used on Android.
- [ ] Define the memory metric used on iOS.
- [ ] Implement the Android collector in Kotlin.
- [ ] Implement the iOS collector in Swift.
- [ ] Normalize values to bytes.
- [ ] Add timestamps.
- [ ] Handle measurement failures.
- [ ] Expose a snapshot through the TurboModule.
- [ ] Compare results against platform profiling tools.

### Deliverables

- Working memory snapshots.
- Platform-specific metric documentation.
- Unit tests for conversion and error handling.

### Exit Criteria

Memory measurements work on both platforms and their semantics are documented.

## Phase 4 — Monitoring Lifecycle

### Tasks

- [ ] Implement startMonitoring.
- [ ] Implement stopMonitoring.
- [ ] Implement isMonitoring.
- [ ] Validate sampling intervals.
- [ ] Prevent duplicate collectors.
- [ ] Handle repeated start and stop calls.
- [ ] Release resources on module invalidation.
- [ ] Test cleanup after errors.

### Deliverables

- Stable monitoring lifecycle.
- Lifecycle tests.
- Defined behavior for repeated operations.

### Exit Criteria

Monitoring can start and stop repeatedly without leaked timers or callbacks.

## Phase 5 — FPS Collection

### Tasks

- [ ] Implement Android frame observation using an appropriate native callback mechanism.
- [ ] Implement iOS frame observation using CADisplayLink.
- [ ] Define the FPS calculation window.
- [ ] Handle unavailable and invalid samples.
- [ ] Return null when FPS cannot be measured.
- [ ] Release frame observers on stop.
- [ ] Validate behavior during animations and idle periods.

### Deliverables

- FPS snapshots on supported platforms.
- Documented measurement limitations.
- Tests for calculation and lifecycle behavior.

### Exit Criteria

FPS is meaningful under the documented conditions and unavailable values are handled safely.

## Phase 6 — Public TypeScript API

### Tasks

- [ ] Implement the public API wrapper.
- [ ] Validate input configuration.
- [ ] Normalize errors.
- [ ] Export public types.
- [ ] Add a React hook if needed.
- [ ] Ensure hook cleanup is safe.
- [ ] Test disabled monitoring and unmount behavior.
- [ ] Document usage examples.

### Deliverables

- Developer-friendly TypeScript API.
- Unit tests.
- API documentation.

### Exit Criteria

A consumer can use the SDK without importing internal native specifications.

## Phase 7 — Example Application

### Tasks

- [ ] Build a monitoring dashboard.
- [ ] Display memory and FPS.
- [ ] Add start and stop controls.
- [ ] Show timestamps and errors.
- [ ] Maintain a bounded history.
- [ ] Add a controlled memory-pressure scenario.
- [ ] Add a controlled frame-drop scenario.
- [ ] Validate on physical devices.

### Deliverables

- Runnable example application.
- Screenshots or a demonstration video.
- Reproducible test scenarios.

### Exit Criteria

The example demonstrates normal operation and makes metric limitations visible.

## Phase 8 — Automated Testing and CI

### Tasks

- [ ] Add TypeScript tests.
- [ ] Add Android unit tests.
- [ ] Add iOS tests where supported by the template.
- [ ] Add integration checks.
- [ ] Configure lint and type checking.
- [ ] Configure Android CI.
- [ ] Configure iOS CI on macOS.
- [ ] Verify clean installation from the package.

### Deliverables

- Automated CI pipeline.
- Documented test commands.
- Build verification for both platforms.

### Exit Criteria

The supported checks pass on every pull request.

## Phase 9 — Performance Validation

### Tasks

- [ ] Measure baseline behavior with monitoring disabled.
- [ ] Measure behavior with memory collection enabled.
- [ ] Measure behavior with FPS collection enabled.
- [ ] Compare sample frequency with the requested interval.
- [ ] Measure memory and CPU overhead where reliable.
- [ ] Repeat experiments on physical devices.
- [ ] Document hardware and software versions.
- [ ] Investigate significant regressions.

### Deliverables

- Reproducible benchmark methodology.
- Recorded results.
- Documented trade-offs and limitations.

### Exit Criteria

The SDK's overhead is measured and transparently documented.

## Phase 10 — Documentation and Release

### Tasks

- [ ] Write the README in English.
- [ ] Document installation and supported versions.
- [ ] Document metrics and their limitations.
- [ ] Add architecture documentation.
- [ ] Add contributing instructions.
- [ ] Add license and changelog.
- [ ] Inspect the npm package contents.
- [ ] Test package installation in a clean example.
- [ ] Publish version 0.1.0 only after all acceptance criteria pass.

### Deliverables

- Complete repository documentation.
- Verified npm package.
- Initial release.

### Exit Criteria

Another developer can install, run, understand, and test the library using the documented instructions.

## Suggested Milestones

- M1: Working TurboModule.
- M2: Memory snapshots on Android and iOS.
- M3: Stable lifecycle and FPS collection.
- M4: Public API and demonstration app.
- M5: Automated tests and performance validation.
- M6: Documentation and release.

## Definition of Done

A feature is complete only when:

- Its implementation is present on every supported platform.
- Its API and metric semantics are documented.
- Relevant tests pass.
- Native resources are cleaned up correctly.
- The example application can demonstrate it.
- Compatibility limitations are documented.