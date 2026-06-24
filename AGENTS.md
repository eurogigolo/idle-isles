# Agent Instructions

<!-- SPECKIT START -->
Spec Kit is initialized for this repository.

Read these files before implementing Idle Galactica work:

1. `.specify/memory/constitution.md`
2. `specs/001-idle-galactica-pivot/spec.md`
3. `specs/001-idle-galactica-pivot/plan.md`
4. `specs/001-idle-galactica-pivot/tasks.md`
5. `migration.md`

Authority order:

1. Direct user instruction
2. `.specify/memory/constitution.md`
3. Active feature spec/plan/tasks under `specs/001-idle-galactica-pivot/`
4. `migration.md`
5. Older Idle Isles docs

Project rules:

- Do not read, modify, or commit `.env`.
- This is a complete pivot, not a compatibility layer.
- Do not preserve old fantasy runtime concepts in v2 active code.
- Use `npm.cmd` on Windows when `npm` is blocked by PowerShell execution policy.
- Preserve unrelated dirty worktree changes unless the user explicitly asks to revert them.
- Run the verification gates listed in `.specify/memory/constitution.md` after each major phase.
<!-- SPECKIT END -->
