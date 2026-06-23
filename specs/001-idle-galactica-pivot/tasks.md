# Tasks: Idle Galactica Complete Pivot

**Input**: [spec.md](./spec.md), [plan.md](./plan.md), and `migration.md`

**Prerequisites**: Spec Kit initialized, constitution ratified, current repo verification passing

**Tests**: Required for contract phases and high-risk local model behavior. Run verification gates at every checkpoint.

## Phase 1: Setup and Baseline

**Purpose**: Establish a stable checkpoint before changing gameplay code.

- [x] T001 Confirm dirty worktree and identify unrelated changes with `git status --short --branch`.
- [x] T002 Run `npm.cmd run verify` and record pass/fail in implementation notes.
- [x] T003 Confirm `.env` remains unread and unmodified.
- [x] T004 Confirm `migration.md`, `.specify/memory/constitution.md`, and `specs/001-idle-galactica-pivot/` agree on complete-pivot rules.

**Checkpoint**: Existing Idle Isles baseline is verified and the v2 spec is authoritative.

---

## Phase 2: Content Registry Reset

**Purpose**: Establish v2 content IDs before TypeScript or Solidity changes depend on them.

- [x] T005 Replace `content/core/ids.json` with v2 Idle Galactica sectors, items, and activity IDs.
- [x] T006 Include launch sectors `orbitalDock` and `innerBelt`; reserve `outerExpanse` only if needed for future content.
- [x] T007 Add item IDs for Credits, resources, gases, biomass/data, salvage, refined materials, repair supplies, ammo, modules, and rare artifacts.
- [x] T008 Add activity IDs for launch combat threats, gathering missions, and production missions.
- [x] T009 Run `npm.cmd run content:generate`.
- [x] T010 Run `npm.cmd run content:check`.

**Checkpoint**: `src/generated/contentIds.ts` is regenerated and registry checks pass.

---

## Phase 3: Local Game Model Reset

**Purpose**: Make local mode compile with v2 core concepts.

- [x] T011 Replace `SkillId` in `src/game.ts` with the 10 launch skills.
- [x] T012 Replace old `ActivityGroup` with `Gathering`, `Production`, and `Combat`.
- [x] T013 Replace old `AreaId` model with `SectorId` and sector definitions.
- [x] T014 Replace inventory/equipment/hitpoint state with cargo, `ShipState`, hull, modules, and v2 combat settings.
- [x] T015 Replace `STORAGE_KEY` with a new v2 key and prevent old save normalization.
- [x] T016 Replace `ItemId`, `ITEMS`, and starter cargo with v2 content.
- [x] T017 Replace `ActivityId` and `ACTIVITIES` with v2 missions.
- [x] T018 Replace cooking rules with production/synthesis rules.
- [x] T019 Replace auto-eat/food logic with auto-repair/repair supply logic.
- [x] T020 Replace death penalty naming and behavior with Hull Failure, permanent module loss, and 50% Credit loss.
- [x] T021 Replace local market rows with Trade Relay v2 item availability.

**Checkpoint**: `src/game.ts` exports a coherent v2 local model, even if `src/App.tsx` temporarily needs rewiring.

---

## Phase 4: Frontend Rewire

**Purpose**: Make local v2 playable through the existing app shell.

- [x] T022 Update `src/App.tsx` imports, type usage, skill icons, and item icons for v2.
- [x] T023 Replace resource tabs with Gathering and Production skill filters.
- [x] T024 Replace Inventory with Cargo Hold.
- [x] T025 Replace Equipment with Ship Modules or Ship Loadout.
- [x] T026 Replace Hitpoints UI with Hull Integrity.
- [x] T027 Replace Auto-eat/Food controls with Auto-repair/Repair Supplies.
- [x] T028 Replace Harbor Merchant/Areas with sector travel and unlock UI.
- [x] T029 Replace Hoard Hall labels with Trade Relay labels.
- [x] T030 Remove combat training style controls.
- [x] T031 Update welcome-back, logs, claim preview, death preview, and chain-mode messages to v2 language.
- [x] T032 Run `npm.cmd run lint`.
- [x] T033 Run `npm.cmd run build`.

**Checkpoint**: Local browser mode can run the starter gather -> production -> combat loop.

---

## Phase 5: Space Scene and UI Polish

