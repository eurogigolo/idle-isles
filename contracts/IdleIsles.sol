// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {ERC1155Holder} from "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IIdleIslesContent} from "./IIdleIslesContent.sol";

contract IdleIsles is ERC1155, ERC1155Holder, ReentrancyGuard {
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
    error AmountZero();
    error PriceZero();
    error CrownsNotListed();
    error NotEnoughListed();
    error NotSeller();
    error OrderEmpty();

    uint256 internal constant CROWNS = 1;
    uint256 internal constant ASH_LOG = 2;
    uint256 internal constant PINE_LOG = 3;
    uint256 internal constant RAW_MINNOW = 8;
    uint256 internal constant COOKED_MINNOW = 9;
    uint256 internal constant COPPER_ORE = 30;
    uint256 internal constant TIN_ORE = 31;
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
    uint16 internal constant ACTIVITY_ASH_GROVE = 201;
    uint16 internal constant ACTIVITY_COPPER_RIDGE = 202;
    uint16 internal constant ACTIVITY_TIN_HOLLOW = 203;
    uint16 internal constant ACTIVITY_RIVER_BEND = 204;
    uint16 internal constant ACTIVITY_WOOD_ARMORY = 301;
    uint16 internal constant ACTIVITY_COPPER_SMELTER = 302;
    uint16 internal constant ACTIVITY_COPPER_DAGGER = 303;
    uint16 internal constant ACTIVITY_COOK_MINNOW = 304;

    uint8 internal constant AREA_STARTER = 1;
    uint8 internal constant AREA_OUTER_ISLES = 2;
    uint8 internal constant AREA_STARTER_MASK = 1;
    uint8 internal constant AREA_OUTER_ISLES_MASK = 2;

    uint256 internal constant OUTER_ISLES_PASSAGE_COST = 50_000;

    uint256 internal constant AFK_CAP = 8 hours;
    uint16 internal constant MAX_SETTLE_CYCLES = 200;

    enum Skill {
        Attack,
        Defence,
        Hitpoints,
        Woodcutting,
        Fishing,
        Mining,
        Smithing,
        Cooking,
        Crafting
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

    struct Order {
        address seller;
        uint256 itemId;
        uint128 priceEach;
        uint64 amountRemaining;
    }

    mapping(address => bool) public hasProfile;
    mapping(address => uint16) public currentHitpoints;
    mapping(address => uint8) public currentAreaId;
    mapping(address => mapping(uint8 => uint64)) public skillXp;
    mapping(address => ActiveTask) public activeTask;
    mapping(address => Equipment) private equipment;
    mapping(address => AutoSettleConfig) public autoSettleConfig;
    mapping(uint256 => Order) public orders;
    mapping(address => uint8) private unlockedAreaMask;

    IIdleIslesContent internal immutable CONTENT;
    uint256 public nextOrderId = 1;

    event ProfileCreated(address indexed player, uint256 maxHitpoints);
    event ActivityStarted(address indexed player, uint16 indexed activityId);
    event ActivityStopped(address indexed player, uint16 indexed activityId, string reason);
    event CombatSettled(
        address indexed player,
        uint16 indexed activityId,
        uint256 cycles,
        uint256 hpLost
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
    event ItemEquipped(address indexed player, uint8 indexed slot, uint256 indexed itemId);
    event ItemUnequipped(address indexed player, uint8 indexed slot, uint256 indexed itemId);
    event AreaTraveled(address indexed player, uint8 indexed areaId, uint256 cost);
    event AutoSettleConfigured(address indexed player, address indexed operator, uint64 expiresAt);
    event OrderCreated(
        uint256 indexed orderId,
        address indexed seller,
        uint256 indexed itemId,
        uint256 amount,
        uint256 priceEach
    );
    event OrderFilled(uint256 indexed orderId, address indexed buyer, uint256 amount);
    event OrderCancelled(uint256 indexed orderId);
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
        override(ERC1155, ERC1155Holder)
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
        if (!hasProfile[msg.sender]) revert NoProfile();
        _settle(msg.sender, MAX_SETTLE_CYCLES);

        IIdleIslesContent.CombatActivity memory activity = CONTENT.getCombatActivity(activityId);
        _requireActivityArea(msg.sender, activityId);
        if (currentHitpoints[msg.sender] == 0) revert NoHp();
        if (levelOf(msg.sender, Skill.Attack) < activity.reqAttack) revert RequirementLow();
        if (levelOf(msg.sender, Skill.Defence) < activity.reqDefence) revert RequirementLow();
        if (levelOf(msg.sender, Skill.Hitpoints) < activity.reqHitpoints) revert RequirementLow();

        if (activity.requiredEquipment != 0) {
            if (!_isEquipped(msg.sender, activity.requiredEquipment)) revert EquipmentRequired();
        }

        _startTask(msg.sender, activityId);
    }

    function startGather(uint16 activityId) external nonReentrant {
        if (!hasProfile[msg.sender]) revert NoProfile();
        _settle(msg.sender, MAX_SETTLE_CYCLES);
        if (
            activityId != ACTIVITY_ASH_GROVE &&
            activityId != ACTIVITY_COPPER_RIDGE &&
            activityId != ACTIVITY_TIN_HOLLOW &&
            activityId != ACTIVITY_RIVER_BEND
        ) revert BadActivity();
        _requireActivityArea(msg.sender, activityId);
        if (activityId == ACTIVITY_ASH_GROVE) {
            if (levelOf(msg.sender, Skill.Woodcutting) < 1) revert RequirementLow();
        } else if (activityId == ACTIVITY_RIVER_BEND) {
            if (levelOf(msg.sender, Skill.Fishing) < 1) revert RequirementLow();
        } else {
            if (levelOf(msg.sender, Skill.Mining) < 1) revert RequirementLow();
        }

        _startTask(msg.sender, activityId);
    }

    function startArtisan(uint16 activityId) external nonReentrant {
        if (!hasProfile[msg.sender]) revert NoProfile();
        _settle(msg.sender, MAX_SETTLE_CYCLES);
        if (
            activityId != ACTIVITY_WOOD_ARMORY &&
            activityId != ACTIVITY_COPPER_SMELTER &&
            activityId != ACTIVITY_COPPER_DAGGER &&
            activityId != ACTIVITY_COOK_MINNOW
        ) revert BadActivity();
        _requireActivityArea(msg.sender, activityId);

        if (activityId == ACTIVITY_COOK_MINNOW) {
            if (levelOf(msg.sender, Skill.Cooking) < 1) revert RequirementLow();
            if (balanceOf(msg.sender, RAW_MINNOW) == 0) revert MaterialLow();
            _startTask(msg.sender, activityId);
            return;
        }

        uint8 smithingLevel = levelOf(msg.sender, Skill.Smithing);
        if (smithingLevel < 1) revert RequirementLow();
        if (activityId == ACTIVITY_WOOD_ARMORY) {
            if (balanceOf(msg.sender, ASH_LOG) < 3) revert MaterialLow();
        } else if (activityId == ACTIVITY_COPPER_SMELTER) {
            if (
                balanceOf(msg.sender, COPPER_ORE) < 1 ||
                balanceOf(msg.sender, TIN_ORE) < 1 ||
                balanceOf(msg.sender, ASH_LOG) < 1
            ) revert MaterialLow();
        } else {
            if (smithingLevel < 4) revert RequirementLow();
            if (balanceOf(msg.sender, COPPER_BAR) < 3 || balanceOf(msg.sender, ASH_LOG) < 2) {
                revert MaterialLow();
            }
        }

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

    function createOrder(uint256 itemId, uint64 amount, uint128 priceEach) external nonReentrant {
        if (!hasProfile[msg.sender]) revert NoProfile();
        _settle(msg.sender, MAX_SETTLE_CYCLES);
        if (amount == 0) revert AmountZero();
        if (priceEach == 0) revert PriceZero();
        if (itemId == CROWNS) revert CrownsNotListed();

        _safeTransferFrom(msg.sender, address(this), itemId, amount, "");

        uint256 orderId = nextOrderId++;
        orders[orderId] = Order({
            seller: msg.sender,
            itemId: itemId,
            priceEach: priceEach,
            amountRemaining: amount
        });

        emit OrderCreated(orderId, msg.sender, itemId, amount, priceEach);
    }

    function buy(uint256 orderId, uint64 amount) external nonReentrant {
        if (!hasProfile[msg.sender]) revert NoProfile();
        _settle(msg.sender, MAX_SETTLE_CYCLES);

        Order storage order = orders[orderId];
        if (amount == 0) revert AmountZero();
        if (order.amountRemaining < amount) revert NotEnoughListed();

        uint256 totalPrice = uint256(order.priceEach) * amount;
        _safeTransferFrom(msg.sender, order.seller, CROWNS, totalPrice, "");
        _safeTransferFrom(address(this), msg.sender, order.itemId, amount, "");

        order.amountRemaining -= amount;
        emit OrderFilled(orderId, msg.sender, amount);
    }

    function cancelOrder(uint256 orderId) external nonReentrant {
        Order storage order = orders[orderId];
        if (order.seller != msg.sender) revert NotSeller();
        if (order.amountRemaining == 0) revert OrderEmpty();

        uint64 remaining = order.amountRemaining;
        order.amountRemaining = 0;
        _safeTransferFrom(address(this), msg.sender, order.itemId, remaining, "");

        emit OrderCancelled(orderId);
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
        uint256 bps = 10_000;
        uint256 reduction = uint256(stats.speed) * 250 + uint256(stats.attack) * 120;

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

        if (cycleLimit == 0 || cycleLimit > MAX_SETTLE_CYCLES) {
            cycleLimit = MAX_SETTLE_CYCLES;
        }
        if (possibleCycles > cycleLimit) {
            possibleCycles = cycleLimit;
        }

        if (
            activityId == ACTIVITY_ASH_GROVE ||
            activityId == ACTIVITY_COPPER_RIDGE ||
            activityId == ACTIVITY_TIN_HOLLOW ||
            activityId == ACTIVITY_RIVER_BEND
        ) {
            _settleGather(player, possibleCycles, cycleSeconds);
            return;
        }

        if (activityId == ACTIVITY_COOK_MINNOW) {
            _settleCooking(player, possibleCycles, cycleSeconds);
            return;
        }

        if (
            activityId == ACTIVITY_WOOD_ARMORY ||
            activityId == ACTIVITY_COPPER_SMELTER ||
            activityId == ACTIVITY_COPPER_DAGGER
        ) {
            _settleArtisan(player, possibleCycles, cycleSeconds, activityId);
            return;
        }

        uint256 hpLost;
        uint256 cyclesSettled;
        uint16 foodUsed;

        for (uint256 i = 0; i < possibleCycles; i++) {
            (bool shouldContinue, uint16 nextFoodUsed) = _prepareCombatCycle(
                player,
                activityId,
                foodUsed
            );
            foodUsed = nextFoodUsed;
            if (!shouldContinue) {
                break;
            }

            (bool died, uint256 cycleHpLost) = _resolveCombatCycle(
                player,
                activityId,
                cycleSeconds
            );
            hpLost += cycleHpLost;

            if (died) {
                break;
            }

            cyclesSettled++;
        }

        if (cyclesSettled > 0 || hpLost > 0) {
            emit CombatSettled(player, activityId, cyclesSettled, hpLost);
        }
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

        if (activityId == ACTIVITY_ASH_GROVE) {
            return 5;
        }

        if (activityId == ACTIVITY_COPPER_RIDGE || activityId == ACTIVITY_TIN_HOLLOW) {
            return 7;
        }

        if (activityId == ACTIVITY_RIVER_BEND) {
            return 6;
        }

        if (activityId == ACTIVITY_WOOD_ARMORY) {
            return 6;
        }

        if (activityId == ACTIVITY_COPPER_SMELTER) {
            return 8;
        }

        if (activityId == ACTIVITY_COPPER_DAGGER) {
            return 10;
        }

        if (activityId == ACTIVITY_COOK_MINNOW) {
            return 4;
        }

        revert BadActivity();
    }

    function _isCombatActivity(uint16 activityId) internal pure returns (bool) {
        return activityId >= ACTIVITY_TRAINING_YARD && activityId <= ACTIVITY_VENOMOUS_DRAKE;
    }

    function _requireActivityArea(address player, uint16 activityId) internal view {
        uint8 requiredAreaId = _activityAreaId(activityId);
        if (!_isAreaUnlocked(player, requiredAreaId)) revert AreaLocked();
        if (currentAreaId[player] != requiredAreaId) revert AreaRequired();
    }

    function _activityAreaId(uint16 activityId) internal pure returns (uint8) {
        if (
            (activityId >= ACTIVITY_CAVE_BAT && activityId <= ACTIVITY_HOLLOW_TREANT) ||
            (activityId >= ACTIVITY_DIRE_WOLF && activityId <= ACTIVITY_VENOMOUS_DRAKE)
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
        uint32 cycleSeconds
    ) internal {
        uint16 activityId = activeTask[player].activityId;
        if (activityId == ACTIVITY_ASH_GROVE) {
            _grantSkillXp(player, Skill.Woodcutting, 18 * cycles);
            _mint(player, ASH_LOG, 2 * cycles, "");
        } else if (activityId == ACTIVITY_RIVER_BEND) {
            _grantSkillXp(player, Skill.Fishing, 20 * cycles);
            _mint(player, RAW_MINNOW, 2 * cycles, "");
        } else {
            _grantSkillXp(player, Skill.Mining, 20 * cycles);
            _mint(player, activityId == ACTIVITY_COPPER_RIDGE ? COPPER_ORE : TIN_ORE, 2 * cycles, "");
        }
        activeTask[player].lastResolvedAt += uint64(cycles * cycleSeconds);

        emit SkillActivitySettled(player, activityId, cycles);
    }

    function _settleCooking(
        address player,
        uint256 possibleCycles,
        uint32 cycleSeconds
    ) internal {
        uint256 cycles = possibleCycles;
        uint256 rawAvailable = balanceOf(player, RAW_MINNOW);
        if (cycles > rawAvailable) {
            cycles = rawAvailable;
        }
        if (cycles == 0) {
            return;
        }

        uint256 cooked;
        uint256 cycleOffset =
            (activeTask[player].lastResolvedAt - activeTask[player].startedAt) /
            cycleSeconds;
        uint256 burnChanceBps = _cookMinnowBurnChanceBps(player);

        for (uint256 i = 0; i < cycles; i++) {
            if (_rollBps(player, cycleOffset + i, 53) >= burnChanceBps) {
                cooked++;
            }
        }

        _burn(player, RAW_MINNOW, cycles);
        if (cooked > 0) {
            _mint(player, COOKED_MINNOW, cooked, "");
        }
        _grantSkillXp(player, Skill.Cooking, 14 * cycles);
        activeTask[player].lastResolvedAt += uint64(cycles * cycleSeconds);

        emit SkillActivitySettled(player, ACTIVITY_COOK_MINNOW, cycles);
        emit CookingSettled(player, ACTIVITY_COOK_MINNOW, cycles, cooked, cycles - cooked);
    }

    function _cookMinnowBurnChanceBps(address player) internal view returns (uint256) {
        uint8 cookingLevel = levelOf(player, Skill.Cooking);
        uint256 reduction = uint256(cookingLevel - 1) * 300;
        if (reduction >= 3500) {
            return 0;
        }
        return 3500 - reduction;
    }

    function _settleArtisan(
        address player,
        uint256 possibleCycles,
        uint32 cycleSeconds,
        uint16 activityId
    ) internal {
        uint256 affordableCycles;
        if (activityId == ACTIVITY_WOOD_ARMORY) {
            affordableCycles = balanceOf(player, ASH_LOG) / 3;
        } else if (activityId == ACTIVITY_COPPER_SMELTER) {
            affordableCycles = balanceOf(player, COPPER_ORE);
            uint256 tinCycles = balanceOf(player, TIN_ORE);
            uint256 ashCycles = balanceOf(player, ASH_LOG);
            if (affordableCycles > tinCycles) affordableCycles = tinCycles;
            if (affordableCycles > ashCycles) affordableCycles = ashCycles;
        } else {
            affordableCycles = balanceOf(player, COPPER_BAR) / 3;
            uint256 ashCycles = balanceOf(player, ASH_LOG) / 2;
            if (affordableCycles > ashCycles) affordableCycles = ashCycles;
        }

        uint256 cycles = possibleCycles;
        if (cycles > affordableCycles) {
            cycles = affordableCycles;
        }
        if (cycles == 0) {
            return;
        }

        if (activityId == ACTIVITY_WOOD_ARMORY) {
            _burn(player, ASH_LOG, 3 * cycles);
            _mint(player, WOOD_CLUB, cycles, "");
            _mint(player, BARK_SHIELD, cycles, "");
            _mint(player, BARK_VEST, cycles, "");
            _grantSkillXp(player, Skill.Smithing, 16 * cycles);
        } else if (activityId == ACTIVITY_COPPER_SMELTER) {
            _burn(player, COPPER_ORE, cycles);
            _burn(player, TIN_ORE, cycles);
            _burn(player, ASH_LOG, cycles);
            _mint(player, COPPER_BAR, cycles, "");
            _grantSkillXp(player, Skill.Smithing, 26 * cycles);
        } else {
            _burn(player, COPPER_BAR, 3 * cycles);
            _burn(player, ASH_LOG, 2 * cycles);
            _mint(player, COPPER_DAGGER, cycles, "");
            _grantSkillXp(player, Skill.Smithing, 42 * cycles);
        }
        activeTask[player].lastResolvedAt += uint64(cycles * cycleSeconds);

        emit SkillActivitySettled(player, activityId, cycles);
    }

    function _resolveCombatCycle(
        address player,
        uint16 activityId,
        uint32 cycleSeconds
    ) internal returns (bool died, uint256 hpLost) {
        IIdleIslesContent.CombatActivity memory activity = CONTENT.getCombatActivity(activityId);
        ActiveTask storage task = activeTask[player];
        uint256 cycleIndex = (task.lastResolvedAt - task.startedAt) / cycleSeconds;
        uint256 damage = _combatDamage(player, activity, cycleIndex);

        if (damage > 0 && currentHitpoints[player] <= damage) {
            hpLost = currentHitpoints[player];
            currentHitpoints[player] = 0;
            _applyDeathPenalty(player, activity.activityId);
            return (true, hpLost);
        }

        if (damage > 0) {
            currentHitpoints[player] -= uint16(damage);
            hpLost = damage;
        }

        _grantCombatCycle(player, activity, cycleIndex);
        task.lastResolvedAt += cycleSeconds;
        return (false, hpLost);
    }

    function _prepareCombatCycle(
        address player,
        uint16 activityId,
        uint16 foodUsed
    ) internal returns (bool shouldContinue, uint16 nextFoodUsed) {
        AutoSettleConfig memory config = autoSettleConfig[player];
        nextFoodUsed = foodUsed;

        if (!config.enabled || block.timestamp > config.expiresAt) {
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
        uint256 cycleIndex
    ) internal {
        _grantSkillXp(player, Skill.Attack, activity.xpAttack);
        _grantSkillXp(player, Skill.Defence, activity.xpDefence);
        _grantSkillXp(player, Skill.Hitpoints, activity.xpHitpoints);

        if (activity.activityId == ACTIVITY_TRAINING_YARD) {
            _mint(player, HIDE, 1, "");
            _mint(player, CROWNS, 2, "");
        } else if (activity.activityId == ACTIVITY_FIELD_RAT) {
            _mint(player, HIDE, 1, "");
            _mint(player, CROWNS, 4, "");
            _mint(player, RAW_MINNOW, 1, "");
        } else if (activity.activityId == ACTIVITY_MOSS_CAMP) {
            _mint(player, THICK_HIDE, 1, "");
            _mint(player, CROWNS, 8, "");
            _mint(player, RUNE_DUST, 1, "");
        } else if (activity.activityId == ACTIVITY_GOBLIN_FORAGER) {
            _mint(player, THICK_HIDE, 1, "");
            _mint(player, CROWNS, 6, "");
        } else if (activity.activityId == ACTIVITY_GIANT_SPIDER) {
            _mint(player, RUGGED_HIDE, 1, "");
            _mint(player, CROWNS, 12, "");
        } else if (activity.activityId == ACTIVITY_DIRE_WOLF) {
            _mint(player, COBALT_SCALE, 1, "");
            _mint(player, CROWNS, 45, "");
        } else if (activity.activityId == ACTIVITY_VENOMOUS_DRAKE) {
            _mint(player, WYRM_HIDE, 1, "");
            _mint(player, CROWNS, 90, "");
        } else if (activity.activityId == ACTIVITY_CAVE_BAT) {
            _mint(player, HIDE, 2, "");
            _mint(player, CROWNS, 22, "");
        } else if (activity.activityId == ACTIVITY_BANDIT_SCOUT) {
            _mint(player, THICK_HIDE, 2, "");
            _mint(player, CROWNS, 35, "");
        } else if (activity.activityId == ACTIVITY_CRYPT_KNIGHT) {
            _mint(player, CROWNS, 58, "");
            _mint(player, RUNE_DUST, 1, "");
        } else if (activity.activityId == ACTIVITY_HOLLOW_TREANT) {
            _mint(player, CROWNS, 140, "");
            _mint(player, PINE_LOG, 4, "");
            _mint(player, RUNE_DUST, 1, "");
        } else {
            _mint(player, CROWNS, 22, "");
        }

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
