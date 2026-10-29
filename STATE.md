# State

_Updated: 2026-10-29_

## Current
- Phase: 4 — Monitoring Lifecycle
- In progress: none
- Next: Implement startMonitoring.

## Done
- spec-driven init — 2026-10-29
- Phase 1 — Project Foundation (all 7 tasks) — validated 2026-10-29; baseline commit 5072f87

- Phase 2 — TurboModule Contract (all 7 tasks) — validated 2026-10-29
- Phase 3 — Memory Collector (all 9 tasks) — validated 2026-10-29

## Last validation
- Task: Phase 3 — Memory Collector
- Verdict: PASS (independent subagent; its only FAIL, `yarn lint` scanning a generated Gradle report, fixed by ignoring `android/build/` in ESLint and re-run: exit 0)
- Evidence: `yarn typecheck|lint|test` exit 0 (3 Jest tests); Android `testDebugUnitTest` 5/5, `assembleDebug` OK; iOS `ios/Tests/run.sh` 4 XCTests 0 failures, `yarn build:ios` exit 0; example `tsc`/`expo lint` exit 0. Runtime (iPhone 17 Pro sim, Android emulator): example shows memory + `fps: null`. Comparison with platform tools: Android snapshot 160.1 MiB vs `dumpsys meminfo` TOTAL PSS 163.7 MiB (taken later); iOS 113.2 MiB vs `footprint` phys_footprint 124 MB (taken later, app had grown). Same order, differences explained by timing; no exact-match claim.

## Blockers / open questions
- `.nvmrc` (template) pins Node v24.22.1; environment verified with v24.21.0.
- Library `package.json` author URL and repository URL are placeholders (`https://github.com/`, `github.com/example/react-native-performance-kit`); README links point to the repo-root CONTRIBUTING/CODE_OF_CONDUCT via relative paths, which break on npm until the real repo URL is set.
- Template CI (`packages/react-native-performance-kit/.github`, `turbo.json`) uses library-relative `example/` paths and is inactive at that location: Phase 8.

- Android `getSnapshot` runs on the module thread; `Debug.getMemoryInfo` may take several ms. Re-check when periodic sampling lands (Phase 4).
- iOS XCTests run via `ios/Tests/run.sh` (macOS host, outside the pod); a real test target is left to Phase 8.
- A Metro dev server (`expo start`, port 8081) started for the runtime check may still be running; the `pkill` was denied. Stop it manually if needed.

## Decisions
- 2026-10-29: Existing spec.md and plan.md kept unchanged.
- 2026-10-29: Library generated with create-react-native-library@0.64.0 (`turbo-module`, `kotlin-objc`, expo example, eslint, jest). `kotlin-swift` is only offered for Nitro; Swift collectors, if used, will be called from the ObjC++ module.
- 2026-10-29: Per user, example app lives at repo root (`example/`), library under `packages/`; root is a Yarn 4 workspace (`packages/*`, `example`) with forwarding scripts. Example tsconfig/babel/autolinking point at `../packages/react-native-performance-kit`.
- 2026-10-29: Added `@types/react`, `typescript`, `eslint`, `eslint-config-expo` to the example (via `npx expo install` / `npx expo lint`) so the example's tsc and lint run standalone.
- 2026-10-29: Native contract is the full four-method API; start/stop/getSnapshot are honest rejecting stubs (no fabricated metrics). `startMonitoring` takes a plain `intervalMs: number`; the TS wrapper applies the 1000 ms default. The web fallback (`multiply.tsx`) was dropped (Android/iOS only).
- 2026-10-29: Android memory = total PSS (`Debug.MemoryInfo.totalPss`, KB x 1024); iOS memory = `phys_footprint` (`task_info` TASK_VM_INFO). Not interchangeable with each other, RSS or heap. Failures reject with `E_MEMORY_UNAVAILABLE`; `fps` stays null until Phase 5.
- 2026-10-29: iOS collector is Swift (`PKMemoryCollector`) called from the ObjC++ module via `PerformanceKit-Swift.h`; builds in the Expo example without extra Podfile changes.
- 2026-10-29: Added a thin `getSnapshot()` export to `src/index.tsx` (pass-through) so the example can exercise native; validation/normalization remains Phase 6.
