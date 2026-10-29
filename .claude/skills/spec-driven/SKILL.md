---
name: spec-driven
description: Spec-driven development workflow (specification → plan → implementation → independent validation) that maintains specs/spec.md, specs/plan.md, STATE.md and ARCHITECTURE.md. Use `/spec-driven init` to bootstrap the project and `/spec-driven implement [phase or task]` to build the next planned work.
argument-hint: init | implement [phase or task]
---

# Spec-driven development

Files (all at repo root unless noted):

| File | Owner | Purpose |
|---|---|---|
| `specs/spec.md` | human + `init` | WHAT: requirements, non-goals, acceptance criteria |
| `specs/plan.md` | human + `init` | HOW: phases, `- [ ]` tasks, exit criteria |
| `ARCHITECTURE.md` | `init`, updated by `implement` | Structure, layers, key decisions, as the code really is |
| `STATE.md` | every command | Current progress, last validation, next step, blockers |

Rules: never mark a task done without passing validation; never edit `spec.md` acceptance criteria to make work pass (raise it in STATE.md instead); keep the project compiling after every task.

Dispatch on the first word of `$ARGUMENTS`. If it is neither `init` nor `implement`, show these two usages and stop.

## `init`

1. Read what exists: `specs/spec.md`, `specs/plan.md`, `README`, package manifests, top-level source layout, `git log -10`. Reuse existing spec/plan; do not overwrite them.
2. If `specs/spec.md` is missing, ask the user for the goal, then write it: Goal, Requirements (numbered, testable), Non-goals, Acceptance criteria.
3. If `specs/plan.md` is missing, derive it from the spec: ordered phases, each with `- [ ]` tasks, deliverables and exit criteria. Tasks must be small enough for one implement run.
4. Write `ARCHITECTURE.md` from the real code (not aspiration): overview, directory map, main components and their responsibilities, data/control flow, key decisions and constraints, build/test commands. Mark parts that are planned but not yet built as `(planned)`.
5. Write `STATE.md` using the template below, with the first unchecked task of `plan.md` as Next.
6. Report the files created and the Next task. Stop; do not implement.

## `implement [phase or task]`

Target = the argument if given, else the first unchecked task in `specs/plan.md`.

1. **Load**: read `STATE.md`, `ARCHITECTURE.md`, the relevant part of `specs/spec.md` and `specs/plan.md`. If STATE.md lists blockers or a failed validation, address those first.
2. **Plan the task**: state in 3–6 lines the acceptance checks for the task (from spec + plan exit criteria) and the files you expect to touch. Set STATE.md `In progress` to this task.
3. **Implement** the task only. Follow existing patterns in `ARCHITECTURE.md`. Add the tests the plan/spec calls for. Run build/tests until they pass.
4. **Validate independently**: spawn a fresh subagent (Agent tool, `general-purpose`) — it must NOT receive your reasoning or a claim of success. Give it only: the task text, the relevant spec requirements and acceptance criteria, and the instruction to inspect `git diff`/untracked files itself, run the build and tests itself, and return a verdict per acceptance check: `PASS`/`FAIL` with evidence (command output or file:line), plus any spec requirement violated or out-of-scope change. It is read-only: it must not edit files.
5. **Resolve**: on any `FAIL`, fix and re-validate with a new subagent (max 3 rounds; then record the failure in STATE.md Blockers and stop). On all `PASS`:
   - tick the task in `specs/plan.md`;
   - update `ARCHITECTURE.md` if structure, components or decisions changed;
   - update `STATE.md`.
6. Stop after the task (or after the phase, if the target was a phase). Report: what was done, validation verdict, Next task. Do not commit unless asked.

## STATE.md template

```markdown
# State

_Updated: YYYY-MM-DD_

## Current
- Phase: <n — name>
- In progress: <task or "none">
- Next: <next unchecked task>

## Done
- <task> — validated YYYY-MM-DD

## Last validation
- Task: <task>
- Verdict: PASS | FAIL
- Evidence: <commands run, key results>

## Blockers / open questions
- <none>

## Decisions
- <date: decision and why>
```
