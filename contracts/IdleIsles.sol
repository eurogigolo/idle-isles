// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IIdleIslesContent} from "./IIdleIslesContent.sol";

contract IdleIsles is ERC1155, ReentrancyGuard {
    error ProfileExists();
    error NoProfile();
    error NoHp();
    error RequirementLow();
    error EquipmentRequired();
    error BadActivity();
    error BadArea();
    error AreaLocked();
    error AreaRequired();
    error MaterialLow();
    error AutoDisabled();
    error AutoExpired();
    error NotOperator();
    error BadConfig();
    error NotFood();
    error NoFood();
    error NotEquipment();
    error NoItem();

    uint256 internal constant CROWNS = 1;
    uint256 internal constant PINE_LOG = 3;
    uint256 internal constant RAW_MINNOW = 8;
    uint256 internal constant COOKED_MINNOW = 9;
    uint256 internal constant COPPER_BAR = 40;
    uint256 internal constant WOOD_CLUB = 50;
    uint256 internal constant BARK_SHIELD = 51;
    uint256 internal constant BARK_VEST = 52;
    uint256 internal constant COPPER_DAGGER = 53;
    uint256 internal constant HIDE = 70;
    uint256 internal constant RUNE_DUST = 72;
    uint256 internal constant THICK_HIDE = 73;
    uint256 internal constant RUGGED_HIDE = 74;
    uint256 internal constant COBALT_SCALE = 75;
    uint256 internal constant WYRM_HIDE = 76;
    uint256 internal constant FEATHER = 77;
    uint16 internal constant BRONZE_ARROW = 130;
    uint16 internal constant IRON_ARROW = 131;
    uint16 internal constant STEEL_ARROW = 132;
    uint16 internal constant TUNGSTEN_ARROW = 133;

    uint8 internal constant XP_RATE_MULTIPLIER = 2;

    uint16 internal constant ACTIVITY_TRAINING_YARD = 101;
    uint16 internal constant ACTIVITY_FIELD_RAT = 102;
    uint16 internal constant ACTIVITY_MOSS_CAMP = 103;
    uint16 internal constant ACTIVITY_CAVE_BAT = 104;
    uint16 internal constant ACTIVITY_BANDIT_SCOUT = 105;
    uint16 internal constant ACTIVITY_CRYPT_KNIGHT = 106;
    uint16 internal constant ACTIVITY_HOLLOW_TREANT = 107;
    uint16 internal constant ACTIVITY_GOBLIN_FORAGER = 108;
    uint16 internal constant ACTIVITY_GIANT_SPIDER = 109;
    uint16 internal constant ACTIVITY_DIRE_WOLF = 110;
    uint16 internal constant ACTIVITY_VENOMOUS_DRAKE = 111;
    uint16 internal constant ACTIVITY_FEATHER_HAWK = 112;
    uint16 internal constant ACTIVITY_ASH_GROVE = 201;
    uint16 internal constant ACTIVITY_LAST_GATHER = 217;
    uint16 internal constant ACTIVITY_WOOD_ARMORY = 301;
    uint16 internal constant ACTIVITY_COPPER_SMELTER = 302;
    uint16 internal constant ACTIVITY_COPPER_DAGGER = 303;
    uint16 internal constant ACTIVITY_COOK_MINNOW = 304;
    uint16 internal constant ACTIVITY_TUNGSTEN_ARROWTIPS = 343;
    uint16 internal constant ACTIVITY_IRONBARK_BOW = 347;
    uint16 internal constant ACTIVITY_TUNGSTEN_ARROWS = 351;
    uint16 internal constant ACTIVITY_LAST_ARTISAN = 351;

    bytes internal constant COMBAT_REWARD_DATA =
        hex"0000020000010046000004000801004600000800480100490000160000020046"
        hex"000023000002004900003a000001004800008c00480400030000060000010049"
        hex"00000c000001004a00002d000001004b00005a000001004c000004000001004d";

    uint8 internal constant AREA_STARTER = 1;
    uint8 internal constant AREA_OUTER_ISLES = 2;
    uint8 internal constant AREA_STARTER_MASK = 1;
    uint8 internal constant AREA_OUTER_ISLES_MASK = 2;

    uint256 internal constant OUTER_ISLES_PASSAGE_COST = 50_000;

    uint256 internal constant AFK_CAP = 8 hours;
    uint16 internal constant MAX_SETTLE_CYCLES = 1_000;
    uint16 internal constant MAX_COMBAT_SETTLE_CYCLES = 200;

    enum Skill {
        Attack,
        Defence,
        Hitpoints,
        Woodcutting,
        Fishing,
        Mining,
        Smithing,
        Cooking,
        Crafting,
        Ranged,
        Magic
    }

    enum CombatStyle {
        Auto,
        Melee,
        Ranged,
        Magic
    }

    enum Slot {
        Weapon,
        Shield,
        Helm,
        Chest,
        Legs,
        Trinket
    }

    struct ActiveTask {
        uint16 activityId;
        uint64 startedAt;
        uint64 lastResolvedAt;
    }

    struct Equipment {
        uint256 weapon;
        uint256 shield;
        uint256 helm;
        uint256 chest;
        uint256 legs;
        uint256 trinket;
    }

    struct AutoSettleConfig {
        bool enabled;
        address operator;
        uint64 expiresAt;
        uint16 maxCyclesPerSettle;
        uint16 stopAtHp;
        bool autoEat;
        uint16 maxFoodPerSettle;
        uint256 foodItemId;
    }

    struct CombatCycleResult {
        bool died;
        bool stopped;
        uint256 hpLost;
    }

    struct CombatSettleState {
        uint256 hpLost;
        uint256 cyclesSettled;
        uint16 foodUsed;
    }

    mapping(address => bool) public hasProfile;
    mapping(address => uint16) public currentHitpoints;
    mapping(address => uint8) public currentAreaId;
    mapping(address => mapping(uint8 => uint64)) public skillXp;
    mapping(address => ActiveTask) public activeTask;
    mapping(address => Equipment) private equipment;
    mapping(address => AutoSettleConfig) public autoSettleConfig;
    mapping(address => uint8) private unlockedAreaMask;

    IIdleIslesContent internal immutable CONTENT;

    event ProfileCreated(address indexed player, uint256 maxHitpoints);
    event ActivityStarted(address indexed player, uint16 indexed activityId);
    event ActivityStopped(address indexed player, uint16 indexed activityId, string reason);
    event CombatSettled(
        address indexed player,
        uint16 indexed activityId,
        uint256 cycles,
        uint256 hpLost,
        CombatStyle indexed style
    );
    event PlayerDied(
        address indexed player,
        uint16 indexed activityId,
        uint256 crownsLost,
        uint256[] equipmentLost
    );
    event RareDrop(
        address indexed player,
        uint16 indexed activityId,
        uint256 indexed itemId,
        uint256 amount,
        uint8 rarity
    );
    event FoodEaten(address indexed player, uint256 indexed itemId, uint256 hpRestored);
    event CombatConsumableUsed(address indexed player, uint16 indexed activityId, uint256 indexed itemId);
    event ItemEquipped(address indexed player, uint8 indexed slot, uint256 indexed itemId);
    event ItemUnequipped(address indexed player, uint8 indexed slot, uint256 indexed itemId);
    event AreaTraveled(address indexed player, uint8 indexed areaId, uint256 cost);
    event AutoSettleConfigured(address indexed player, address indexed operator, uint64 expiresAt);
    event SkillActivitySettled(
        address indexed player,
        uint16 indexed activityId,
        uint256 cycles
    );
    event CookingSettled(
        address indexed player,
        uint16 indexed activityId,
        uint256 cycles,
        uint256 cooked,
        uint256 burned
    );

    constructor(string memory metadataUri, address contentAddress) ERC1155(metadataUri) {
        if (contentAddress == address(0)) revert BadConfig();
        CONTENT = IIdleIslesContent(contentAddress);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function createProfile() external {
        if (hasProfile[msg.sender]) revert ProfileExists();

        hasProfile[msg.sender] = true;
        currentHitpoints[msg.sender] = uint16(maxHitpoints(msg.sender));
        currentAreaId[msg.sender] = AREA_STARTER;
        unlockedAreaMask[msg.sender] = AREA_STARTER_MASK;
        _mint(msg.sender, CROWNS, 80, "");

        emit ProfileCreated(msg.sender, maxHitpoints(msg.sender));
    }

    function startCombat(uint16 activityId) external nonReentrant {
        _startCombat(msg.sender, activityId);
    }

    function _startCombat(address player, uint16 activityId) internal {
        if (!hasProfile[player]) revert NoProfile();
        _settle(player, MAX_SETTLE_CYCLES);

        IIdleIslesContent.CombatActivity memory activity = CONTENT.getCombatActivity(activityId);
        CombatStyle resolvedStyle = _resolveCombatStyle(player);
        _requireActivityArea(player, activityId);
        if (currentHitpoints[player] == 0) revert NoHp();
        if (levelOf(player, _combatSkillForStyle(resolvedStyle)) < activity.reqAttack) {
            revert RequirementLow();
        }
        if (levelOf(player, Skill.Defence) < activity.reqDefence) revert RequirementLow();
        if (levelOf(player, Skill.Hitpoints) < activity.reqHitpoints) revert RequirementLow();

        if (activity.requiredEquipment != 0) {
            if (!_isEquipped(player, activity.requiredEquipment)) revert EquipmentRequired();
        }

        _startTask(player, activityId);
    }

    function startGather(uint16 activityId) external nonReentrant {
        if (!hasProfile[msg.sender]) revert NoProfile();
        _settle(msg.sender, MAX_SETTLE_CYCLES);

        uint256 config = CONTENT.getGatherActivity(activityId);
        _requireActivityArea(msg.sender, activityId);

        if (levelOf(msg.sender, Skill(uint8(config >> 16))) < uint8(config >> 24)) {
            revert RequirementLow();
        }

        _startTask(msg.sender, activityId);
    }

    function startArtisan(uint16 activityId) external nonReentrant {
        if (!hasProfile[msg.sender]) revert NoProfile();
        _settle(msg.sender, MAX_SETTLE_CYCLES);

        (uint256 config, uint256 costs,) = CONTENT.getArtisanActivity(activityId);
        _requireActivityArea(msg.sender, activityId);

        if (levelOf(msg.sender, Skill(uint8(config >> 16))) < uint8(config >> 24)) {
            revert RequirementLow();
        }
        if (_affordableRecipeCycles(msg.sender, costs) == 0) revert MaterialLow();

        _startTask(msg.sender, activityId);
    }

    function claim() external nonReentrant {
        if (!hasProfile[msg.sender]) revert NoProfile();
        _settle(msg.sender, MAX_SETTLE_CYCLES);
    }

    function travelToArea(uint8 areaId) external nonReentrant {
        if (!hasProfile[msg.sender]) revert NoProfile();
        if (!_isValidArea(areaId)) revert BadArea();
        if (currentAreaId[msg.sender] == areaId) {
            return;
        }

        _settle(msg.sender, MAX_SETTLE_CYCLES);

        uint256 cost;
        if (!_isAreaUnlocked(msg.sender, areaId)) {
            cost = _areaShipCost(areaId);
            if (balanceOf(msg.sender, CROWNS) < cost) revert MaterialLow();
            _burn(msg.sender, CROWNS, cost);
            unlockedAreaMask[msg.sender] |= _areaMask(areaId);
        }

        uint16 activityId = activeTask[msg.sender].activityId;
        if (activityId != 0) {
            _stopActivity(msg.sender, activityId, "TRAVEL");
        }

        currentAreaId[msg.sender] = areaId;
        emit AreaTraveled(msg.sender, areaId, cost);
    }

    function settleFor(address player, uint16 maxCycles) external nonReentrant {
        if (!hasProfile[player]) revert NoProfile();

        AutoSettleConfig memory config = autoSettleConfig[player];
        if (!config.enabled) revert AutoDisabled();
        if (block.timestamp > config.expiresAt) revert AutoExpired();
        if (config.operator != address(0) && config.operator != msg.sender) revert NotOperator();

        uint16 cycleLimit = maxCycles;
        if (cycleLimit == 0 || cycleLimit > config.maxCyclesPerSettle) {
            cycleLimit = config.maxCyclesPerSettle;
        }
        if (cycleLimit == 0) {
            cycleLimit = 1;
        }

        _settle(player, cycleLimit);
    }

    function configureAutoSettle(
        address operator,
        uint64 expiresAt,
        uint16 maxCyclesPerSettle,
        uint16 stopAtHp,
        bool autoEat,
        uint16 maxFoodPerSettle,
        uint256 foodItemId
    ) external {
        if (!hasProfile[msg.sender]) revert NoProfile();
        if (expiresAt <= block.timestamp) revert BadConfig();
        if (maxCyclesPerSettle == 0) revert BadConfig();

        if (autoEat) {
            if (CONTENT.healAmount(foodItemId) == 0) revert NotFood();
        }

        autoSettleConfig[msg.sender] = AutoSettleConfig({
            enabled: true,
            operator: operator,
            expiresAt: expiresAt,
            maxCyclesPerSettle: maxCyclesPerSettle,
            stopAtHp: stopAtHp,
            autoEat: autoEat,
            maxFoodPerSettle: maxFoodPerSettle,
            foodItemId: foodItemId
        });

        emit AutoSettleConfigured(msg.sender, operator, expiresAt);
    }

    function clearAutoSettle() external {
        delete autoSettleConfig[msg.sender];
        emit AutoSettleConfigured(msg.sender, address(0), 0);
    }

    function combatStylePreference(address player) external view returns (CombatStyle) {
        return _combatStylePreference(player);
    }

    function setCombatStylePreference(CombatStyle style) external {
        unlockedAreaMask[msg.sender] =
            (unlockedAreaMask[msg.sender] & 0x3f) |
            (uint8(style) << 6);
    }

    function eatFood(uint256 itemId) external nonReentrant {
        if (!hasProfile[msg.sender]) revert NoProfile();
        _settle(msg.sender, MAX_SETTLE_CYCLES);
        _eatFood(msg.sender, itemId);
    }

    function equip(uint256 itemId) external nonReentrant {
        if (!hasProfile[msg.sender]) revert NoProfile();
        _settle(msg.sender, MAX_SETTLE_CYCLES);

        (bool equippable, uint8 slotIndex) = CONTENT.itemSlot(itemId);
        if (!equippable) revert NotEquipment();
        if (balanceOf(msg.sender, itemId) == 0) revert NoItem();

        Slot slot = Slot(slotIndex);
        _unequipSlot(msg.sender, slot);
        _burn(msg.sender, itemId, 1);
        _setEquipped(msg.sender, slot, itemId);
        _clampHitpoints(msg.sender);

        emit ItemEquipped(msg.sender, uint8(slot), itemId);
    }

    function unequip(Slot slot) external nonReentrant {
        if (!hasProfile[msg.sender]) revert NoProfile();
        _settle(msg.sender, MAX_SETTLE_CYCLES);
        _unequipSlot(msg.sender, slot);
        _clampHitpoints(msg.sender);
    }

    function pendingCycles(address player) external view returns (uint256 cycles) {
        ActiveTask memory task = activeTask[player];
        if (task.activityId == 0) {
            return 0;
        }

        uint256 elapsed = block.timestamp - task.lastResolvedAt;
        if (elapsed > AFK_CAP) {
            elapsed = AFK_CAP;
        }

        cycles = elapsed / _activityCycleSeconds(player, task.activityId);
    }

    function equippedItem(address player, Slot slot) external view returns (uint256) {
        return _equippedItem(player, slot);
    }

    function isAreaUnlocked(address player, uint8 areaId) public view returns (bool) {
        return _isAreaUnlocked(player, areaId);
    }

    function levelOf(address player, Skill skill) public view returns (uint8) {
        return levelForXp(skillXp[player][uint8(skill)]);
    }

    function levelForXp(uint64 xp) public pure returns (uint8 level) {
        level = 1;
        while (level < 99 && xp >= xpRequiredForLevel(level + 1)) {
            level++;
        }
    }

    function xpRequiredForLevel(uint8 targetLevel) public pure returns (uint64) {
        if (targetLevel <= 1) {
            return 0;
        }

        uint64 step = uint64(targetLevel - 1);
        uint64 stepSquared = step * step;
        uint64 stepCubed = stepSquared * step;
        return 75 * stepSquared + 45 * stepCubed + stepCubed * step;
    }

    function maxHitpoints(address player) public view returns (uint256) {
        return 10 + (uint256(levelOf(player, Skill.Hitpoints)) - 1) * 3 + equipmentStats(player).hitpoints;
    }

    function adjustedCycleSeconds(address player, IIdleIslesContent.CombatActivity memory activity)
        public
        view
        returns (uint32)
    {
        IIdleIslesContent.Stats memory stats = equipmentStats(player);
        IIdleIslesContent.WeaponStats memory weaponStats = _equippedWeaponStats(player);
        uint256 bps = 10_000;
        uint256 reduction =
            uint256(stats.speed) *
            250 +
            uint256(stats.attack) *
            120 +
            uint256(weaponStats.accuracy) *
            40;

        if (reduction > 3_200) {
            reduction = 3_200;
        }

        uint256 adjusted = (uint256(activity.cycleSeconds) * (bps - reduction)) / bps;
        if (adjusted < 3) {
            adjusted = 3;
        }

        return uint32(adjusted);
    }

    function equipmentStats(address player) public view returns (IIdleIslesContent.Stats memory stats) {
        Equipment memory gear = equipment[player];
        IIdleIslesContent.Stats memory itemStats;

        itemStats = CONTENT.itemStatsOf(gear.weapon);
        stats.attack += itemStats.attack;
        stats.defence += itemStats.defence;
        stats.hitpoints += itemStats.hitpoints;
        stats.speed += itemStats.speed;

        itemStats = CONTENT.itemStatsOf(gear.shield);
        stats.attack += itemStats.attack;
        stats.defence += itemStats.defence;
        stats.hitpoints += itemStats.hitpoints;
        stats.speed += itemStats.speed;

        itemStats = CONTENT.itemStatsOf(gear.helm);
        stats.attack += itemStats.attack;
        stats.defence += itemStats.defence;
        stats.hitpoints += itemStats.hitpoints;
        stats.speed += itemStats.speed;

        itemStats = CONTENT.itemStatsOf(gear.chest);
        stats.attack += itemStats.attack;
        stats.defence += itemStats.defence;
        stats.hitpoints += itemStats.hitpoints;
        stats.speed += itemStats.speed;

        itemStats = CONTENT.itemStatsOf(gear.legs);
        stats.attack += itemStats.attack;
        stats.defence += itemStats.defence;
        stats.hitpoints += itemStats.hitpoints;
        stats.speed += itemStats.speed;

        itemStats = CONTENT.itemStatsOf(gear.trinket);
        stats.attack += itemStats.attack;
        stats.defence += itemStats.defence;
        stats.hitpoints += itemStats.hitpoints;
        stats.speed += itemStats.speed;
    }

    function _equippedWeaponStats(
        address player
    ) internal view returns (IIdleIslesContent.WeaponStats memory stats) {
        uint256 weaponId = equipment[player].weapon;
        if (weaponId == 0) {
            // Unarmed combat stays melee-capable for starter activities.
            return IIdleIslesContent.WeaponStats(uint8(CombatStyle.Auto), 1, 0);
        }

        return CONTENT.weaponStatsOf(weaponId);
    }

    function _settle(address player, uint16 cycleLimit) internal {
        uint16 activityId = activeTask[player].activityId;
        if (activityId == 0) {
            return;
        }

        uint32 cycleSeconds = _activityCycleSeconds(player, activityId);
        uint256 elapsed = block.timestamp - activeTask[player].lastResolvedAt;
        if (elapsed > AFK_CAP) {
            elapsed = AFK_CAP;
        }

        uint256 possibleCycles = elapsed / cycleSeconds;
        if (possibleCycles == 0) {
            return;
        }

        uint16 maxSettleCycles = _maxSettleCycles(activityId);
        if (cycleLimit == 0 || cycleLimit > maxSettleCycles) {
            cycleLimit = maxSettleCycles;
        }
        if (possibleCycles > cycleLimit) {
            possibleCycles = cycleLimit;
        }

        if (_isGatherActivity(activityId)) {
            _settleGather(player, possibleCycles, cycleSeconds, activityId);
            return;
        }

        if (_isArtisanActivity(activityId)) {
            _settleArtisan(player, possibleCycles, cycleSeconds, activityId);
            return;
        }

        _settleCombat(player, possibleCycles, cycleSeconds, activityId);
    }

    function _settleCombat(
        address player,
        uint256 possibleCycles,
        uint32 cycleSeconds,
        uint16 activityId
    ) internal {
        CombatSettleState memory state;
        CombatStyle style = _resolveCombatStyle(player);

        for (uint256 i = 0; i < possibleCycles; i++) {
            (bool shouldContinue, uint16 nextFoodUsed) = _prepareCombatCycle(
                player,
                activityId,
                state.foodUsed
            );
            state.foodUsed = nextFoodUsed;
            if (!shouldContinue) {
                break;
            }

            CombatCycleResult memory result = _resolveCombatCycle(
                player,
                activityId,
                cycleSeconds,
                style
            );

            if (result.stopped) {
                break;
            }

            state.hpLost += result.hpLost;

            if (result.died) {
                break;
            }

            state.cyclesSettled++;
        }

        if (state.cyclesSettled > 0 || state.hpLost > 0) {
            emit CombatSettled(
                player,
                activityId,
                state.cyclesSettled,
                state.hpLost,
                style
            );
        }
    }

    function _maxSettleCycles(uint16 activityId) internal pure returns (uint16) {
        if (_isCombatActivity(activityId)) {
            return MAX_COMBAT_SETTLE_CYCLES;
        }
        return MAX_SETTLE_CYCLES;
    }

    function _resolveCombatStyle(address player) internal view returns (CombatStyle) {
        CombatStyle preference = _combatStylePreference(player);
        if (preference != CombatStyle.Auto) return preference;

        uint8 weaponStyle = _equippedWeaponStats(player).style;
        if (weaponStyle == uint8(CombatStyle.Ranged)) return CombatStyle.Ranged;
        if (weaponStyle == uint8(CombatStyle.Magic)) return CombatStyle.Magic;
        return CombatStyle.Melee;
    }

    function _combatStylePreference(address player) internal view returns (CombatStyle) {
        return CombatStyle(unlockedAreaMask[player] >> 6);
    }

    function _combatSkillForStyle(CombatStyle style) internal pure returns (Skill) {
        if (style == CombatStyle.Ranged) {
            return Skill.Ranged;
        }
        if (style == CombatStyle.Magic) {
            return Skill.Magic;
        }
        return Skill.Attack;
    }

    function _startTask(address player, uint16 activityId) internal {
        activeTask[player] = ActiveTask({
            activityId: activityId,
            startedAt: uint64(block.timestamp),
            lastResolvedAt: uint64(block.timestamp)
        });

        emit ActivityStarted(player, activityId);
    }

    function _activityCycleSeconds(address player, uint16 activityId)
        internal
        view
        returns (uint32)
    {
        if (_isCombatActivity(activityId)) {
            return adjustedCycleSeconds(player, CONTENT.getCombatActivity(activityId));
        }

        if (_isGatherActivity(activityId)) {
            return uint32(CONTENT.getGatherActivity(activityId) & 0xffff);
        }

        if (_isArtisanActivity(activityId)) {
            (uint256 config,,) = CONTENT.getArtisanActivity(activityId);
            return uint32(config & 0xffff);
        }

        revert BadActivity();
    }

    function _isCombatActivity(uint16 activityId) internal pure returns (bool) {
        return activityId >= ACTIVITY_TRAINING_YARD && activityId <= ACTIVITY_FEATHER_HAWK;
    }

    function _isGatherActivity(uint16 activityId) internal pure returns (bool) {
        return activityId >= ACTIVITY_ASH_GROVE && activityId <= ACTIVITY_LAST_GATHER;
    }

    function _isArtisanActivity(uint16 activityId) internal pure returns (bool) {
        return activityId >= ACTIVITY_WOOD_ARMORY && activityId <= ACTIVITY_LAST_ARTISAN;
    }

    function _requireActivityArea(address player, uint16 activityId) internal view {
        uint8 requiredAreaId = _activityAreaId(activityId);
        if (!_isAreaUnlocked(player, requiredAreaId)) revert AreaLocked();
        if (currentAreaId[player] != requiredAreaId) revert AreaRequired();
    }

    function _activityAreaId(uint16 activityId) internal pure returns (uint8) {
        if (
            (activityId >= ACTIVITY_CAVE_BAT && activityId <= ACTIVITY_HOLLOW_TREANT) ||
            (activityId >= ACTIVITY_DIRE_WOLF && activityId <= ACTIVITY_VENOMOUS_DRAKE) ||
            (activityId >= 207 && activityId <= 209) ||
            (activityId >= 211 && activityId <= 214) ||
            (activityId >= 216 && activityId <= ACTIVITY_LAST_GATHER) ||
            (activityId >= 316 && activityId <= 319) ||
            (activityId >= 329 && activityId <= 334) ||
            activityId == ACTIVITY_TUNGSTEN_ARROWTIPS ||
            activityId == ACTIVITY_IRONBARK_BOW ||
            activityId == ACTIVITY_TUNGSTEN_ARROWS
        ) {
            return AREA_OUTER_ISLES;
        }

        return AREA_STARTER;
    }

    function _isValidArea(uint8 areaId) internal pure returns (bool) {
        return areaId == AREA_STARTER || areaId == AREA_OUTER_ISLES;
    }

    function _isAreaUnlocked(address player, uint8 areaId) internal view returns (bool) {
        if (!_isValidArea(areaId)) {
            return false;
        }

        return unlockedAreaMask[player] & _areaMask(areaId) != 0;
    }

    function _areaShipCost(uint8 areaId) internal pure returns (uint256) {
        if (areaId == AREA_OUTER_ISLES) {
            return OUTER_ISLES_PASSAGE_COST;
        }

        return 0;
    }

    function _areaMask(uint8 areaId) internal pure returns (uint8) {
        if (areaId == AREA_OUTER_ISLES) {
            return AREA_OUTER_ISLES_MASK;
        }

        return AREA_STARTER_MASK;
    }

    function _settleGather(
        address player,
        uint256 cycles,
        uint32 cycleSeconds,
        uint16 activityId
    ) internal {
        uint256 config = CONTENT.getGatherActivity(activityId);
        _grantSkillXp(player, Skill(uint8(config >> 16)), uint32(config >> 32) * cycles);
        _mint(player, uint16(config >> 64), uint16(config >> 80) * cycles, "");
        activeTask[player].lastResolvedAt += uint64(cycles * cycleSeconds);

        emit SkillActivitySettled(player, activityId, cycles);
    }

    function _settleArtisan(
        address player,
        uint256 possibleCycles,
        uint32 cycleSeconds,
        uint16 activityId
    ) internal {
        (uint256 config, uint256 costs, uint256 rewards) = CONTENT.getArtisanActivity(activityId);
        uint256 affordableCycles = _affordableRecipeCycles(player, costs);
        uint256 cycles = possibleCycles;
        if (cycles > affordableCycles) {
            cycles = affordableCycles;
        }
        if (cycles == 0) {
            return;
        }

        _burnRecipeCosts(player, costs, cycles);

        uint256 cookedItem = uint16(config >> 64);
        if (cookedItem != 0) {
            uint256 cooked = _cookedRecipeCycles(player, config, cycles, cycleSeconds);
            if (cooked > 0) {
                _mint(player, cookedItem, cooked, "");
            }
            _grantSkillXp(player, Skill(uint8(config >> 16)), uint32(config >> 32) * cycles);
            activeTask[player].lastResolvedAt += uint64(cycles * cycleSeconds);
            emit SkillActivitySettled(player, activityId, cycles);
            emit CookingSettled(player, activityId, cycles, cooked, cycles - cooked);
            return;
        }

        _mintRecipeRewards(player, rewards, cycles);
        _grantSkillXp(player, Skill(uint8(config >> 16)), uint32(config >> 32) * cycles);
        activeTask[player].lastResolvedAt += uint64(cycles * cycleSeconds);

        emit SkillActivitySettled(player, activityId, cycles);
    }

    function _affordableRecipeCycles(
        address player,
        uint256 costs
    ) internal view returns (uint256 cycles) {
        cycles = type(uint256).max;
        for (uint256 i = 0; i < 3; i++) {
            uint256 pair = (costs >> (i * 32)) & 0xffffffff;
            uint256 itemId = uint16(pair);
            uint256 amount = uint16(pair >> 16);
            if (itemId == 0 || amount == 0) continue;

            uint256 itemCycles = balanceOf(player, itemId) / amount;
            if (itemCycles < cycles) {
                cycles = itemCycles;
            }
        }
        if (cycles == type(uint256).max) return 0;
    }

    function _burnRecipeCosts(
        address player,
        uint256 costs,
        uint256 cycles
    ) internal {
        for (uint256 i = 0; i < 3; i++) {
            uint256 pair = (costs >> (i * 32)) & 0xffffffff;
            uint256 itemId = uint16(pair);
            uint256 amount = uint16(pair >> 16);
            if (itemId != 0 && amount != 0) {
                _burn(player, itemId, amount * cycles);
            }
        }
    }

    function _mintRecipeRewards(
        address player,
        uint256 rewards,
        uint256 cycles
    ) internal {
        for (uint256 i = 0; i < 3; i++) {
            uint256 pair = (rewards >> (i * 32)) & 0xffffffff;
            uint256 itemId = uint16(pair);
            uint256 amount = uint16(pair >> 16);
            if (itemId != 0 && amount != 0) {
                _mint(player, itemId, amount * cycles, "");
            }
        }
    }

    function _cookedRecipeCycles(
        address player,
        uint256 config,
        uint256 cycles,
        uint32 cycleSeconds
    ) internal view returns (uint256 cooked) {
        uint256 cycleOffset =
            (activeTask[player].lastResolvedAt - activeTask[player].startedAt) /
            cycleSeconds;
        uint256 burnChanceBps = _recipeBurnChanceBps(player, config);

        for (uint256 i = 0; i < cycles; i++) {
            if (_rollBps(player, cycleOffset + i, 53) >= burnChanceBps) {
                cooked++;
            }
        }
    }

    function _recipeBurnChanceBps(
        address player,
        uint256 config
    ) internal view returns (uint256) {
        uint256 base = uint16(config >> 80);
        uint256 floor = uint16(config >> 96);
        if (base <= floor) return floor;

        uint256 reduction =
            uint256(levelOf(player, Skill.Cooking) - 1) *
            uint16(config >> 112);
        uint256 reducible = base - floor;
        if (reduction >= reducible) return floor;
        return base - reduction;
    }

    function _resolveCombatCycle(
        address player,
        uint16 activityId,
        uint32 cycleSeconds,
        CombatStyle style
    ) internal returns (CombatCycleResult memory result) {
        IIdleIslesContent.CombatActivity memory activity = CONTENT.getCombatActivity(activityId);
        ActiveTask storage task = activeTask[player];
        uint256 cycleIndex = (task.lastResolvedAt - task.startedAt) / cycleSeconds;

        if (!_consumeAmmoForStyle(player, activityId, style)) {
            _stopActivity(
                player,
                activityId,
                style == CombatStyle.Magic ? "NO_RUNE" : "NO_AMMO"
            );
            result.stopped = true;
            return result;
        }

        uint256 damage = _combatDamage(player, activity, cycleIndex);

        if (damage > 0 && currentHitpoints[player] <= damage) {
            result.hpLost = currentHitpoints[player];
            currentHitpoints[player] = 0;
            _applyDeathPenalty(player, activity.activityId);
            result.died = true;
            return result;
        }

        if (damage > 0) {
            currentHitpoints[player] -= uint16(damage);
            result.hpLost = damage;
        }

        if (_combatHit(player, activity, cycleIndex, style)) {
            _grantCombatCycle(player, activity, cycleIndex, style);
        }

        task.lastResolvedAt += cycleSeconds;
        return result;
    }

    function _prepareCombatCycle(
        address player,
        uint16 activityId,
        uint16 foodUsed
    ) internal returns (bool shouldContinue, uint16 nextFoodUsed) {
        AutoSettleConfig memory config = autoSettleConfig[player];
        nextFoodUsed = foodUsed;

        if (!config.enabled || !config.autoEat || block.timestamp > config.expiresAt) {
            return (true, nextFoodUsed);
        }

        if (currentHitpoints[player] > config.stopAtHp) {
            return (true, nextFoodUsed);
        }

        if (
            config.autoEat &&
            nextFoodUsed < config.maxFoodPerSettle &&
            balanceOf(player, config.foodItemId) > 0
        ) {
            uint256 restored = _eatFood(player, config.foodItemId);
            nextFoodUsed++;

            if (restored > 0 && currentHitpoints[player] > config.stopAtHp) {
                return (true, nextFoodUsed);
            }
        }

        _stopActivity(player, activityId, "HP_STOP");
        return (false, nextFoodUsed);
    }

    function _grantCombatCycle(
        address player,
        IIdleIslesContent.CombatActivity memory activity,
        uint256 cycleIndex,
        CombatStyle style
    ) internal {
        _grantSkillXp(player, _combatSkillForStyle(style), activity.xpAttack);
        _grantSkillXp(player, Skill.Defence, activity.xpDefence);
        _grantSkillXp(player, Skill.Hitpoints, activity.xpHitpoints);

        uint256 rewardConfig = _combatRewardConfig(activity.activityId);
        uint256 rewardItem = uint16(rewardConfig);
        uint256 rewardAmount = uint8(rewardConfig >> 16);
        uint256 extraItem = uint16(rewardConfig >> 24);
        uint256 crowns = uint16(rewardConfig >> 40);

        if (rewardItem != 0) _mint(player, rewardItem, rewardAmount, "");
        if (extraItem != 0) _mint(player, extraItem, 1, "");
        if (crowns != 0) _mint(player, CROWNS, crowns, "");

        for (uint8 i = 0; i < 4; i++) {
            IIdleIslesContent.Drop memory drop = CONTENT.getDrop(activity.activityId, i);
            if (drop.itemId == 0) {
                continue;
            }

            if (_rollBps(player, cycleIndex, 71 + i * 13) < drop.chanceBps) {
                _mint(player, drop.itemId, drop.amount, "");
                emit RareDrop(player, activity.activityId, drop.itemId, drop.amount, drop.rarity);
            }
        }
    }

    function _combatRewardConfig(uint16 activityId) internal pure returns (uint256 config) {
        uint256 offset = uint256(activityId - ACTIVITY_TRAINING_YARD) * 8;
        bytes memory data = COMBAT_REWARD_DATA;

        assembly {
            config := shr(192, mload(add(add(data, 0x20), offset)))
        }
    }

    function _grantSkillXp(address player, Skill skill, uint256 baseXp) internal {
        skillXp[player][uint8(skill)] += uint64(baseXp * XP_RATE_MULTIPLIER);
    }

    function _combatDamage(
        address player,
        IIdleIslesContent.CombatActivity memory activity,
        uint256 cycleIndex
    ) internal view returns (uint256) {
        if (_rollBps(player, cycleIndex, 17) >= activity.damageChanceBps) {
            return 0;
        }

        uint256 range = activity.maxDamage - activity.minDamage + 1;
        uint256 rawDamage = activity.minDamage + (_rollBps(player, cycleIndex, 31) % range);
        uint256 mitigation =
            (uint256(levelOf(player, Skill.Defence)) - 1) /
            5 +
            equipmentStats(player).defence /
            3;

        if (rawDamage <= mitigation) {
            return 0;
        }

        return rawDamage - mitigation;
    }

    function _combatHit(
        address player,
        IIdleIslesContent.CombatActivity memory activity,
        uint256 cycleIndex,
        CombatStyle style
    ) internal view returns (bool) {
        return _rollBps(player, cycleIndex, 89) < _combatAccuracyBps(player, activity, style);
    }

    function _combatAccuracyBps(
        address player,
        IIdleIslesContent.CombatActivity memory activity,
        CombatStyle style
    ) internal view returns (uint256) {
        if (activity.activityId == ACTIVITY_TRAINING_YARD) {
            return 10_000;
        }

        IIdleIslesContent.WeaponStats memory weaponStats = _equippedWeaponStats(player);
        uint256 weaponDamage = weaponStats.damage == 0 ? 1 : weaponStats.damage;
        uint256 skillLevel = levelOf(player, _combatSkillForStyle(style));
        uint256 offence =
            skillLevel *
            120 +
            uint256(weaponStats.accuracy) *
            75 +
            (weaponDamage + (skillLevel - 1) / 12) *
            40 +
            100;
        uint256 monsterDefence = uint256(activity.reqDefence) * 100 + 100;
        uint256 chance = 1_500 + (offence * 8_000) / (offence + monsterDefence);

        return chance > 9_800 ? 9_800 : chance;
    }

    function _consumeAmmoForStyle(
        address player,
        uint16 activityId,
        CombatStyle style
    ) internal returns (bool) {
        uint256 itemId;

        if (style == CombatStyle.Ranged) {
            itemId = _selectAmmunition(player);
        } else if (style == CombatStyle.Magic) {
            itemId = balanceOf(player, RUNE_DUST) > 0 ? RUNE_DUST : 0;
        } else {
            return true;
        }

        if (itemId == 0) {
            return false;
        }

        _burn(player, itemId, 1);
        emit CombatConsumableUsed(player, activityId, itemId);
        return true;
    }

    function _selectAmmunition(address player) internal view returns (uint256) {
        if (balanceOf(player, TUNGSTEN_ARROW) > 0) return TUNGSTEN_ARROW;
        if (balanceOf(player, STEEL_ARROW) > 0) return STEEL_ARROW;
        if (balanceOf(player, IRON_ARROW) > 0) return IRON_ARROW;
        if (balanceOf(player, BRONZE_ARROW) > 0) return BRONZE_ARROW;
        return 0;
    }

    function _rollBps(address player, uint256 cycleIndex, uint256 salt)
        internal
        view
        returns (uint256)
    {
        return
            uint256(
                keccak256(
                    abi.encodePacked(
                        player,
                        activeTask[player].startedAt,
                        cycleIndex,
                        salt,
                        block.prevrandao,
                        blockhash(block.number - 1)
                    )
                )
            ) % 10_000;
    }

    function _eatFood(address player, uint256 itemId) internal returns (uint256 restored) {
        uint16 heal = CONTENT.healAmount(itemId);
        if (heal == 0) revert NotFood();
        if (balanceOf(player, itemId) == 0) revert NoFood();

        uint256 maxHp = maxHitpoints(player);
        if (currentHitpoints[player] >= maxHp) {
            return 0;
        }

        _burn(player, itemId, 1);
        uint256 nextHp = currentHitpoints[player] + heal;
        if (nextHp > maxHp) {
            nextHp = maxHp;
        }

        restored = nextHp - currentHitpoints[player];
        currentHitpoints[player] = uint16(nextHp);
        emit FoodEaten(player, itemId, restored);
    }

    function _applyDeathPenalty(address player, uint16 activityId) internal {
        uint256 crownsLost = balanceOf(player, CROWNS) / 2;
        if (crownsLost > 0) {
            _burn(player, CROWNS, crownsLost);
        }

        uint256[] memory lostEquipment = new uint256[](6);
        uint256 lostCount;

        for (uint8 i = 0; i < 6; i++) {
            Slot slot = Slot(i);
            uint256 itemId = _equippedItem(player, slot);
            if (itemId != 0) {
                lostEquipment[lostCount] = itemId;
                lostCount++;
                _setEquipped(player, slot, 0);
            }
        }

        uint256[] memory compactLost = new uint256[](lostCount);
        for (uint256 i = 0; i < lostCount; i++) {
            compactLost[i] = lostEquipment[i];
        }

        delete activeTask[player];
        emit PlayerDied(player, activityId, crownsLost, compactLost);
        emit ActivityStopped(player, activityId, "DEATH");
    }

    function _stopActivity(address player, uint16 activityId, string memory reason) internal {
        delete activeTask[player];
        emit ActivityStopped(player, activityId, reason);
    }

    function _unequipSlot(address player, Slot slot) internal {
        uint256 itemId = _equippedItem(player, slot);
        if (itemId == 0) {
            return;
        }

        _setEquipped(player, slot, 0);
        _mint(player, itemId, 1, "");
        emit ItemUnequipped(player, uint8(slot), itemId);
    }

    function _clampHitpoints(address player) internal {
        uint256 maxHp = maxHitpoints(player);
        if (currentHitpoints[player] > maxHp) {
            currentHitpoints[player] = uint16(maxHp);
        }
    }

    function _isEquipped(address player, uint256 itemId) internal view returns (bool) {
        Equipment memory gear = equipment[player];
        return
            gear.weapon == itemId ||
            gear.shield == itemId ||
            gear.helm == itemId ||
            gear.chest == itemId ||
            gear.legs == itemId ||
            gear.trinket == itemId;
    }

    function _equippedItem(address player, Slot slot) internal view returns (uint256) {
        Equipment memory gear = equipment[player];
        if (slot == Slot.Weapon) return gear.weapon;
        if (slot == Slot.Shield) return gear.shield;
        if (slot == Slot.Helm) return gear.helm;
        if (slot == Slot.Chest) return gear.chest;
        if (slot == Slot.Legs) return gear.legs;
        return gear.trinket;
    }

    function _setEquipped(address player, Slot slot, uint256 itemId) internal {
        if (slot == Slot.Weapon) {
            equipment[player].weapon = itemId;
        } else if (slot == Slot.Shield) {
            equipment[player].shield = itemId;
        } else if (slot == Slot.Helm) {
            equipment[player].helm = itemId;
        } else if (slot == Slot.Chest) {
            equipment[player].chest = itemId;
        } else if (slot == Slot.Legs) {
            equipment[player].legs = itemId;
        } else {
            equipment[player].trinket = itemId;
        }
    }
}
