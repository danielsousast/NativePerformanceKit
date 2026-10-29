# Architecture

_Updated: 2026-10-29_

## Overview

NativePerformanceKit is a React Native library (Turbo Native Module + Codegen) exposing process memory and FPS snapshots with a start/stop monitoring lifecycle. See `specs/spec.md` (WHAT) and `specs/plan.md` (HOW).

**Current reality:** the repo has no commits and no library code yet. Only a freshly generated Expo example app exists. Everything below marked `(planned)` is not built.

## Directory map

```
NativePerformanceKit/
├── specs/spec.md, specs/plan.md      requirements and phased plan
├── ARCHITECTURE.md, STATE.md         this file / progress tracker
├── .claude/skills/spec-driven/       workflow skill
└── packages/react-native-performance-kit/
    ├── example/                      Expo app (blank template, built)
    │   ├── App.js, index.js          placeholder screen, registerRootComponent
    │   ├── app.json, package.json    expo ~58.0.21, react-native 0.88.1, react 19.3.0
    │   └── AGENTS.md                 Expo guidance (use `npx expo install`, lint + tsc before done)
    ├── package.json, src/, android/, ios/   (planned) library from the generated template
```

## Components

Built:
- Example app: blank Expo template, JavaScript (`App.js`), no `ios/` or `android/` directories (Continuous Native Generation), no dependency on the library yet.

Planned (per spec section 7):
- TypeScript layer (planned): public API (`startMonitoring`, `stopMonitoring`, `isMonitoring`, `getSnapshot`), validation, error normalization, optional hook.
- TurboModule spec (planned): Codegen contract; nullable fps may need normalization in the wrapper.
- Android layer (planned): Kotlin, memory metric plus Choreographer FPS, one shared session.
- iOS layer (planned): Swift collectors, CADisplayLink FPS (Swift/TurboModule bridging approach to be decided in Phase 1/2).

## Data / control flow (planned)

JS API -> TurboModule -> single shared native session (memory sampler + frame observer) -> snapshot `{timestamp, memoryUsageBytes, fps|null}` returned to JS. Stop/invalidate releases timers and frame callbacks.

## Key decisions and constraints

- Use the generated library template's conventions; do not hand-invent registration code.
- One shared native monitoring session, no per-consumer collectors.
- No telemetry, no network, metrics stay local.
- Expo Go cannot load custom native code: the example needs a development build (`npx expo run:ios|android`).
- Open: the example is Expo (CNG, JS) while the spec assumes a template-generated library example; Phase 1 must settle how the library is generated and linked into it.
- Open: spec requires documenting tested RN/OS versions.

## Build / test commands

Example app (from `packages/react-native-performance-kit/example`):
- `npx expo start`, `npx expo run:ios`, `npx expo run:android`
- `npx expo lint`, `npx tsc --noEmit` (no TS config yet), `npx expo-doctor`

Library build/test commands: (planned), defined in Phase 1.
