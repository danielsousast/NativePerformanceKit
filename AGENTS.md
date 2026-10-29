# AGENTS.md

NativePerformanceKit: React Native library (Turbo Native Module + Codegen) exposing process memory and FPS snapshots on Android (Kotlin) and iOS (Swift), with a TypeScript public API.

## Source of truth

- `specs/spec.md`: requirements and acceptance criteria (WHAT). Never edit acceptance criteria to make work pass; record the issue in `STATE.md` instead.
- `specs/plan.md`: phased `- [ ]` tasks (HOW).
- `ARCHITECTURE.md`: structure as the code really is; `(planned)` marks unbuilt parts.
- `STATE.md`: current progress, blockers, decisions. Read it first.

Workflow: `/spec-driven init` and `/spec-driven implement [phase or task]` (see `.claude/skills/spec-driven`). Do not tick a task without passing independent validation. Do not commit unless asked.

## Layout

- `packages/react-native-performance-kit/`: the library (planned) and `example/`, an Expo app (expo ~58, react-native 0.88.1, react 19.3.0).
- `specs/`: spec and plan.

## Rules

- Keep the project compiling after every task; validate Android and iOS independently.
- Use the generated library template's conventions for TurboModule/Codegen registration; do not hand-write registration code.
- Keep JS types and the Codegen spec consistent. Normalize nullable metrics (`fps: number | null`) in the TypeScript wrapper if Codegen cannot express them.
- One shared native monitoring session; no per-consumer collectors. Repeated start/stop must be safe. Release timers, frame callbacks and other native resources on stop and module invalidation.
- Never fabricate a metric: return null or an explicit unavailable result. Document the exact memory metric per platform (RSS, PSS and heap are not interchangeable).
- No telemetry, network calls or personal data. Metrics stay local.
- Keep history and queues bounded; avoid expensive work on the UI thread.
- Add tests with every feature. Do not make performance claims before measuring overhead.
- Public documentation (README, etc.) is written in English.

## Example app (`packages/react-native-performance-kit/example`)

Expo guidance applies; see its `AGENTS.md`. Key points:
- Expo changes between SDKs: check docs at `https://docs.expo.dev/versions/v58.0.0/` before touching Expo/RN APIs.
- Install with `npx expo install <package>`, not npm/yarn.
- Without `ios/` and `android/` directories, native config goes in `app.json` and config plugins (Continuous Native Generation); do not hand-edit generated native dirs.
- Expo Go cannot load the custom native module: use a development build (`npx expo run:ios|android`).
- Run `npx expo lint` and `npx tsc --noEmit` before declaring a task done.

## Commands

Example app, from `packages/react-native-performance-kit/example`:
- `npx expo start`, `npx expo run:ios`, `npx expo run:android`
- `npx expo lint`, `npx tsc --noEmit`, `npx expo-doctor`

Library build/test commands: to be defined in Phase 1 and recorded in `ARCHITECTURE.md`.
