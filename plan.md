# Idle Isles Playable Launch Plan

Idle Isles should be a game first: an idle fantasy RPG with satisfying progression, meaningful AFK choices, player-owned items, and a Hoard Hall economy. This plan defines the work needed to move from the current prototype to a playable alpha.

## Current Checkpoint

As of the latest implementation pass:

- Local React simulation includes tiered gather/combat/artisan content, cooking, equipment, hitpoints, combat safety, local inventory, a local Hoard Hall, and area-based activity routing.
- Players start in the Starter Area and can buy a 50,000 Crown ship ride from the Harbor Merchant to unlock Outer Isles content. Chain mode now stores current/unlocked areas and burns Crowns for ship passage.
- The project is branded as Idle Isles across app UI, package metadata, contracts, tests, docs, and metadata/storage slugs.
- Contract architecture is split into `IdleIsles` for state/settlement, immutable `IdleIslesContent` for static lookup data, and `HoardHall` for marketplace escrow/orders.
- Onchain gameplay currently supports profile creation, area travel, combat settlement, equipment burn/remint, death penalties, content-driven Gather settlement for registered source routes 201-217, and generic packed Artisan settlement for registered recipes 301-339. Marketplace list/buy/cancel now lives in the separate Hoard Hall contract.
- Food loops are onchain for registered fish tiers: raw fish sources can be gathered, Cooking recipes can burn or produce cooked food, raw fish cannot heal, cooked fish heals, and combat auto-eat can consume gameplay-created food.
- Verification commands currently pass through `npm.cmd run verify`, including linting, audit, content ID validation, Solidity build, bytecode budget checks, contract tests, and frontend build.
- Contract tests currently pass at 25 Node test-runner tests.
- Deployed bytecode measures 22,759 bytes for `IdleIsles`, 10,762 bytes for `IdleIslesContent`, and 3,500 bytes for `HoardHall`; `IdleIsles` is capped by a 24,200-byte project budget in CI.
- Frontend now has an opt-in Chain mode, configured by `VITE_IDLE_ISLES_ADDRESS` and `VITE_HOARD_HALL_ADDRESS`, for profile reads, balances, area travel, `createProfile`, `startGather`, `startArtisan`, `startCombat`, `claim`, `equip`, `unequip`, `eatFood`, bounded marketplace order reads, listing, buying, and cancellation. Local simulation remains the default dev/play mode.
- MegaETH deployment config and `npm run deploy:megaeth` now deploy `IdleIslesContent`, `IdleIsles`, and `HoardHall`, then write `deployments/megaeth-testnet.json` with both frontend contract addresses.

Recommended next build step: generate the packed Gather/Artisan tables from structured content, broaden end-to-end parity tests for high-tier local loops, and keep new market behavior in `HoardHall` instead of the core.

## 1. Core Gameplay Goals

- Make every skill have a clear reason to exist.
- Make AFK actions rewarding but bounded by risk, level requirements, inventory, and resource sinks.
- Make combat require preparation instead of being an infinite passive faucet.
- Make gathered resources feed artisan skills, food, equipment, and the market.
- Make transferable items matter without turning the game into a DeFi protocol.
- Keep claim-based idle progression: players start an activity, time passes, then rewards are calculated when claimed.

## 2. Skill Expansion

Current skills:

- Attack
- Defence
- Woodcutting
- Fishing
- Mining
- Smithing
- Hitpoints
- Cooking
- Crafting

Add:

- Ranged
- Magic

Future candidates after alpha:

- Fletching
- Slayer
- Farming
- Prayer

## 3. Gather Tab Expansion

Gathering needs tiered activities with level requirements, different resource outputs, and different cycle times.

Woodcutting:

- Level 1: Ash Grove -> Ash Logs
- Level 5: Pine Stand -> Pine Logs
- Level 12: Oakwood -> Oak Logs
- Level 25: Ironbark Trees -> Ironbark Logs
- Level 40: Elderwood Grove -> Elder Logs
- Level 60: Spiritwood Grove -> Spiritwood Logs

Fishing:

- Level 1: River Bend -> Raw Minnow
- Level 8: Lake Dock -> Raw Trout
- Level 18: Coastal Net -> Raw Cod
- Level 32: Deepwater Line -> Raw Tuna
- Level 48: Storm Pier -> Raw Manta
- Level 70: Abyssal Pool -> Raw Leviathan

Mining:

- Level 1: Copper Ridge -> Copper Ore
- Level 1: Tin Hollow -> Tin Ore
- Level 8: Iron Vein -> Iron Ore
- Level 25: Coal Cut -> Coal
- Level 55: Tungsten Lode -> Tungsten Ore

