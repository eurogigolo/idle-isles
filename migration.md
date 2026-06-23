# Idle Galactica Complete Pivot Migration Plan

This document is the implementation plan for pivoting the current fantasy Idle Isles prototype into a space-themed idle exploration, ship-building, and ship-combat game under the working title Idle Galactica.

The current live on-chain state does not need to be preserved. That changes the plan materially: we should use the existing project as a strong engine foundation, but we should reset fantasy content, IDs, local saves, and deployed contracts instead of building a compatibility bridge.

The pivot is a complete replacement. Reuse proven architecture patterns, verification scripts, and mechanical ideas, but do not keep fantasy gameplay terminology, legacy ABI names, or old content aliases in the active v2 runtime.

## 1. Operating Principles

- Build a clean v2, not a backwards-compatible content patch.
- Preserve proven mechanics: idle activity loop, AFK cap, claim settlement, cargo accounting, module slots, marketplace escrow pattern, wallet support, deploy scripts, and verification gates.
- Replace fantasy content completely: skills, items, activities, enemies, areas, UI labels, scene art, contract constants, packed content tables, and tests.
- Replace fantasy domain names completely in active code paths. `Artisan`, `Hitpoints`, `eatFood`, `HoardHall`, old skill names, old item names, and old activity names should not remain as functional v2 concepts.
- Keep changes phased and verifiable. The project is concentrated in a few large files, so every phase needs a narrow success gate.
- Prefer data-first content. The existing `content/core/ids.json` is not yet the source of truth, but the migration should move in that direction instead of deepening duplication.
- Do not read or commit secrets. `.env` is intentionally out of scope.
- Do not preserve old local saves. Use a new storage key so old fantasy saves cannot pollute v2 state.
- Do not preserve old on-chain addresses. Deploy fresh space-version contracts with space-native names, ABI methods, constants, and emitted terminology.

## 2. Workspace Analysis

### Current Project Shape

- Frontend: React 19, TypeScript, Vite.
- Contracts: Solidity with Hardhat 3, viem, OpenZeppelin ERC-1155, ReentrancyGuard.
- Wallet/chain: viem, MegaETH Testnet, optional MOSS gameplay sessions.
- Marketplace: separate `HoardHall` ERC-1155 escrow/order contract.
- Deployment: `scripts/deploy.ts` deploys `IdleIslesContent`, `IdleIsles`, and `HoardHall`.
- Verification: `npm run verify` runs lint, audit, content checks, Solidity build, bytecode budget, contract tests, and frontend build.

### High-Impact Files

| File | Current Role | Migration Impact |
| --- | --- | --- |
| `src/game.ts` | Local content database and rules engine | Highest impact. Replace skills, items, activities, areas, save key, combat supply rules, food rules, market rows, and labels. |
| `src/App.tsx` | Main UI, local/chain orchestration, wallet actions, marketplace UI | High impact. Replace icons, tabs, combat controls, copy, panels, and domain terms. |
| `src/GameScene.tsx` | Canvas fantasy scene renderer | High impact. Replace character/tools with space scenes. |
| `src/App.css` | Full app styling, including old scene remnants | Medium-high impact. Retheme and remove old fantasy/CSS scene leftovers. |
| `src/chain.ts` | Chain snapshot reads and writes | High impact. Update item/activity IDs, food/supply lists, skill order assumptions, combat settings. |
| `src/generated/contentIds.ts` | Generated contract ID map | Regenerate from new registry. Do not edit by hand. |
| `content/core/ids.json` | Current checked ID registry | Replace or version into a space registry. |
| `contracts/IdleIsles.sol` | Stateful ERC-1155 game engine | High impact. Reset skills, constants, combat assumptions, area/sectors, ammo/repair logic. |
| `contracts/IdleIslesContent.sol` | Pure packed content lookup | Highest contract-content impact. Replace all fantasy lookup data. |
| `contracts/IIdleIslesContent.sol` | Content interface | Medium impact. Update names/comments and possibly struct fields for hull/modules. |
| `contracts/HoardHall.sol` | Marketplace escrow | Medium impact. Replace/rename to a space-native `TradeRelay` contract while preserving the escrow mechanic. |
| `test/IdleIsles.ts` | Contract test suite | Highest test impact. Rewrite fixtures and assertions around the space loop. |
| `README.md`, `plan.md`, `solidity-notes.md`, `technical-breakdown.md` | Existing fantasy/alpha docs | Update after the implementation stabilizes. |

### Current Coupling Points

- TypeScript unions in `src/game.ts` drive most frontend type safety.
- `SKILLS` order is mirrored by contract `enum Skill` and chain snapshot reads.
- `ITEMS`, `ACTIVITIES`, `AREAS`, and `content/core/ids.json` are duplicated across local, generated chain mappings, Solidity, and tests.
- `src/chain.ts` reads all contract item balances using `CONTRACT_ITEM_IDS`.
- `src/chain.ts` reads skill XP by the index order of `SKILLS`.
- `IdleIsles.sol` has hard-coded activity ranges: combat `101+`, gather `201+`, artisan `301+`.
- `IdleIsles.sol` uses fantasy combat styles: melee, ranged, magic.
- `IdleIsles.sol` is near bytecode limits, so v2 should simplify where possible.
- `GameScene.tsx` is fantasy-specific: character, axe, rod, pickaxe, hammer, sword, trees, water, rocks, forge, enemy.

### Current Bytecode Position

Current bytecode check:

| Contract | Size | EIP-170 Headroom | Project Budget Headroom |
| --- | ---: | ---: | ---: |
| `IdleIsles` | 24,183 bytes | 393 bytes | 17 bytes |
| `IdleIslesContent` | 11,228 bytes | 13,348 bytes | 772 bytes |
| `HoardHall` | 3,500 bytes | 21,076 bytes | 4,500 bytes |

Implication: do not layer the new game onto the current stateful core. Rewrite/reset the contract content and remove obsolete fantasy branches as part of the v2 contract phase.

## 3. Target Product

The new game is a sci-fi idle RPG centered on spaceship progression, space exploration, resource extraction, production chains, ship modules, survival supplies, and ship combat.

Core loop:

1. Pick a mission in the current sector.
2. Time passes while the ship works.
3. Claim completed cycles.
4. Gain XP, cargo, credits, and possible rare drops.
5. Use gathered resources in production skills.
6. Build modules, repair supplies, fuel, ammo, drones, and advanced parts.
7. Equip ship modules.
8. Fight ship threats with Gunnery and survive through Engineering.
9. Sell cargo/modules through the marketplace.
10. Unlock harder sectors and higher tier activities.

## 4. Final Launch Skills

| # | Skill | Category | Purpose |
| ---: | --- | --- | --- |
| 1 | Asteroid Mining | Gathering | Main source of basic metals, minerals, ice, and rare ore chances. |
| 2 | Wreck Salvage | Gathering | Components, scrap, tech fragments, and risky loot variety. |
| 3 | Nebula Siphoning | Gathering | Fuel gases, plasma, energy resources, and exotic precursors. |
| 4 | Exo-Surveying | Gathering | Biomass, survey data, artifacts, organics, and research materials. |
| 5 | Shipyard Fabrication | Production | Ship modules, hull plating, shields, engines, and core upgrades. |
| 6 | Life Systems Synthesis | Production | Rations, oxygen, med packs, repair gel, and sustainment supplies. |
| 7 | Quantum Refining | Production | Fuel processing, isotopes, exotic matter, and power materials. |
| 8 | Nanofab Assembly | Production | Precision parts, drones, ammo, tools, and advanced components. |
| 9 | Gunnery | Combat | Offensive ship combat, weapon accuracy, damage, and combat access. |
| 10 | Engineering | Combat | Defensive ship combat, hull integrity, shields, mitigation, and repairs. |