**Purpose**: Replace fantasy presentation with a ship operations dashboard.

- [x] T034 Replace `src/GameScene.tsx` fantasy character/tool scenes with ship, asteroid, wreck, nebula, survey, production, and combat scenes.
- [x] T035 Update `src/App.css` and `src/index.css` toward the Section 24 dashboard UI direction.
- [ ] T036 Remove old fantasy scene CSS and unused assets when confirmed unreferenced.
- [ ] T037 Check desktop and mobile layouts for overlapping text and unstable controls.
- [x] T038 Run `npm.cmd run lint`.
- [x] T039 Run `npm.cmd run build`.

**Checkpoint**: The first screen reads as a playable spaceship operations dashboard.

---

## Phase 6: Contract Reset

**Purpose**: Rebuild Chain mode around fresh v2 contracts.

- [ ] T040 Rename or replace game/content/marketplace contract symbols with v2 space-native names.
- [ ] T041 Replace contract skill enum with the 10 launch skills in TypeScript order.
- [ ] T042 Replace HP state with hull state.
- [ ] T043 Replace equipment slots with module slots.
- [ ] T044 Replace area travel with sector travel.
- [ ] T045 Replace `startGather`, `startArtisan`, and `eatFood` ABI paths with v2 equivalents.
- [ ] T046 Remove old CombatStyle and ranged/magic/melee branches.
- [ ] T047 Replace packed gather/artisan/combat data with v2 gathering/production/threat data.
- [ ] T048 Preserve bounded settlement, ERC-1155 item ownership, module burn/remint, death penalties, and escrow mechanics.
- [ ] T049 Run `npm.cmd run build:contracts`.
- [ ] T050 Run `npm.cmd run bytecode:contracts`.

**Checkpoint**: v2 contracts compile under bytecode budget.

---

## Phase 7: Contract Tests and Chain Adapter

**Purpose**: Restore chain confidence before deployment.

- [ ] T051 Rewrite `test/IdleIsles.ts` around v2 profile creation, starter missions, modules, repair, Hull Failure, sectors, and Trade Relay.
- [ ] T052 Update or replace `contracts/test/IdleIslesHarness.sol` if deterministic v2 settlement requires it.
- [ ] T053 Update `src/chain.ts` ABI, call names, MOSS call list, item ID mapping, sector mapping, module mapping, and snapshot conversion.
- [ ] T054 Update chain error messages to v2 terms.
- [ ] T055 Run `npm.cmd run test:contracts`.
- [ ] T056 Run `npm.cmd run build`.
- [ ] T057 Run `npm.cmd run verify`.

**Checkpoint**: Chain mode is ready for fresh v2 deployment.

---

## Phase 8: Fresh Deployment and Docs

**Purpose**: Launch a clean testnet v2 and make docs truthful.

- [ ] T058 Deploy fresh v2 contracts with `npm.cmd run deploy:megaeth`.
- [ ] T059 Update `deployments/megaeth-testnet.json` with fresh v2 addresses.
- [ ] T060 Manually update local/Railway env vars outside source control.
- [ ] T061 Smoke test profile creation, starter gathering, production, modules, combat, repair, Hull Failure, and Trade Relay.
- [ ] T062 Update `README.md`, `technical-breakdown.md`, `solidity-notes.md`, and production readiness docs after the implementation stabilizes.
- [ ] T063 Run final `npm.cmd run verify`.

**Checkpoint**: Public testnet points to fresh v2 contracts and old live state is not required.

---

## Dependencies & Execution Order

- Phase 1 blocks all implementation.
- Phase 2 blocks local model reset.
- Phase 3 blocks frontend rewire.
- Phase 4 can overlap with early Phase 5 only after the app compiles.
- Contract phases must wait until the local loop is proven.
- Deployment must wait for full verification.

## Parallel Opportunities

- Item/activity content naming can be drafted while model edits are in progress.
- UI icon mapping can be updated in parallel with CSS cleanup after v2 types compile.
- Contract content lookup and contract test fixtures can be drafted in parallel after v2 IDs stabilize.

## Notes

- Do not implement deferred skills or systems during launch build.
- Do not preserve old fantasy runtime names for convenience.
- Do not edit generated files by hand.
- Do not read or commit `.env`.
