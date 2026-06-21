# Solidity / Smart Contract Notes

This file tracks every gameplay change that must be reflected onchain. The frontend prototype can move quickly, but the contract must become the authoritative version before any real blockchain playtest.

## Current Contract Gap

`contracts/IdleIsles.sol` now has the lazy combat settlement foundation, death penalties, slot-based equipment, auto-settle session preferences, marketplace cancellation, starter gather/artisan paths, starter fishing/cooking, and authoritative Starter Area/Outer Isles travel. Static item/combat lookup content has been split into immutable `IdleIslesContent` through `IIdleIslesContent` so the stateful core has room to grow. The content contract now also includes the expanded combat definitions for Goblin Forager, Giant Spider, Dire Wolf, and Venomous Drake, plus item slot/stat definitions for Crafting light armor and the legs equipment slot. The system is still not fully content-complete with `src/game.ts`; higher-tier gather, Crafting settlement, full artisan parity, full cooking, and the Realm Scavenger floor still need to be ported before a serious testnet build.

The frontend now has area routing for Idle Isles in both local and Chain mode. Profiles start in the Starter Area, and the Harbor Merchant can unlock Outer Isles travel for 50,000 Crowns. Chain mode stores current/unlocked areas, burns Crowns for first passage, stops active tasks on travel, and blocks Outer Isles activities until the player has unlocked and selected that area.

Community-created content is not implemented onchain yet. Treat it as a major protocol design area, not a small content addition. User-authored content can only be allowed into the main economy after it has an explicit approval model, versioning rules, generated ID management, settlement tests, and balance review. Permissionless user-created activities must not be able to mint core ERC-1155 items, mint Crowns, bypass costs, bypass death penalties, or call arbitrary external logic from the settlement path.

## Implemented Contract Foundation

- Lazy settlement exists through `claim`, `startCombat`, `eatFood`, `equip`, `unequip`, marketplace listing, and marketplace buying.
- Starter non-combat settlement now exists through `startGather` and `startArtisan`.
- XP awards use `XP_RATE_MULTIPLIER = 2`; listed activity XP is base XP before the multiplier.
- The first onchain gather action is Ash Grove (`ACTIVITY_ASH_GROVE = 201`): 5 second cycles, 18 base Woodcutting XP, and 2 Ash Logs.
- The first onchain artisan action is Wood Armory (`ACTIVITY_WOOD_ARMORY = 301`): 6 second cycles, 16 base Smithing XP, costs 3 Ash Logs, and creates Wood Club, Bark Shield, and Bark Vest.
- The first T2 mining actions are Copper Ridge (`ACTIVITY_COPPER_RIDGE = 202`) and Tin Hollow (`ACTIVITY_TIN_HOLLOW = 203`): 7 second cycles, 20 base Mining XP, and 2 ore per cycle.
- The first T2 artisan actions are Copper Smelter (`ACTIVITY_COPPER_SMELTER = 302`) and Copper Dagger (`ACTIVITY_COPPER_DAGGER = 303`). Copper Smelter costs Copper Ore, Tin Ore, and Ash Log for Copper Bar. Copper Dagger requires Smithing level 4 and costs 3 Copper Bars plus 2 Ash Logs.
- The first fishing action is River Bend (`ACTIVITY_RIVER_BEND = 204`): 6 second cycles, 20 base Fishing XP, and 2 Raw Minnow.
- The first cooking action is Cook Minnow (`ACTIVITY_COOK_MINNOW = 304`): 4 second cycles, 14 base Cooking XP per attempt, costs 1 Raw Minnow, and mints Cooked Minnow only when the burn roll succeeds.
- Cook Minnow burn chance is `max(0, 3500 - (cookingLevel - 1) * 300)` basis points. Burned Raw Minnow disappears permanently.
- Pending combat is resolved cycle by cycle.
- Fatal cycles do not grant rewards or XP.
- Death clears equipped gear and burns half of Crowns.
- Equipped items are burned on equip and minted back on unequip, which prevents transfer-while-equipped exploits.
- Gear loss should use `_burn`/non-remint semantics, not a transfer to a `0x...dead` burn address. A dead-address transfer leaves a visible ERC-1155 balance owned by an address and relies on a social convention that nobody controls it; `_burn` is the cleaner destruction primitive.
- Do not add production admin item faucets for tests or convenience. Gear used in tests should be obtained through real onchain crafting, drops, or a test-only harness that is never deployed.
- The contract does not currently inherit an admin/owner role. `Ownable` was removed because no owner-only production behavior exists and bytecode size is a hard constraint.
- Revert strings were replaced with Solidity custom errors to reduce deployed bytecode while keeping guard failures typed and explicit.
- Item and activity constants are internal, with numeric IDs documented in this file and the technical breakdown, to avoid public getter bytecode for every content constant.
- Static item/combat content is now split toward `IdleIslesContent`, an ownerless pure lookup contract referenced by the core. This avoids production admin powers while creating bytecode room for future content.
- Current compiled bytecode after tying Stop HP to auto-eat: `IdleIsles` is 24,092 deployed bytes and `IdleIslesContent` is 5,963 deployed bytes. The 19-test Hardhat suite passes against the two-contract deployment shape.
- `npm run bytecode:contracts` enforces a 24,200-byte project budget for `IdleIsles`, below the 24,576-byte EIP-170 deployed bytecode limit.
- Core area, item, and activity IDs are now recorded in `content/core/ids.json` and checked by `npm run content:check`. The registry generates frontend chain mappings in `src/generated/contentIds.ts`, but it is not yet the full gameplay or Solidity source of truth.
- Auto-settle session preferences exist through `configureAutoSettle`.
- Authorized operators can call `settleFor`.
- Session safety can auto-eat configured cooked food before continuing combat; the HP stop threshold is active only while auto-eat is enabled.
- The frontend local simulation now mirrors this UX with persisted combat safety settings: auto-eat, selected food, stop-at HP, and max food per claim.
- Optimized Hardhat builds use Solidity 0.8.28 with 1 optimizer run so the current core/content contract pair deploys under the EVM bytecode size limit. Bytecode budget is tight, so new activity slices currently use direct compact branches rather than a broad generic content table.
- Hardhat 3 + viem tests now cover level thresholds, profile creation, basic combat settlement, auto-settle HP safety stops, marketplace escrow/fill, and marketplace cancellation.