Deferred concepts:

- Piloting can later become ship evasion/speed/module stat, not a launch skill.
- Psionics can later become anomaly or endgame specialization, not a launch skill.
- Xenobiology can later become alien boss track or exploration specialization, not a launch skill.
- AI Core Programming can later become automation/fleet progression, not a launch skill.

## 5. Tier Pacing

Use the user's revised pacing. Ignore the original tier level recommendations from the pasted tier notes, but keep the tier names, focus, and economic purpose.

| Tier | Range | Default Meaning |
| ---: | --- | --- |
| 1 | Level 1 | Starter loop. |
| 2 | Level 5-8 | First real upgrade tier. |
| 3 | Level 14-17 | Mid-game specialization. |
| 4 | Level 23-28 | Late-game high-value content. |
| 5 | Level 35-42 | Endgame aspirational content. |

Recommended concrete unlock profiles:

| Profile | Skills | Unlocks |
| --- | --- | --- |
| Fast fundamentals | Asteroid Mining, Life Systems Synthesis, Engineering | 1, 5, 14, 23, 35 |
| Standard progression | Wreck Salvage, Nebula Siphoning, Shipyard Fabrication, Gunnery | 1, 6, 15, 25, 38 |
| Advanced systems | Exo-Surveying, Quantum Refining, Nanofab Assembly | 1, 8, 17, 28, 42 |

## 6. Skill Tier Ladders

### Asteroid Mining

| Tier | Name | Level | Focus | Economic Purpose | Requirements |
| ---: | --- | ---: | --- | --- | --- |
| 1 | Rock Hopper | 1 | Basic asteroid mining | High volume common ores | Starter mining laser |
| 2 | Belt Prospector | 5 | Improved yield | Introduces mid-tier metals | Reinforced drill head |
| 3 | Deep Core Miner | 14 | High-density cores | High-value metals and rare chance | Deep-core drill, Engineering 8 |
| 4 | Void Extractor | 23 | Large-scale mining | Bulk high-tier ores | Heavy mining rig, Quantum Refining 12 |
| 5 | Singularity Miner | 35 | Extreme extraction | Top-tier rare materials | Singularity drill, Engineering 25 |

### Wreck Salvage

| Tier | Name | Level | Focus | Economic Purpose | Requirements |
| ---: | --- | ---: | --- | --- | --- |
| 1 | Scrapper | 1 | Basic wreck looting | Common components and scrap | Starter salvage beam |
| 2 | Wreck Diver | 6 | Better recovery | Mid-tier ship parts | Cutting torch, Engineering 5 |
| 3 | Salvage Specialist | 15 | Dangerous wrecks | High-value modules and tech | Hazard plating, Gunnery 8 |
| 4 | Ghost Ship Hunter | 25 | High-risk wrecks | Rare components and blueprints | Advanced scanners, Engineering 18 |
| 5 | Relic Recoverer | 38 | Ancient wrecks | Extremely rare tech and items | Relic decoder, Gunnery 25, Engineering 25 |

### Nebula Siphoning

| Tier | Name | Level | Focus | Economic Purpose | Requirements |
| ---: | --- | ---: | --- | --- | --- |
| 1 | Gas Skimmer | 1 | Basic gas collection | Low-grade fuel | Starter gas scoop |
| 2 | Nebula Harvester | 6 | Better separation | Mid-tier fuel and isotopes | Compression tanks |
| 3 | Plasma Extractor | 15 | Charged particles | High-energy fuel and rare gases | Reinforced scoops, Engineering 10 |
| 4 | Quantum Siphon | 25 | Exotic matter | Very high value exotics | Stabilizer array, Quantum Refining 18 |
| 5 | Event Horizon Tap | 38 | Extreme siphoning | Top-tier energy and materials | Exotic containment, Engineering 28 |

### Exo-Surveying

| Tier | Name | Level | Focus | Economic Purpose | Requirements |
| ---: | --- | ---: | --- | --- | --- |
| 1 | Surface Scanner | 1 | Basic planet scans | Common biomass and data | Starter probe |
| 2 | Planetary Surveyor | 8 | Deeper analysis | Better biomass and early artifacts | Survey scanner |
| 3 | Exo-Biologist | 17 | Lifeform mapping | High-value organics and data cores | Bio-lab module, Life Systems Synthesis 10 |
| 4 | System Cartographer | 28 | Full system scans | Rare materials and tech fragments | Long-range probes, Nanofab Assembly 15 |
| 5 | Cosmic Archaeologist | 42 | Ancient ruins | Extremely valuable artifacts | Relic analysis suite, Quantum Refining 28 |

### Shipyard Fabrication

| Tier | Name | Level | Focus | Economic Purpose | Requirements |
| ---: | --- | ---: | --- | --- | --- |
| 1 | Basic Fabricator | 1 | Simple parts | Starter ship modules | Common metals and scrap |
| 2 | Module Assembler | 6 | Better components | Mid-tier upgrades | Refined alloy, Asteroid Mining 5 |
| 3 | Advanced Shipwright | 15 | Complex modules | High-performance parts | Tech fragments, Wreck Salvage 10 |
| 4 | Capital Fabricator | 25 | Large ship construction | Endgame ship modules | Exotic alloys, Quantum Refining 18 |
| 5 | Arcology Builder | 38 | Stations and mega structures | Player-owned infrastructure prep | Relic cores, Nanofab Assembly 25 |

### Life Systems Synthesis

| Tier | Name | Level | Focus | Economic Purpose | Requirements |
| ---: | --- | ---: | --- | --- | --- |
| 1 | Basic Hydroponics | 1 | Simple rations and oxygen | Basic survival supplies | Biomass, water ice |
| 2 | Nutrient Synthesizer | 5 | Better rations and medicine | Improved crew sustainment | Better biomass, Exo-Surveying 5 |
| 3 | Advanced Life Support | 14 | High-quality supplies | Premium rations and medical goods | Medical compounds, Exo-Surveying 10 |
| 4 | Bio-Forge | 23 | Specialized supplements | High-value crew performance items | Rare organics, Quantum Refining 12 |
| 5 | Genesis Lab | 35 | Advanced biological products | Extremely valuable unique items | Ancient biomass, Exo-Surveying 25 |

### Quantum Refining

| Tier | Name | Level | Focus | Economic Purpose | Requirements |
| ---: | --- | ---: | --- | --- | --- |
| 1 | Basic Refinery | 1 | Simple fuel processing | Basic fuel | Raw gas or ore |
| 2 | Isotope Separator | 8 | Better fuel separation | Improved fuel and early exotics | Nebula gas, Asteroid Mining 5 |
| 3 | Quantum Distiller | 17 | High-grade refinement | High-value fuel and power cores | Plasma, Nebula Siphoning 12 |
| 4 | Antimatter Forge | 28 | Dangerous exotic processing | Extremely valuable energy sources | Exotic matter, Engineering 18 |
| 5 | Reality Refiner | 42 | Extreme refinement | Best fuel/power and unique resources | Singularity material, Engineering 30 |

### Nanofab Assembly

