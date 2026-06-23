# Idle Galactica Constitution

## Core Principles

### I. Complete Pivot, Not a Theme Layer

Idle Galactica is a clean v2 replacement for the current Idle Isles fantasy game. Active runtime concepts must be space-native. Do not preserve fantasy gameplay terminology, legacy ABI names, or old content aliases in active v2 code paths. Reuse proven mechanics and implementation patterns only when the resulting model still reads as a spaceship exploration, production, and combat game.

### II. Ship-First Product Model

The ship is the central character and progression vehicle. Ship hull, modules, cargo, sectors, missions, repair supplies, credits, and threats are first-class concepts. UI, local state, chain state, tests, and generated content must reinforce ship identity rather than character equipment identity.

### III. Local-First, Chain-Ready Delivery

Build and validate the local game loop before contract rewrites. Content registry, local simulation, and frontend ergonomics must prove the shape of the game before bytecode-constrained Solidity work begins. Chain mode can be disabled or pointed at fresh v2 contracts until parity is rebuilt.

### IV. Data Discipline Across Frontend and Solidity

Skill order, item IDs, activity IDs, sector IDs, module slots, and content tables are protocol-level data. Any change to these must update TypeScript, generated IDs, Solidity constants, chain adapter mappings, and tests together. Generated files must be regenerated through project scripts, not edited by hand.

### V. Verification Gates Are Mandatory

Every significant phase must leave the project in a verifiable state. Required gates are `npm.cmd run lint`, `npm.cmd run content:check`, and `npm.cmd run build` for frontend/local phases. Contract phases additionally require `npm.cmd run build:contracts`, `npm.cmd run bytecode:contracts`, `npm.cmd run test:contracts`, and `npm.cmd run verify` before deployment.

## Technical Constraints

- Do not read, modify, or commit `.env`.
- The current live on-chain state does not need to be preserved.
- Use a new local storage key for v2 saves.
- Deploy fresh v2 contracts; do not reuse old Idle Isles or Hoard Hall addresses.
- Stateful Solidity bytecode is tight. Remove old branches before adding v2 contract behavior.
- Use PowerShell-safe commands on Windows. Prefer `npm.cmd` over `npm` when execution policy blocks `.ps1` shims.
- Preserve unrelated working tree changes unless the user explicitly asks to revert them.

## Development Workflow

1. Keep `migration.md` as the broad product and migration brief.
2. Keep `specs/001-idle-galactica-pivot/spec.md` as the feature requirements source.
3. Keep `specs/001-idle-galactica-pivot/plan.md` as the technical implementation plan.
4. Keep `specs/001-idle-galactica-pivot/tasks.md` as the executable task queue.
5. Implement in small vertical phases with a verification gate after each phase.
6. Prefer deleting or replacing obsolete fantasy concepts over adapting them through aliases.

## Governance

This constitution takes precedence over older Idle Isles planning documents for the v2 pivot. Amendments must update the spec and task plan when they change product scope, data model, contract behavior, risk posture, or verification gates. Any decision to preserve a legacy fantasy runtime concept must be treated as a constitution violation and explicitly approved before implementation.

**Version**: 1.0.0 | **Ratified**: 2026-06-23 | **Last Amended**: 2026-06-23
