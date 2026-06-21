// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IIdleIslesContent} from "./IIdleIslesContent.sol";

contract IdleIslesContent is IIdleIslesContent {
    error BadActivity();

    uint256 internal constant PINE_LOG = 3;
    uint256 internal constant RAW_MINNOW = 8;
    uint256 internal constant COOKED_MINNOW = 9;
    uint256 internal constant RAW_TROUT = 10;
    uint256 internal constant COOKED_TROUT = 11;
    uint256 internal constant RAW_COD = 12;
    uint256 internal constant RAW_TUNA = 14;
    uint256 internal constant RAW_MANTA = 16;
    uint256 internal constant TREANT_BARK = 20;
    uint256 internal constant HOLLOW_SEED = 21;
    uint256 internal constant COAL_ORE = 33;
    uint256 internal constant COBALT_ORE = 34;
    uint256 internal constant TUNGSTEN_ORE = 37;
    uint256 internal constant STEEL_BAR = 42;
    uint256 internal constant WOOD_CLUB = 50;
    uint256 internal constant BARK_SHIELD = 51;
    uint256 internal constant BARK_VEST = 52;
    uint256 internal constant COPPER_DAGGER = 53;
    uint256 internal constant COPPER_HELM = 54;
    uint256 internal constant COPPER_PLATE = 55;
    uint256 internal constant IRON_SWORD = 56;
    uint256 internal constant IRON_HELM = 57;
    uint256 internal constant IRON_PLATE = 58;
    uint256 internal constant STEEL_LONGSWORD = 59;
    uint256 internal constant STEEL_HELM = 60;
    uint256 internal constant STEEL_PLATE = 61;
    uint256 internal constant TUNGSTEN_BLADE = 62;
    uint256 internal constant TUNGSTEN_HELM = 63;
    uint256 internal constant TUNGSTEN_PLATE = 64;
    uint256 internal constant BARK_LEGGINGS = 65;
    uint256 internal constant COPPER_LEGS = 66;
    uint256 internal constant IRON_LEGS = 67;
    uint256 internal constant STEEL_LEGS = 68;
    uint256 internal constant TUNGSTEN_LEGS = 69;
    uint256 internal constant LEATHER_COWL = 80;
    uint256 internal constant LEATHER_BODY = 81;
    uint256 internal constant HARDLEATHER_COWL = 82;
    uint256 internal constant HARDLEATHER_BODY = 83;
    uint256 internal constant CARAPACE_COWL = 84;
    uint256 internal constant CARAPACE_BODY = 85;
    uint256 internal constant COBALT_MESH_COWL = 86;
    uint256 internal constant COBALT_MESH_BODY = 87;
    uint256 internal constant DRAGONHIDE_COWL = 88;
    uint256 internal constant DRAGONHIDE_BODY = 89;
    uint256 internal constant LEATHER_CHAPS = 90;
    uint256 internal constant HARDLEATHER_CHAPS = 91;
    uint256 internal constant CARAPACE_LEGS = 92;
    uint256 internal constant COBALT_MESH_LEGS = 93;
    uint256 internal constant DRAGONHIDE_CHAPS = 94;
    uint256 internal constant FIELD_CHARM = 71;
    uint256 internal constant RUNE_DUST = 72;

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

    function itemSlot(uint256 itemId) external pure returns (bool equippable, uint8 slot) {
        if (
            itemId == WOOD_CLUB ||
            itemId == COPPER_DAGGER ||
            itemId == IRON_SWORD ||
            itemId == STEEL_LONGSWORD ||
            itemId == TUNGSTEN_BLADE
        ) {
            return (true, 0);
        }
        if (itemId == BARK_SHIELD) {
            return (true, 1);
        }
        if (
            itemId == COPPER_HELM ||
            itemId == IRON_HELM ||
            itemId == STEEL_HELM ||
            itemId == TUNGSTEN_HELM ||
            itemId == LEATHER_COWL ||
            itemId == HARDLEATHER_COWL ||
            itemId == CARAPACE_COWL ||
            itemId == COBALT_MESH_COWL ||
            itemId == DRAGONHIDE_COWL
        ) {
            return (true, 2);
        }
        if (
            itemId == BARK_VEST ||
            itemId == COPPER_PLATE ||
            itemId == IRON_PLATE ||
            itemId == STEEL_PLATE ||
            itemId == TUNGSTEN_PLATE ||
            itemId == LEATHER_BODY ||
            itemId == HARDLEATHER_BODY ||
            itemId == CARAPACE_BODY ||
            itemId == COBALT_MESH_BODY ||
            itemId == DRAGONHIDE_BODY
        ) {
            return (true, 3);
        }
        if (
            itemId == BARK_LEGGINGS ||
            itemId == COPPER_LEGS ||
            itemId == IRON_LEGS ||
            itemId == STEEL_LEGS ||
            itemId == TUNGSTEN_LEGS ||
            itemId == LEATHER_CHAPS ||
            itemId == HARDLEATHER_CHAPS ||
            itemId == CARAPACE_LEGS ||
            itemId == COBALT_MESH_LEGS ||
            itemId == DRAGONHIDE_CHAPS
        ) {
            return (true, 4);
        }
        if (itemId == FIELD_CHARM) {
            return (true, 5);
        }

        return (false, 0);
    }

    function itemStatsOf(uint256 itemId) external pure returns (Stats memory stats) {
        if (itemId == WOOD_CLUB) return Stats(1, 0, 0, 0);
        if (itemId == BARK_SHIELD) return Stats(0, 1, 0, 0);
        if (itemId == BARK_VEST) return Stats(0, 1, 1, 0);
        if (itemId == BARK_LEGGINGS) return Stats(0, 1, 1, 0);
        if (itemId == COPPER_DAGGER) return Stats(2, 0, 0, 1);
        if (itemId == COPPER_HELM) return Stats(0, 1, 0, 0);
        if (itemId == COPPER_PLATE) return Stats(0, 3, 2, 0);
        if (itemId == COPPER_LEGS) return Stats(0, 2, 1, 0);
        if (itemId == IRON_SWORD) return Stats(4, 0, 0, 0);
        if (itemId == IRON_HELM) return Stats(0, 3, 0, 0);
        if (itemId == IRON_PLATE) return Stats(0, 6, 4, 0);
        if (itemId == IRON_LEGS) return Stats(0, 4, 2, 0);
        if (itemId == STEEL_LONGSWORD) return Stats(7, 0, 0, 0);
        if (itemId == STEEL_HELM) return Stats(0, 5, 2, 0);
        if (itemId == STEEL_PLATE) return Stats(0, 10, 8, 0);
        if (itemId == STEEL_LEGS) return Stats(0, 7, 4, 0);
        if (itemId == TUNGSTEN_BLADE) return Stats(12, 0, 0, 0);
        if (itemId == TUNGSTEN_HELM) return Stats(0, 8, 4, 0);
        if (itemId == TUNGSTEN_PLATE) return Stats(0, 16, 14, 0);
        if (itemId == TUNGSTEN_LEGS) return Stats(0, 12, 8, 0);
        if (itemId == LEATHER_COWL) return Stats(0, 1, 0, 1);
        if (itemId == LEATHER_BODY) return Stats(0, 2, 0, 1);
        if (itemId == LEATHER_CHAPS) return Stats(0, 1, 0, 1);
        if (itemId == HARDLEATHER_COWL) return Stats(0, 2, 0, 2);
        if (itemId == HARDLEATHER_BODY) return Stats(0, 4, 0, 2);
        if (itemId == HARDLEATHER_CHAPS) return Stats(0, 3, 0, 2);
        if (itemId == CARAPACE_COWL) return Stats(0, 4, 0, 3);
        if (itemId == CARAPACE_BODY) return Stats(0, 8, 0, 3);
        if (itemId == CARAPACE_LEGS) return Stats(0, 6, 0, 3);
        if (itemId == COBALT_MESH_COWL) return Stats(0, 6, 0, 4);
        if (itemId == COBALT_MESH_BODY) return Stats(0, 12, 0, 4);
        if (itemId == COBALT_MESH_LEGS) return Stats(0, 9, 0, 4);
        if (itemId == DRAGONHIDE_COWL) return Stats(0, 10, 0, 5);
        if (itemId == DRAGONHIDE_BODY) return Stats(0, 20, 0, 5);
        if (itemId == DRAGONHIDE_CHAPS) return Stats(0, 15, 0, 5);
        if (itemId == FIELD_CHARM) return Stats(0, 0, 0, 2);
    }

    function healAmount(uint256 itemId) external pure returns (uint16) {
        if (itemId == COOKED_MINNOW) return 3;
        if (itemId == COOKED_TROUT) return 6;
        return 0;
    }

    function getCombatActivity(uint16 activityId)
        external
        pure
        returns (CombatActivity memory activity)
    {
        if (activityId == ACTIVITY_TRAINING_YARD) {
            return CombatActivity(activityId, 7, 1, 1, 1, 0, 15, 8, 8, 2400, 1, 2, false);
        }
        if (activityId == ACTIVITY_FIELD_RAT) {
            return CombatActivity(activityId, 9, 4, 1, 3, 0, 22, 10, 13, 3400, 1, 3, false);
        }
        if (activityId == ACTIVITY_MOSS_CAMP) {
            return CombatActivity(
                activityId,
                11,
                8,
                7,
                7,
                COPPER_DAGGER,
                35,
                22,
                20,
                4600,
                2,
                5,
                false
            );
        }
        if (activityId == ACTIVITY_CAVE_BAT) {
            return CombatActivity(activityId, 13, 16, 14, 14, IRON_SWORD, 52, 28, 30, 5000, 2, 7, false);
        }
        if (activityId == ACTIVITY_BANDIT_SCOUT) {
            return CombatActivity(activityId, 14, 24, 21, 21, IRON_SWORD, 68, 38, 42, 5600, 3, 9, false);
        }
        if (activityId == ACTIVITY_CRYPT_KNIGHT) {
            return CombatActivity(
                activityId,
                17,
                38,
                35,
                36,
                STEEL_LONGSWORD,
                95,
                64,
                68,
                6200,
                5,
                12,
                false
            );
        }
        if (activityId == ACTIVITY_HOLLOW_TREANT) {
            return CombatActivity(
                activityId,
                26,
                55,
                50,
                52,
                STEEL_LONGSWORD,
                180,
                120,
                120,
                7200,
                7,
                18,
                true
            );
        }
        if (activityId == ACTIVITY_GOBLIN_FORAGER) {
            return CombatActivity(activityId, 10, 10, 8, 10, 0, 42, 28, 25, 4000, 2, 5, false);
        }
        if (activityId == ACTIVITY_GIANT_SPIDER) {
            return CombatActivity(activityId, 12, 20, 18, 18, IRON_SWORD, 60, 35, 35, 4800, 3, 8, false);
        }
        if (activityId == ACTIVITY_DIRE_WOLF) {
            return CombatActivity(
                activityId,
                15,
                35,
                30,
                32,
                STEEL_LONGSWORD,
                85,
                55,
                60,
                5800,
                5,
                14,
                false
            );
        }
        if (activityId == ACTIVITY_VENOMOUS_DRAKE) {
            return CombatActivity(
                activityId,
                22,
                55,
                50,
                55,
                TUNGSTEN_BLADE,
                160,
                105,
                110,
                7000,
                8,
                22,
                false
            );
        }

        revert BadActivity();
    }

    function getDrop(uint16 activityId, uint8 index) external pure returns (Drop memory) {
        if (activityId == ACTIVITY_CAVE_BAT) {
            if (index == 0) return Drop(RAW_TROUT, 1, 1800, 1);
            if (index == 1) return Drop(RUNE_DUST, 1, 600, 2);
        }
        if (activityId == ACTIVITY_BANDIT_SCOUT) {
            if (index == 0) return Drop(IRON_HELM, 1, 350, 3);
            if (index == 1) return Drop(STEEL_BAR, 1, 500, 2);
        }
        if (activityId == ACTIVITY_CRYPT_KNIGHT) {
            if (index == 0) return Drop(STEEL_HELM, 1, 250, 3);
            if (index == 1) return Drop(STEEL_PLATE, 1, 150, 3);
            if (index == 2) return Drop(TUNGSTEN_ORE, 1, 400, 2);
        }
        if (activityId == ACTIVITY_HOLLOW_TREANT) {
            if (index == 0) return Drop(TREANT_BARK, 1, 1800, 2);
            if (index == 1) return Drop(STEEL_PLATE, 1, 400, 3);
            if (index == 2) return Drop(TUNGSTEN_ORE, 2, 300, 3);
            if (index == 3) return Drop(HOLLOW_SEED, 1, 70, 4);
        }
        if (activityId == ACTIVITY_GOBLIN_FORAGER) {
            if (index == 0) return Drop(PINE_LOG, 1, 1500, 1);
            if (index == 1) return Drop(RUNE_DUST, 1, 500, 2);
        }
        if (activityId == ACTIVITY_GIANT_SPIDER) {
            if (index == 0) return Drop(RAW_COD, 1, 1000, 1);
            if (index == 1) return Drop(COAL_ORE, 1, 500, 2);
        }
        if (activityId == ACTIVITY_DIRE_WOLF) {
            if (index == 0) return Drop(RAW_TUNA, 1, 1500, 1);
            if (index == 1) return Drop(COBALT_ORE, 1, 800, 2);
        }
        if (activityId == ACTIVITY_VENOMOUS_DRAKE) {
            if (index == 0) return Drop(RAW_MANTA, 1, 1200, 1);
            if (index == 1) return Drop(TUNGSTEN_ORE, 1, 500, 2);
            if (index == 2) return Drop(RUNE_DUST, 1, 1000, 2);
        }

        return Drop(0, 0, 0, 0);
    }
}
