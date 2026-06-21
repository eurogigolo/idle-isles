# Idle Isles Technical Breakdown

This document records the current implementation of Idle Isles as of the local prototype in this repository. It covers the playable React simulation, the gameplay data model, the progression math, combat/cooking/economy systems, and the current Solidity foundation.

## 1. Project Shape

Idle Isles is currently a Vite + React + TypeScript idle RPG prototype with a Solidity contract foundation.

Primary files:

- `src/App.tsx`: application shell, local/chain mode UI, wallet/network UI, activity controls, equipment/inventory UI, Hoard Hall UI, and event log.
- `src/chain.ts`: MegaETH Testnet contract configuration, minimal `IdleIsles` ABI, profile snapshot reads, and core write helpers.
- `src/game.ts`: authoritative local simulation data and pure gameplay functions.
- `src/App.css`: visual layout, responsive UI, and CSS-rendered activity scenes.
- `contracts/IdleIsles.sol`: current Solidity alpha foundation for profile creation, combat settlement, equipment, food, marketplace orders, death penalty, and session settlement.
- `contracts/IdleIslesContent.sol`: immutable static content contract for item slots, item stats, food healing, combat activity definitions, and combat drop tables.
- `contracts/IIdleIslesContent.sol`: interface shared by the core contract and the deployed content contract.
- `content/core/ids.json`: checked core namespace and numeric ID registry for areas, items, and activities. It generates frontend chain mappings and remains migration scaffolding before full content generation becomes the source of truth.
- `hardhat.config.ts`: Hardhat 3 configuration for contract builds/tests using the viem, network helper, and Node test-runner plugins, Solidity 0.8.28, and 1 optimizer run on both default and production profiles. The contract pragma remains `^0.8.24`, but OpenZeppelin 5.6.1 requires a compiler new enough for the `mcopy` builtin. Optimized default builds are required because bytecode size is a hard constraint for the stateful core contract. The optimizer is biased toward smaller deployed bytecode because gameplay content is currently the limiting factor.
- `scripts/deploy.ts`: Hardhat 3 + viem deployment script for the `IdleIslesContent` and `IdleIsles` contract pair. It writes deployment addresses to `deployments/<network>.json`.
- `scripts/check-bytecode-size.mjs`: deployed bytecode budget gate. `IdleIsles` currently has a 24,200-byte project budget below the 24,576-byte EIP-170 hard limit.
- `scripts/check-content-ids.mjs`: validates the core ID registry for namespace format, uniqueness, and basic references.
- `scripts/generate-content-ids.mjs`: generates `src/generated/contentIds.ts` from the checked core ID registry.
- `test/IdleIsles.ts`: Node test runner + viem contract tests for level thresholds, profile creation, and training combat settlement.
- `plan.md`: playable alpha roadmap.
- `solidity-notes.md`: contract parity checklist and onchain implementation notes.
- `technical-breakdown.md`: this document.

Current stack:

- React
- TypeScript
- Vite
- lucide-react icons
- Plain CSS
- Solidity `^0.8.24`
- OpenZeppelin ERC-1155, ERC1155Holder, ReentrancyGuard
- Hardhat 3 with `@nomicfoundation/hardhat-toolbox-viem` for contract tests
- Node.js built-in test runner through the Hardhat toolbox
- `dotenv` for local `.env` deployment configuration

Tooling boundaries:

- ESLint ignores generated output directories: `dist`, `artifacts`, and `cache`.
- Hardhat writes ABI/build artifacts into `artifacts` and compile metadata into `cache`; those files are generated and are not linted as source.

The app is still primarily a local simulation. A small opt-in Chain mode can connect to a configured deployed `IdleIsles` contract and route core profile, activity, claim, equipment, food, and marketplace actions through wallet transactions.

## 2. Product Direction

The design target is:

- Game first, chain second.
- Passive idle progression inspired by Melvor Idle.
- Skill and gear progression inspired by Old School RuneScape.
- Onchain asset transferability as the reason for blockchain use.
- A Hoard Hall economy where player-owned items can become real market goods.
- Combat risk that prevents infinite unattended combat.
- Clear gather -> artisan -> combat -> market loops.

Current playable loop:

1. Start one active activity.
2. Time passes.
3. Completed cycles become claimable.
4. Claiming grants XP/items or consumes materials.
5. Combat cycles auto-resolve while the app is open and can damage the player.
6. Combat safety settings can auto-eat food and stop combat at a configured HP threshold while auto-eat is enabled.
7. Food restores Hitpoints.
8. Equipment changes stats and unlocks harder combat.
9. Items can be listed, bought, cancelled, and inspected in a local Hoard Hall simulation.

## 3. Local Game State

The core local state is `GameState` in `src/game.ts`.

```ts
interface GameState {
  skills: SkillBook
  inventory: Inventory
  equipment: Equipment
  marketOrders: MarketOrder[]
  combatSettings: CombatSettings
  currentHitpoints: number
  active: {
    id: ActivityId
    startedAt: number
    lastClaimAt: number
  } | null
  log: string[]
}
```

Combat safety settings:

```ts
interface CombatSettings {
  autoEat: boolean
  stopAtHitpoints: number
  foodItemId: ItemId | null
  maxFoodPerClaim: number
}
```

These settings are local simulation parity for the contract's auto-settle session configuration. They are stored on the local profile so refreshes do not reset AFK safety behavior.

Local area state is also persisted on the profile:

```ts
currentAreaId: AreaId
unlockedAreaIds: AreaId[]
```

Every profile starts in the Starter Area. The Outer Isles route is unlocked by paying the Harbor Merchant 50,000 Crowns for ship passage; Chain mode stores the same current/unlocked area state onchain.

Persistence:

- Storage key: `idle-isles-save-v1`
- Storage mechanism: `window.localStorage`
- Existing saves are normalized through `normalizeState`.
- Invalid or removed item/activity references are ignored during normalization.
- Missing new state fields, such as `marketOrders`, `combatSettings`, `currentAreaId`, and `unlockedAreaIds`, receive defaults.

Initial state:

- Every skill starts at 0 XP.
- Inventory starts with 80 Crowns and 0 of every other item.
- Equipment slots are empty.
- Current Hitpoints starts at 10.
- Current area starts at Starter Area.
- Unlocked areas starts with Starter Area only.
- Combat safety starts with auto-eat off, stop-at HP 6, cooked Minnow selected, and max 12 food per claim.
- No activity is active.
- Market orders are seeded from realm liquidity.
- Log starts with `Profile minted locally.`

## 4. Skills

Current skills:

| Skill | Purpose |
| --- | --- |
| Attack | Combat unlocks and combat speed through gear interaction |
| Defence | Combat unlocks and incoming damage mitigation |
| Hitpoints | Max HP growth and combat survival |
| Woodcutting | Logs for early equipment/material loops |
| Fishing | Raw food supply |
| Mining | Ores and coal for smithing |
| Smithing | Bars and equipment |
| Cooking | Converts raw fish into healing food |
| Crafting | Converts monster hides/scales and logs into light armor |

Future skills are mentioned in the plan but not implemented: Ranged, Magic, Fletching, Slayer, Farming, Prayer.

## 5. Progression Math

### Level Curve

The frontend and contract currently use the same integer-safe XP formula.

```text
n = level - 1
xpRequiredForLevel(level) = 75n^2 + 45n^3 + n^4
```

Properties:

- Level 1 requires 0 XP.
- `levelFromXp` starts at level 1 and loops up to level 99.
- The formula has a fast early curve and a long late-game tail.
- It avoids floating point math so it can be mirrored onchain.

Known thresholds:

| Level | Required XP |
| ---: | ---: |
| 1 | 0 |
| 2 | 121 |
| 5 | 4,336 |
| 10 | 45,441 |
| 25 | 997,056 |
| 35 | 3,191,716 |
| 55 | 15,807,636 |
| 70 | 37,807,101 |
| 99 | 135,310,756 |