## Required Contract Updates

### Level Curve

- The current contract and frontend use the same integer-safe level formula:

```text
xpRequiredForLevel(L) = 75 * (L - 1)^2 + 45 * (L - 1)^3 + (L - 1)^4
```

- Known thresholds:
  - Level 2: 121 XP
  - Level 5: 4,336 XP
  - Level 10: 45,441 XP
  - Level 25: 997,056 XP
  - Level 35: 3,191,716 XP
  - Level 55: 15,807,636 XP
  - Level 70: 37,807,101 XP
  - Level 99: 135,310,756 XP
- Add tests for known thresholds.
- Implemented in `test/IdleIsles.ts`.
- Do not let frontend and contract level curves diverge.

### Tier Pacing

- T4 Steel is now the first multi-week tier:
  - Coal Cut: Mining 25.
  - Steel Smelter: Smithing 35.
  - Steel Longsword: Smithing 38.
  - Steel Armor: Smithing 40.
  - Crypt Knight: Attack 38, Defence 35, Hitpoints 36, Steel Longsword equipped.
- T5 Tungsten is now the first multi-month tier:
  - Tungsten Lode: Mining 55.
  - Tungsten Smelter: Smithing 55.
  - Tungsten Blade: Smithing 60.
  - Tungsten Armor: Smithing 62.
  - Hollow Treant: Attack 55, Defence 50, Hitpoints 52, Steel Longsword equipped.
- Gather, artisan, and cooking tier requirements still need to be ported to contract-side activity definitions when those systems move onchain.

### Skills

- Add `Hitpoints`.
- Add `Cooking`.
- `Strength` has been removed. Current enum order is Attack, Defence, Hitpoints, Woodcutting, Fishing, Mining, Smithing, Cooking, Crafting.
- Add `Crafting` at enum index 8.
- Confirm enum order before deployment; changing enum order after deployed state exists is dangerous.
- Combat claims must award Hitpoints XP.
- Eating food must not award Hitpoints XP.

