# Implementation Plan: Idle Galactica Complete Pivot

**Branch**: `001-idle-galactica-pivot` | **Date**: 2026-06-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-idle-galactica-pivot/spec.md` and migration brief from `migration.md`.

## Summary

Reset the current Idle Isles fantasy RPG into Idle Galactica, a space idle exploration, production, ship module, and ship combat game. The implementation is a complete pivot: local saves, content IDs, TypeScript models, UI language, contracts, ABI names, chain adapter mappings, tests, and deployment addresses are replaced with v2 space-native concepts. Work proceeds local-first, then contracts, then chain parity.

## Technical Context

**Language/Version**: TypeScript 6, React 19, Vite 8, Solidity 0.8.28, Node 24, npm 11

**Primary Dependencies**: React, lucide-react, viem, Hardhat 3, OpenZeppelin ERC-1155, MegaETH wallet SDK

**Storage**: Local browser storage for local mode; ERC-1155 balances and contract mappings for Chain mode

**Testing**: ESLint, TypeScript build, Vite build, Hardhat build, bytecode check, node:test contract tests

**Target Platform**: Browser frontend with optional MegaETH Testnet chain mode

**Project Type**: Full-stack web game with Solidity contracts

**Performance Goals**: Idle loop remains responsive in local mode; contract settlement remains bounded and bytecode remains under budget

**Constraints**: Do not read `.env`; do not preserve old on-chain state; do not layer v2 on old fantasy runtime names; keep verification green after each major phase

**Scale/Scope**: Launch target is 10 skills, 2 sectors, 35-45 items, 12-15 gathering activities, 12-15 production activities, 8-10 threats, 12-15 modules, and 4-6 repair supplies

## Constitution Check

*GATE: Must pass before implementation and after every major phase.*

- Complete pivot: active v2 code uses space-native concepts, not old fantasy aliases.
- Ship-first: `ShipState`, module slots, hull, cargo, sectors, missions, and Trade Relay are first-class.
- Local-first: content registry and local model are proven before Solidity rewrite.
- Data discipline: content IDs and skill order are updated together across TS, generated files, Solidity, chain adapter, and tests.
- Verification: local phases run `npm.cmd run lint`, `npm.cmd run content:check`, and `npm.cmd run build`; contract phases also run contract build, bytecode, tests, and full verify.

## Project Structure

### Documentation

```text
migration.md
specs/001-idle-galactica-pivot/
  spec.md
  plan.md
  tasks.md
.specify/
  memory/constitution.md
  scripts/powershell/
  templates/
.agents/skills/
```

### Source Code

```text
content/core/ids.json
src/generated/contentIds.ts
src/game.ts
src/App.tsx
src/GameScene.tsx
src/App.css
src/index.css
src/chain.ts
contracts/IdleIsles.sol
contracts/IdleIslesContent.sol
contracts/IIdleIslesContent.sol
contracts/HoardHall.sol
test/IdleIsles.ts
scripts/deploy.ts
deployments/megaeth-testnet.json
```

**Structure Decision**: Keep the current single Vite/Hardhat project layout during the pivot. Rename files/contracts only when a phase requires space-native symbols; avoid broad folder churn until the v2 loop compiles.

## Phase Strategy

### Phase 0: Baseline

- Preserve unrelated dirty worktree changes.
- Keep `.env` out of scope.
- Run `npm.cmd run verify` before implementation.
- Record current bytecode.

### Phase 1: Registry Reset

- Replace `content/core/ids.json` with the first v2 space registry.
- Regenerate `src/generated/contentIds.ts`.
- Gate: `npm.cmd run content:check`.

### Phase 2: Local Game Model Reset

- Replace old skills, items, activities, areas, storage key, combat settings, market rows, and save defaults in `src/game.ts`.
- Introduce `ShipState`, `ModuleSlot`, `SectorId`, `SpaceGameState`, `Gathering`, `Production`, and `Combat`.
- Keep reusable idle mechanics only when names and behavior are space-native.
- Gate: `npm.cmd run build` after App references are updated enough to compile.

### Phase 3: Frontend Rewire

- Update `src/App.tsx` to use Cargo Hold, Ship Modules, Hull, Repair Supplies, Sectors, Missions, and Trade Relay.
- Remove combat style UI.
- Ensure local mode is playable.
- Gate: `npm.cmd run lint` and `npm.cmd run build`.

### Phase 4: Space Scene

- Replace fantasy canvas scene with ship, asteroid, wreck, nebula, survey, production, and combat scenes.
- Gate: browser review plus build.

### Phase 5: Contracts

- Rename active contract concepts to v2: hull, modules, sectors, production, repair, Trade Relay, and v2 skills.
- Remove old combat styles and fantasy content branches.
- Preserve ERC-1155 ownership, bounded settlement, module burn/remint behavior, and marketplace escrow mechanics.
- Gate: contract build, bytecode, contract tests.

### Phase 6: Chain Adapter and Deployment

- Update `src/chain.ts`, MOSS call list, ABI, snapshot mapping, and deployment flow for fresh v2 contracts.
- Deploy fresh MegaETH Testnet contracts.
- Gate: full `npm.cmd run verify` and chain smoke test.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --- | --- | --- |
| Large cross-file reset | The old fantasy model is deeply coupled across frontend, contracts, content, and tests | A skinning pass would preserve old runtime semantics and violate the complete-pivot requirement |
| Fresh contract ABI | v2 must remove `startArtisan`, `eatFood`, HP, areas, and old slot names | Backward compatibility is not required and would increase bytecode/risk |
| Spec Kit governance | The pivot spans product, local simulation, Solidity, UI, and deployment | Informal tasking is likely to drift across such a large rewrite |

## Verification Matrix

| Phase | Required Checks |
| --- | --- |
| Registry | `npm.cmd run content:check` |
| Local model | `npm.cmd run lint`, `npm.cmd run build` |
| Frontend UI | `npm.cmd run lint`, `npm.cmd run build`, manual local play |
| Contracts | `npm.cmd run build:contracts`, `npm.cmd run bytecode:contracts`, `npm.cmd run test:contracts` |
| Deployment | `npm.cmd run verify`, manual chain smoke test |

## Rollback Policy

- Before contract deployment, rollback is standard git revert of the current phase.
- After fresh v2 deployment, rollback is disabling/repointing frontend env vars or reverting the frontend build.
- Do not merge old v1 chain state into v2.