Tier pacing target:

- T1/T2: first session.
- T3 Iron: repeated sessions.
- T4 Steel: starts around level 35 and should take roughly 3 weeks of daily capped play once material and crafting friction are included.
- T5 Tungsten: starts around level 55 and should take roughly 2 months of daily capped play once high-tier gathering, boss drops, and crafting friction are included.

### Skill Progress Bar

For a skill with XP `x`:

```text
level = levelFromXp(x)
current = xpRequiredForLevel(level)
next = xpRequiredForLevel(level + 1)
progressPercent = ((x - current) / (next - current)) * 100
```

The UI clamps progress to `[0, 100]`.

### XP Rate

Activity definitions store base XP. The current live rate applies a global `2x` multiplier when XP is awarded:

```text
awardedXp = baseActivityXp * completedCycles * 2
```

The level curve is unchanged. Local mode applies the multiplier in claim preview/application, and the contract applies the same rule through `_grantSkillXp`.

## 6. Hitpoints Math

Hitpoints has both:

- A skill level.
- A current resource value.

Max HP:

```text
baseMaxHp = 10 + (hitpointsLevel - 1) * 3
maxHp = baseMaxHp + equipmentHitpointsBonus
```

Food restores current HP, capped at max HP. Eating food does not grant Hitpoints XP.

Current HP is clamped during state normalization and after equipment changes in the contract. Frontend equipment currently does not consume inventory when equipping; the contract burns/escrows equipped items and remints on unequip.

## 7. Activity System

Each activity is data-driven with this shape:

```ts
interface ActivityDefinition {
  id: ActivityId
  name: string
  zone: string
  group: 'Gather' | 'Combat' | 'Artisan'
  scene: 'forest' | 'river' | 'mine' | 'arena' | 'forge'
  primarySkill: SkillId
  levelReqs: Partial<Record<SkillId, number>>
  cycleMs: number
  xp: Partial<Record<SkillId, number>>
  rewards: Partial<Record<ItemId, number>>
  costs?: Partial<Record<ItemId, number>>
  requiredEquipment?: ItemId
  combat?: CombatRules
  cooking?: CookingRules
}
```

Only one activity can be active at a time.

Areas:

- Activities still keep their `zone` label for display.
- `ZONE_AREAS` maps later zones such as Greywild, Saltmarsh, Mooncut Mine, Deep Crucible, Ridge Road, and Old Crypt to `outerIsles`.
- Unmapped zones belong to `starterArea`.
- `getActivityLocks` now includes area locks before skill/equipment locks.
- `travelToArea` claims completed local cycles, unlocks the destination if the player can pay its ship cost, sets `currentAreaId`, and stops the active task for travel.
- Chain mode writes current/unlocked area state onchain and uses `travelToArea(uint8)` to burn Crowns for first Outer Isles passage.

Activity start flow:

1. Existing completed cycles are claimed first.
2. The selected activity is checked for lock requirements.
3. If locked, the log records the missing requirement.
4. If unlocked, `active` is replaced with the selected activity and current timestamps.

Lock checks:

- Required skill levels.
- Current HP above 0 for combat.
- Required equipped item, if any.

The UI shows the first lock reason and a count of additional requirements, with the full list in the tooltip.

## 8. AFK Claim Math

AFK cap:

```text
AFK_CAP_MS = 8 * 60 * 60 * 1000
```

Claim preview:

```text
elapsedMs = clamp(now - lastClaimAt, 0, AFK_CAP_MS)
rawCycles = floor(elapsedMs / adjustedCycleMs)
affordableCycles = min(floor(inventory[item] / cost[item]) for each cost)
possibleCycles = min(rawCycles, affordableCycles)
```

For combat, `possibleCycles` is then passed through cycle-by-cycle HP resolution. Fatal cycles do not grant XP or rewards.

For non-combat:

- Costs are multiplied by completed cycles.
- Rewards are multiplied by completed cycles.
- Base XP is multiplied by completed cycles and then by the global 2x XP rate.
- `lastClaimAt` advances by `cycles * cycleMs`, preserving partial progress.

For cooking:

- Costs are raw fish.
- Rewards are cooked fish only for successful cycles.
- Burned food is tracked separately and disappears.

## 9. Cycle Speed Math

Cycle duration is adjusted by equipment stats.

Frontend combat:

```text
combatMultiplier = max(0.68, 1 - speed * 0.025 - attack * 0.012)
cycleMs = max(2500, round(baseCycleMs * combatMultiplier))
```

Frontend non-combat:

```text
nonCombatMultiplier = max(0.8, 1 - speed * 0.015)
cycleMs = max(2500, round(baseCycleMs * nonCombatMultiplier))
```

Contract combat:

```text
reductionBps = speed * 250 + attack * 120
reductionBps = min(reductionBps, 3200)
adjustedSeconds = activitySeconds * (10000 - reductionBps) / 10000
adjustedSeconds = max(adjustedSeconds, 3)
```

The frontend and contract are directionally aligned, but they are not exactly identical in units or caps. This should be reconciled before contract-authoritative gameplay.

## 10. Deterministic Randomness

Frontend roll function:

```text
x = sin(seedA * 12.9898 + seedB * 78.233 + salt * 37.719) * 43758.5453
rollPercent = fractionalPart(x) * 100
```

Usage:

- Combat hit checks use salt `17`.
- Combat damage amount uses salt `31`.
- Cooking burn checks use salt `53`.
- Rare drops use salt `71 + dropIndex * 13`.

Cycle index:

```text
cycleIndex = floor((lastClaimAt - startedAt) / cycleMs) + offset
```

This gives deterministic local results for the same activity session and cycle index.

Contract roll function:

```text
rollBps = uint256(keccak256(
  player,
  startedAt,
  cycleIndex,
  salt,
  block.prevrandao,
  blockhash(block.number - 1)
)) % 10000
```

This is acceptable for an alpha/testnet foundation but not strong enough for valuable production rare drops. `solidity-notes.md` still tracks commit/reveal or stronger randomness as required production work.

## 11. Combat System

Current combat activities:

| Activity | Requirements | Equipment | Cycle | XP | Base Rewards |
| --- | --- | --- | ---: | --- | --- |
| Training Yard | Attack 1 | none | 7s | 15 Atk, 8 Def, 8 HP | 1 Tanned Hide, 2 Crowns |
| Field Rat | Attack 4, HP 3 | none | 8.5s | 22 Atk, 10 Def, 13 HP | 1 Tanned Hide, 4 Crowns, 1 Raw Minnow |
| Moss Camp | Attack 8, Def 7, HP 7 | Copper Dagger | 11s | 35 Atk, 22 Def, 20 HP | 1 Thick Hide, 8 Crowns, 1 Rune Dust |
| Goblin Forager | Attack 10, Def 8, HP 10 | none | 10s | 42 Atk, 28 Def, 25 HP | 1 Thick Hide, 6 Crowns |
| Giant Spider | Attack 20, Def 18, HP 18 | Iron Sword | 12s | 60 Atk, 35 Def, 35 HP | 1 Rugged Hide, 12 Crowns |
| Dire Wolf | Attack 35, Def 30, HP 32 | Steel Longsword | 15s | 85 Atk, 55 Def, 60 HP | 1 Cobalt Scale, 45 Crowns |
| Venomous Drake | Attack 55, Def 50, HP 55 | Tungsten Blade | 22s | 160 Atk, 105 Def, 110 HP | 1 Wyrm Hide, 90 Crowns |
| Cave Bat | Attack 16, Def 14, HP 14 | Iron Sword | 12.5s | 52 Atk, 28 Def, 30 HP | 2 Tanned Hide, 22 Crowns |
| Bandit Scout | Attack 24, Def 21, HP 21 | Iron Sword | 14s | 68 Atk, 38 Def, 42 HP | 2 Thick Hide, 35 Crowns |
| Crypt Knight | Attack 38, Def 35, HP 36 | Steel Longsword | 17s | 95 Atk, 64 Def, 68 HP | 58 Crowns, 1 Rune Dust |
| Hollow Treant | Attack 55, Def 50, HP 52 | Steel Longsword | 26s | 180 Atk, 120 Def, 120 HP | 140 Crowns, 4 Pine Logs, 1 Rune Dust |