### Player State

- Add `currentHitpoints`.
- Continue porting Outer Isles activity content behind the onchain area gates.
- Add max HP calculation from Hitpoints level plus equipped gear bonuses.
- Clamp current HP when gear is unequipped and max HP drops.
- Prevent combat start when current HP is 0.
- Stop combat claims when damage would reduce HP to 0.
- Implemented in the current contract foundation. Automated tests currently cover profile initialization and auto-settle HP safety stops; death and direct damage assertions still need deterministic coverage.

### Items

Add item IDs/constants for all current frontend items:

- Crowns
- Ash Logs
- Pine Logs
- Oak Logs
- Ironbark Logs
- Elder Logs
- Spiritwood Logs
- Raw Minnow
- Cooked Minnow
- Raw Trout
- Cooked Trout
- Raw Cod
- Cooked Cod
- Raw Tuna
- Cooked Tuna
- Raw Manta
- Cooked Manta
- Raw Leviathan
- Cooked Leviathan
- Treant Bark
- Hollow Seed
- Copper Ore
- Tin Ore
- Iron Ore
- Coal
- Cobalt Ore
- Tungsten Ore
- Copper Bar
- Iron Bar
- Steel Bar
- Tungsten Bar
- Wood Club
- Bark Shield
- Bark Vest
- Bark Leggings
- Copper Dagger
- Copper Helm
- Copper Plate
- Copper Legs
- Iron Sword
- Iron Helm
- Iron Plate
- Iron Legs
- Steel Longsword
- Steel Helm
- Steel Plate
- Steel Legs
- Tungsten Blade
- Tungsten Helm
- Tungsten Plate
- Tungsten Legs
- Tanned Hide
- Thick Hide
- Rugged Hide
- Cobalt Scale
- Wyrm Hide
- Leather Cowl
- Leather Body
- Leather Chaps
- Hardleather Cowl
- Hardleather Body
- Hardleather Chaps
- Carapace Cowl
- Carapace Body
- Carapace Legs
- Cobalt-Mesh Cowl
- Cobalt-Mesh Body
- Cobalt-Mesh Legs
- Dragonhide Cowl
- Dragonhide Body
- Dragonhide Chaps
- Field Charm
- Rune Dust

### Equipment

- Replace `mapping(address => mapping(uint256 => bool)) equipped`.
- Use slot-based equipment:
  - Weapon
  - Shield
  - Helm
  - Chest
  - Legs
  - Trinket
- Add item slot validation.
- Add item tier metadata:
  - T1 Wood
  - T2 Copper / Hardleather
  - T3 Iron / Carapace
  - T4 Steel / Cobalt-Mesh
  - T5 Tungsten / Dragonhide
- Add item stat metadata:
  - Attack
  - Defence
  - Hitpoints
  - Speed
- Apply equipment stats to:
  - Combat cycle speed
  - Incoming damage mitigation
  - Max HP
- Emit equipment change events with slot and item ID.
- Implemented in the current contract foundation for current combat-relevant gear, Crafting light armor, and the legs slot/stat lookups, but full item minting parity still needs review.

### Activities

The contract needs activity definitions matching the frontend:

Gather:

- Ash Grove: implemented onchain as the first starter gather action.
- Pine Stand
- Oakwood
- Ironbark Trees
- Elderwood Grove
- Spiritwood Grove
- River Bend
- Lake Dock
- Coastal Net
- Deepwater Line
- Storm Pier
- Abyssal Pool
- Copper Ridge: implemented onchain as first T2 mining action.
- Tin Hollow: implemented onchain as first T2 mining action.
- Iron Vein
- Coal Cut
- Tungsten Lode

Combat:

- Training Yard
- Field Rat
- Moss Camp
- Goblin Forager
- Giant Spider
- Dire Wolf
- Venomous Drake
- Cave Bat
- Bandit Scout
- Crypt Knight
- Hollow Treant boss

Artisan:

- Wood Armory: implemented onchain as the first starter artisan action and legitimate no-admin path to T1 gear.
- Bark Leggings
- Copper Smelter: implemented onchain as first T2 bar recipe.
- Iron Smelter
- Copper Dagger: implemented onchain as first T2 weapon recipe.
- Copper Armor
- Copper Legs
- Iron Sword
- Iron Armor
- Iron Legs
- Steel Smelter
- Steel Longsword
- Steel Armor
- Steel Legs
- Tungsten Smelter
- Tungsten Blade
- Tungsten Armor
- Tungsten Legs
- Craft Leather Cowl
- Craft Leather Chaps
- Craft Leather Body
- Craft Hardleather Cowl
- Craft Hardleather Chaps
- Craft Hardleather Body
- Craft Carapace Cowl
- Craft Carapace Legs
- Craft Carapace Body
- Craft Cobalt-Mesh Cowl
- Craft Cobalt-Mesh Legs
- Craft Cobalt-Mesh Body
- Craft Dragonhide Cowl
- Craft Dragonhide Chaps
- Craft Dragonhide Body
- Cook Minnow
- Cook Trout
- Cook Cod
- Cook Tuna
- Cook Manta
- Cook Leviathan

### Activity Data Model

The current `ActivityDef` only supports one cost item and one reward item. That is no longer enough.

Needed:

- Multiple cost items.
- Multiple reward items.
- Multiple XP outputs.
- Required equipment item or required equipment tier.
- Combat rules.
- Cooking rules.
- Optional boss/drop table support later.

Consider using compact fixed arrays for alpha, for example:

```solidity
struct ItemAmount {
    uint256 itemId;
    uint64 amount;
}

struct ActivityDef {
    Skill primarySkill;
    uint8 requiredLevel;
    uint32 cycleSeconds;
    ItemAmount[] costs;
    ItemAmount[] rewards;
    XpReward[] xpRewards;
    CombatRules combat;
    CookingRules cooking;
}
```

If dynamic arrays are too expensive or awkward for pure definitions, use storage-configured activities or hardcoded helper functions per activity.

### Cooking

- Fishing should mint raw fish only.
- Cooked fish should be created only through cooking.
- Raw fish cannot heal.
- Cooked fish can be consumed to restore current HP.
- Cooking must burn some raw fish based on burn chance.
- Burned fish disappear permanently.
- Burn chance must decrease as Cooking level increases.
- Add `eatFood(itemId)` or equivalent.
- Add events for cooked and burned outputs.
- Add higher-tier cooking recipes for Cod, Tuna, Manta, and Leviathan.
- Higher-tier fish must require higher Cooking levels and heal more HP.

Current frontend burn formula:

```text
burnChance = max(minBurnChance, baseBurnChance - (cookingLevel - 1) * burnReductionPerLevel)
```

Solidity should avoid decimals. Store burn values in basis points or tenths of a percent.

### Combat

- Add per-cycle damage chance.
- Add min/max incoming damage.
- Reduce damage using Defence level and equipment Defence stats.
- Damage must resolve per completed combat cycle, not as one aggregate end calculation.
- Stop claim processing when HP would hit 0.
- Award rewards/XP only for completed cycles.
- Add Hitpoints XP to combat cycles.
- Add monster tier requirements for Attack, Defence, Hitpoints, and equipment.
- Add boss flag to activity definitions.
- Add `Hollow Treant` as the first boss.
- Add deterministic test coverage for combat stopping behavior.
- Smart contracts cannot apply damage by themselves without a transaction. Any `claim`, `startActivity`, food action, or future keeper/automation transaction must settle pending combat cycles one-by-one before doing anything else.
- Implemented through lazy settlement. Tests now cover one successful Training Yard settlement and a configured HP safety stop. Future work should add deterministic death/damage tests and frontend integration for `settleFor` and `configureAutoSettle` session UX.

### Death Penalty

Current frontend rule:

- If current HP reaches 0 during combat, combat stops.
- All equipped items are lost.
- Half of Crowns are lost.
- Rewards/XP are granted only for completed cycles before the fatal cycle.
- The fatal cycle does not grant rewards.