| Tier | Name | Level | Focus | Economic Purpose | Requirements |
| ---: | --- | ---: | --- | --- | --- |
| 1 | Basic Nanofab | 1 | Simple components and ammo | Basic consumables | Scrap, basic metals |
| 2 | Precision Fabricator | 8 | Better drones and tools | Mid-tier modules | Components, Wreck Salvage 5 |
| 3 | Advanced Nanofactory | 17 | High-performance items | Strong modules and weapons | Rare metals, Shipyard Fabrication 12 |
| 4 | Quantum Nanofab | 28 | Cutting-edge tech | Very high value modules | Exotic materials, Quantum Refining 20 |
| 5 | Singularity Assembler | 42 | Ultimate technology | Best-in-slot items | Relic tech, Shipyard Fabrication 30 |

### Gunnery

| Tier | Name | Level | Focus | Economic Purpose | Requirements |
| ---: | --- | ---: | --- | --- | --- |
| 1 | Gunner Recruit | 1 | Basic turret combat | Low damage, starter fights | Starter turret |
| 2 | Turret Specialist | 6 | Improved fire rate | Solid early damage | Light cannon, Engineering 5 |
| 3 | Ordnance Expert | 15 | Heavy weapons and missiles | High damage output | Missile rack, Nanofab Assembly 10 |
| 4 | Void Marksman | 25 | Precision long-range | Very high damage and better loot | Precision weapons, Engineering 18 |
| 5 | Singularity Gunner | 38 | Ultimate offensive combat | Highest damage and best rewards | Singularity weapon, Quantum Refining 25 |

### Engineering

| Tier | Name | Level | Focus | Economic Purpose | Requirements |
| ---: | --- | ---: | --- | --- | --- |
| 1 | Field Engineer | 1 | Basic repairs | Low survivability | Starter hull repair |
| 2 | Systems Technician | 5 | Better shields and repairs | Improved survival | Shield emitter, Shipyard Fabrication 5 |
| 3 | Damage Control Chief | 14 | Advanced mitigation | Strong defensive capability | Reinforced hull, Life Systems Synthesis 8 |
| 4 | Master Engineer | 23 | High-end defensive systems | Excellent survivability | Advanced shields, Quantum Refining 15 |
| 5 | Quantum Engineer | 35 | Extreme defense | Best-in-slot defense and unique tech | Quantum armor, Nanofab Assembly 25 |

## 7. Vocabulary Mapping

| Current Fantasy Term | Space v2 Term |
| --- | --- |
| Idle Isles | Idle Galactica |
| Crowns | Credits |
| Area | Sector |
| Starter Area | Orbital Dock / Inner Belt |
| Outer Isles | Fringe Belt / Outer Expanse |
| Harbor Merchant | Starport Navigation |
| Hoard Hall | Trade Relay |
| Inventory | Cargo Hold |
| Equipment | Ship Modules |
| Weapon | Hardpoint |
| Shield | Shield Array |
| Helm | Sensor Suite |
| Chest | Hull Plating |
| Legs | Engine Core |
| Trinket | Auxiliary Core |
| Hitpoints / HP | Hull Integrity |
| Food | Repair Supplies / Life Support Supplies |
| Auto-eat | Auto-repair |
| Combat | Ship Combat |
| Monsters | Threats / Hostiles / Anomalies |
| Boss | Elite Threat / Sector Boss |
| Ship ride | Jump route / Sector unlock |

This mapping is a replacement map, not an alias layer. Active v2 UI, state fields, contract ABI names, tests, content IDs, and generated IDs should use the space terms directly.

## 8. Suggested New IDs

Since old on-chain state is disposable, IDs can be repurposed. Still, use clear ranges to reduce future confusion.

### Areas / Sectors

| Local ID | Chain ID | Display |
| --- | ---: | --- |
| `orbitalDock` | 1 | Orbital Dock |
| `innerBelt` | 2 | Inner Belt |
| `outerExpanse` | 3 | Outer Expanse |

For launch, two sectors are enough:

- `orbitalDock`: starter-safe routes.
- `innerBelt`: first unlock route.

Add `outerExpanse` only if content is ready.

### Item Ranges

| Range | Class | Examples |
| ---: | --- | --- |
| 1 | Currency | Credits |
| 10-49 | Basic resources | Iron Ore, Nickel Ore, Water Ice, Scrap Metal |
| 50-89 | Energy/fuel resources | Hydrogen Gas, Ionized Gas, Plasma, Fuel Cells |
| 90-129 | Biological/data resources | Biomass, Survey Data, Xenodata, Bio-Samples |
| 130-179 | Salvage/components | Scrap, Circuits, Tech Fragments, Damaged Cores |
| 200-249 | Refined materials | Alloy Plate, Refined Isotopes, Power Cores |
| 250-299 | Consumables | Repair Gel, Oxygen Cells, Med Packs, Rations |
| 300-349 | Ammo/drones | Rail Slugs, Missiles, Drone Swarms, Plasma Charges |
| 400-499 | Ship modules | Turrets, Shields, Hulls, Engines, Sensors, Aux Cores |
| 700-799 | Rare artifacts | Relic Core, Ancient Blueprint, Singularity Shard |

### Activity Ranges

| Range | Type | Examples |
| ---: | --- | --- |
| 101-149 | Combat | Drone Skirmish, Raider Patrol, Rogue Frigate |
| 201-249 | Gathering | Rock Hopper, Scrapper, Gas Skimmer, Surface Scanner |
| 301-349 | Production | Basic Fabricator, Basic Hydroponics, Basic Refinery, Basic Nanofab |

Rename active game APIs to the v2 domain instead of carrying legacy method names. Recommended contract and chain adapter verbs:

- `startGathering`
- `startProduction`
- `startCombat`
- `equipModule`
- `unequipModule`
- `repairHull`
- `travelToSector`
- `claimMission`

Remove `startGather`, `startArtisan`, `eatFood`, old equipment terminology, and old area terminology from the active ABI during the contract reset.

## 9. Target Data Model

### Skills

New `SkillId` union:

```ts
type SkillId =
  | 'asteroidMining'
  | 'wreckSalvage'
  | 'nebulaSiphoning'
  | 'exoSurveying'
  | 'shipyardFabrication'
  | 'lifeSystemsSynthesis'
  | 'quantumRefining'
  | 'nanofabAssembly'
  | 'gunnery'
  | 'engineering'
```

Contract enum order should match exactly:

```solidity
enum Skill {
    AsteroidMining,
    WreckSalvage,
    NebulaSiphoning,
    ExoSurveying,
    ShipyardFabrication,
    LifeSystemsSynthesis,
    QuantumRefining,
    NanofabAssembly,
    Gunnery,
    Engineering
}
```

### Activity Definition

Recommended local shape:

```ts
interface ActivityDefinition {
  id: ActivityId
  name: string
  sector: string
  group: 'Gathering' | 'Production' | 'Combat'
  scene: SpaceSceneKind
  primarySkill: SkillId
  tier: 1 | 2 | 3 | 4 | 5
  levelReqs: Partial<Record<SkillId, number>>
  cycleMs: number
  xp: Partial<Record<SkillId, number>>
  rewards: Partial<Record<ItemId, number>>
  costs?: Partial<Record<ItemId, number>>
  requiredModule?: ItemId
  combat?: CombatRules
  synthesis?: SynthesisRules
}
```

`synthesis` replaces fantasy cooking as a native production mechanic. It can support fail/burn-style outcomes for life support goods, fuel processing, or advanced refining, but exported types and content fields should use `synthesis`, `production`, or skill-specific names, not `cooking`.

Recommended state rename targets:

```ts
interface ShipState {
  currentHull: number
  maxHull: number
  modules: Partial<Record<ModuleSlot, ItemId>>
  // Future: baseShipStats, shipName, shipLevel, shipClass, etc.
}

interface SpaceGameState {
  cargo: Record<ItemId, number>
  skills: Record<SkillId, SkillProgress>
  activeMission: ActiveMission | null
  currentSectorId: SectorId
  ship: ShipState
  combatSettings: CombatSettings
}
```

### Combat Settings

Current local `CombatSettings`:

- `autoEat`
- `stopAtHitpoints`
- `foodItemId`
- `maxFoodPerClaim`
- `trainingStyle`

Recommended v2:

- `autoRepair`
- `stopAtHull`
- `repairItemId`
- `maxRepairItemsPerClaim`

Remove `trainingStyle` for launch. With only Gunnery and Engineering, combat XP should be explicit in activity data:

- Gunnery XP for successful offensive cycles.
- Engineering XP for survival/mitigation exposure.

### Equipment / Modules

Use the existing six-slot idea, but rename the active slot identifiers in TypeScript and Solidity instead of keeping old equipment names:

```ts
type ModuleSlot =
  | 'hardpoint'
  | 'shieldArray'
  | 'sensorSuite'
  | 'hullPlating'
  | 'engineCore'
  | 'auxiliaryCore'
```

| Space Slot | Stat Emphasis |
| --- | --- |
| hardpoint | Damage and accuracy |
| shieldArray | Shielding and hull mitigation |
| sensorSuite | Accuracy, salvage, and survey bonuses later |
| hullPlating | Hull integrity and defense |
| engineCore | Speed and evasion later |
| auxiliaryCore | Utility and rare bonuses |

Recommended module stat display labels:

- `damage` -> DMG
- `shielding` -> SHLD
- `armor` -> ARMOR
- `hull` -> HULL
- `speed` -> SPD

## 10. Initial Content Slice

The first playable local slice should be small, complete, and representative.

### Starter Resources

| Item | Source | Use |
| --- | --- | --- |
| Credits | Combat, market | Currency |
| Ferrite Ore | Asteroid Mining | Alloy Plate |
| Nickel Ore | Asteroid Mining | Alloy Plate |
| Water Ice | Asteroid Mining / Exo-Surveying | Oxygen Cells |
| Scrap Metal | Wreck Salvage | Modules and ammo |
| Circuit Fragments | Wreck Salvage | Nanofab recipes |
| Hydrogen Gas | Nebula Siphoning | Fuel Cells |
| Ionized Gas | Nebula Siphoning | Refined fuel |
| Biomass | Exo-Surveying | Rations and med supplies |
| Survey Data | Exo-Surveying | Unlock/advanced recipes |

### Starter Production

| Activity | Skill | Inputs | Outputs |
| --- | --- | --- | --- |
| Basic Fabricator | Shipyard Fabrication | Ferrite Ore, Scrap Metal | Light Turret, Patchwork Hull |
| Basic Hydroponics | Life Systems Synthesis | Biomass, Water Ice | Rations / Repair Gel |
| Basic Refinery | Quantum Refining | Hydrogen Gas | Fuel Cells |
| Basic Nanofab | Nanofab Assembly | Scrap Metal, Circuit Fragments | Rail Slugs |

### Starter Combat

| Threat | Tier | Requirements | Rewards | Risk |
| --- | ---: | --- | --- | --- |
| Target Drone | 1 | Gunnery 1 | Scrap, Credits | Low hull damage |
| Raider Skiff | 1 | Gunnery 3, Engineering 2 | Scrap, Circuits, Credits | Moderate hull damage |
| Rogue Survey Probe | 2 | Gunnery 6, Engineering 5, Light Turret | Tech Fragments, Credits | Uses repair supplies |

## 11. Implementation Phases

### Phase 0: Baseline and Guardrails

Goal: prepare for a destructive content reset without losing track of the working base.

Steps:

1. Confirm working tree state and identify unrelated changes.
2. Do not revert unrelated user/deployment changes.
3. Run `npm run verify` once before code changes if time allows.
4. Record current bytecode sizes.
5. Use `Idle Galactica` as the working v2 product name unless a final replacement name is chosen before public launch.

Files touched:

- None required.

Verification:

- `git status --short --branch`
- `npm run verify`

Rollback:

- No rollback needed.

### Phase 1: Content and ID Registry Reset

Goal: establish the space ID map before touching rules.

Steps:

1. Replace `content/core/ids.json` with the new space areas, items, and activities.
2. Move to a `space` namespace, or replace `core` only if the generator makes namespaces expensive. The active registry should not mix old fantasy IDs with v2 IDs.
3. Assign item IDs by the ranges in section 8.
4. Assign activity IDs by combat/gather/production ranges.
5. Run `npm run content:generate`.
6. Run `npm run content:check`.
7. Commit only after generated `src/generated/contentIds.ts` is consistent.

Files touched:

- `content/core/ids.json`
- `src/generated/contentIds.ts`

Verification:

- `npm run content:check`

Rollback:

- Revert the registry and generated file only.

### Phase 2: Local Game Model Reset

Goal: make local mode compile and run with the 10 space skills and new content.

Steps:

1. Replace `SkillId` union with the 10 launch skills.
2. Replace `ItemId` union with the new cargo, supplies, modules, ammo, and rare artifacts.
3. Replace `ActivityId` union with the first space activities.
4. Replace `AreaId` with `SectorId`.
5. Replace `STORAGE_KEY` with a new key such as `idle-isles-space-save-v1`.
6. Remove old `LEGACY_STORAGE_KEYS` or leave them unused but do not normalize old fantasy saves into v2.
7. Replace `SKILLS`, `ITEMS`, `ACTIVITIES`, `AREAS`, `MARKET_ITEMS`, and `MARKET_ROWS`.
8. Replace `cooking` rules with native `synthesis` or production rule names.
9. Replace combat supply rules:
   - Remove ranged/magic style resolution.
   - Add ammo consumption for Gunnery weapons only if the equipped module requires ammo.
   - Add repair supply consumption through auto-repair.
10. Replace summary/log text with native space terms: Credits, Hull, Repair Supplies, Cargo, Modules, Sectors, Missions.
11. Rename model concepts as part of the reset: inventory -> cargo, equipment -> modules, area -> sector, task/activity -> mission where it improves clarity.
12. Keep `getClaimPreview`, `applyClaim`, XP curve, AFK cap, cycle speed, rare drops, and market helper behavior unless a specific rule requires change, but rename exported domain objects to v2 terms.

Files touched:

- `src/game.ts`

Verification:

- `npm run build`
- Manual local start after App wiring compiles.

Rollback:

- Revert `src/game.ts` and generated IDs from Phase 1.

### Phase 3: Frontend App Rewire

Goal: make the app space-themed and space-modeled without rewriting every interaction pattern.

Steps:

1. Replace imports/icons in `src/App.tsx`.
2. Replace `SKILL_ICONS` and `ITEM_ICONS`.
3. Use native activity groups directly:
   - `Gathering`
   - `Production`
   - `Combat`
4. Update subtabs:
   - Gathering: Asteroid Mining, Wreck Salvage, Nebula Siphoning, Exo-Surveying.
   - Production: Shipyard Fabrication, Life Systems Synthesis, Quantum Refining, Nanofab Assembly.
5. Remove combat style segmented control unless there is a concrete v2 need.
6. Replace combat safety copy and state labels:
   - Hull Safety.
   - Auto-repair.
   - Repair Supply.
   - Stop Hull.
