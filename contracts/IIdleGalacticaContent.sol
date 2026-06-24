// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IIdleGalacticaContent {
    struct ModuleStats {
        uint16 damage;
        uint16 accuracy;
        uint16 shielding;
        uint16 armor;
        uint16 hull;
        uint16 speed;
        uint16 utility;
    }

    struct CombatRules {
        uint16 threatHull;
        uint16 attack;
        uint16 defense;
        uint16 accuracy;
        uint256 requiredAmmo;
    }

    struct Activity {
        uint16 activityId;
        uint8 kind;
        uint8 sectorId;
        uint8 primarySkill;
        uint8 tier;
        uint32 cycleSeconds;
        uint256 requiredModule;
        uint256 levelReqs;
        uint256 xp;
        uint256 costs;
        uint256 rewards;
        CombatRules combat;
    }

    function moduleSlot(uint256 itemId) external pure returns (bool isModule, uint8 slot);
    function moduleStatsOf(uint256 itemId) external pure returns (ModuleStats memory stats);
    function repairAmount(uint256 itemId) external pure returns (uint16);
    function ammoDamage(uint256 itemId) external pure returns (uint16);
    function getActivity(uint16 activityId) external pure returns (Activity memory activity);
    function sectorUnlock(uint8 sectorId)
        external
        pure
        returns (uint256 costItem, uint256 cost, uint256 levelReqs);
}
