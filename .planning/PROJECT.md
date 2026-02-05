# Project: AGI

## Goal

Build a real general-purpose agent (not a demo): core loop (perceive → recall → reason → plan → act → store), memory (semantic, episodic, working), reasoning, planning, and tool execution. Extensible toward broader capability.

## Approach

- **GSD**: Phases in `.planning/`; roadmap and state tracked.
- **B.L.A.S.T.**: Data schema and behavioral rules in `project/gemini.md`; architecture in `project/architecture.md`; process journal, findings, progress in `project/`.
- **WHEEE**: Compliance via `wheee audit`; source of truth index in `project/source-of-truth.json`.

## Key artifacts

- `.planning/` — GSD planning (PROJECT, REQUIREMENTS, ROADMAP, STATE, phases).
- `project/` — B.L.A.S.T. memory (task_plan, findings, progress, process-journal, gemini, architecture, changelog, errors).
- `architecture.md` (root) and `project/architecture.md` — AGI architecture.
- `src/agi/` — Implementation (core loop, memory, reasoner, planner, action).

## WHEEE usage

- `wheee init` — Already run; project structure and memory files created.
- `wheee audit` — Check project health and compliance.
- `wheee log <type>` — Add process journal entry (decision, challenge, etc.).
- `wheee context` — Check context health.
- `wheee fip <file|symbol>` — Find dependencies before changing.