7. Replace panels and backing component language:
   - Harbor Merchant -> Starport Navigation.
   - Equipment -> Ship Modules.
   - Inventory -> Cargo Hold.
   - Hoard Hall -> Trade Relay.
8. Replace stat labels:
   - ATK -> DMG.
   - DEF -> ARMOR or SHLD.
   - HP -> HULL.
9. Update welcome-back copy to avoid fantasy terms.
10. Update chain error messages to use space language.

Files touched:

- `src/App.tsx`

Verification:

- `npm run lint`
- `npm run build`
- Manual browser check for all panels at desktop and mobile sizes.

Rollback:

- Revert `src/App.tsx`.

### Phase 4: Space Scene Renderer

Goal: replace fantasy canvas rendering with a space dashboard scene.

Steps:

1. Replace `GameSceneAction` with:
   - `idle`
   - `asteroidMining`
   - `wreckSalvage`
   - `nebulaSiphoning`
   - `exoSurveying`
   - `production`
   - `combat`
2. Replace character/tool pose drawing with ship/drones/beam effects.
3. Implement scene backgrounds:
   - Orbital dock idle.
   - Asteroid field.
   - Derelict wreck.
   - Nebula cloud.
   - Planet scan.
   - Shipyard/fabricator bay.
   - Ship combat.
4. Keep canvas-only implementation for performance and layout stability.
5. Remove or ignore old unused CSS scene selectors after the new scene is stable.

Files touched:

- `src/GameScene.tsx`
- `src/App.tsx`
- `src/App.css`

Verification:

- `npm run build`
- Manual screenshot checks for active activity types.

Rollback:

- Revert scene files only.

### Phase 5: Contract Skill and Content Reset

Goal: make contracts match local v2 content.

Steps:

1. Rename the main game/content contracts to space-native names once the product working title is chosen. Use placeholders like `SpaceGame` and `SpaceContent` only if naming is still undecided.
2. Replace `enum Skill` with the 10 v2 skills in exact frontend order.
3. Rename health state to hull state: `currentHull`, `maxHull`, hull failure events, and hull repair settings.
4. Remove `CombatStyle`; launch combat XP comes from threat data and equipped modules.
5. Remove ranged/magic/melee-specific ammo logic.
6. Add v2 constants for Credits, cargo, modules, repair supplies, and ammo.
7. Replace combat activity constants with v2 threat constants.
8. Replace gather activity constants with v2 gathering tier activities.
9. Remove old artisan activity constants and replace them with v2 production tier activities, production constants, and production functions.
10. Replace area constants with sector constants.
11. Update `_activityAreaId` into `_missionSectorId` or equivalent.
12. Remove `_combatSkillForStyle`.
13. Update `_consumeAmmoForStyle` into a simpler `_consumeCombatSupply`.
14. Replace `eatFood` with `repairHull` or automatic repair consumption.
15. Update death penalty events/copy to hull failure/module loss.
16. Keep ERC-1155 ownership, profile creation, active mission tracking, settlement caps, module burn/remint while equipped, marketplace mechanics, and AFK cap.

Files touched or renamed:

- `contracts/IdleIsles.sol` -> new space game contract name
- `contracts/IIdleIslesContent.sol` -> new space content interface name

Verification:

- `npm run build:contracts`
- `npm run bytecode:contracts`

Rollback:

- Revert contract files.

### Phase 6: Contract Content Lookup Reset

Goal: replace fantasy packed content with space content.

Steps:

1. Replace item slot lookups with ship module slot lookups.
2. Replace item stat lookups with module stats.
3. Replace healing fields with repair/life support fields such as `repairAmount`.
4. Replace `GATHER_DATA` with v2 gathering activities.
5. Remove `ARTISAN_DATA` and replace it with a native production table such as `PRODUCTION_DATA`.
6. Replace `COMBAT_DATA` with v2 threats.
7. Replace `getDrop` with v2 loot tables.
8. Keep compact packed data patterns to protect bytecode size.
9. Add comments documenting each packed field because the next rewrite will otherwise be hard to audit.

Files touched or renamed:

- `contracts/IdleIslesContent.sol` -> new space content contract name
- `contracts/IIdleIslesContent.sol` -> new space content interface name

Verification:

- `npm run build:contracts`
- `npm run bytecode:contracts`

Rollback:

- Revert content contract files.

### Phase 7: Contract Tests Rewrite

Goal: ensure the new game has real on-chain confidence before deploy.

Steps:

1. Replace fantasy constants in `test/IdleIsles.ts`.
2. Test level curve still matches frontend.
3. Test profile creation grants starter Credits.
4. Test starter gathering:
   - Rock Hopper mints common ore.
   - Scrapper mints scrap/components.
   - Gas Skimmer mints gas/fuel precursor.
   - Surface Scanner mints biomass/data.
5. Test starter production:
   - Basic Fabricator creates a starter module.
   - Basic Hydroponics creates repair/life support supply.
   - Basic Refinery creates fuel cells.
   - Basic Nanofab creates ammo.
6. Test module slots:
   - Hardpoint.
   - Shield array.
   - Sensor suite.
   - Hull plating.
   - Engine core.
   - Auxiliary core.
7. Test combat:
   - Target Drone settles.
   - Hull damage occurs.
   - Engineering mitigates/extends survival.
   - Auto-repair consumes repair supplies.
   - Hull failure clears equipped modules and burns half Credits.
8. Test marketplace:
   - Create order.
   - Buy.
   - Cancel.
   - Credits cannot be listed.
9. Keep or update `IdleIslesHarness` only for deterministic tests.

Files touched:

- `test/IdleIsles.ts`
- `contracts/test/IdleIslesHarness.sol` if needed

Verification:

- `npm run test:contracts`
- `npm run verify`

Rollback:

- Revert test files.

### Phase 8: Chain Adapter Update

Goal: make Chain mode read and write the new contracts correctly.

Steps:

1. Replace `CONTRACT_FOOD_ITEMS` with a repair supply set such as `CONTRACT_REPAIR_SUPPLY_ITEMS`.
2. Remove or simplify combat style preference writes if style is removed.
3. Update ABI entries for the new contract signatures.
4. Update `readChainSnapshot` assumptions:
   - Skill order.
   - Item ID map.
   - Area/sector ID map.
   - Equipped module slots.
5. Update MOSS gameplay call list to the new signatures.
6. Update chain error copy to space terms.
7. Update approval and order flow to the new `TradeRelay` contract and ABI.

Files touched:

- `src/chain.ts`

Verification:

- `npm run build`
- Manual chain-mode smoke test on fresh deployment.

Rollback:

- Revert `src/chain.ts`.

### Phase 9: Styling and Cleanup

Goal: remove fantasy leftovers and make the interface coherent.

Steps:

1. Retheme colors and layout toward a utilitarian ship dashboard.
2. Avoid oversized marketing/landing page patterns. The first screen remains the actual game.
3. Remove old unused CSS scene selectors identified in `redundencies.md`.
4. Remove unused Vite starter assets if still deleted.
5. Remove unreferenced fantasy images/assets.
6. Ensure mobile layout has no overlapping text or controls.
7. Ensure cards are not nested inside cards.
8. Keep panels dense and operational rather than decorative.

Files touched:

- `src/App.css`
- `src/index.css`
- `public/favicon.svg` if branding changes
- Unused asset files if cleanup is approved

Verification:

- `npm run lint`
- `npm run build`
- Browser checks on desktop and mobile widths.

Rollback:

- Revert CSS/assets only.

### Phase 10: Deploy Fresh Space Contracts

Goal: create a new clean MegaETH testnet deployment.

