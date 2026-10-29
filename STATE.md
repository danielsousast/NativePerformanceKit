# State

_Updated: 2026-10-29_

## Current
- Phase: 2 — TurboModule Contract
- In progress: none
- Next: Define the native specification.

## Done
- spec-driven init — 2026-10-29
- Phase 1 — Project Foundation (all 7 tasks) — validated 2026-10-29; baseline commit 5072f87

## Last validation
- Task: Phase 1 — Project Foundation
- Verdict: PASS (10/10 checks, independent subagent)
- Evidence: root `yarn typecheck|lint|test|prepare` exit 0 (1 todo test); example `npx tsc --noEmit`, `npx expo lint` exit 0; `npx expo-doctor` 20/20; `yarn install --immutable` clean; Android `./gradlew assembleDebug` BUILD SUCCESSFUL (PerformanceKitModule compiled, PackageList autolinks PerformanceKitPackage); iOS `xcodebuild` iphonesimulator exit 0 (libPerformanceKit.a, PerformanceKitSpecJSI.h generated; Podfile.lock links PerformanceKit from ../../packages/react-native-performance-kit).

## Blockers / open questions
- `.nvmrc` (template) pins Node v24.22.1; environment verified with v24.21.0.
- Library `package.json` author URL and repository URL are placeholders (`https://github.com/`, `github.com/example/react-native-performance-kit`); README links point to the repo-root CONTRIBUTING/CODE_OF_CONDUCT via relative paths, which break on npm until the real repo URL is set.
- iOS runtime registration not yet exercised (`.mm` has no RCT_EXPORT_MODULE; generated RCTModuleProviders `moduleMapping` is empty). Verify in Phase 2 "Verify iOS registration"; example not yet launched on simulator/emulator.
- Template CI (`packages/react-native-performance-kit/.github`, `turbo.json`) uses library-relative `example/` paths and is inactive at that location: Phase 8.

## Decisions
- 2026-10-29: Existing spec.md and plan.md kept unchanged.
- 2026-10-29: Library generated with create-react-native-library@0.64.0 (`turbo-module`, `kotlin-objc`, expo example, eslint, jest). `kotlin-swift` is only offered for Nitro; Swift collectors, if used, will be called from the ObjC++ module.
- 2026-10-29: Per user, example app lives at repo root (`example/`), library under `packages/`; root is a Yarn 4 workspace (`packages/*`, `example`) with forwarding scripts. Example tsconfig/babel/autolinking point at `../packages/react-native-performance-kit`.
- 2026-10-29: Added `@types/react`, `typescript`, `eslint`, `eslint-config-expo` to the example (via `npx expo install` / `npx expo lint`) so the example's tsc and lint run standalone.
