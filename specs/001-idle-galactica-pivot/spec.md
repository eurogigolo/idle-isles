# Feature Specification: Idle Galactica Complete Pivot

**Feature Branch**: `001-idle-galactica-pivot`

**Created**: 2026-06-23

**Status**: Draft

**Input**: Complete pivot from Idle Isles fantasy idle RPG into Idle Galactica, a space idle exploration, ship-building, and on-chain ship-combat game.

## User Scenarios & Testing

### User Story 1 - Fresh Space Profile and Core Loop (Priority: P1)

As a new player, I want to start a fresh Idle Galactica profile, choose a sector mission, gather cargo, claim rewards, and use those rewards in production so the game immediately feels like a space idle loop.

**Why this priority**: Without a fresh v2 profile and resource loop, there is no playable game.

**Independent Test**: Start local mode with an empty v2 save key, run a Tier 1 gathering mission, claim cargo and XP, run a Tier 1 production mission using that cargo, and verify no old fantasy skill/item/activity appears.

**Acceptance Scenarios**:

1. **Given** no v2 save exists, **When** the app starts, **Then** the player receives a fresh space profile with Credits, Cargo Hold, ShipState, Orbital Dock, and the 10 launch skills.
2. **Given** the player has starter resources, **When** they complete a Tier 1 production mission, **Then** the output is a space item such as a module, ammo, repair supply, or refined material.
3. **Given** the player searches active UI and local content, **When** old fantasy terms are checked, **Then** no active v2 UI or local content uses old skills, equipment, food, areas, Hoard Hall, or Crowns.

---

### User Story 2 - Ship Identity and Module Loadout (Priority: P1)

As a player, I want my ship to be the central character, with hull and modules defining power, risk, and progression.

**Why this priority**: The pivot fails if the game feels like a fantasy character wearing sci-fi labels.

**Independent Test**: Build or obtain a module, equip it into the correct ModuleSlot, verify it leaves cargo while equipped, verify ship stats change, then unequip it and verify it returns to cargo.

**Acceptance Scenarios**:

1. **Given** the player has a module in cargo, **When** they equip it, **Then** the module is stored on `ShipState.modules` and removed from cargo.
2. **Given** a module is equipped, **When** the player manually unequips it, **Then** it returns to cargo.
3. **Given** Hull Failure occurs, **When** penalties resolve, **Then** equipped modules are permanently destroyed and 50% of Credits are burned.

---

### User Story 3 - Two-Skill Ship Combat (Priority: P1)

As a player, I want combat missions to use Gunnery for offense and Engineering for survival, with clear hull, repair, ammo, and module-loss risk.

**Why this priority**: Combat is the main risk loop and must be space-native before chain parity.

**Independent Test**: Start a starter combat mission with a hardpoint, resolve cycles, verify Gunnery XP on successful attacks, Engineering XP on damage/mitigation/repair, ammo consumption when required, and Hull Failure behavior.

**Acceptance Scenarios**:

1. **Given** a combat mission is active, **When** the ship lands an offensive cycle, **Then** the threat takes damage and Gunnery XP is awarded.
2. **Given** the ship takes or mitigates incoming damage, **When** the cycle settles, **Then** Engineering XP is awarded.
3. **Given** auto-repair is enabled and repair supplies are available, **When** hull drops below threshold, **Then** repair supplies restore hull without triggering death penalties.
4. **Given** hull reaches 0, **When** Hull Failure resolves, **Then** active mission ends, modules are destroyed, Credits are halved, and the player must recover before another mission.

---

### User Story 4 - Sector-Gated Mission Progression (Priority: P2)

As a player, I want sectors to organize progression so Orbital Dock introduces the game and Inner Belt expands rewards, threats, and requirements.

**Why this priority**: Sectors replace old areas and provide structure for progression and future expansion.

**Independent Test**: Unlock Inner Belt with Credits and skill requirements, travel to it, verify mission list changes by `currentSectorId`, and verify locked-sector requirements are visible.

**Acceptance Scenarios**:

1. **Given** the player is in Orbital Dock, **When** they view missions, **Then** only Orbital Dock missions are startable.
2. **Given** the player meets Inner Belt requirements and pays the Credit cost, **When** they travel to Inner Belt, **Then** it remains permanently unlocked.
3. **Given** a mission belongs to a locked sector, **When** the player views it, **Then** the UI communicates requirements instead of silently hiding progression goals.

---

### User Story 5 - Trade Relay and Chain Parity (Priority: P3)

As a player using Chain mode, I want the same core gameplay loops to work on fresh v2 contracts, including cargo ownership, modules, repair, combat, sectors, and marketplace orders.

**Why this priority**: Chain parity is essential to the on-chain game, but should follow local validation.

**Independent Test**: Deploy fresh v2 contracts, create profile, start and claim starter missions, equip a module, resolve starter combat, use repair supplies, and create/buy/cancel Trade Relay orders.

**Acceptance Scenarios**:

1. **Given** fresh v2 contracts are configured, **When** a player creates a profile, **Then** chain state starts from zero v2 state and does not depend on old live state.
2. **Given** chain mode is enabled, **When** the player starts/claims missions, equips modules, repairs hull, and trades, **Then** the chain adapter uses v2 ABI names and v2 content IDs only.
3. **Given** old v1 addresses exist, **When** v2 is launched, **Then** Railway and local chain mode point only to fresh v2 contract addresses.