Steps:

1. Run full verification locally.
2. Deploy with `npm run deploy:megaeth`.
3. Confirm `deployments/megaeth-testnet.json` contains new addresses.
4. Update local `.env` manually outside source control if testing locally.
5. Update Railway frontend variables to the new contract addresses.
6. Do not reuse old game or marketplace addresses.
7. Smoke test:
   - Create profile.
   - Start each starter gathering type.
   - Claim.
   - Produce a starter module.
   - Equip module.
   - Run starter combat.
   - List and buy/cancel a marketplace item.

Files touched:

- `deployments/megaeth-testnet.json`

Verification:

- `npm run verify`
- Manual chain smoke test.

Rollback:

- If the fresh v2 deploy is bad, disable Chain mode by removing env vars or roll the frontend back to the previous production build. Do not merge old chain state into v2.

### Phase 11: Documentation Refresh

Goal: make docs match v2 reality after implementation works.

Steps:

1. Update `README.md`.
2. Replace or archive `plan.md`.
3. Update `technical-breakdown.md`.
4. Update `solidity-notes.md`.
5. Update `docs/production-readiness.md`.
6. Document the fresh deployment and content source hash.
7. Document that old on-chain state was intentionally not migrated.

Files touched:

- `README.md`
- `plan.md`
- `technical-breakdown.md`
- `solidity-notes.md`
- `docs/production-readiness.md`

Verification:

- Docs review.

Rollback:

- Revert docs only.

## 12. First Implementation Batch

When implementation starts, the first safe batch should be:

1. Update `content/core/ids.json` to a small v2 space registry.
2. Regenerate `src/generated/contentIds.ts`.
3. Replace only `src/game.ts` local content and save key.
4. Make `npm run build` fail for expected App references, then fix App references in the next batch.

Do not start with contracts. Local mode is the fastest validation surface and will reveal naming/model mistakes before bytecode work begins.

## 13. Milestone Definitions

| Milestone | Goal | Success Criteria |
| --- | --- | --- |
| Milestone A | Local playable prototype | All 10 skills functional with basic Tier 1-2 content. |
| Milestone B | Full local experience | Tier 1-3 content across all skills plus basic marketplace. |
| Milestone C | Chain parity | Core gameplay loops work on-chain with tests and bytecode under budget. |
| Milestone D | Public testnet launch | Fresh deployment with stable local and chain experience. |

The detailed launch content targets are in Section 23. Milestone A can use a smaller temporary content subset, but Milestone D should satisfy the Section 23 launch scope.

## 14. Verification Gates

Run these at the end of every major phase:

```bash
npm run lint
npm run content:check
npm run build
```

Run these before any contract deploy:

```bash
npm run build:contracts
npm run bytecode:contracts
npm run test:contracts
npm run verify
```

Manual checks:

- Local save starts fresh under the new key.
- No old fantasy item appears in inventory, market, details, logs, or activity cards.
- No old fantasy skill appears in the skill list.
- Activity tabs show 4 gathering skills and 4 production skills.
- Combat panel uses hull/repair/module language.
- Trade Relay can create, buy, and cancel orders locally.
- Chain mode is unavailable or clearly requires fresh v2 addresses until deployment.
- Fresh chain profile starts from zero v2 state.

## 15. Removal Checklist

Remove or rewrite these fantasy concepts during implementation:

- Attack, Defence, Hitpoints, Woodcutting, Fishing, Mining, Smithing, Cooking, Crafting, Ranged, Magic.
- Crowns, logs, fish, ore/bar fantasy names, swords, leather armor, arrows, hides, rune dust.
- Starter Area, Outer Isles, Harbor Merchant, Hoard Hall labels.
- Field Rat, Goblin Forager, Giant Spider, Dire Wolf, Venomous Drake, Cave Bat, Bandit Scout, Crypt Knight, Hollow Treant.
- Ash Grove, River Bend, Copper Ridge, Wood Armory, Smelter, cooking recipes.
- Fantasy GameScene character/tools and background props.
- Old CSS scene remnants if they remain unused.
- Old contract packed tables.
- Old contract test constants.

Keep or adapt:

- ERC-1155 item ownership model.
- Marketplace escrow mechanics, renamed to Trade Relay.
- AFK cap and claim loop.
- Module burn/remint while equipped.
- Death/module loss mechanics.
- Auto-settle/auto-repair safety design.
- MOSS gameplay sessions updated to the new signatures.
- Content ID generation flow.
- Deployment script shape.

## 16. Main Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Large-file edits cause regressions | High | Phase work, run checks after every phase, keep changes scoped. |
| Skill order mismatch between TS and Solidity | High | Treat skill order as protocol, test `skillXp` reads explicitly. |
| Content ID drift | High | Update registry first, generate mappings, keep `content:check` green. |
| Contract bytecode over budget | High | Remove old styles/branches, keep packed tables, check size after every contract phase. |
| UI compiles but still shows fantasy terms | Medium | Run text search for fantasy terms after UI phase. |
| Local and chain simulation diverge | High | Contract tests and manual chain smoke tests before deploy. |
| Marketplace still assumes old currency name | Medium | Keep ID 1 as currency but rename everywhere to Credits. |
| Auto-repair accidentally causes death penalties on safety stop | High | Preserve current separation between death stop and safety stop. |
| Permanent module loss feels too punitive | Medium-high | Keep starter modules cheap, make Hull Failure warnings obvious, and reserve harsher risk for better rewards. |
| Ship identity is diluted by old equipment language | High | Treat `ShipState`, `ModuleSlot`, cargo, modules, and hull as acceptance-level naming requirements. |
| Sector gates block progression too early | Medium | Tune `orbitalDock` and `innerBelt` with local simulations before contract deployment. |
| Launch scope creeps toward old-game breadth | High | Cap launch content to Section 23 counts and defer extra systems explicitly. |
| UI becomes decorative instead of operational | Medium | Validate against Section 24: ship status, active mission, cargo, modules, and risk must stay visible. |
| Fresh deployment accidentally points to old frontend env vars | High | Verify Railway vars and deployment JSON before public testing. |

## 17. Text Search Audit

Before final deploy, search for these old terms:

```bash
rg -n "Crowns|Hoard Hall|Harbor|Isles|Woodcutting|Fishing|Mining|Smithing|Cooking|Crafting|Attack|Defence|Hitpoints|Ranged|Magic|Grove|Minnow|Dagger|Treant|Drake|Goblin|Rat|Sword|Arrow|Rune Dust|Leather|Bark|Copper|Tungsten" src contracts test content docs README.md plan.md solidity-notes.md technical-breakdown.md
```

Not every match is automatically wrong. Some docs may intentionally describe the old version during transition. No old fantasy terms should remain in active v2 UI, active v2 local content, active v2 contract content, or active v2 tests.

## 18. Acceptance Criteria

The migration is complete when:

- Local mode starts a fresh space profile.
- The skill list contains exactly 10 launch skills.
- The activity surface has 4 gathering skills, 4 production skills, and combat.
- Tier names from this plan are used in content or unlock descriptions.
- The starter loop is playable from gathering to production to combat.
- Hull, repair supply, cargo, module, sector, and mission language is used throughout the active UI.
- Trade Relay replaces Hoard Hall in the UI.
- Ship hull and equipped modules live under a first-class `ShipState`.
- Combat uses Gunnery for offensive cycles and Engineering for mitigation/repair cycles.
- Hull Failure permanently destroys equipped modules and burns 50% of Credits, while safety stops do not.
- Sector unlocks and `currentSectorId` drive mission availability.
- Launch content matches the Section 23 scope before public testnet.
- Main UI reads as a spaceship operations dashboard with ship status, mission state, cargo, and risk visible without excessive navigation.
- Fresh contracts deploy under bytecode budget.
- Contract tests cover starter gather, production, modules, combat, repair, death, and marketplace.
- Railway points to the fresh v2 contract addresses.
- Old live on-chain state is not required for the v2 game to function.