Needed onchain:

- Clear all equipment slots when death occurs.
- Burn one copy of each equipped item by clearing the virtual equipped item without reminting it.
- Burn or transfer away `floor(crowns / 2)`.
- Emit a death event with lost Crown amount and lost equipment item IDs.
- Clamp current HP to 0.
- Ensure max HP is recalculated after equipment is removed.
- Add tests for death with no equipment, one equipped item, multiple equipped items, odd Crown balances, and death after several successful cycles.
- Implemented in the current contract foundation. A starter death test now uses gameplay-crafted gear and verifies equipped gear is not reminted after death; this test passes in the Hardhat suite. Broader edge-case death tests still need to be added.
- Equipment-loss tests now have a starter onchain gameplay path through Ash Grove and Wood Armory. The production contract should not gain an admin item faucet just to make tests shorter.
- Do not simplify death loss by transferring gear to a burn address. Current equip logic burns one item when equipped and remints it only on unequip; death clears the equipment slot without reminting, which is equivalent to permanent gear loss.

### Weighted Combat Drops

Current frontend combat now supports deterministic weighted drop tables per completed combat cycle.

Needed onchain:

- Add `DropTableEntry` equivalent with item ID, amount, chance, and rarity.
- Resolve drop tables only for completed combat cycles.
- Add common/uncommon/rare/ultra rare rarity metadata or event data.
- Ensure rare drops are minted alongside normal combat rewards.
- Emit rare drop events so the frontend can highlight them.
- Add contract tests for low-percentage drops using deterministic test seeds or injectable randomness.

Current frontend drop examples:

- Goblin Forager: Pine Logs, Rune Dust
- Giant Spider: Raw Cod, Coal
- Dire Wolf: Raw Tuna, Cobalt Ore
- Venomous Drake: Raw Manta, Tungsten Ore, Rune Dust
- Cave Bat: Raw Trout, Rune Dust
- Bandit Scout: Iron Helm, Steel Bar
- Crypt Knight: Steel Helm, Steel Plate, Tungsten Ore
- Hollow Treant boss: Treant Bark, Steel Plate, Tungsten Ore, Hollow Seed

Randomness note:

- The current frontend uses deterministic pseudo-randomness for simulation.
- For production, combat damage and boss drops need a stronger strategy.
- Options:
  - Commit/reveal
  - External randomness provider
  - Delayed reveal using future block data, if acceptable for testnet
- Do not rely on easily manipulated timestamp-only randomness for valuable rare drops.

### Marketplace

Current frontend local simulation supports:

- Persisted order state.
- Permanent Realm Scavenger buy-floor rows for every non-Crown item at `max(1, floor(marketPrice * 0.05))`.
- Player-created fixed-price listings.
- Inventory escrow when a listing is created.
- One-unit fills that decrement order quantity.
- Player cancellation that returns remaining escrowed inventory.
- Category filters by resource, material, food, equipment, and rare item.

Current contract supports listing, buying, and cancellation, but still needs:

- Support all new ERC-1155 item IDs.
- A Realm Scavenger buy-floor function or equivalent protocol design.
- Clear behavior for partially filled orders.
- Optional marketplace fee/tax.
- Additional tests for partial fill and invalid orders.
- Frontend Chain mode now reads a bounded set of recent open orders and can submit list, buy, and cancel transactions. This should eventually move to event-indexed reads for larger markets.

Contract marketplace parity requirements:

- Listing must escrow ERC-1155 item quantity in the contract.
- Buying must transfer exactly the filled quantity and decrement remaining quantity.
- Cancelling must be restricted to the seller and return the remaining escrowed quantity.
- Listed equipment must not be usable, equippable, or transferable while escrowed.
- Fees, if added, should be explicit and emitted in fill events.

### Community Content and Approved Extension System

Community content must be designed as an approved extension system, not as permissionless settlement logic.

The safe model is:

1. Contributors propose data.
2. Maintainers or governance review the data.
3. Tooling validates IDs, references, rewards, costs, and balance.
4. Tests prove that all new mint, burn, equip, claim, and marketplace paths behave correctly.
5. Approved content is activated in a specific release or content version.

