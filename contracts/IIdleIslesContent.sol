// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IIdleIslesContent {
    struct Stats {
        uint16 attack;
        uint16 defence;
        uint16 hitpoints;
        uint16 speed;
    }

    struct CombatActivity {
        uint16 activityId;
        uint32 cycleSeconds;
        uint8 reqAttack;
        uint8 reqDefence;
        uint8 reqHitpoints;
        uint256 requiredEquipment;
        uint32 xpAttack;
        uint32 xpDefence;
        uint32 xpHitpoints;
        uint16 damageChanceBps;
        uint16 minDamage;
        uint16 maxDamage;
        bool boss;
    }

    struct Drop {
        uint256 itemId;
        uint64 amount;
        uint16 chanceBps;
        uint8 rarity;
    }

    function itemSlot(uint256 itemId) external pure returns (bool equippable, uint8 slot);
    function itemStatsOf(uint256 itemId) external pure returns (Stats memory stats);
    function healAmount(uint256 itemId) external pure returns (uint16);
    function getCombatActivity(uint16 activityId)
        external
        pure
        returns (CombatActivity memory activity);
    function getDrop(uint16 activityId, uint8 index) external pure returns (Drop memory);
}