## 19. Recommended Work Order Summary

1. Registry reset.
2. Local game content reset.
3. Frontend UI rewire.
4. Space scene renderer.
5. Contract skill reset.
6. Contract content reset.
7. Contract tests rewrite.
8. Chain adapter update.
9. Styling cleanup.
10. Fresh deploy.
11. Documentation refresh.

This order keeps the fastest feedback loop first and delays contract bytecode work until the local game shape is proven.

## 20. Combat Resolution Model (v2)

For launch, Idle Galactica uses a simplified two-skill ship combat system built around Gunnery for offense and Engineering for defense/survival. Combat remains cycle-based and idle-friendly, but both combat skills must have clear value every time the player sends the ship into danger.

### Core Combat Loop

When a combat mission is active:

1. Each cycle, the ship attempts to engage the threat.
2. Gunnery determines offensive success: hit chance, damage dealt, ammo use, and Gunnery XP.
3. Engineering determines defensive performance: incoming damage mitigation, repair effectiveness, and Engineering XP.
4. The threat deals damage to the ship's hull.
5. If auto-repair is enabled and repair supplies are available, the ship attempts to restore hull before the next cycle.
6. If hull reaches 0, the mission ends in Hull Failure.

### Offensive Resolution: Gunnery

Gunnery is primarily driven by:

- Player Gunnery level.
- Equipped `hardpoint` module.
- Threat defensive value.
- Ammo availability if the hardpoint requires ammunition.

On a successful offensive cycle:

- The threat takes damage.
- The player gains Gunnery XP.
- If the hardpoint uses ammunition, consume 1 unit of the required ammo type.
- If the threat is defeated, resolve rewards and advance/settle the mission.

On a failed offensive cycle:

- No damage is dealt to the threat.
- The ship still risks incoming damage.
- No Gunnery XP is awarded for that offensive attempt.

### Defensive Resolution: Engineering

Incoming damage is calculated from the threat's attack power minus mitigation from:

- Player Engineering level.
- Equipped `shieldArray` module.
- Equipped `hullPlating` module.

Higher Engineering levels should provide better damage reduction and a chance to reduce incoming damage further. On cycles where the ship takes damage or successfully mitigates damage, the player gains Engineering XP. This keeps Engineering relevant during difficult fights even when Gunnery misses.

### Combat Resource Consumption

| Resource | Consumed By | Condition | Notes |
| --- | --- | --- | --- |
| Ammo | Gunnery | Equipped hardpoint requires ammo | Different hardpoints may use different ammo types. |
| Repair Supplies | Auto-repair | Auto-repair enabled and hull is damaged | Consumed only when repair actually occurs. |
| Hull Integrity | Threats | Every damaging threat cycle | Core survival resource. |

### Hull Failure

When hull reaches 0:

- The active mission ends immediately.
- All equipped modules are lost permanently.
- The player loses 50% of their Credits, rounded down.
- Current hull is set to 0.
- The player must manually recover/repair before starting another mission.

Safety stops are different from Hull Failure. Stopping because hull falls below the configured threshold must not destroy modules or burn Credits.

### Auto-Repair Behavior

Auto-repair replaces the old auto-eat behavior as a space-native survival system:

- The game checks before each cycle whether hull is below the configured threshold.
- If auto-repair is enabled and repair supplies are available, repair hull up to the threshold or max hull.
- If repair supplies are unavailable, continue only if the configured safety rules allow it.
- Repair supplies are consumed only when hull is actually restored.

### XP Distribution

| Skill | Gains XP When | Notes |
| --- | --- | --- |
| Gunnery | Successful offensive cycles | Primary damage skill. |
| Engineering | Ship takes damage, mitigates damage, or auto-repair is used | Rewards defensive play and survival. |

### Combat Data Requirements

Each combat mission should include:

- Threat hull/health.
- Threat attack power.
- Threat defense/evasion value.
- Cycle time.
- Gunnery XP on successful offensive cycles.
- Engineering XP on damage/mitigation cycles.
- Credit reward.
- Drop table.
- Required sector.
- Required Gunnery/Engineering levels.
- Optional required module or ammo type.

Do not add Piloting, Psionics, Xenobiology, or style-based combat at launch. The launch model should prove the two-skill loop first.

## 21. Sector Progression Model

Sectors replace the old Areas system. They represent regions of space with increasing difficulty, better rewards, stronger threats, and higher skill requirements.

### Launch Sector Structure

| Sector ID | Display Name | Difficulty | Primary Content Focus | Unlock Method | Recommended Skill Level |
| --- | --- | --- | --- | --- | --- |
| `orbitalDock` | Orbital Dock | Starter | Basic gathering, production, and simple threats | Starting sector | Level 1 |
| `innerBelt` | Inner Belt | Early | Mid-tier resources and stronger threats | Credit cost plus skill requirements | Level 8-12 |
| `outerExpanse` | Outer Expanse | Mid/future | High-value resources, dangerous threats, anomalies | Credit cost plus higher skills | Level 20-25 |

For launch, implement `orbitalDock` and `innerBelt`. Treat `outerExpanse` as planned future content unless there is enough content to make it meaningful.

### Unlock Rules

Sector unlocking should be permanent per profile.

- Credit cost: players pay a one-time Credit fee to unlock a sector.
- Skill requirements: sectors can require minimum levels in key skills, such as Asteroid Mining 10 and Engineering 8.
- Ship capability: future sectors can require minimum module quality or total ship power, but this is not required at launch.

### Content Distribution

- Orbital Dock: starter gathering activities, starter production, basic combat threats, and low-risk recovery loops.
- Inner Belt: first meaningful resource variety, Tier 2 and Tier 3 activities, stronger combat threats, and better module recipes.
- Outer Expanse: Tier 4 and Tier 5 activities, dangerous anomalies, rare resources, elite threats, and sector-specific drops.

### Mission Availability

- Most missions are tied to a specific sector.
- Higher-tier gathering and production activities should appear in more advanced sectors.
- Combat threats should scale with sector difficulty.
- UI should filter mission lists by the current sector while still making locked sector goals visible enough to guide progression.

### Implementation Notes

- Store unlocked sectors as a bitmask or compact array locally and on-chain.
- Store `currentSectorId` in player state.
- Use `travelToSector(sectorId)` to move between unlocked sectors.
- If the target sector is locked, `travelToSector` should validate requirements and burn the one-time Credit cost.
- Keep sector unlock logic simple for launch so it does not compete with the core resource/combat rewrite.

## 22. Ship Identity & Module Philosophy

In Idle Galactica, the ship is the central character and primary progression vehicle, not the player avatar. This is a deliberate philosophical shift from Idle Isles, where the player equipped personal gear.

### Core Design Principles

| Principle | Description | Implementation Implication |
| --- | --- | --- |
| The Ship is the Character | Progression is expressed through ship capabilities and modules. | UI and state should center the ship, not a humanoid avatar. |
| Modules are Ship Systems | Modules represent physical ship components. | Use a dedicated `ModuleSlot` enum instead of generic equipment slots. |
| Identity Through Loadout | Power and playstyle come from the current ship configuration. | The loadout panel should show the ship as one coherent system. |
| Risk and Attachment | Hull Failure permanently destroys equipped modules. | Equipped modules are removed from cargo and lost on death. |
| Future Extensibility | Ships can later gain base stats, upgrades, names, classes, or multiple hulls. | Keep ship state separate from cargo and profile state. |