## Edge Cases

- Old local saves exist under `idle-isles-save-v1`.
- Player has no repair supplies and hull is below the configured safety threshold.
- Player has ammo-using hardpoint but no ammo.
- Hull Failure occurs after rewards are earned in the same claim window.
- Manual unequip and death-loss must not both remint the same module.
- Sector unlock requirements are met locally but not on-chain due to stale chain snapshot.
- Content ID generation drifts from TypeScript or Solidity constants.
- Contract bytecode exceeds the project budget after adding v2 behavior.
- Marketplace attempts to list Credits.

## Requirements

### Functional Requirements

- **FR-001**: System MUST define exactly 10 launch skills: Asteroid Mining, Wreck Salvage, Nebula Siphoning, Exo-Surveying, Shipyard Fabrication, Life Systems Synthesis, Quantum Refining, Nanofab Assembly, Gunnery, and Engineering.
- **FR-002**: System MUST replace fantasy activity groups with `Gathering`, `Production`, and `Combat`.
- **FR-003**: System MUST use a fresh v2 local storage key and MUST NOT migrate old Idle Isles saves into v2 state.
- **FR-004**: System MUST represent the ship with first-class `ShipState` containing `currentHull`, `maxHull`, and module slots.
- **FR-005**: System MUST define six launch module slots: `hardpoint`, `shieldArray`, `hullPlating`, `sensorSuite`, `engineCore`, and `auxiliaryCore`.
- **FR-006**: System MUST remove active fantasy runtime concepts including old skills, Hitpoints, food, equipment, areas, Crowns, Hoard Hall, `startArtisan`, `startGather`, and `eatFood`.
- **FR-007**: System MUST provide Tier 1 through Tier 5 naming and progression ladders for the 10 launch skills, using the tier ranges in `migration.md`.
- **FR-008**: System MUST implement launch content for Orbital Dock and Inner Belt.
- **FR-009**: System MUST target 35-45 items, 12-15 gathering activities, 12-15 production activities, 8-10 combat threats, 12-15 ship modules, and 4-6 repair supplies before public testnet.
- **FR-010**: System MUST make Gunnery drive offensive combat and Engineering drive mitigation, repair, and survival.
- **FR-011**: System MUST destroy equipped modules and burn 50% of Credits on Hull Failure.
- **FR-012**: System MUST keep safety stops distinct from Hull Failure and MUST NOT apply module/Credit death penalties on safety stop.
- **FR-013**: System MUST make sectors drive mission availability through `currentSectorId` and permanent unlock state.
- **FR-014**: System MUST rename the marketplace to Trade Relay and preserve marketplace escrow mechanics under v2 terminology.
- **FR-015**: System MUST deploy fresh v2 contracts for chain mode and MUST NOT rely on old live on-chain state.
- **FR-016**: System MUST keep TypeScript skill order, Solidity skill order, generated content IDs, and chain snapshot mapping aligned.
- **FR-017**: System MUST pass the verification gates defined in `.specify/memory/constitution.md` before deployment.

### Key Entities

- **SpaceGameState**: Local profile state containing cargo, skills, active mission, current sector, ship, combat settings, market state, and logs.
- **ShipState**: Ship identity and risk state containing hull and equipped modules.
- **ModuleSlot**: Fixed launch slot enum for ship systems.
- **Mission/Activity**: Timed action with sector, group, skill requirements, costs, rewards, XP, cycle time, and optional combat/synthesis rules.
- **Sector**: Region of space with unlock requirements, Credit cost, and mission availability.
- **Cargo Item**: Resource, refined material, module, ammo, repair supply, artifact, or Credit currency.
- **Threat**: Combat mission target with hull, attack, defense/evasion, rewards, XP, risk, and requirements.
- **Trade Relay Order**: Marketplace escrow order for non-Credit cargo items.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A fresh local v2 profile can complete gather -> production -> combat within the first session without chain mode.
- **SC-002**: Text search finds no old fantasy terminology in active v2 UI, local content, contract content, or v2 tests except documented migration/removal references.
- **SC-003**: `npm.cmd run verify` passes before any fresh v2 deployment.
- **SC-004**: Stateful v2 contract bytecode remains below EIP-170 and the project bytecode budget.
- **SC-005**: Public testnet launch includes exactly the 10 launch skills, 2 launch sectors, and Section 23 launch content counts from `migration.md`.
- **SC-006**: Chain smoke test covers profile creation, starter gathering, starter production, module equip/unequip, starter combat, repair, Hull Failure, and Trade Relay order create/buy/cancel.
- **SC-007**: Main UI presents a spaceship operations dashboard where hull, modules, cargo, current mission, claim state, and risk are visible without excessive navigation.

## Assumptions

- Live v1 on-chain state can be abandoned for v2.
- Idle Galactica is the working title until the user chooses a final name.
- Local mode remains the fastest validation surface.
- React, TypeScript, Vite, Hardhat, viem, OpenZeppelin ERC-1155, and MegaETH Testnet remain the technology stack.
- MOSS session support should be updated only after v2 ABI shape is stable.
- Piloting, Psionics, Xenobiology, AI Core Programming, factions, multiple ships, and story events are deferred.