Combat damage:

```text
if rollPercent(startedAt, cycleIndex, 17) >= damageChance:
  damage = 0
else:
  range = maxDamage - minDamage + 1
  rawDamage = minDamage + floor((rollPercent(startedAt, cycleIndex, 31) / 100) * range)
  mitigation = floor((defenceLevel - 1) / 5) + floor(equipmentDefence / 3)
  damage = max(0, rawDamage - mitigation)
```

If damage would reduce HP to 0 or below:

- The current cycle is fatal.
- Fatal cycle does not grant XP or rewards.
- HP loss is capped at remaining HP.
- Combat stops.
- Death penalty is applied.

Death penalty:

- Current HP becomes 0.
- Active task is cleared.
- All equipped items are lost.
- Half of Crowns are lost, rounded down.

Combat safety:

- Safety is checked before each simulated combat cycle.
- Stop-at HP is active only while auto-eat is enabled.
- If auto-eat is enabled and HP is at or below the configured threshold, the selected food is consumed before the next cycle if available.
- Food use is limited by `maxFoodPerClaim`.
- If food raises HP above the threshold, combat continues.
- If no selected food is available, max food is exhausted, or food does not raise HP above the threshold, combat stops without applying the death penalty.
- The effective threshold is clamped below max HP:

```text
effectiveStopHp = min(configuredStopHp, max(1, maxHp - 1))
```

Auto-eat restoration:

```text
restored = min(maxHp, currentHp + foodHealAmount) - currentHp
currentHp += restored
foodQuantity -= 1
```

Preview state now separates:

- `stoppedByHp`: death/fatal combat stop.
- `stoppedBySafety`: non-death safety stop.

This prevents safety stops from triggering gear and Crown loss.

Frontend auto-combat:

- A React interval checks every second.
- If the active activity is combat, `applyClaim` is called automatically.
- This means damage and combat rewards resolve after each completed combat cycle while the app is open.
- Auto-eaten food, restored HP, safety stops, and death stops are all applied from the returned claim state even when zero reward cycles complete.
- Non-combat activities still require manual claim.

Rare drops:

| Monster | Drop | Chance |
| --- | --- | ---: |
| Goblin Forager | Pine Logs | 15% |
| Goblin Forager | Rune Dust | 5% |
| Giant Spider | Raw Cod | 10% |
| Giant Spider | Coal | 5% |
| Dire Wolf | Raw Tuna | 15% |
| Dire Wolf | Cobalt Ore | 8% |
| Venomous Drake | Raw Manta | 12% |
| Venomous Drake | Tungsten Ore | 5% |
| Venomous Drake | Rune Dust | 10% |
| Cave Bat | Raw Trout | 18% |
| Cave Bat | Rune Dust | 6% |
| Bandit Scout | Iron Helm | 3.5% |
| Bandit Scout | Steel Bar | 5% |
| Crypt Knight | Steel Helm | 2.5% |
| Crypt Knight | Steel Plate | 1.5% |
| Crypt Knight | Tungsten Ore | 4% |
| Hollow Treant | Treant Bark | 18% |
| Hollow Treant | Steel Plate | 4% |
| Hollow Treant | Tungsten Ore x2 | 3% |
| Hollow Treant | Hollow Seed | 0.7% |

## 12. Cooking System

Cooking converts raw fish into cooked food. Raw fish cannot be eaten.

Burn chance:

```text
burnChance = baseBurnChance - (cookingLevel - 1) * burnReductionPerLevel
burnChance = max(minBurnChance, round(burnChance * 10) / 10)
```

For each cooking cycle:

```text
if rollPercent(startedAt, cycleIndex, 53) < burnChance:
  raw fish is consumed and no cooked fish is produced
else:
  raw fish is consumed and cooked fish is produced
```

Cooking activities:

| Activity | Level | Cycle | XP | Burn Rules | Food Output |
| --- | ---: | ---: | ---: | --- | --- |
| Cook Minnow | 1 | 4.2s | 14 | base 35%, min 0%, -3/level | Cooked Minnow, heals 3 |
| Cook Trout | 5 | 5.6s | 30 | base 50%, min 5%, -2.5/level | Cooked Trout, heals 6 |
| Cook Cod | 12 | 7s | 48 | base 60%, min 6%, -2/level | Cooked Cod, heals 9 |
| Cook Tuna | 24 | 8.8s | 82 | base 75%, min 8%, -1.7/level | Cooked Tuna, heals 14 |
| Cook Manta | 38 | 11.5s | 145 | base 95%, min 10%, -1.6/level | Cooked Manta, heals 21 |
| Cook Leviathan | 58 | 17s | 310 | base 110%, min 12%, -1.4/level | Cooked Leviathan, heals 34 |

Eating food:

- Only items with `healAmount` can be eaten.
- Food is consumed by 1.
- HP restored is `min(maxHp, currentHp + healAmount) - currentHp`.
- Eating at full HP is rejected.

## 13. Gathering Content

Woodcutting:

| Activity | Level | Cycle | XP | Output |
| --- | ---: | ---: | ---: | --- |
| Ash Grove | 1 | 5s | 18 | 2 Ash Logs |
| Pine Stand | 4 | 7.2s | 32 | 2 Pine Logs |
| Oakwood | 8 | 9.2s | 56 | 2 Oak Logs |
| Ironbark Trees | 16 | 13s | 95 | 1 Ironbark Log |
| Elderwood Grove | 28 | 17.5s | 150 | 1 Elder Log |
| Spiritwood Grove | 48 | 25s | 275 | 1 Spiritwood Log |

Fishing:

| Activity | Level | Cycle | XP | Output |
| --- | ---: | ---: | ---: | --- |
| River Bend | 1 | 6s | 20 | 2 Raw Minnow |
| Lake Dock | 5 | 8.5s | 38 | 1 Raw Trout |
| Coastal Net | 12 | 10.5s | 66 | 1 Raw Cod |
| Deepwater Line | 24 | 14.5s | 118 | 1 Raw Tuna |
| Storm Pier | 38 | 20.5s | 205 | 1 Raw Manta |
| Abyssal Pool | 58 | 32s | 420 | 1 Raw Leviathan |

Mining:

| Activity | Level | Cycle | XP | Output |
| --- | ---: | ---: | ---: | --- |
| Copper Ridge | 1 | 6.5s | 20 | 2 Copper Ore |
| Tin Hollow | 1 | 6.5s | 20 | 2 Tin Ore |
| Iron Vein | 8 | 8.2s | 34 | 2 Iron Ore |
| Coal Cut | 25 | 12.5s | 72 | 1 Coal |
| Tungsten Lode | 55 | 18s | 140 | 1 Tungsten Ore |

Silver, gold, runite, and star ore were intentionally removed from the active gather/market surface because they had no current artisan sink. They are reserved for future jewelry/trinket or post-T5 expansions.

## 14. Artisan and Equipment Content

Smithing and crafting activities:

| Activity | Level | Cycle | Cost | Output |
| --- | ---: | ---: | --- | --- |
| Wood Armory | 1 | 5.6s | 3 Ash Logs | Wood Club, Bark Shield, Bark Vest |
| Bark Leggings | 2 | 6.5s | 2 Ash Logs, 1 Tanned Hide | Bark Leggings |
| Copper Smelter | 1 | 8s | Copper Ore, Tin Ore, Ash Log | Copper Bar |
| Iron Smelter | 8 | 11s | 2 Iron Ore, 1 Coal | Iron Bar |
| Copper Dagger | 4 | 10s | 3 Copper Bar, 2 Ash Logs | Copper Dagger |
| Copper Armor | 6 | 12s | 4 Copper Bar, 1 Tanned Hide | Copper Helm, Copper Plate |
| Copper Legs | 7 | 12.5s | 3 Copper Bar, 1 Tanned Hide | Copper Legs |
| Iron Sword | 10 | 13s | 3 Iron Bar, 1 Pine Log | Iron Sword |
| Iron Armor | 16 | 15s | 5 Iron Bar, 2 Tanned Hide | Iron Helm, Iron Plate |
| Iron Legs | 18 | 16s | 4 Iron Bar, 2 Tanned Hide | Iron Legs |
| Steel Smelter | 35 | 15s | 2 Iron Bar, 2 Coal | Steel Bar |
| Steel Longsword | 38 | 17.5s | 3 Steel Bar, 1 Rune Dust | Steel Longsword |
| Steel Armor | 40 | 19s | 5 Steel Bar, 3 Thick Hide | Steel Helm, Steel Plate |
| Steel Legs | 42 | 20s | 4 Steel Bar, 2 Thick Hide | Steel Legs |
| Tungsten Smelter | 55 | 22s | 2 Tungsten Ore, 2 Coal | Tungsten Bar |
| Tungsten Blade | 60 | 26s | 3 Tungsten Bar, 3 Rune Dust | Tungsten Blade |
| Tungsten Armor | 62 | 29s | 5 Tungsten Bar, 4 Rune Dust | Tungsten Helm, Tungsten Plate |
| Tungsten Legs | 64 | 30s | 4 Tungsten Bar, 3 Rune Dust | Tungsten Legs |
| Craft Leather Cowl | 1 Crafting | 5s | 2 Tanned Hide, 1 Ash Log | Leather Cowl |
| Craft Leather Chaps | 3 Crafting | 6s | 3 Tanned Hide, 1 Ash Log | Leather Chaps |
| Craft Leather Body | 4 Crafting | 7s | 4 Tanned Hide, 1 Ash Log | Leather Body |
| Craft Hardleather Cowl | 10 Crafting | 8.5s | 2 Thick Hide, 1 Pine Log | Hardleather Cowl |
| Craft Hardleather Chaps | 12 Crafting | 9.5s | 3 Thick Hide, 1 Pine Log | Hardleather Chaps |
| Craft Hardleather Body | 15 Crafting | 11s | 4 Thick Hide, 1 Pine Log | Hardleather Body |
| Craft Carapace Cowl | 25 Crafting | 12.5s | 2 Rugged Hide, 1 Oak Log | Carapace Cowl |
| Craft Carapace Legs | 28 Crafting | 13.5s | 3 Rugged Hide, 1 Oak Log | Carapace Legs |
| Craft Carapace Body | 32 Crafting | 15s | 4 Rugged Hide, 1 Oak Log | Carapace Body |
| Craft Cobalt-Mesh Cowl | 45 Crafting | 18s | 2 Cobalt Scale, 1 Ironbark Log | Cobalt-Mesh Cowl |
| Craft Cobalt-Mesh Legs | 48 Crafting | 20s | 3 Cobalt Scale, 1 Ironbark Log | Cobalt-Mesh Legs |
| Craft Cobalt-Mesh Body | 52 Crafting | 22s | 4 Cobalt Scale, 1 Ironbark Log | Cobalt-Mesh Body |
| Craft Dragonhide Cowl | 65 Crafting | 25s | 2 Wyrm Hide, 1 Elder Log | Dragonhide Cowl |
| Craft Dragonhide Chaps | 68 Crafting | 27s | 3 Wyrm Hide, 1 Elder Log | Dragonhide Chaps |
| Craft Dragonhide Body | 72 Crafting | 30s | 4 Wyrm Hide, 1 Elder Log | Dragonhide Body |

Crafting output reference prices are deterministic:

```text
marketPrice = floor(sum(input marketPrices) * 135 / 100)
```

Equipment slots:

- Weapon
- Shield
- Helm
- Chest
- Legs
- Trinket

Equipment tiers:

| Tier | Theme | Examples |
| --- | --- | --- |
| T1 | Wood/Leather | Wood Club, Bark Shield, Bark Vest, Bark Leggings, Leather Chaps |
| T2 | Copper/Hardleather | Copper Dagger, Copper Helm, Copper Plate, Copper Legs, Hardleather Chaps |
| T3 | Iron/Carapace | Iron Sword, Iron Helm, Iron Plate, Iron Legs, Carapace Legs |
| T4 | Steel/Cobalt-Mesh | Steel Longsword, Steel Helm, Steel Plate, Steel Legs, Cobalt-Mesh Legs |
| T5 | Tungsten/Dragonhide | Tungsten Blade, Tungsten Helm, Tungsten Plate, Tungsten Legs, Dragonhide Chaps |

Equipment stats:

- Attack
- Defence
- Hitpoints
- Speed

Stats are aggregated by summing equipped item stats. They affect combat speed, non-combat speed, incoming damage mitigation, and max HP.

## 15. Inventory and Equipment UI

Inventory:

- Does not show Crowns in the item grid.
- Does not show zero-quantity item stacks.
- Shows an empty state when the player has no visible items.
- Equippable items can be clicked to equip.
- Cooked food can be clicked to eat.
- Raw food cannot be eaten.

Equipment:

- Shows each slot.
- Clicking an equipped slot unequips that item in the local sim.
- Shows aggregate ATK, DEF, and HP bonuses.

Important frontend-contract difference:

- Local equipment does not remove the item from inventory when equipped.
- Contract equipment burns/escrows one item on equip and mints it back on unequip.
- Contract death clears equipped state without reminting, which makes equipped gear actually lost.

## 16. Hoard Hall Simulation

Hoard Hall is now a local order book rather than a pure fixed-price shop.

Market order shape:

```ts
interface MarketOrder {
  id: string
  itemId: ItemId
  seller: 'Realm' | 'Player' | 'Trader'
  side: 'buy' | 'sell'
  quantity: number
  unitPrice: number
  createdAt: number
}
```

Realm Scavenger floor liquidity:

```text
side = buy
quantity = Number.MAX_SAFE_INTEGER
unitPrice = max(1, floor(item.marketPrice * 0.05))
createdAt = bootMarketTime - marketIndex * 60000
```

Market categories:

- All
- Resources
- Materials
- Food
- Equipment
- Rare

Category derivation:

- Equippable item -> Equipment.
- Food or Raw Food -> Food.
- Material or Currency -> Materials.
- Rare, Boss Material, Ultra Rare -> Rare.
- Otherwise -> Resources.

Player listing flow:

1. Player selects item, quantity, and unit price.
2. UI checks available count.
3. Available count subtracts equipped copies so equipped items are not accidentally listed.
4. Quantity is clamped to available count.
5. Inventory is reduced immediately.
6. A `Player` order is inserted into `marketOrders`.

Realm Scavenger sell flow:

- `Realm` orders are buy orders from the player.
- Selling one item to Realm removes one inventory item.
- Player receives `unitPrice` Crowns.
- Realm floor orders are permanent and do not decrement.

Buy flow for sell orders:

- Buying consumes `unitPrice` Crowns.
- Buyer receives one item.
- Order quantity decrements by 1.
- Empty sell orders are removed.

Cancel flow:

- Only `Player` orders are cancellable.
- Cancelling returns all remaining escrowed quantity to inventory.
- Order is removed.