### Launch Module Slots

The ship has six fixed launch module slots.

| Slot | Primary Role | Associated Skill | Example Modules |
| --- | --- | --- | --- |
| `hardpoint` | Offense: damage and accuracy | Gunnery | Light Turret, Missile Launcher |
| `shieldArray` | Active defense: shields | Engineering | Basic Shield Generator |
| `hullPlating` | Passive defense: armor | Engineering | Reinforced Hull Plating |
| `sensorSuite` | Utility and detection | Exo-Surveying / Wreck Salvage | Survey Scanner, Salvage Array |
| `engineCore` | Mobility, future evasion, future travel speed | Piloting later | Basic Thrusters |
| `auxiliaryCore` | Utility and special systems | Various | Drone Bay, Repair Drone |

### How Modules Interact With Skills

- Gunnery primarily scales with the `hardpoint` module and the player's Gunnery level.
- Engineering primarily scales with `shieldArray`, `hullPlating`, and the player's Engineering level.
- Sensor Suite and Auxiliary Core modules can provide utility bonuses for gathering, surveying, salvage, production, or future automation.
- At launch, modules are the main way players customize combat effectiveness.

### Ship State Model

The recommended model is:

```ts
interface ShipState {
  currentHull: number
  maxHull: number
  modules: Partial<Record<ModuleSlot, ItemId>>
  // Future: baseShipStats, shipName, shipLevel, shipClass, etc.
}
```

Key rules:

- Equipping a module removes it from cargo and stores it on the ship.
- Manual unequip returns/remints the module to cargo.
- Hull Failure permanently destroys equipped modules.
- Modules directly modify combat calculations such as damage, accuracy, shielding, armor, mitigation, and hull bonuses.

### UI and Player Perception Goals

- The player should feel like they are upgrading a ship, not equipping a character.
- Hull Failure should feel like losing ship components, not losing personal gear.
- The old equipment panel should become Ship Modules or Ship Loadout.
- Combat screens should show the ship, hull, module status, threat, and repair supply state clearly.
- Future versions can expand into ship naming, paint, refits, classes, or multiple ships.

### Long-Term Vision

The launch model should support future additions without another structural rewrite:

- Base ship stats that modules modify.
- Ship upgrades or refits that permanently improve hull and system capacity.
- Multiple ships that can be switched or specialized.
- Ship classes with different slot layouts or bonuses.
- Module rarity, manufacturer traits, or set bonuses.

This philosophy keeps the game feeling like a space idle game rather than a fantasy character with a sci-fi skin.

## 23. Launch Content Priorities

To keep scope manageable and deliver a coherent playable experience, the initial Idle Galactica release should focus on a tight, well-balanced content slice rather than trying to match the breadth of the original game immediately.

### Recommended Launch Content Scope

| Category | Target Count | Notes |
| --- | ---: | --- |
| Skills | 10 | The exact 10 skills defined in Section 4. |
| Sectors | 2 | Orbital Dock and Inner Belt. |
| Items | 35-45 | Focus on resources, modules, ammo, repair supplies, and core production materials. |
| Gathering Activities | 12-15 | 3-4 tiers per gathering skill. |
| Production Activities | 12-15 | At least 2-3 recipes per production skill. |
| Combat Threats | 8-10 | Mix easy, medium, and challenging threats. |
| Ship Modules | 12-15 | Spread across all 6 module slots. |
| Repair Supplies | 4-6 | Different tiers of repair and life support items. |

### Launch Content Philosophy

- Quality over quantity: every activity should feel meaningful and connected to ship progression.
- Clear progression: players should naturally move from Tier 1 to Tier 2 to Tier 3 without major roadblocks.
- Economic coherence: gathered resources should feed into production, which enables stronger combat and better gathering.
- Ship focus: most rewards should improve the ship or sustain it through fuel, repair supplies, ammo, modules, or advanced materials.

### Deferred Content

Plan these explicitly for post-launch updates:

- Additional sectors, starting with Outer Expanse and beyond.
- Piloting as a third combat or ship-control skill.
- Psionics and Xenobiology.
- AI Core Programming and automation systems.
- Ship naming, customization, paint, refits, or multiple ships.
- Faction systems and diplomacy.
- Deep story or narrative events.
- Advanced anomalies and special events.

### Launch Milestone Readiness

| Milestone | Goal | Success Criteria |
| --- | --- | --- |
| Milestone A | Local playable prototype | All 10 skills functional with basic Tier 1-2 content. |
| Milestone B | Full local experience | Tier 1-3 content across all skills plus basic marketplace. |
| Milestone C | Chain parity | Core gameplay loops work on-chain with tests. |
| Milestone D | Public testnet launch | Fresh deployment with stable local and chain experience. |

This focused scope gives the game a strong identity from day one while leaving clear room to expand later.

## 24. UI/UX Philosophy

The Idle Galactica interface should feel like a utilitarian spaceship operations dashboard rather than a traditional fantasy RPG interface.

### Core UI Principles

| Principle | Description | Implementation Guidance |
| --- | --- | --- |
| Ship-Centric | The player should always feel like they are managing their ship. | Keep Hull, Modules, Cargo, and current mission prominent in the main view. |
| Operational Density | Information should be dense but scannable. | Use compact cards, clear icons, stable panel layouts, and grouped controls. |
| Clarity Over Flavor | Readable information matters more than heavy theming. | Use clean typography, direct labels, and consistent iconography. |
| Idle-First | The game should feel good when running mostly in the background. | Make active missions, claimable rewards, offline progress, and safety stops obvious. |
| Risk Awareness | Combat and Hull Failure should feel meaningful without UI ambiguity. | Show hull state, repair supply count, auto-repair settings, and module-loss risk clearly. |

### Key Interface Shifts

| Old Concept | New Concept | UI Treatment |
| --- | --- | --- |
| Equipment Panel | Ship Modules / Ship Loadout | Rename panel and show a ship silhouette or module layout. |
| Inventory | Cargo Hold | Use cargo-themed language, filters, and icons. |
| Hitpoints | Hull Integrity | Prominent hull bar with repair supply integration. |
| Auto-eat | Auto-repair | Clear toggle with repair supply counter. |
| Food | Repair Supplies | Separate from general cargo where useful. |
| Hoard Hall | Trade Relay | Rename marketplace and use space trading terminology. |
| Areas | Sectors | Use sector selection with visible unlock requirements. |

### Recommended Layout Direction

- Left panel: Skills and progression.
- Center panel: Mission selection and current mission status.
- Right panel: Ship status, Hull, Modules, and Cargo summary.
- Bottom panel: Trade Relay and Event Log.

The goal is to make the ship feel like the persistent entity the player is investing in while keeping critical information visible without excessive clicking.

### Visual Direction

- Use a darker, industrial palette with blues and grays as the base and orange/red only for alerts or high-priority states.
- Use technical and sci-fi icons rather than fantasy item silhouettes.
- Keep scene rendering focused on ships, drones, beams, scan effects, nebulae, wrecks, asteroids, and sector environments.
- Avoid decorative elements that do not improve gameplay clarity.
- Keep the first screen as the actual playable dashboard, not a landing page.

This philosophy helps Idle Galactica feel like a distinct space idle experience from the first screen.