The unsafe model is:

- Any user can publish an activity that the core contract will settle.
- Any external contract can return arbitrary rewards.
- Any pack can mint core resources or Crowns.
- The contract trusts offchain metadata as game logic.
- Active tasks can settle against a different ruleset than the one used when they started.

Do not implement the unsafe model.

#### Content Trust Levels

Use explicit trust levels for content.

| Trust Level | Meaning | Onchain Effect |
| --- | --- | --- |
| Local-only | Runs in browser simulation only | No onchain mint/burn rights |
| Testnet experimental | Maintainer-approved for disposable deployments | Can mint within testnet contracts only |
| Approved core | Reviewed and activated for the main economy | Can mint/burn core ERC-1155 IDs through fixed settlement code |
| Seasonal/isolated | Approved but isolated from the core economy | Uses isolated item ranges or limited bridge rules |

Only approved core content should touch existing core item IDs or Crown rewards.

#### ID Management

The current contract uses numeric item and activity IDs. Community content requires a reserved ID policy before any external pack is accepted.

Recommended ranges:

- `1` to `9999`: core item IDs.
- `10000` to `19999`: core activity IDs.
- `20000` to `49999`: future official expansion IDs.
- `50000` to `99999`: seasonal or event IDs.
- `100000+`: community or experimental IDs.

These exact ranges can change before implementation, but the important rule is that ranges must be documented and enforced by tests or generation tooling. ID collisions are protocol bugs because balances, active tasks, marketplace orders, and equipment slots all refer to numeric IDs.

Frontend namespaced IDs such as `core:ashLog` or `creator.pack:stormGlass` should compile to numeric IDs for the contract. The mapping must be generated or checked, not hand-maintained in several files indefinitely.

#### Content Source Hashes

Each approved content release should have a stable content hash.

The content hash should cover:

- Item definitions.
- Activity definitions.
- Recipe definitions.
- Drop tables.
- Area gates, if those are part of the release.
- Numeric ID mappings.
- Balance limits used for review.

The contract does not necessarily need to store the whole content hash during alpha, but deployment records and tests should. If a registry is introduced later, activated content versions should emit their content hash in an event.

#### Versioning and Active Tasks

If content can change while players have active tasks, the contract must prevent rule switching during settlement.

Acceptable strategies:

- Immutable release pair: content cannot change inside a deployment.
- Settle-and-stop migration: before activating new content, force or require settlement of old tasks and stop affected activities.
- Versioned active task: store content version and activity ID in `activeTask`, then settle using that same version until the task ends.

Do not let a task start under one reward/cost/risk profile and claim under another profile. That creates direct exploit opportunities.

#### Registry Options

There are three possible paths.

Immutable release pairs:

- Current architecture.
- Deploy `IdleIslesContent` and `IdleIsles` together for each release.
- Lowest complexity and lowest governance risk.
- Best for alpha and testnet.
- Requires migration planning for long-lived state.

Approved content registry:

- A separate registry stores approved content versions.
- The core contract reads only activated content.
- Governance or a maintainer role can activate/deprecate versions.
- Requires rigorous access control and event logging.
- Requires careful handling of active tasks during activation.

Approved pack contracts:

- External content contracts implement a read-only interface.
- The core contract can read from allowlisted pack contracts.
- More modular, but introduces external call risk, gas uncertainty, and more audit surface.
- If used, call only through read-only interfaces and never allow pack contracts to execute callbacks or transfer assets during settlement.

For this project, keep immutable release pairs until local/contract parity is much stronger. A registry should come later, after code generation and content validation exist.

#### Registry Access Control

If a registry is added, it must have explicit authority rules.

Possible authorities:

- Maintainer multisig.
- Timelocked governance.
- DAO vote plus emergency pause.
- Testnet-only deployer for disposable experiments.

Do not use a single externally owned account for production content activation. If a maintainer-controlled model is used early, it should be a multisig and the trust assumption should be visible in deployment docs.

Registry events should include:

- Content version proposed.
- Content version approved.
- Content version activated.
- Content version deprecated.
- Content version disabled or paused.
- Content hash.
- Effective timestamp or block.

#### Data-Only Rule

Community content should be declarative data.

Allowed:

- Item IDs.
- Item stat values within bounds.
- Equipment slots.
- Healing values within bounds.
- Activity requirements.
- Cycle times.
- XP rewards.
- Item costs.
- Item rewards.
- Drop entries.
- Rarity markers.
- Area gates.

Not allowed:

- Arbitrary Solidity execution.
- Arbitrary JavaScript execution.
- User-defined reward formulas.
- User-defined randomness sources.
- User-defined marketplace transfers.
- User-defined ERC-1155 hooks.
- External callbacks during claim settlement.

The core engine should interpret content data through fixed settlement rules.

#### Economy Safety Bounds

Approved content must obey hard safety bounds.

Potential hard bounds:

- Minimum cycle time.
- Maximum XP per cycle by skill and tier.
- Maximum Crown reward per cycle.
- Maximum item market value per hour.
- Maximum equipment stat by tier.
- Maximum heal amount by food tier.
- Maximum drop table entries.
- Maximum drop chance per entry.
- Maximum total expected rare-drop value per hour.
- Maximum number of rewards and costs per activity.

Some bounds can be enforced onchain. Others can be enforced by generator tests before deployment. Economy-critical bounds should not rely only on human review.

#### Mint Authority

Community content must never gain direct mint authority.

Only the core settlement engine should mint or burn ERC-1155 items. Content data can describe rewards, but it should not execute minting itself.

Special attention:

- Crowns are an economy-wide currency. Any new Crown faucet requires explicit review.
- High-tier gear must come from reviewed crafting or drop paths.
- Rare drops must use the approved randomness strategy.
- Seasonal items should use isolated ID ranges unless intentionally promoted.
- If item bridges between seasonal and core economies exist, they need separate tests and rate limits.

#### Marketplace Impact

If community items become tradable, marketplace reads and indexing need to understand their IDs and metadata.

Before community items are tradable onchain:

- ERC-1155 metadata URI strategy must support their IDs.
- The frontend must know their names, categories, and icons.
- Indexers must handle their order events.
- The Realm Scavenger floor, if added onchain, must define whether community items receive buy floors.
- Delisted or deprecated content must define what happens to open orders.

Deprecated tradable items should remain transferable and cancellable unless there is a very strong reason to freeze them. Players should not lose assets because a content pack is deprecated.

#### Deprecation and Migration

Content will eventually need deprecation.

Deprecation rules should define:

- Whether new activities can be started.
- Whether existing active tasks can claim.
- Whether existing items remain transferable.
- Whether marketplace orders remain fillable.
- Whether recipes remain available.
- Whether items can be migrated to replacement IDs.

Default policy:

- Deprecating an activity stops new starts.
- Existing tasks should be settled or stopped safely.
- Existing ERC-1155 items should remain owned by players.
- Marketplace cancellation should keep working.
- Forced item deletion should be avoided.

#### Gas and Bytecode Budget

The current optimized core is close to the EVM deployed bytecode limit. Community content must not be added by indefinitely expanding branch-heavy logic inside `IdleIsles.sol`.

Preferred long-term patterns:

- Keep stateful settlement in the core.
- Move static lookup data out of the core.
- Use compact structs or generated lookup contracts for approved content.
- Generate tests and IDs from the same content source.
- Keep revert data compact with custom errors.
- Avoid public getters for every constant.

If content data is moved to storage for registry behavior, measure gas impact carefully. Frequent claim settlement must remain affordable.

#### Randomness Requirements

Community rare drops increase the importance of randomness.

Rules:

- Local-only packs can use deterministic simulation randomness.
- Testnet packs can use the current alpha randomness only if no valuable assets are at stake.
- Main-economy rare drops need a stronger randomness strategy before promotion.
- A content pack must not choose its own randomness source.
- Drop tables must be resolved by the core engine.

#### Testing Requirements for Community Content

Every approved onchain content pack needs tests for:

