# State

_Updated: 2026-10-29_

## Current
- Phase: 8 — Automated Testing and CI
- In progress: none
- Next: Phase 9 — Performance Validation (Phase 7 physical-device validation still open; needs hardware).

## Done
- spec-driven init — 2026-10-29
- Phase 1 — Project Foundation (all 7 tasks) — validated 2026-10-29; baseline commit 5072f87

- Phase 2 — TurboModule Contract (all 7 tasks) — validated 2026-10-29
- Phase 3 — Memory Collector (all 9 tasks) — validated 2026-10-29
- Phase 4 — Monitoring Lifecycle (all 8 tasks) — validated 2026-10-29
- Phase 5 — FPS Collection (all 7 tasks) — validated 2026-10-29
- Phase 6 — Public TypeScript API (all 8 tasks) — validated 2026-10-29
- Phase 10 — Documentation and Release (8 of 9 tasks; publish deferred) — validated 2026-10-29
- Phase 7 — Example Application (7 of 8 tasks; physical-device validation open) — validated 2026-10-29
- Phase 8 — Automated Testing and CI (all 8 tasks) — validated 2026-10-29

## Last validation
- Task: Phase 8 — tests, lint/typecheck, Android and iOS CI, clean package install
- Verdict: PASS (independent subagent)
- Evidence: `yarn lint`, `yarn typecheck`, `yarn test` (19 tests), `yarn test:android` (JUnit, rerun-tasks), `yarn test:ios` (27 XCTests), `yarn verify:package` all exit 0. Not run: GitHub Actions itself, `expo prebuild` on iOS, `build:ios`, fresh Android prebuild/`assembleDebug`, any simulator/device run. The workflow is validated by reasoning only; first real run is the first PR/push.

## Blockers / open questions
- Before publishing: replace placeholder author/repository/bugs/homepage URLs in the library package.json; README relative links to ARCHITECTURE/CONTRIBUTING break on npm until the real repo URL is set. README states device validation and overhead measurements are not done (Phases 7/9).
- Phase 7 "Validate on physical devices" and the screenshots/video deliverable need real hardware; unchecked in plan.md.
- `.nvmrc` (template) pins Node v24.22.1; environment verified with v24.21.0.
- Library `package.json` author URL and repository URL are placeholders (`https://github.com/`, `github.com/example/react-native-performance-kit`); README links point to the repo-root CONTRIBUTING/CODE_OF_CONDUCT via relative paths, which break on npm until the real repo URL is set.
- CI (`.github/workflows/ci.yml`) has never run on GitHub; `macos-latest` must provide Xcode 26 and `ubuntu-latest` `$ANDROID_HOME/cmdline-tools/latest`. No coverage threshold is enforced.
- Spec section 9 integration items "example application execution" and "device-level validation" are not automated (need a device/simulator). Real `CADisplayLink`/`Choreographer` wrappers are only tested through fake observers; no Android test for cleanup on module invalidation.

- Android `Debug.getMemoryInfo` now runs on the sampler thread while monitoring; a stopped `getSnapshot` still reads on the module thread.
- `start()` after module invalidation is not blocked (low risk); minimum interval 100 ms is enforced in both the TS wrapper and natively.
- iOS XCTests run via `ios/Tests/run.sh` (macOS host, outside the pod); kept as the iOS test mechanism (no Xcode test target).
- A Metro dev server (`expo start`, port 8081) started for the runtime check may still be running; the `pkill` was denied. Stop it manually if needed.

## Decisions
- 2026-10-29: Example is a single-screen app (`example/src/App.tsx`, `FrameLoad.tsx`, `scenarios.ts`) built on `usePerformanceMonitor`; history (30) and error log (30) are bounded in the app. Memory pressure = up to 10 x 16 MiB touched `Uint8Array`s; frame load = 1500 views re-rendered every 16 ms for 5 s (UI-thread load; JS-only blocking would not move the display-cadence FPS). Effect on the metric is unmeasured until device validation.
- 2026-10-29: FPS = observed display cadence over a 1 s sliding window, `(frames - 1) / span`; null when unmeasurable (see ARCHITECTURE). Frame observer lives in the shared session; an interval change restarts it (FPS null for ~0.5 s). Idle apps read about the refresh rate by design; README (Phase 10) must document this and the vsync power cost.
- 2026-10-29: Existing spec.md and plan.md kept unchanged.
- 2026-10-29: Library generated with create-react-native-library@0.64.0 (`turbo-module`, `kotlin-objc`, expo example, eslint, jest). `kotlin-swift` is only offered for Nitro; Swift collectors, if used, will be called from the ObjC++ module.
- 2026-10-29: Per user, example app lives at repo root (`example/`), library under `packages/`; root is a Yarn 4 workspace (`packages/*`, `example`) with forwarding scripts. Example tsconfig/babel/autolinking point at `../packages/react-native-performance-kit`.
- 2026-10-29: Added `@types/react`, `typescript`, `eslint`, `eslint-config-expo` to the example (via `npx expo install` / `npx expo lint`) so the example's tsc and lint run standalone.
- 2026-10-29: Native contract is the full four-method API; start/stop/getSnapshot are honest rejecting stubs (no fabricated metrics). `startMonitoring` takes a plain `intervalMs: number`; the TS wrapper applies the 1000 ms default. The web fallback (`multiply.tsx`) was dropped (Android/iOS only).
- 2026-10-29: Android memory = total PSS (`Debug.MemoryInfo.totalPss`, KB x 1024); iOS memory = `phys_footprint` (`task_info` TASK_VM_INFO). Not interchangeable with each other, RSS or heap. Failures reject with `E_MEMORY_UNAVAILABLE`; `fps` stays null until Phase 5.
- 2026-10-29: iOS collector is Swift (`PKMemoryCollector`) called from the ObjC++ module via `PerformanceKit-Swift.h`; builds in the Expo example without extra Podfile changes.
- 2026-10-29: Added a thin `getSnapshot()` export to `src/index.tsx` (pass-through) so the example can exercise native; validation/normalization remains Phase 6.
- 2026-10-29: Lifecycle semantics: start with same interval = no-op, different interval = replace the single ticker, invalid interval rejects `E_INVALID_INTERVAL` and leaves a running session alone, stop when stopped = no-op. While monitoring `getSnapshot` returns the latest sample; failed sample clears it. Added thin TS `startMonitoring`/`stopMonitoring` pass-throughs (default 1000 ms).
- 2026-10-29: TS layer split into `api.ts` (validation, normalization), `errors.ts` (`PerformanceKitError`, codes `E_INVALID_INTERVAL|E_MEMORY_UNAVAILABLE|E_UNKNOWN`), `usePerformanceMonitor.ts`. Hook ref-counts enabled hooks so the shared session stops only when the last unmounts; it polls `getSnapshot` per interval. Added dev deps `react-test-renderer@19.3.0` + types for hook tests (deprecated in React 19 but working).
- 2026-10-29: CI moved to the repo root and simplified: jobs lint, test, package, android (prebuild, JUnit via example Gradle, assembleDebug), ios (XCTests, prebuild, xcodebuild). Dropped turbo (`turbo.json`, devDependency) and the web build: Android/iOS only. Root `lint`/`typecheck` also cover the example. `scripts/verify-package.sh` packs, installs into an empty project, checks shipped files and typechecks a consumer; `android/src/test` and `ios/Tests` excluded from the npm package.
