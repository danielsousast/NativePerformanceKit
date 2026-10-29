# State

_Updated: 2026-10-29_

## Current
- Phase: 3 — Memory Collector
- In progress: none
- Next: Define the memory metric used on Android.

## Done
- spec-driven init — 2026-10-29
- Phase 1 — Project Foundation (all 7 tasks) — validated 2026-10-29; baseline commit 5072f87

- Phase 2 — TurboModule Contract (all 7 tasks) — validated 2026-10-29

## Last validation
- Task: Phase 2 — TurboModule Contract
- Verdict: PASS (7/7 checks, independent subagent)
- Evidence: root `yarn typecheck|lint|test|prepare` exit 0 (1 test); example `npx tsc --noEmit`, `npx expo lint` exit 0; Android `assembleDebug` BUILD SUCCESSFUL, Kotlin overrides match generated spec; iOS xcodebuild iphonesimulator BUILD SUCCEEDED, selectors match generated protocol. Author runtime check: example showed "Monitoring: false" from the native call on iPhone 17 Pro simulator and Android API 37 emulator.

## Blockers / open questions
- `.nvmrc` (template) pins Node v24.22.1; environment verified with v24.21.0.
- Library `package.json` author URL and repository URL are placeholders (`https://github.com/`, `github.com/example/react-native-performance-kit`); README links point to the repo-root CONTRIBUTING/CODE_OF_CONDUCT via relative paths, which break on npm until the real repo URL is set.
- Template CI (`packages/react-native-performance-kit/.github`, `turbo.json`) uses library-relative `example/` paths and is inactive at that location: Phase 8.

- A Metro dev server (`expo start`, port 8081) started for the runtime check may still be running; the `pkill` was denied. Stop it manually if needed.

## Decisions
- 2026-10-29: Existing spec.md and plan.md kept unchanged.
- 2026-10-29: Library generated with create-react-native-library@0.64.0 (`turbo-module`, `kotlin-objc`, expo example, eslint, jest). `kotlin-swift` is only offered for Nitro; Swift collectors, if used, will be called from the ObjC++ module.
- 2026-10-29: Per user, example app lives at repo root (`example/`), library under `packages/`; root is a Yarn 4 workspace (`packages/*`, `example`) with forwarding scripts. Example tsconfig/babel/autolinking point at `../packages/react-native-performance-kit`.
- 2026-10-29: Added `@types/react`, `typescript`, `eslint`, `eslint-config-expo` to the example (via `npx expo install` / `npx expo lint`) so the example's tsc and lint run standalone.
- 2026-10-29: Native contract is the full four-method API; start/stop/getSnapshot are honest rejecting stubs (no fabricated metrics). `startMonitoring` takes a plain `intervalMs: number`; the TS wrapper applies the 1000 ms default. The web fallback (`multiply.tsx`) was dropped (Android/iOS only).