Future mining expansion:

- Silver and gold should return only when jewelry/trinket crafting exists.
- Runite and star ore should return only when post-T5 equipment tiers are designed.
- Do not expose mineable resources that have no current artisan sink or combat economy sink.

Gathering implementation tasks:

- Add data-driven gather definitions to `src/game.ts`.
- Add level requirement checks per action.
- Add item definitions for each raw resource.
- Add cycle time, XP, and output tuning per tier.
- Update gather UI to show locked tiers, requirements, output, and expected cycles.
- Add visual variants per gather tier or at least per gather category.
- Add contract activity IDs for each gather action.

## 4. Combat Tab Expansion

Combat should support normal monsters, stronger monsters, and bosses. Monsters should require combat stats and equipment progression.

Combat stats:

- Attack affects accuracy and unlock requirements.
- Defence reduces incoming damage.
- Hitpoints controls survivability and is a real level that increases over time from combat XP.
- Combat activities should award Hitpoints XP alongside Attack and Defence XP.
- Harder monsters should award more Hitpoints XP per completed cycle.

Monster tiers:

- Level 1: Training Dummy
- Level 3: Field Rat
- Level 6: Cave Bat
- Level 10: Bandit Scout
- Level 18: Moss Brute
- Level 30: Crypt Knight
- Level 45: Firebound Warden
- Level 60: Frost Revenant
- Level 75: Rift Champion

Boss fights:

- Level 25 boss: Hollow Treant
- Level 45 boss: Ember Drake
- Level 65 boss: Grave King
- Level 85 boss: Starforged Titan

Boss drop design:

- Bosses should have low percentage rare drops.
- Drops should include equipment, cosmetics, crafting materials, and collection log items.
- Rare drops must be meaningful but not required for basic progression.

Example boss table:

- Hollow Treant
- Requirements: Attack 20, Defence 15, Hitpoints 20
- Common: Oak Logs, Ironbark Logs, Crowns
- Uncommon: Treant Bark, Rootguard Shield
- Rare: Living Axe, Grove Charm
- Ultra rare: Hollow Seed pet/cosmetic

Combat implementation tasks:

- Add monster data model with requirements, cycle time, XP, HP damage range, and drop table.
- Add weighted drop table support.
- Add boss flag and boss-specific UI treatment.
- Add combat result simulation for each cycle.
- Add combat XP distribution across Attack, Defence, and Hitpoints.
- Add per-cycle incoming damage.
- Add death/retreat state when Hitpoints reaches 0.
- Add rare drop event log styling.
- Add contract support for weighted drops or deterministic pseudo-randomness strategy.

## 5. Hitpoints And Combat Risk

Hitpoints must be added so combat cannot be endlessly AFKed without food or gear.

Rules:

- Hitpoints is a skill and a current resource.
- Max hitpoints increases with Hitpoints level.
- Hitpoints level increases from combat experience over time.
- Hitpoints XP should be awarded on successful combat cycles, not from eating food.
- Hitpoints XP should scale with monster difficulty so harder combat trains survivability faster.
- Combat occasionally reduces current hitpoints after each completed combat cycle.
- Damage chance and amount depend on monster tier and player Defence.
- If current hitpoints reaches 0, combat stops automatically.
- If current hitpoints reaches 0, all equipped items are lost and half of Crowns are lost.
- A player at 0 hitpoints cannot start combat.
- Non-combat activities should not reduce hitpoints.

Recovery:

- Players recover hitpoints by eating cooked food.
- Combat safety controls can auto-eat selected food and stop combat at a configured HP threshold while auto-eat is enabled.
- Optional later: slow passive recovery while not in combat.
- Optional later: potions or prayers can modify damage/recovery.

Implementation tasks:

- Add `hitpoints` skill.
- Add `currentHitpoints` to game state and contract profile data.
- Add max HP calculation from Hitpoints level.
- Add Hitpoints XP rewards to all combat activities.
- Tune Hitpoints XP separately from Attack and Defence XP.
- Add damage rolls to combat claim calculation.
- Resolve combat damage cycle-by-cycle rather than as a single aggregate total.
- Stop combat when damage would drop HP to 0.
- Apply death penalty: clear equipment, remove equipped items, and remove half of Crowns.
- Show HP clearly in the top bar and combat panel.
- Add low HP warning state.
- Add Eat button for cooked food.
- Wire frontend combat safety controls to contract `configureAutoSettle`.

## 6. Cooking And Food

Cooking should connect Fishing to Combat. Raw fish should not restore hitpoints until cooked.

Rules:

- Fishing produces raw fish.
- Cooking converts raw fish into cooked fish.
- Cooked fish restores hitpoints when eaten.
- Burnt food disappears permanently.
- Burn chance decreases as Cooking level increases.
- Higher-tier fish should require higher Cooking levels.
- Higher-tier fish should restore more hitpoints.

Example cooking tiers:

- Level 1: Raw Minnow -> Cooked Minnow, restores 3 HP
- Level 8: Raw Trout -> Cooked Trout, restores 6 HP
- Level 18: Raw Cod -> Cooked Cod, restores 9 HP
- Level 32: Raw Tuna -> Cooked Tuna, restores 14 HP
- Level 48: Raw Manta -> Cooked Manta, restores 21 HP
- Level 70: Raw Leviathan -> Cooked Leviathan, restores 34 HP

Burn chance:

- Each fish has a base burn chance.
- Burn chance drops as Cooking level rises.
- At high enough Cooking level, low-tier fish can become impossible to burn.

Example formula:

```text
burnChance = max(minBurnChance, baseBurnChance - cookingLevel * burnReductionPerLevel)
```

Example result:

- Player cooks 100 Raw Trout.
- Burn chance resolves to 35%.
- 65 become Cooked Trout.
- 35 disappear forever.

Cooking implementation tasks:

- Add Cooking skill.
- Add raw fish and cooked fish item definitions.
- Add cooking activities to Artisan tab or a dedicated Cooking sub-filter.
- Add batch cooking support.
- Add burn chance preview before cooking.
- Add burned count to claim/log output.
- Add Eat action for cooked fish.
- Add contract support for burn chance and cooked output.

## 7. Artisan Tab Expansion

Artisan skills should transform gathered resources into useful equipment, consumables, and market goods.

Smithing:

- Level 1: Wood Armory and Copper Smelter
- Level 4: Copper Dagger
- Level 6: Copper Armor
- Level 8: Iron Smelter
- Level 10: Iron Sword
- Level 16: Iron Armor
- Level 35: Steel Bar
- Level 38: Steel Longsword
- Level 40: Steel Armor
- Level 55: Tungsten Bar
- Level 60: Tungsten Blade
- Level 62: Tungsten Armor
- Level 70+: Runite and Starforged future expansion

Cooking:

- Converts raw fish into cooked food.
- Has burn chance.
- Produces combat sustain.

Future artisan skills:

- Crafting: hides, jewelry, trinkets
- Fletching: bows, arrows
- Alchemy: utility consumables

Artisan implementation tasks:

- Add recipe data model with skill requirements, material costs, output, XP, and cycle time.
- Add material validation.
- Add locked recipe UI states.
- Add success/failure or burn logic where relevant.
- Add batch crafting support.
- Add crafting output to inventory and ERC-1155 item mapping.
- Add recipe IDs to contract.

## 8. Equipment Expansion

Equipment should mostly come from crafting and stronger combat monsters. Stronger monsters should unlock better gear through direct drops and crafting components.

Equipment tiers:

- T1 Wood: fragile starter weapons and shields; made from logs; very low stats.
- T2 Copper: first metal equipment; made from copper/tin/bronze-style materials; early combat baseline.
- T3 Iron: durable mid-early equipment; required for stronger monsters.
- T4 Steel: meaningful midgame equipment; crafted from higher-tier bars and combat materials.
- T5 Tungsten: current alpha endgame tier; rare materials from bosses and high-level gathering.

Slots for alpha:

- Weapon
- Shield
- Helm
- Chest
- Legs
- Trinket

Equipment stats:

- Attack bonus
- Defence bonus
- Hitpoints bonus
- Gathering speed bonus
- Rare drop bonus, later

Weapon progression examples:

- T1 Wood Club: crafted from logs.
- T2 Copper Dagger: crafted from copper-tier bars.
- T3 Iron Sword: crafted from iron bars.
- T4 Steel Longsword: crafted from steel bars and monster materials.
- T5 Tungsten Blade: crafted from tungsten bars and boss drops.

Armor progression examples:

- T1 Bark Vest / Bark Leggings: basic protection from woodcutting and early hide materials.
- T2 Copper Helm / Copper Plate / Copper Legs: early smithing armor.
- T3 Iron Helm / Iron Plate / Iron Legs: needed for mid-tier monsters.
- T4 Steel Helm / Steel Plate / Steel Legs: midgame defensive set.
- T5 Tungsten Helm / Tungsten Plate / Tungsten Legs: alpha endgame defensive set.

Boss and monster equipment drops:

- Stronger monsters should drop components, partial equipment, or rare finished gear.
- Bosses should have low percentage rare drops that fit into the T4/T5 equipment economy.
- Boss drops can be tradable, but the best crafted gear should require both boss materials and artisan levels.

Equipment implementation tasks:

- Add item stat definitions.
- Add item tier definitions from T1 through T5.
- Expand equipment state from 2 slots to full slot map.
- Add equip/unequip validation by slot.
- Apply equipment bonuses to activity cycle times, combat accuracy, damage, and Defence.
- Add equipment display with stats.
- Add rare drop source information.
- Add contract storage for equipped items.

## 9. Hoard Hall And Economy

The exchange should become the core onchain advantage: real transferable items, player listings, and visible market behavior.

Needed for playable alpha:

- Fixed-price listings.
- Buy listed item.
- Cancel listing.
- Basic recent price display.
- Market filters by resource, material, food, equipment, and rare item.
- Escrowed player listings so listed items cannot also be used or transferred.
- Item detail view with source and uses.
- Fees or taxes as a sink.

Current frontend prototype:

- Local profile has persisted order state.
- Realm Scavenger liquidity provides permanent 5% buy-floor orders for every current non-Crown market item.
- Player listings escrow inventory immediately.
- Player listing cancellation returns remaining escrowed inventory.
- Buying player/trader sell orders consumes Crowns and decrements order quantity one unit at a time.
- Selling to Realm Scavenger removes one inventory item and grants the floor-price Crowns without decrementing the permanent floor order.
- The UI has category filters and a listing form.
- Market rows open an item detail band with current sources and uses derived from activity data.

Later:

- Buy offers.
- Price history.
- Volume charts.
- Collection log price flexing.
- Guild or clan trading.

Implementation tasks:

- Improve contract marketplace reads beyond the current bounded order scan, likely with events or an indexer.
- Expand item detail into a richer modal or side panel with drop rates and recipe quantities.
- Add market fees or taxes as a Crown sink.
- Add sorting by price, quantity, seller, and recency.
- Add tests for listing, buying, and cancellation.

## 10. Onchain Design

Use onchain ownership for assets and authoritative claims, but avoid unnecessary transactions.

Maintain the detailed smart contract checklist in `solidity-notes.md`. Whenever gameplay rules change in `src/game.ts`, update that file in the same work session.

Onchain:

- Player profile.
- Skill XP.
- Current HP.
- Active activity.
- Inventory items as ERC-1155.
- Equipment.
- Marketplace orders.
- Boss/rare drops.

Offchain/local UI:

- Preview calculations.
- Animations.
- Sorting/filtering.
- Expected rewards.
- Non-authoritative price charts until indexed.

Contract tasks:

- Expand `IdleIsles.sol` activity definitions.
- Add Hitpoints and Cooking.
- Add current HP.
- Add raw/cooked fish.
- Add burn chance cooking logic.
- Add weighted combat drop tables.
- Add equipment slots and stat modifiers.
- Add order cancellation.
- Add admin/content update strategy.
- Decide immutable content vs upgradeable/configurable content.
- Add Foundry or Hardhat test setup.
- Add deployment scripts for MegaETH Testnet.

Randomness decision:

- For alpha, deterministic pseudo-randomness may be acceptable on testnet.
- For production, boss drops need a stronger randomness source or commit/reveal design.
- Drop logic must be resistant to easy timestamp/block manipulation.

## 11. Frontend Work

The frontend should make progression obvious and satisfying.

Needed:

- Add HP bar and food eating controls.
- Add Cooking UI.
- Add expanded Gather tiers.
- Add expanded Combat tiers and bosses.
- Add expanded Artisan recipes.
- Add equipment stat panel.
- Add item detail panel.
- Add locked/unlocked progression clarity.
- Add rare drop celebration.
- Add collection log.
- Add market listing UI.
- Add wallet-connected mode vs local simulation mode.
- Add empty/loading/error states for chain calls.
- Add mobile layout pass.

## 12. Balance Passes

Balance should happen before contract deployment and again after real usage.

Tune:

- XP per cycle.
- Level curve.
- Resource output rates.
- Recipe costs.
- Food healing amounts.
- Burn chances.
- Combat damage.
- Rare drop rates.
- Equipment bonuses.
- Market sinks.
- AFK cap.

Initial alpha target:

- Level 1-10 should feel fast.
- Level 10-30 should take meaningful sessions.
- Boss attempts should require preparation.
- Food should matter in combat.
- Equipment upgrades should be noticeable.
- Gathering should feed the market and crafting.

Level curve:

- Early levels should be fast and frequent.
- Each level should require progressively more XP than the prior level.
- The curve should be deterministic, integer-safe, and easy to mirror in Solidity.
- Avoid a purely linear curve because it makes late levels too fast.
- Avoid an overly steep exponential curve because it makes alpha progression stall.

Recommended alpha formula:

```text
xpRequiredForLevel(L) = 75 * (L - 1)^2 + 45 * (L - 1)^3 + (L - 1)^4
```

Where:

- `L` is the target level.
- Level 1 requires 0 XP.
- Level 2 requires 121 XP.
- Level 5 requires 4,336 XP.
- Level 10 requires 45,441 XP.
- Level 25 requires 997,056 XP.
- Level 35 requires 3,191,716 XP.
- Level 55 requires 15,807,636 XP.
- Level 70 requires 37,807,101 XP.

This formula is Solidity-friendly and creates a long tail without floating point math. Use one formula everywhere; do not let frontend and contract level curves diverge.

Current tier pacing target:

- T1/T2 unlocks should happen in the first session.
- T3 Iron should take repeated sessions and establish combat/food loops.
- T4 Steel starts at level 35 and should take about 3 weeks of daily capped play when material collection and crafting friction are included.
- T5 Tungsten starts at level 55 and should take about 2 months of daily capped play when high-tier gathering, boss drops, and crafting friction are included.
- The current 8-hour AFK cap is part of this target. If that cap changes, rebalance thresholds or XP rates.

XP pacing tasks:

- Keep the frontend `xpForLevel` and contract `xpRequiredForLevel` formula identical.
- Add threshold tests for levels 2, 5, 10, 25, 35, 55, 70, and 99.
- Set XP per cycle around target time-to-level bands.
- Make level 1-5 take minutes, 5-15 take short sessions, 15-30 take repeated sessions, and later levels become long-term goals.
- Add a balance spreadsheet or JSON table that documents expected time per level for each skill.

## 13. Testing

Frontend tests:

- Claim cycles produce expected XP and items.
- Locked actions stay locked.
- Cooking burn calculations work.
- Eating food restores HP but does not exceed max HP.
- Combat stops at 0 HP.
- Equipment modifies stats correctly.

Contract tests:

- Profile creation.
- Activity start/claim.
- Skill XP progression.
- Gather rewards.
- Cooking burns and outputs.
- Combat HP damage and stopping behavior.
- Boss weighted drops.
- Equipment slot validation.
- Marketplace list/buy/cancel.
- ERC-1155 transfer behavior.

Manual QA:

- Start each activity.
- Let cycles accrue.
- Claim after short and long waits.
- Confirm AFK cap.
- Cook raw fish and verify burned fish disappear.
- Fight until HP loss occurs.
- Eat cooked food.
- Equip boss drop.
- Buy and sell marketplace item.

## 14. Playable Alpha Milestone

The game is ready for a first playable alpha when:

- Gather tab has at least 5 woodcutting, 5 fishing, and 5 mining activities.
- Combat tab has at least 8 monsters and 1 boss.
- Artisan tab has smithing and cooking recipes with level requirements.
- Hitpoints exists and combat can reduce HP.
- Cooked food is required for reliable combat AFK.
- Raw fish must be cooked before healing.
- Burn chance works and destroys failed food.
- Equipment has at least 5 meaningful upgrades.
- Marketplace supports listing, buying, and cancellation.
- Local simulation mode is stable.
- Contract tests cover the core mechanics.
- MegaETH Testnet deployment exists.
- Frontend can read/write the deployed contract.

## 15. Suggested Build Order

1. Add Hitpoints, current HP, and food eating.
2. Add Cooking skill, raw fish, cooked fish, and burn chance.
3. Expand item definitions for tiered fish, logs, ores, bars, and equipment.
4. Expand Gather tab with tiered activities and locked states.
5. Expand Artisan tab with smithing and cooking recipes.
6. Expand Combat with HP damage and monster tiers.
7. Add one boss with weighted rare drops.
8. Expand equipment slots and stat bonuses.
9. Convert the simulated exchange into real listing mechanics.
10. Port the expanded mechanics into the Solidity contract.
11. Add contract tests and deployment scripts.
12. Wire frontend to MegaETH Testnet.
13. Run balance pass and QA pass.

## 16. Open Questions

- Should profile progress be transferable or soulbound?
- Should skills be stored directly onchain or represented through a soulbound profile token?
- Should marketplace currency be Crowns only, ETH only, or both?
- Should boss drops be tradable immediately or require binding/crafting?
- Should combat consume food automatically or require manual eating before AFK?
- Should players be able to queue actions or only run one activity at a time?
- Should cooking be in Artisan or its own top-level tab?
