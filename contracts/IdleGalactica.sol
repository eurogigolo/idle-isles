// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {IIdleGalacticaContent} from "./IIdleGalacticaContent.sol";

contract IdleGalactica is ERC1155 {
    error ProfileExists();
    error NoProfile();
    error HullEmpty();
    error RequirementLow();
    error ModuleRequired();
    error BadActivity();
    error BadSector();
    error SectorLocked();
    error SectorRequired();
    error CargoLow();
    error BadConfig();
    error NotModule();
    error NoItem();
    error NotRepairSupply();
    error HullFull();
    error EmptySlot();

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

    enum ModuleSlot {
        Hardpoint,
        ShieldArray,
        HullPlating,
        SensorSuite,
        EngineCore,
        AuxiliaryCore
    }

    struct ActiveMission {
        uint16 activityId;
        uint64 startedAt;
        uint64 lastResolvedAt;
    }

    struct ShipModules {
        uint256 hardpoint;
        uint256 shieldArray;
        uint256 hullPlating;
        uint256 sensorSuite;
        uint256 engineCore;
        uint256 auxiliaryCore;
    }

    struct CombatSettings {
        bool autoRepair;
        uint16 stopAtHull;
        uint256 repairItemId;
        uint16 maxRepairItemsPerClaim;
    }

    struct Settlement {
        uint256 cycles;
        uint256 hullDamage;
        bool stopped;
        string reason;
    }

    uint256 internal constant CREDITS = 1;
    uint256 public constant BOSS_ENCOUNTER_COST = 10_000;
    uint256 internal constant REPAIR_GEL = 250;
    uint256 internal constant OXYGEN_CELL = 251;
    uint256 internal constant LIGHT_TURRET = 404;
    uint256 internal constant BASIC_SHIELD_GENERATOR = 406;
    uint256 internal constant REINFORCED_HULL_PLATING = 408;
    uint256 internal constant MINING_LASER = 400;
    uint256 internal constant SALVAGE_BEAM = 401;
    uint256 internal constant GAS_SCOOP = 402;
    uint256 internal constant SURVEY_SCANNER = 403;

    uint8 internal constant SECTOR_ORBITAL_DOCK = 1;
    uint8 internal constant KIND_COMBAT = 1;
    uint8 internal constant KIND_GATHERING = 2;
    uint8 internal constant KIND_PRODUCTION = 3;
    uint8 internal constant SKILL_GUNNERY = 8;
    uint8 internal constant SKILL_ENGINEERING = 9;
    uint16 internal constant BASE_MAX_HULL = 100;
    uint256 internal constant AFK_CAP = 12 hours;
    uint256 internal constant MAX_SETTLE_CYCLES = 1_000;
    uint256 internal constant MAX_COMBAT_SETTLE_CYCLES = 200;

    IIdleGalacticaContent internal immutable CONTENT;

    mapping(address => bool) public hasProfile;
    mapping(address => uint16) public currentHull;
    mapping(address => uint8) public currentSectorId;
    mapping(address => mapping(uint8 => uint64)) public skillXp;
    mapping(address => ActiveMission) public activeMission;
    mapping(address => CombatSettings) public combatSettings;
    mapping(address => uint8) private unlockedSectorMask;
    mapping(address => ShipModules) private shipModules;

    event ProfileCreated(address indexed player, uint256 maxHull);
    event MissionStarted(address indexed player, uint16 indexed activityId, uint8 indexed kind);
    event MissionStopped(address indexed player, uint16 indexed activityId, string reason);
    event MissionSettled(address indexed player, uint16 indexed activityId, uint256 cycles);
    event CombatSettled(
        address indexed player,
        uint16 indexed activityId,
        uint256 cycles,
        uint256 hullDamage
    );
    event ShipDestroyed(
        address indexed player,
        uint16 indexed activityId,
        uint256 creditsLost,
        uint256[] modulesLost
    );
    event ModuleEquipped(address indexed player, uint8 indexed slot, uint256 indexed itemId);
    event ModuleUnequipped(address indexed player, uint8 indexed slot, uint256 indexed itemId);
    event HullRepaired(address indexed player, uint256 indexed itemId, uint256 hullRestored);
    event SectorTraveled(address indexed player, uint8 indexed sectorId, uint256 cost);
    event BossEncounterStarted(address indexed player, uint256 cost);
    event CombatSettingsUpdated(
        address indexed player,
        bool autoRepair,
        uint16 stopAtHull,
        uint256 repairItemId,
        uint16 maxRepairItemsPerClaim
    );

    constructor(string memory metadataUri, address contentAddress) ERC1155(metadataUri) {
        if (contentAddress == address(0)) revert BadConfig();
        CONTENT = IIdleGalacticaContent(contentAddress);
    }

    function createProfile() external {
        address player = msg.sender;
        if (hasProfile[player]) revert ProfileExists();

        hasProfile[player] = true;
        currentHull[player] = BASE_MAX_HULL;
        currentSectorId[player] = SECTOR_ORBITAL_DOCK;
        unlockedSectorMask[player] = _sectorBit(SECTOR_ORBITAL_DOCK);
        combatSettings[player] = CombatSettings({
            autoRepair: true,
            stopAtHull: 35,
            repairItemId: REPAIR_GEL,
            maxRepairItemsPerClaim: 12
        });

        _mint(player, CREDITS, 120, "");
        _mint(player, REPAIR_GEL, 4, "");
        _mint(player, OXYGEN_CELL, 2, "");
        _mint(player, LIGHT_TURRET, 1, "");
        _mint(player, BASIC_SHIELD_GENERATOR, 1, "");
        _mint(player, REINFORCED_HULL_PLATING, 1, "");
        _mint(player, MINING_LASER, 1, "");
        _mint(player, SALVAGE_BEAM, 1, "");
        _mint(player, GAS_SCOOP, 1, "");
        _mint(player, SURVEY_SCANNER, 1, "");

        emit ProfileCreated(player, BASE_MAX_HULL);
    }

    function startGathering(uint16 activityId) external {
        _startMission(activityId, KIND_GATHERING);
    }

    function startProduction(uint16 activityId) external {
        _startMission(activityId, KIND_PRODUCTION);
    }

    function startCombat(uint16 activityId) external {
        _startMission(activityId, KIND_COMBAT);
    }

    function startBossEncounter() external {
        address player = msg.sender;
        _requireProfile(player);
        _settle(player);

        if (balanceOf(player, CREDITS) < BOSS_ENCOUNTER_COST) revert CargoLow();
        _burn(player, CREDITS, BOSS_ENCOUNTER_COST);

        emit BossEncounterStarted(player, BOSS_ENCOUNTER_COST);
    }

    function claimMission() external {
        _requireProfile(msg.sender);
        _settle(msg.sender);
    }

    function stopMission() external {
        address player = msg.sender;
        _requireProfile(player);
        _settle(player);

        ActiveMission memory mission = activeMission[player];
        if (mission.activityId != 0) {
            emit MissionStopped(player, mission.activityId, "MANUAL");
            delete activeMission[player];
        }
    }

    function equipModule(uint256 itemId) external {
        address player = msg.sender;
        _requireProfile(player);
        if (balanceOf(player, itemId) == 0) revert NoItem();

        (bool isModule, uint8 slot) = CONTENT.moduleSlot(itemId);
        if (!isModule || slot > uint8(ModuleSlot.AuxiliaryCore)) revert NotModule();

        uint256 previousItem = _moduleInSlot(player, slot);
        _burn(player, itemId, 1);
        if (previousItem != 0) {
            _mint(player, previousItem, 1, "");
        }
        _setModuleInSlot(player, slot, itemId);
        _clampHull(player);

        emit ModuleEquipped(player, slot, itemId);
    }

    function unequipModule(uint8 slot) external {
        address player = msg.sender;
        _requireProfile(player);
        if (slot > uint8(ModuleSlot.AuxiliaryCore)) revert BadConfig();

        uint256 itemId = _moduleInSlot(player, slot);
        if (itemId == 0) revert EmptySlot();

        _setModuleInSlot(player, slot, 0);
        _mint(player, itemId, 1, "");
        _clampHull(player);

        emit ModuleUnequipped(player, slot, itemId);
    }

    function repairHull(uint256 itemId) external {
        address player = msg.sender;
        _requireProfile(player);

        uint16 repair = CONTENT.repairAmount(itemId);
        if (repair == 0) revert NotRepairSupply();
        if (balanceOf(player, itemId) == 0) revert NoItem();

        uint16 hull = currentHull[player];
        uint16 cap = _maxHull(player);
        if (hull >= cap) revert HullFull();

        _burn(player, itemId, 1);
        uint16 restored = _restoreHull(player, repair);
        emit HullRepaired(player, itemId, restored);
    }

    function travelToSector(uint8 sectorId) external {
        address player = msg.sender;
        _requireProfile(player);
        if (sectorId == 0) revert BadSector();

        _settle(player);

        uint256 cost;
        if (!isSectorUnlocked(player, sectorId)) {
            uint256 costItem;
            uint256 levelReqs;
            (costItem, cost, levelReqs) = CONTENT.sectorUnlock(sectorId);
            if (!_meetsLevelReqs(player, levelReqs)) revert RequirementLow();
            if (costItem != 0) {
                if (balanceOf(player, costItem) < cost) revert CargoLow();
                _burn(player, costItem, cost);
            }
            unlockedSectorMask[player] |= _sectorBit(sectorId);
        } else {
            CONTENT.sectorUnlock(sectorId);
        }

        ActiveMission storage mission = activeMission[player];
        if (mission.activityId != 0) {
            emit MissionStopped(player, mission.activityId, "TRAVEL");
            delete activeMission[player];
        }
        currentSectorId[player] = sectorId;

        emit SectorTraveled(player, sectorId, cost);
    }

    function setCombatSettings(
        bool autoRepair,
        uint16 stopAtHull,
        uint256 repairItemId,
        uint16 maxRepairItemsPerClaim
    ) external {
        address player = msg.sender;
        _requireProfile(player);
        if (stopAtHull == 0 || stopAtHull >= _maxHull(player)) revert BadConfig();
        if (maxRepairItemsPerClaim > 99) revert BadConfig();
        if (CONTENT.repairAmount(repairItemId) == 0) revert NotRepairSupply();

        combatSettings[player] = CombatSettings({
            autoRepair: autoRepair,
            stopAtHull: stopAtHull,
            repairItemId: repairItemId,
            maxRepairItemsPerClaim: maxRepairItemsPerClaim
        });

        emit CombatSettingsUpdated(
            player,
            autoRepair,
            stopAtHull,
            repairItemId,
            maxRepairItemsPerClaim
        );
    }

    function isSectorUnlocked(address player, uint8 sectorId) public view returns (bool) {
        return unlockedSectorMask[player] & _sectorBit(sectorId) != 0;
    }

    function moduleInSlot(address player, uint8 slot) external view returns (uint256) {
        if (slot > uint8(ModuleSlot.AuxiliaryCore)) return 0;
        return _moduleInSlot(player, slot);
    }

    function shipStats(address player)
        external
        view
        returns (IIdleGalacticaContent.ModuleStats memory stats)
    {
        return _shipStats(player);
    }

    function maxHull(address player) public view returns (uint16) {
        return _maxHull(player);
    }

    function levelOf(address player, uint8 skill) external view returns (uint256) {
        return _levelForXp(skillXp[player][skill]);
    }

    function levelForXp(uint256 xp) external pure returns (uint256) {
        return _levelForXp(xp);
    }

    function xpRequiredForLevel(uint256 level) public pure returns (uint256) {
        if (level <= 1) return 0;
        uint256 progress = level - 1;
        return progress * progress * 45;
    }

    function pendingCycles(address player) external view returns (uint256) {
        ActiveMission memory mission = activeMission[player];
        if (mission.activityId == 0) return 0;

        IIdleGalacticaContent.Activity memory activity = CONTENT.getActivity(mission.activityId);
        if (activity.cycleSeconds == 0) return 0;

        uint256 elapsed = block.timestamp - mission.lastResolvedAt;
        if (elapsed > AFK_CAP) elapsed = AFK_CAP;
        return elapsed / activity.cycleSeconds;
    }

    function _startMission(uint16 activityId, uint8 expectedKind) internal {
        address player = msg.sender;
        _requireProfile(player);

        uint16 previousActivityId = activeMission[player].activityId;
        _settle(player);
        if (previousActivityId != 0 && activeMission[player].activityId == previousActivityId) {
            emit MissionStopped(player, previousActivityId, "SWITCHED");
        }

        IIdleGalacticaContent.Activity memory activity = CONTENT.getActivity(activityId);
        if (activity.kind != expectedKind) revert BadActivity();
        if (!isSectorUnlocked(player, activity.sectorId)) revert SectorLocked();
        if (currentSectorId[player] != activity.sectorId) revert SectorRequired();
        if (!_meetsLevelReqs(player, activity.levelReqs)) revert RequirementLow();
        if (activity.requiredModule != 0 && !_hasModuleEquippedOrInCargo(player, activity.requiredModule)) {
            revert ModuleRequired();
        }
        if (expectedKind == KIND_COMBAT) {
            if (currentHull[player] == 0) revert HullEmpty();
            if (_moduleInSlot(player, uint8(ModuleSlot.Hardpoint)) == 0) revert ModuleRequired();
        }
        if (expectedKind == KIND_PRODUCTION && activity.costs != 0) {
            if (_maxAffordableCycles(player, activity.costs) == 0) revert CargoLow();
        }

        activeMission[player] = ActiveMission({
            activityId: activityId,
            startedAt: uint64(block.timestamp),
            lastResolvedAt: uint64(block.timestamp)
        });

        emit MissionStarted(player, activityId, expectedKind);
    }

    function _settle(address player) internal {
        ActiveMission memory mission = activeMission[player];
        if (mission.activityId == 0) return;

        IIdleGalacticaContent.Activity memory activity = CONTENT.getActivity(mission.activityId);
        if (activity.cycleSeconds == 0) revert BadActivity();

        uint256 elapsed = block.timestamp - mission.lastResolvedAt;
        if (elapsed > AFK_CAP) elapsed = AFK_CAP;
        uint256 possibleCycles = elapsed / activity.cycleSeconds;
        if (possibleCycles == 0) return;
        if (possibleCycles > MAX_SETTLE_CYCLES) possibleCycles = MAX_SETTLE_CYCLES;

        Settlement memory settlement = activity.kind == KIND_COMBAT
            ? _settleCombat(player, activity, possibleCycles)
            : _settleActivity(player, activity, possibleCycles);

        if (settlement.cycles > 0) {
            activeMission[player].lastResolvedAt = uint64(
                mission.lastResolvedAt + settlement.cycles * activity.cycleSeconds
            );
        }

        if (settlement.stopped) {
            emit MissionStopped(player, activity.activityId, settlement.reason);
            delete activeMission[player];
        }

        if (settlement.cycles > 0) {
            if (activity.kind == KIND_COMBAT) {
                emit CombatSettled(
                    player,
                    activity.activityId,
                    settlement.cycles,
                    settlement.hullDamage
                );
            } else {
                emit MissionSettled(player, activity.activityId, settlement.cycles);
            }
        }
    }

    function _settleActivity(
        address player,
        IIdleGalacticaContent.Activity memory activity,
        uint256 possibleCycles
    ) internal returns (Settlement memory settlement) {
        uint256 cycles = possibleCycles;
        if (activity.costs != 0) {
            uint256 affordable = _maxAffordableCycles(player, activity.costs);
            if (affordable < cycles) {
                cycles = affordable;
                settlement.stopped = true;
                settlement.reason = "CARGO_EMPTY";
            }
            if (cycles > 0) {
                _burnPacked(player, activity.costs, cycles);
            }
        }

        if (cycles > 0) {
            _mintPacked(player, activity.rewards, cycles);
            _grantXp(player, activity.xp, cycles);
        }

        settlement.cycles = cycles;
        if (cycles == 0 && activity.costs != 0) {
            settlement.stopped = true;
            settlement.reason = "CARGO_EMPTY";
        }
    }

    function _settleCombat(
        address player,
        IIdleGalacticaContent.Activity memory activity,
        uint256 possibleCycles
    ) internal returns (Settlement memory settlement) {
        uint256 cycles = possibleCycles;
        if (cycles > MAX_COMBAT_SETTLE_CYCLES) cycles = MAX_COMBAT_SETTLE_CYCLES;

        CombatSettings memory settings = combatSettings[player];
        IIdleGalacticaContent.ModuleStats memory stats = _shipStats(player);
        uint16 hull = currentHull[player];
        uint256 repairItemsUsed;

        for (uint256 cycle = 0; cycle < cycles; cycle++) {
            (hull, repairItemsUsed) = _autoRepairHullIfNeeded(
                player,
                settings,
                hull,
                repairItemsUsed
            );

            if (hull <= settings.stopAtHull) {
                settlement.stopped = true;
                settlement.reason = "HULL_STOP";
                break;
            }

            if (activity.combat.requiredAmmo != 0 && balanceOf(player, activity.combat.requiredAmmo) == 0) {
                settlement.stopped = true;
                settlement.reason = "NO_AMMO";
                break;
            }

            (bool hit, uint16 damageTaken, uint16 mitigatedDamage) = _resolveCombatCycle(
                player,
                activity,
                stats,
                cycle
            );

            if (hit) {
                if (activity.combat.requiredAmmo != 0) {
                    _burn(player, activity.combat.requiredAmmo, 1);
                }
                _mintPacked(player, activity.rewards, 1);
                _grantSingleXp(player, SKILL_GUNNERY, _xpForSkill(activity.xp, SKILL_GUNNERY));
            }

            if (damageTaken > 0 || mitigatedDamage > 0) {
                _grantSingleXp(player, SKILL_ENGINEERING, _xpForSkill(activity.xp, SKILL_ENGINEERING));
            }

            if (damageTaken >= hull) {
                settlement.cycles += 1;
                settlement.hullDamage += hull;
                _destroyShip(player, activity.activityId);
                settlement.stopped = true;
                settlement.reason = "HULL_FAILURE";
                return settlement;
            }

            hull -= damageTaken;
            settlement.hullDamage += damageTaken;

            (hull, repairItemsUsed) = _autoRepairHullIfNeeded(
                player,
                settings,
                hull,
                repairItemsUsed
            );

            settlement.cycles += 1;
        }

        currentHull[player] = hull;
    }

    function _resolveCombatCycle(
        address player,
        IIdleGalacticaContent.Activity memory activity,
        IIdleGalacticaContent.ModuleStats memory stats,
        uint256 cycle
    ) internal view returns (bool hit, uint16 damageTaken, uint16 mitigatedDamage) {
        hit = _combatHit(player, activity, stats, cycle);
        (damageTaken, mitigatedDamage) = _combatDamage(player, activity, stats, cycle);
    }

    function _combatHit(
        address player,
        IIdleGalacticaContent.Activity memory activity,
        IIdleGalacticaContent.ModuleStats memory stats,
        uint256 cycle
    ) internal view returns (bool) {
        uint256 gunnery = _levelForXp(skillXp[player][SKILL_GUNNERY]);
        uint256 hardpoint = _moduleInSlot(player, uint8(ModuleSlot.Hardpoint));
        IIdleGalacticaContent.ModuleStats memory hardpointStats = CONTENT.moduleStatsOf(hardpoint);
        uint256 offense = gunnery * 4
            + stats.damage
            + stats.accuracy
            + hardpointStats.damage
            + hardpointStats.accuracy
            + CONTENT.ammoDamage(activity.combat.requiredAmmo)
            + _roll(player, activity.activityId, cycle, 0);

        return offense >= activity.combat.defense;
    }

    function _combatDamage(
        address player,
        IIdleGalacticaContent.Activity memory activity,
        IIdleGalacticaContent.ModuleStats memory stats,
        uint256 cycle
    ) internal view returns (uint16 damageTaken, uint16 mitigatedDamage) {
        uint256 engineering = _levelForXp(skillXp[player][SKILL_ENGINEERING]);
        uint256 mitigation = engineering / 2 + stats.shielding + stats.armor;
        uint256 incoming = activity.combat.attack > mitigation
            ? activity.combat.attack - mitigation
            : 0;
        bool glancingSave = _roll(player, activity.activityId, cycle, 1) < engineering + stats.shielding;
        uint256 damage = incoming;
        if (glancingSave) {
            damage = damage > 3 ? damage - 3 : 0;
        }
        if (damage > type(uint16).max) damage = type(uint16).max;
        damageTaken = uint16(damage);
        mitigatedDamage = activity.combat.attack > damageTaken
            ? uint16(activity.combat.attack - damageTaken)
            : 0;
    }

    function _destroyShip(address player, uint16 activityId) internal {
        uint256 creditsLost = balanceOf(player, CREDITS) / 2;
        if (creditsLost > 0) {
            _burn(player, CREDITS, creditsLost);
        }

        uint256[] memory modulesLost = new uint256[](6);
        uint256 lostCount;
        for (uint8 slot = 0; slot <= uint8(ModuleSlot.AuxiliaryCore); slot++) {
            uint256 itemId = _moduleInSlot(player, slot);
            if (itemId != 0) {
                modulesLost[lostCount] = itemId;
                lostCount += 1;
                _setModuleInSlot(player, slot, 0);
            }
        }

        currentHull[player] = 0;

        uint256[] memory trimmed = new uint256[](lostCount);
        for (uint256 index = 0; index < lostCount; index++) {
            trimmed[index] = modulesLost[index];
        }

        emit ShipDestroyed(player, activityId, creditsLost, trimmed);
    }

    function _burnPacked(address player, uint256 packed, uint256 multiplier) internal {
        for (uint256 index = 0; index < 4; index++) {
            uint256 amount = _pairAmount(packed, index);
            if (amount == 0) continue;

            uint256 itemId = _pairId(packed, index);
            _burn(player, itemId, amount * multiplier);
        }
    }

    function _mintPacked(address player, uint256 packed, uint256 multiplier) internal {
        for (uint256 index = 0; index < 4; index++) {
            uint256 amount = _pairAmount(packed, index);
            if (amount == 0) continue;

            uint256 itemId = _pairId(packed, index);
            _mint(player, itemId, amount * multiplier, "");
        }
    }

    function _grantXp(address player, uint256 packed, uint256 multiplier) internal {
        for (uint256 index = 0; index < 4; index++) {
            uint256 amount = _pairAmount(packed, index);
            if (amount == 0) continue;

            _grantSingleXp(player, uint8(_pairId(packed, index)), amount * multiplier);
        }
    }

    function _grantSingleXp(address player, uint8 skill, uint256 xp) internal {
        if (xp == 0) return;
        uint256 nextXp = uint256(skillXp[player][skill]) + xp;
        skillXp[player][skill] = nextXp > type(uint64).max ? type(uint64).max : uint64(nextXp);
    }

    function _restoreHull(address player, uint16 repair) internal returns (uint16 restored) {
        uint16 hull = currentHull[player];
        uint16 cap = _maxHull(player);
        uint16 nextHull = hull + repair > cap ? cap : hull + repair;
        currentHull[player] = nextHull;
        return nextHull - hull;
    }

    function _autoRepairHullIfNeeded(
        address player,
        CombatSettings memory settings,
        uint16 hull,
        uint256 repairItemsUsed
    ) internal returns (uint16, uint256) {
        if (
            !settings.autoRepair ||
            hull == 0 ||
            hull > settings.stopAtHull ||
            repairItemsUsed >= settings.maxRepairItemsPerClaim
        ) {
            return (hull, repairItemsUsed);
        }

        uint16 repair = CONTENT.repairAmount(settings.repairItemId);
        if (repair == 0) return (hull, repairItemsUsed);

        uint16 cap = _maxHull(player);
        while (
            hull <= settings.stopAtHull &&
            repairItemsUsed < settings.maxRepairItemsPerClaim &&
            balanceOf(player, settings.repairItemId) > 0 &&
            hull < cap
        ) {
            _burn(player, settings.repairItemId, 1);
            repairItemsUsed += 1;
            hull = hull + repair > cap ? cap : hull + repair;
        }

        return (hull, repairItemsUsed);
    }

    function _maxHull(address player) internal view returns (uint16) {
        IIdleGalacticaContent.ModuleStats memory stats = _shipStats(player);
        uint256 cap = BASE_MAX_HULL + stats.hull;
        return cap > type(uint16).max ? type(uint16).max : uint16(cap);
    }

    function _clampHull(address player) internal {
        uint16 cap = _maxHull(player);
        if (currentHull[player] > cap) {
            currentHull[player] = cap;
        }
    }

    function _shipStats(address player)
        internal
        view
        returns (IIdleGalacticaContent.ModuleStats memory stats)
    {
        for (uint8 slot = 0; slot <= uint8(ModuleSlot.AuxiliaryCore); slot++) {
            uint256 itemId = _moduleInSlot(player, slot);
            if (itemId == 0) continue;

            IIdleGalacticaContent.ModuleStats memory moduleStats = CONTENT.moduleStatsOf(itemId);
            stats.damage += moduleStats.damage;
            stats.accuracy += moduleStats.accuracy;
            stats.shielding += moduleStats.shielding;
            stats.armor += moduleStats.armor;
            stats.hull += moduleStats.hull;
            stats.speed += moduleStats.speed;
            stats.utility += moduleStats.utility;
        }
    }

    function _hasModuleEquippedOrInCargo(address player, uint256 itemId) internal view returns (bool) {
        if (balanceOf(player, itemId) > 0) return true;
        for (uint8 slot = 0; slot <= uint8(ModuleSlot.AuxiliaryCore); slot++) {
            if (_moduleInSlot(player, slot) == itemId) return true;
        }
        return false;
    }

    function _meetsLevelReqs(address player, uint256 packed) internal view returns (bool) {
        for (uint256 index = 0; index < 4; index++) {
            uint256 level = _pairAmount(packed, index);
            if (level == 0) continue;
            uint8 skill = uint8(_pairId(packed, index));
            if (_levelForXp(skillXp[player][skill]) < level) return false;
        }
        return true;
    }

    function _maxAffordableCycles(address player, uint256 packedCosts) internal view returns (uint256) {
        uint256 maxCycles = type(uint256).max;
        bool hasCost;

        for (uint256 index = 0; index < 4; index++) {
            uint256 amount = _pairAmount(packedCosts, index);
            if (amount == 0) continue;

            hasCost = true;
            uint256 itemId = _pairId(packedCosts, index);
            uint256 affordable = balanceOf(player, itemId) / amount;
            if (affordable < maxCycles) maxCycles = affordable;
        }

        return hasCost ? maxCycles : type(uint256).max;
    }

    function _xpForSkill(uint256 packed, uint8 skill) internal pure returns (uint256) {
        for (uint256 index = 0; index < 4; index++) {
            uint256 amount = _pairAmount(packed, index);
            if (amount == 0) continue;
            if (_pairId(packed, index) == skill) return amount;
        }
        return 0;
    }

    function _moduleInSlot(address player, uint8 slot) internal view returns (uint256) {
        ShipModules storage modules = shipModules[player];
        if (slot == uint8(ModuleSlot.Hardpoint)) return modules.hardpoint;
        if (slot == uint8(ModuleSlot.ShieldArray)) return modules.shieldArray;
        if (slot == uint8(ModuleSlot.HullPlating)) return modules.hullPlating;
        if (slot == uint8(ModuleSlot.SensorSuite)) return modules.sensorSuite;
        if (slot == uint8(ModuleSlot.EngineCore)) return modules.engineCore;
        if (slot == uint8(ModuleSlot.AuxiliaryCore)) return modules.auxiliaryCore;
        return 0;
    }

    function _setModuleInSlot(address player, uint8 slot, uint256 itemId) internal {
        ShipModules storage modules = shipModules[player];
        if (slot == uint8(ModuleSlot.Hardpoint)) {
            modules.hardpoint = itemId;
        } else if (slot == uint8(ModuleSlot.ShieldArray)) {
            modules.shieldArray = itemId;
        } else if (slot == uint8(ModuleSlot.HullPlating)) {
            modules.hullPlating = itemId;
        } else if (slot == uint8(ModuleSlot.SensorSuite)) {
            modules.sensorSuite = itemId;
        } else if (slot == uint8(ModuleSlot.EngineCore)) {
            modules.engineCore = itemId;
        } else if (slot == uint8(ModuleSlot.AuxiliaryCore)) {
            modules.auxiliaryCore = itemId;
        } else {
            revert BadConfig();
        }
    }

    function _pairId(uint256 packed, uint256 index) internal pure returns (uint256) {
        return uint16(packed >> (index * 64));
    }

    function _pairAmount(uint256 packed, uint256 index) internal pure returns (uint256) {
        return uint32(packed >> (index * 64 + 16));
    }

    function _levelForXp(uint256 xp) internal pure returns (uint256 level) {
        level = 1;
        while (xp >= xpRequiredForLevel(level + 1)) {
            level += 1;
        }
    }

    function _roll(address player, uint16 activityId, uint256 cycle, uint256 salt)
        internal
        view
        returns (uint256)
    {
        return uint256(
            keccak256(
                abi.encodePacked(
                    block.prevrandao,
                    block.timestamp,
                    player,
                    activityId,
                    cycle,
                    salt
                )
            )
        ) % 100;
    }

    function _sectorBit(uint8 sectorId) internal pure returns (uint8) {
        if (sectorId == 0 || sectorId > 8) revert BadSector();
        return uint8(1 << (sectorId - 1));
    }

    function _requireProfile(address player) internal view {
        if (!hasProfile[player]) revert NoProfile();
    }
}