- Numeric item ID uniqueness.
- Numeric activity ID uniqueness.
- All referenced items exist.
- All referenced activities exist.
- All reward items can be minted only through intended paths.
- All cost items are actually consumed.
- Multi-reward and multi-cost settlement.
- Activity start requirements.
- Equipment requirements.
- Food healing bounds.
- Cooking burn behavior, if applicable.
- Combat damage and death behavior, if applicable.
- Drop table mint behavior.
- Marketplace list/buy/cancel for new tradable items.
- Deprecation behavior, if the pack can be deprecated.
- Active task behavior across version changes, if content can be updated in place.

Do not approve a content pack into chain mode without tests that exercise the actual settlement path.

#### Frontend and Contract Generation

The same content source should eventually generate:

- TypeScript content maps.
- Frontend item/activity ID maps. The first version exists as `src/generated/contentIds.ts`.
- Solidity constants or lookup data.
- Contract test fixtures.
- Human-readable balance reports.
- Deployment metadata.

Manual duplication across `src/game.ts`, `IdleIsles.sol`, `IdleIslesContent.sol`, tests, and docs is acceptable for the current alpha, but it is not acceptable for a mature community-content pipeline.

### Events

Add or revise events for:

- Profile created with initial HP.
- Activity started.
- Activity claimed with cycles, HP lost, and stop reason.
- Cooking claim with cooked and burned amounts.
- Food eaten with HP restored.
- Equipment changed by slot.
- Order created.
- Order filled.
- Order cancelled.

### Tests Needed

- Level curve threshold tests.
- Profile creation initializes HP correctly.
- Gather claim mints expected resources.
- Cooking consumes raw fish.
- Cooking burns fish correctly.
- Cooking mints cooked fish correctly.
- Eating cooked fish restores HP and burns item.
- Raw fish cannot be eaten.
- Combat reduces HP.
- Combat stops at 0 HP.
- Hitpoints XP is awarded from combat.
- Equipment slot validation works.
- Equipment stats affect max HP and damage.
- Multi-cost recipes validate inventory.
- Multi-reward recipes mint all outputs.
- Marketplace list/buy/cancel behavior.
- Community content ID collision tests.
- Community content missing-reference validation tests.
- Community content reward/cost bounds tests.
- Community content active-task versioning tests, once updateable content exists.
- Community content deprecation tests, once deprecation exists.
- Generated fixture tests that ensure frontend IDs and Solidity IDs match.

Implemented tests:

- Level curve threshold tests.
- Profile creation initializes HP and starter Crowns.
- One Training Yard cycle grants expected XP and rewards.
- Auto-settle HP safety stop clears combat without death loss.
- Marketplace listing escrows items.
- Marketplace buying transfers item escrow to buyer and Crowns to seller.
- Marketplace cancellation returns escrowed items.
- Ash Grove gathering mints Ash Logs and Woodcutting XP.
- Wood Armory crafting burns Ash Logs, mints T1 gear, and grants Smithing XP.
- Copper Ridge and Tin Hollow mint Copper/Tin Ore and Mining XP.
- Copper Smelter burns Copper Ore, Tin Ore, and Ash Log to mint Copper Bar.
- Copper Dagger can be crafted through the no-admin gameplay path after reaching Smithing level 4.
- River Bend fishing mints Raw Minnow and Fishing XP.
- Raw Minnow cannot be eaten.
- Cook Minnow burns Raw Minnow attempts, mints successful Cooked Minnow, destroys burned attempts, and grants Cooking XP.
- Cooked Minnow can heal HP after being created through gameplay.
- Combat auto-eat can consume gameplay-created Cooked Minnow during settlement.
- Equipping crafted gear burns the wallet copy and unequipping remints it.
- Combat death with crafted equipped gear clears equipped slots, does not remint lost gear, and burns half of Crowns after completed combat rewards.

## Rule

Whenever `src/game.ts` changes gameplay rules, update this file in the same work session with the matching contract work.

Whenever a community content path is added or changed, document the content trust level, numeric ID range, mint/burn behavior, active-task versioning behavior, marketplace impact, deprecation behavior, and required tests in this file before treating it as chain-ready.