Market row detail:

- Clicking a market item selects it.
- A detail band shows item kind, category, reference price, current sources, and current uses.
- Sources and uses are derived from current activity data:
  - Sources include activity rewards, cooking outputs, and combat drops.
  - Uses include recipe costs, equip slot, and food healing.

Chain marketplace flow:

- Chain mode reads recent order IDs from `nextOrderId` and the public `orders` mapping, capped to the latest 120 orders until an event indexer exists.
- Open orders owned by the connected wallet are shown as `Player`; other open onchain orders are shown as `Trader`.
- Listing calls `createOrder` and escrows ERC-1155 inventory in the contract.
- Buying calls `buy(orderId, 1)` for one-unit fills.
- Cancelling calls `cancelOrder` for the connected wallet's own listings.
- Chain listing availability uses wallet ERC-1155 balances directly because equipped items are already burned/removed from the wallet balance onchain.

## 17. UI Structure

Major UI regions:

- Top bar:
  - Brand
  - Total level
  - Active activity
  - HP pill
  - Crowns
  - Wallet connect
  - MegaETH network button
- Status strip:
  - Chain
  - Profile
  - Food reminder
  - AFK bank time
- Left panel:
  - Skills and progress bars
- Center panel:
  - Activity scene
  - Active task HUD
  - Activity group segmented control
  - Claim button
  - Activity cards
- Right rail:
  - Equipment panel
  - Combat Safety panel
  - Inventory panel
- Bottom band:
  - Hoard Hall
  - Event log

Visual implementation:

- Activity scenes are CSS-generated, not image assets.
- Scene styles vary by activity group and activity id.
- Cards are compact and use lucide icons.
- The design avoids a landing-page structure and opens directly into the game.
- Responsive rules collapse panels for smaller viewports.

## 18. Wallet and Network UX

Wallet support is currently UI-level only.

Functions:

- `connectWallet`: requests `eth_requestAccounts`, then reads `eth_chainId`.
- `addMegaEth`: sends `wallet_addEthereumChain` for MegaETH Testnet.

MegaETH Testnet config:

- chainId: `0x18c7`
- chainName: `MegaETH Testnet`
- nativeCurrency: ETH
- rpcUrl: `https://carrot.megaeth.com/rpc`
- explorer: `https://megaeth-testnet-v2.blockscout.com`

Local simulation remains the default. When `VITE_IDLE_ISLES_ADDRESS` is configured and the Chain toggle is selected, the frontend reads wallet profile state from the deployed contract and can submit `createProfile`, `startGather`, `startArtisan`, `startCombat`, `claim`, `equip`, `unequip`, `eatFood`, `createOrder`, `buy`, and `cancelOrder`.

## 19. Contract Foundation

`contracts/IdleIsles.sol` is an ERC-1155-based alpha foundation. Static lookup content is being separated from the stateful core so content expansion does not keep growing the main contract bytecode.

`contracts/IdleIslesContent.sol` is immutable and ownerless. It contains pure lookups only:

- Equipment slot mapping.
- Equipment stat mapping.
- Food healing values.
- Combat activity definitions.
- Combat drop tables.

Core/content deployment shape:

- Deploy `IdleIslesContent` first.
- Deploy `IdleIsles` with the metadata URI and the content contract address.
- The content address is stored immutably in the core contract constructor.
- This is not an admin upgrade hook; changing content requires deploying a new core/content pair for a new testnet build.

Implemented contract areas:

- Profile creation.
- Initial Crowns mint.
- Current/unlocked area storage.
- Crown-burn ship travel.
- Skill XP storage.
- Current HP storage.
- Combat activity settlement.
- Starter gather settlement for Ash Grove.
- Starter artisan settlement for Wood Armory.
- Hitpoints and death penalty.
- Slot-based equipment.
- Equip/unequip with burn/remint escrow behavior.
- Cooked food healing for currently configured food.
- Marketplace create/buy/cancel.
- Auto-settle session preferences.
- Authorized `settleFor` operator flow.
- ERC-1155 receiving through ERC1155Holder.
- No production admin role is currently inherited. `Ownable` was removed because there are no owner-only contract functions and the bytecode budget is tight.
- Runtime guard failures use Solidity custom errors instead of revert strings to reduce deployed bytecode size while preserving explicit failure categories.
- Contract item and activity IDs are internal constants rather than public constants. The frontend and tests use the documented numeric IDs directly; this avoids generating public getter bytecode for every content constant.
- The core contract keeps only item constants needed for stateful settlement/mint/burn paths. Content-only item IDs live in `IdleIslesContent`.

Contract state includes:

- `hasProfile`
- `currentHitpoints`
- `skillXp`
- `activeTask`
- `equipment`
- `autoSettleConfig`
- `orders`
- immutable content contract reference

Contract custom errors:

- Profile/session errors such as `ProfileExists`, `NoProfile`, and `NoHp`.
- Requirement and activity errors such as `RequirementLow`, `EquipmentRequired`, `BadActivity`, and `MaterialLow`.
- Automation, food, equipment, and marketplace errors such as `AutoDisabled`, `NotFood`, `NotEquipment`, `AmountZero`, and `NotEnoughListed`.

Important structs:

- `ActiveTask`
- `Equipment`
- `Stats`
- `CombatActivity`
- `Drop`
- `AutoSettleConfig`
- `Order`

Contract skills enum, zero-based:

0. Attack
1. Defence
2. Hitpoints
3. Woodcutting
4. Fishing
5. Mining
6. Smithing
7. Cooking
8. Crafting

Contract level formula:

```solidity
step = targetLevel - 1;
stepSquared = step * step;
stepCubed = stepSquared * step;
return 75 * stepSquared + 45 * stepCubed + stepCubed * step;
```

Contract profile creation:

- Requires no existing profile.
- Marks `hasProfile`.
- Sets current HP to max HP.
- Mints 80 Crowns.
- Emits `ProfileCreated`.

Contract combat start:

- Requires profile.
- Settles pending activity first.
- Checks HP > 0.
- Checks Attack, Defence, Hitpoints requirements.
- Checks required equipped item.
- Writes `ActiveTask`.
- Emits `ActivityStarted`.

Contract starter gather:

- `startGather(ACTIVITY_ASH_GROVE)` settles the previous task, checks the profile and Woodcutting level, and starts the Ash Grove task.
- Ash Grove uses 5 second cycles.
- Each settled cycle grants 18 Woodcutting XP and 2 Ash Logs.
- `startGather(ACTIVITY_COPPER_RIDGE)` and `startGather(ACTIVITY_TIN_HOLLOW)` settle the previous task, check the profile and Mining level, and start the matching mining task.
- Copper Ridge and Tin Hollow use 7 second cycles.
- Each settled mining cycle grants 20 Mining XP and 2 Copper Ore or 2 Tin Ore.
- `startGather(ACTIVITY_RIVER_BEND)` settles the previous task, checks the profile and Fishing level, and starts the River Bend task.
- River Bend uses 6 second cycles.
- Each settled fishing cycle grants 20 Fishing XP and 2 Raw Minnow.

Contract starter artisan:

- `startArtisan(ACTIVITY_WOOD_ARMORY)` settles the previous task, checks the profile and Smithing level, requires at least 3 Ash Logs, and starts the Wood Armory task.
- Wood Armory uses 6 second cycles.
- Each settled cycle burns 3 Ash Logs, grants 16 Smithing XP, and mints Wood Club, Bark Shield, and Bark Vest.
- `startArtisan(ACTIVITY_COPPER_SMELTER)` requires Copper Ore, Tin Ore, and Ash Log, uses 8 second cycles, burns one of each material per cycle, grants 26 Smithing XP, and mints Copper Bar.
- `startArtisan(ACTIVITY_COPPER_DAGGER)` requires Smithing level 4, 3 Copper Bars, and 2 Ash Logs, uses 10 second cycles, grants 42 Smithing XP, and mints Copper Dagger.
- `startArtisan(ACTIVITY_COOK_MINNOW)` requires Cooking level 1 and at least one Raw Minnow.
- Cook Minnow uses 4 second cycles, burns one Raw Minnow per attempt, grants 14 Cooking XP per attempt, and mints Cooked Minnow only for successful attempts.
- Cook Minnow burn chance is stored in basis points:

```text
burnChanceBps = max(0, 3500 - (cookingLevel - 1) * 300)
```

- Burned Raw Minnow disappears permanently.
- This is the first legitimate onchain gear creation path and avoids any production admin mint/faucet surface.
- The current starter and T2 settlement code uses direct constants for these first slices to avoid unnecessary Solidity stack pressure and bytecode growth before the broader recipe/activity table is designed.

Contract settlement:

- `_settle` reads active task.
- Applies 8-hour AFK cap.
- Computes possible cycles from elapsed time and adjusted cycle seconds.
- Applies `MAX_SETTLE_CYCLES`.
- Resolves cycles one by one.
- Stops on auto-settle safety stop or death.
- Emits `CombatSettled`.

Contract fatal cycle:

- Damage is computed before grants.
- If damage would kill the player:
  - Current HP becomes 0.
  - Death penalty is applied.
  - XP and rewards for that cycle are not granted.

Contract equipment:

- Equipping burns one ERC-1155 item from the player.
- Unequipping mints it back.
- Death clears equipped state without minting back, so gear is lost.
- This prevents transfer-while-equipped exploits.
- The production design intentionally avoids admin item faucets. Equipment-loss tests should get gear through real onchain crafting/drop flows once those are implemented, not through privileged minting.
- A burn-address transfer is not preferred for death loss. `_burn`/non-remint semantics are simpler for supply and ownership accounting because the item is destroyed rather than left as a balance at `0x...dead`.

Contract marketplace:

- `createOrder` settles first, validates amount/price, forbids listing Crowns, and transfers item escrow to the contract.
- `buy` settles buyer first, transfers Crowns from buyer to seller, transfers escrowed item from contract to buyer, and decrements `amountRemaining`.
- `cancelOrder` requires seller and returns remaining escrow.

Current contract gaps:

- Gather activities are not fully implemented onchain; Ash Grove, Copper Ridge, and Tin Hollow are currently ported.
- Artisan/smithing recipes are not fully implemented onchain; Wood Armory, Copper Smelter, and Copper Dagger are currently ported.
- Full cooking and all fish tiers are not implemented onchain; River Bend and Cook Minnow are currently ported.
- Full frontend item list is not ported into the content/core contract pair.
- Frontend market category/detail UI is wired to bounded contract order reads, but still needs event-indexed history for larger markets.
- Frontend Chain mode is available for the first core gameplay slice and marketplace transactions, but auto-settle configuration and full content parity remain future work.
- Broader contract tests are still needed for death, gear loss, rare drops, and future gather/artisan/cooking parity.
- Starter equipment-loss tests now use gameplay-created gear. Broader equipment-loss edge tests are still needed for multiple gear tiers, odd Crown balances, and higher-risk combat paths.
- Strong randomness is still needed before valuable production drops.

## 20. Contract and Frontend Parity Notes

Known areas where the frontend and contract differ:

- Frontend has full gather/artisan/cooking simulation; contract currently focuses on combat/equipment/food/market foundation.
- Frontend equipment does not remove equipped items from inventory; contract does.
- Frontend local market supports realm-seeded liquidity and player listings; Chain mode supports contract orders with bounded direct reads instead of an indexed order book.
- Frontend has all cooked fish heal amounts; contract currently includes only cooked Minnow and cooked Trout heal amounts.
- Frontend combat safety settings write to `configureAutoSettle` when auto-eat is enabled and clear safety with `clearAutoSettle` when auto-eat is disabled.
- Frontend has deterministic local random rolls; contract uses block data and keccak.
- Frontend cycle speed is in milliseconds; contract cycle speed is in seconds.
- Chain mode has onchain Starter Area and Outer Isles travel, but many local Outer Isles activities are still waiting for contract settlement parity.

Before a serious testnet build, `solidity-notes.md` should be worked down until these surfaces match.

## 21. Documentation Created So Far

`plan.md` includes:

- Product goals.
- Skill roadmap.
- Gather/combat/cooking/artisan/equipment/economy plans.
- Onchain design.
- Balance targets.
- Testing plan.
- Playable alpha milestone.
- Build order and open questions.

`solidity-notes.md` includes:

- Current contract gap.
- Implemented contract foundation.
- Required contract updates.
- Level curve and tier pacing.
- Item/activity parity checklist.
- Combat risk and lazy settlement design.
- Cooking parity requirements.
- Marketplace escrow requirements.
- Community content trust levels, ID management, approval models, active-task versioning, mint authority rules, and generated fixture requirements.
- Events and tests needed.
- Current Hardhat contract test coverage status and remaining deterministic death/equipment test gaps.

## 22. Verification So Far

Commands run repeatedly during implementation:

```powershell
npm.cmd run build
npm.cmd run lint
```

`npm.cmd run build` passes after the latest contract test work. `npm.cmd run lint` initially failed after Hardhat generated `artifacts/**/*.d.ts`; ESLint was updated to ignore generated Hardhat output and now passes.

The local dev server has been checked with:

```powershell
Invoke-WebRequest -Uri 'http://127.0.0.1:5173' -UseBasicParsing
```

It returned HTTP `200`.

Contract compilation and bytecode-size checks are now handled through Hardhat:

```powershell
npm.cmd run build:contracts
```

The current two-contract deployment stays under the EVM 24,576-byte deployed-code limit for each contract.

Contract scripts now available:

```powershell
npm.cmd run build:contracts
npm.cmd run test:contracts
npm.cmd run deploy:megaeth
```

These wrap Hardhat 3's build, test, and MegaETH deployment tasks.

Latest contract build verification:

```powershell
npm.cmd run build:contracts
```

Result: passes with Solidity 0.8.28 and the optimized default Hardhat profile. The previous unoptimized bytecode-size deployment blocker is resolved for normal `hardhat build`, and the starter gather/artisan additions currently compile without a bytecode-size warning. Optimizer runs were lowered from 50 to 1 after the T2 slice to preserve bytecode room for gameplay content. After tying Stop HP to auto-eat, deployed bytecode measures 24,092 bytes for `IdleIsles` and 5,963 bytes for `IdleIslesContent`.

Latest full verification:

```powershell
npm.cmd run build:contracts
npm.cmd run test:contracts
npm.cmd run build
npm.cmd run lint
```

Result: all pass after the onchain area travel pass. Contract tests are at 19 passing Node test-runner tests. Deployed bytecode measures 24,092 bytes for `IdleIsles` and 5,963 bytes for `IdleIslesContent`.

Initial contract test coverage:

- Shared alpha level curve thresholds for levels 1, 2, 5, 10, 25, 35, 55, 70, and 99.
- Profile creation initializes profile state, 10 current HP, 80 Crowns, and 10 max HP.
- One Training Yard combat cycle settles after elapsed time and grants Tanned Hide, Crowns, and combat XP.
- Auto-settle HP safety can stop a combat task before a cycle resolves without applying death loss.
- Marketplace listing escrows ERC-1155 items in the contract, fills to a buyer, transfers Crowns to the seller, and clears the order amount.
- Marketplace cancellation returns escrowed ERC-1155 items to the seller and clears the order amount.
- Ash Grove and Wood Armory provide a gameplay path to starter gear without admin minting.
- Equipping crafted gear burns the wallet copy, and unequipping remints it.
- Combat death clears equipped crafted gear without reminting it and burns half of Crowns after successful combat-cycle rewards are accounted for.
- Copper Ridge and Tin Hollow provide a no-admin mining path to Copper Ore and Tin Ore.
- Copper Smelter burns Copper Ore, Tin Ore, and Ash Log to mint Copper Bar.
- Copper Dagger requires Smithing level 4 and is craftable through gathered/smelted materials.
- River Bend provides a no-admin fishing path to Raw Minnow.
- Raw Minnow cannot be eaten because content healing for raw fish is zero.
- Cook Minnow consumes Raw Minnow, mints successful Cooked Minnow, destroys burned attempts, and grants Cooking XP for attempted cycles.
- Cooked Minnow can heal HP and can be consumed by combat auto-eat.
- Test deployment now mirrors production shape by deploying `IdleIslesContent` first and passing its address to the `IdleIsles` constructor.

Latest contract test verification:

```powershell
npm.cmd run test:contracts
```

Result: passes with 19 Node test-runner tests.

Tooling note: after adding the expanded tests, the first rerun was blocked before test execution by a Windows `EPERM` rename failure in Hardhat's generated `cache/compile-cache.json` file. `npx.cmd hardhat clean` was run to clear generated cache/artifact state before rerunning the normal test script.

Current result: passes with 19 Node test-runner tests, including area gates/travel guards, starter gather/artisan, T2 mining/smelting/Copper Dagger, fishing/cooking/healing/auto-eat, combat safety toggling, equipment burn/remint, and combat death gear/Crown loss.

## 23. Current Playable Alpha Status

Implemented locally:

- Skills, XP, and level curve.
- Hitpoints skill and current HP.
- Gather tab with tiered woodcutting, fishing, and cleaned mining.
- Combat tab with monster tiers, one boss, damage, death, and rare drops.
- Artisan tab with smithing and cooking.
- Raw/cooked fish and burn chance.
- Food eating.
- Combat safety controls for auto-eat, stop-at HP, selected food, and max food per claim.
- Equipment slots and stat bonuses.
- Inventory cleanup that hides zero-quantity stacks.
- Local order-book Hoard Hall.
- Chain mode marketplace reads and create/buy/cancel actions.
- Item detail sources/uses.
- Wallet/network UI shell.
- Smart contract foundation for core onchain systems.

Still needed:

- Contract parity for gather/artisan/cooking.
- Indexed chain market history and scalable market reads.
- Broader frontend contract integration through a wallet client.
- Stronger randomness strategy.
- Content schema extraction, validation, and generation.
- Community contribution workflow and curated content-pack tooling.
- More bosses and monster tiers.
- Collection log and rare drop celebration polish.
- Balance spreadsheet or generated pacing report.
- Mobile QA screenshots and interaction pass.

## 24. Open Source and Community Content Architecture

The game can support users building onto it, but the implementation must separate three different levels of contribution:

1. Repository contributions.
2. Curated content packs.
3. Economy-affecting onchain content.

These must not be treated as the same feature. A pull request that changes local UI copy is low risk. A content pack that adds a local-only activity is moderate risk. A user-authored activity that mints ERC-1155 items, Crowns, or rare gear is high risk and must be reviewed, versioned, and explicitly activated.

### Product Goal

The target is an open-source-style game where players and contributors can help expand the world with:

- New activities.
- New items.
- New recipes.
- New monsters and bosses.
- New areas.
- New UI polish.
- New balance proposals.
- New tests and simulation reports.

The target is not permissionless arbitrary rule execution. Community contributions should make the game larger without letting contributors bypass progression, inflate the economy, create impossible saves, or add unreviewed mint paths.

### Current Constraints

The current codebase is not yet plugin-based.

Current local constraints:

- `SkillId`, `ItemId`, `ActivityId`, and `AreaId` are TypeScript union types in `src/game.ts`.
- `ITEMS`, `ACTIVITIES`, `AREAS`, and `MARKET_ITEMS` are hard-coded exports.
- Item icons are hard-coded in `ITEM_ICONS` in `src/App.tsx`.
- Activity scenes use a fixed set of scene types: `forest`, `river`, `mine`, `arena`, and `forge`.
- Many activity-specific visual rules live in `src/App.css` through `activity-<id>` classes.
- Save files store item and activity IDs directly, so removed or renamed content can break references unless normalization handles it.

Current chain constraints:

- `src/generated/contentIds.ts` maps registered frontend item IDs to numeric ERC-1155 IDs.
- `src/generated/contentIds.ts` maps registered frontend activities to contract activity IDs.
- `IdleIsles` stores an immutable `IdleIslesContent` address.
- `IdleIslesContent` is ownerless and pure lookup based.
- The current contract has no production owner/admin role.
- Bytecode budget is tight, so content cannot keep expanding in the stateful core through endless branch chains.
- Chain mode is intentionally smaller than local mode until contract parity is reached.

These constraints are manageable, but they mean community content should first become a data/modeling feature before it becomes an onchain feature.

### Layer 1: Repository Contributions

Repository contributions are the safest first implementation.

Contribution examples:

- Add a new local activity to `src/game.ts`.
- Add a new item definition.
- Add a recipe using existing item IDs.
- Add a monster using the existing combat model.
- Tune XP, cycle time, rewards, or requirements.
- Add contract parity for an existing local feature.
- Add tests for content parity.
- Improve UI layout, accessibility, or mobile behavior.

Expected contribution requirements:

- The contribution must keep local mode buildable.
- The contribution must not break save normalization.
- The contribution must not add contract mint paths without tests.
- The contribution must document any frontend/contract divergence.
- If gameplay rules change, `solidity-notes.md` must be updated in the same work session.

This layer can exist before any runtime plugin system. It should be the default way to accept community help during alpha.

### Layer 2: Curated Content Packs

Curated content packs are the medium-term target. A content pack is a structured set of data that can be reviewed, tested, and compiled into the app.

Content packs should be data, not arbitrary TypeScript or Solidity code.

Recommended pack shape:

```ts
interface ContentPack {
  namespace: string
  version: string
  displayName: string
  items: ItemDefinition[]
  activities: ActivityDefinition[]
  areas: AreaDefinition[]
  market?: MarketDefinition
  metadata?: ContentPackMetadata
}
```

The namespace is mandatory. Core content should use `core`. Community packs should use stable namespaces such as `creator-name.pack-name`.

Pack IDs should be globally qualified:

```text
core:ashLog
core:trainingYard
creator.pack:stormGlass
creator.pack:glassReefDive
```

The current unqualified IDs can remain internally during the transition, but new extension architecture should move toward namespaced IDs. This prevents collisions when two contributors submit an item named `crystalOre` or an activity named `deepMine`.

### Pack Validation

Every content pack must be validated before it is accepted.

Validation should check:

- Every ID is namespaced and unique.
- Every referenced skill exists.
- Every referenced item exists.
- Every activity reward item exists.
- Every activity cost item exists.
- Every equipment requirement references an equipment item.
- Every cooking raw/cooked item pair is valid.
- Every market item is tradable.
- Every area reference exists.
- Every activity has a valid scene type or a safe default.
- Numeric values are finite, positive where required, and within allowed bounds.
- Reward rates stay inside configured economy limits.
- XP rates stay inside configured progression limits.
- Drop tables do not exceed allowed probability totals.
- Boss flags, rare drops, and high-value rewards trigger stricter review.

Validation should fail closed. Invalid content should not load partially into the live game.

### Economy Classes

Not all content should be allowed to affect the economy equally.

Recommended classes:

| Class | Description | Allowed Source |
| --- | --- | --- |
| Cosmetic | UI labels, descriptions, art metadata, scene selection | Broad community contribution |
| Local-only | Activities/items available only in local simulation | Reviewed pack |
| Testnet experimental | Chain-integrated content on a disposable deployment | Maintainer approved |
| Core economy | Content that mints tradable items or Crowns in the main contract | Strictly curated |
| Seasonal/isolated | Content with separate item ID ranges and limited bridge to core economy | Governance or maintainer approved |

The core economy class needs the strongest controls. Any content that can mint Crowns, high-tier gear, rare drops, or high-yield resources can change player wealth and market prices.

### Content Source of Truth

The current project has duplicated truth:

- Local definitions in `src/game.ts`.
- Frontend contract mappings generated from `content/core/ids.json` into `src/generated/contentIds.ts`.
- Solidity constants and branch logic in `contracts/IdleIsles.sol`.
- Pure lookup data in `contracts/IdleIslesContent.sol`.
- Tests that duplicate numeric item and activity IDs.

The long-term implementation should move toward a generated content pipeline.

Recommended source of truth:

```text
content/
  core/
    items.json
    activities.json
    areas.json
    market.json
    balance.json
  community/
    <namespace>/
      pack.json
      items.json
      activities.json
```

Generated outputs:

- `src/generated/content.ts` for local gameplay.
- `src/generated/contentIds.ts` for frontend chain mappings.
- Solidity constants or packed lookup tables for approved onchain content.
- Test fixtures that use generated IDs instead of hand-copied constants.
- Human-readable balance reports.

Until full content generation exists, every content update must manually keep `src/game.ts`, `contracts`, tests, and docs aligned. Frontend chain ID drift is now checked through `npm run content:check`.

### Runtime Loading

There are two viable runtime models.

Compile-time curated loading:

- Content packs are reviewed and merged into the repository.
- Build output includes approved packs.
- The local game loads all approved packs at startup.
- This is simplest and safest for alpha.

Runtime external loading:

- The app fetches a pack manifest from a known URL, IPFS CID, or user-selected file.
- The app validates the pack.
- The app stores enabled packs in local storage.
- External content is marked as local-only unless it is also approved onchain.

Runtime loading is more complex because it introduces unavailable URLs, malicious payloads, broken manifests, content disappearance, and save compatibility issues. It should come after compile-time curated packs.

### Save Compatibility

Community content makes save compatibility much harder.

Save files must eventually include:

- Save schema version.
- Enabled content pack namespaces.
- Enabled content pack versions.
- Active activity fully qualified ID.
- Inventory item fully qualified IDs.
- Equipment item fully qualified IDs.
- Known migration history.

If a save references a missing pack:

- The game should not crash.
- Missing inventory items should be hidden or quarantined, not silently deleted.
- Missing active activities should be stopped safely.
- Missing equipment should be unequipped into a quarantine bucket or ignored with a clear log entry.
- The player should be able to disable or re-enable packs without corrupting core progress.

Core save normalization already ignores invalid references in several places. That behavior should become an explicit content migration system before runtime packs are supported.

### UI Requirements

Community content needs safe UI defaults.

Items should specify a generic icon category instead of requiring a direct Lucide component:

```text
currency
wood
fish
ore
bar
weapon
shield
armor
material
rare
food
trinket
```

The UI can map categories to icons. A pack should not need to edit `ITEM_ICONS` for basic rendering.

Activities should specify:

- Scene type.
- Primary skill.
- Short name.
- Zone.
- Optional rarity or boss presentation flags.

If an activity lacks custom CSS, it should still render with the generic scene renderer. Per-activity CSS should be optional polish, not required for functionality.

### Balance Review

Every accepted content pack needs balance review. At minimum, a balance report should calculate:

- XP per hour by skill.
- Item output per hour.
- Crown output per hour.
- Resource sink per hour.
- Net market reference value per hour.
- Required level versus expected value.
- Combat HP risk per hour.
- Food required per hour.
- Rare drop expected value.
- Time to craft key gear from scratch.

Contribution review should reject content that:

- Creates a faster path to high-tier gear than intended.
- Creates a Crown faucet above approved limits.
- Creates a zero-risk combat farm with valuable drops.
- Produces more market value than its prerequisite chain justifies.
- Makes existing content obsolete without an intentional rebalance.
- Requires an item that has no source.
- Produces an item that has no use, market role, or progression role.

### Onchain Approval Model

Onchain content should be explicitly approved.

Recommended staged model:

1. Local-only community pack.
2. Maintainer-reviewed testnet pack.
3. Generated Solidity or registry entry.
4. Contract tests for all new mint/burn/claim paths.
5. Deployment to a disposable testnet build.
6. Balance observation.
7. Promotion to the next public build only if it is stable.

The current deployed-contract shape does not support updating content in place. That is acceptable during alpha. The safer model is repeated versioned deployments until the game has enough confidence to introduce governance or upgradeable content registries.

### Contract Integration Options

There are three viable contract approaches.

Immutable release pairs:

- Deploy a new `IdleIslesContent` and `IdleIsles` pair for each approved content release.
- Lowest governance risk.
- Simple mental model.
- Poor long-term continuity unless migration tooling exists.

Approved content registry:

- Keep a stateful core contract.
- Add a registry of approved content versions.
- Content can be activated or deprecated by governance or a maintainer role.
- Requires strong tests around versioning, settlement, and migration.

Approved pack contracts:

- External contracts implement a read-only content interface.
- Core contract only accepts pack contracts from an allowlist.
- More modular.
- More gas and security review complexity.
- Must not allow arbitrary external callbacks during settlement.

For this project, the recommended path is immutable release pairs during alpha, then an approved registry only after local and chain content parity are much stronger.

### Active Task Versioning

If onchain content can change after a player starts an activity, active tasks need versioning.

An active task should eventually store:

- Content namespace or pack ID.
- Content version.
- Activity numeric ID.
- Started timestamp.
- Last resolved timestamp.

Settlement must use the same content version that was active when the task started, or the system must settle and stop all affected tasks before a content change activates. Without this rule, a player could start one version of an activity and claim under another version with different rewards, costs, or risks.

### Security Boundaries

Community content must not be able to:

- Execute arbitrary JavaScript in the app.
- Execute arbitrary Solidity logic in core settlement.
- Mint core items without an approved activity path.
- Mint Crowns without explicit economy review.
- Create negative costs or rewards.
- Create infinite loops or huge drop tables.
- Reference missing items to bypass costs.
- Add equipment stats outside bounded limits.
- Override core skill formulas.
- Override death penalties.
- Override marketplace escrow rules.

The extension system should be declarative. Contributors provide data; the game engine interprets that data through fixed rules.

### Implementation Phases

Recommended implementation order:

1. Keep accepting source-level contributions through reviewed changes.
2. Extract core item and activity definitions from `src/game.ts` into a local content module.
3. Add schema validation for local content.
4. Add namespaced IDs while preserving compatibility aliases for existing saves.
5. Move icon and scene selection to safe category fields.
6. Generate derived maps such as `ITEMS`, `ACTIVITY_BY_ID`, `MARKET_ITEMS`, and item source/use indexes.
7. Add balance-report tooling.
8. Generate contract fixture IDs for tests.
9. Port remaining local gameplay to contract parity.
10. Introduce curated compile-time packs.
11. Add runtime local-only pack loading if still desirable.
12. Evaluate an onchain approved content registry only after parity and test coverage are mature.

### Documentation Requirements

Every content-affecting contribution should document:

- Content namespace and version.
- New item IDs and numeric chain IDs, if any.
- New activity IDs and numeric chain IDs, if any.
- New rewards, costs, and XP rates.
- Expected XP/hour and item/hour.
- New market role.
- New contract behavior, if any.
- Whether the content is local-only, testnet-only, or core economy.
- Save migration behavior.
- Test coverage added.

This project should keep the rule that gameplay changes and contract notes move together. Community content makes that rule more important, not less.
