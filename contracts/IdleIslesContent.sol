// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IIdleIslesContent} from "./IIdleIslesContent.sol";

contract IdleIslesContent is IIdleIslesContent {
    error BadActivity();

    uint8 internal constant SKILL_WOODCUTTING = 3;
    uint8 internal constant SKILL_FISHING = 4;
    uint8 internal constant SKILL_MINING = 5;
    uint8 internal constant SKILL_SMITHING = 6;
    uint8 internal constant SKILL_COOKING = 7;
    uint8 internal constant SKILL_CRAFTING = 8;

    uint256 internal constant ASH_LOG = 2;
    uint256 internal constant PINE_LOG = 3;
    uint256 internal constant OAK_LOG = 4;
    uint256 internal constant IRONBARK_LOG = 5;
    uint256 internal constant ELDER_LOG = 6;
    uint256 internal constant SPIRITWOOD_LOG = 7;
    uint256 internal constant RAW_MINNOW = 8;
    uint256 internal constant COOKED_MINNOW = 9;
    uint256 internal constant RAW_TROUT = 10;
    uint256 internal constant COOKED_TROUT = 11;
    uint256 internal constant RAW_COD = 12;
    uint256 internal constant COOKED_COD = 13;
    uint256 internal constant RAW_TUNA = 14;
    uint256 internal constant COOKED_TUNA = 15;
    uint256 internal constant RAW_MANTA = 16;
    uint256 internal constant COOKED_MANTA = 17;
    uint256 internal constant RAW_LEVIATHAN = 18;
    uint256 internal constant COOKED_LEVIATHAN = 19;
    uint256 internal constant TREANT_BARK = 20;
    uint256 internal constant HOLLOW_SEED = 21;
    uint256 internal constant COPPER_ORE = 30;
    uint256 internal constant TIN_ORE = 31;
    uint256 internal constant IRON_ORE = 32;
    uint256 internal constant COAL_ORE = 33;
    uint256 internal constant COBALT_ORE = 34;
    uint256 internal constant TUNGSTEN_ORE = 37;
    uint256 internal constant COPPER_BAR = 40;
    uint256 internal constant IRON_BAR = 41;
    uint256 internal constant STEEL_BAR = 42;
    uint256 internal constant TUNGSTEN_BAR = 43;
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
    uint256 internal constant HIDE = 70;
    uint256 internal constant THICK_HIDE = 73;
    uint256 internal constant RUGGED_HIDE = 74;
    uint256 internal constant COBALT_SCALE = 75;
    uint256 internal constant WYRM_HIDE = 76;

    uint16 internal constant ACTIVITY_ASH_GROVE = 201;
    uint16 internal constant ACTIVITY_COPPER_RIDGE = 202;
    uint16 internal constant ACTIVITY_TIN_HOLLOW = 203;
    uint16 internal constant ACTIVITY_RIVER_BEND = 204;
    uint16 internal constant ACTIVITY_PINE_STAND = 205;
    uint16 internal constant ACTIVITY_OAKWOOD = 206;
    uint16 internal constant ACTIVITY_IRONBARK_TREES = 207;
    uint16 internal constant ACTIVITY_ELDERWOOD_GROVE = 208;
    uint16 internal constant ACTIVITY_SPIRITWOOD_GROVE = 209;
    uint16 internal constant ACTIVITY_LAKE_DOCK = 210;
    uint16 internal constant ACTIVITY_COASTAL_NET = 211;
    uint16 internal constant ACTIVITY_DEEPWATER_LINE = 212;
    uint16 internal constant ACTIVITY_STORM_PIER = 213;
    uint16 internal constant ACTIVITY_ABYSSAL_POOL = 214;
    uint16 internal constant ACTIVITY_IRON_VEIN = 215;
    uint16 internal constant ACTIVITY_COAL_CUT = 216;
    uint16 internal constant ACTIVITY_TUNGSTEN_LODE = 217;

    uint16 internal constant ACTIVITY_WOOD_ARMORY = 301;
    uint16 internal constant ACTIVITY_COPPER_SMELTER = 302;
    uint16 internal constant ACTIVITY_COPPER_DAGGER = 303;
    uint16 internal constant ACTIVITY_COOK_MINNOW = 304;
    uint16 internal constant ACTIVITY_BARK_LEGGINGS = 305;
    uint16 internal constant ACTIVITY_IRON_SMELTER = 306;
    uint16 internal constant ACTIVITY_COPPER_ARMOR = 307;
    uint16 internal constant ACTIVITY_COPPER_LEGS = 308;
    uint16 internal constant ACTIVITY_IRON_SWORD = 309;
    uint16 internal constant ACTIVITY_IRON_ARMOR = 310;
    uint16 internal constant ACTIVITY_IRON_LEGS = 311;
    uint16 internal constant ACTIVITY_STEEL_SMELTER = 312;
    uint16 internal constant ACTIVITY_STEEL_LONGSWORD = 313;
    uint16 internal constant ACTIVITY_STEEL_ARMOR = 314;
    uint16 internal constant ACTIVITY_STEEL_LEGS = 315;
    uint16 internal constant ACTIVITY_TUNGSTEN_SMELTER = 316;
    uint16 internal constant ACTIVITY_TUNGSTEN_BLADE = 317;
    uint16 internal constant ACTIVITY_TUNGSTEN_ARMOR = 318;
    uint16 internal constant ACTIVITY_TUNGSTEN_LEGS = 319;
    uint16 internal constant ACTIVITY_LEATHER_COWL = 320;
    uint16 internal constant ACTIVITY_LEATHER_CHAPS = 321;
    uint16 internal constant ACTIVITY_LEATHER_BODY = 322;
    uint16 internal constant ACTIVITY_HARDLEATHER_COWL = 323;
    uint16 internal constant ACTIVITY_HARDLEATHER_CHAPS = 324;
    uint16 internal constant ACTIVITY_HARDLEATHER_BODY = 325;
    uint16 internal constant ACTIVITY_CARAPACE_COWL = 326;
    uint16 internal constant ACTIVITY_CARAPACE_LEGS = 327;
    uint16 internal constant ACTIVITY_CARAPACE_BODY = 328;
    uint16 internal constant ACTIVITY_COBALT_MESH_COWL = 329;
    uint16 internal constant ACTIVITY_COBALT_MESH_LEGS = 330;
    uint16 internal constant ACTIVITY_COBALT_MESH_BODY = 331;
    uint16 internal constant ACTIVITY_DRAGONHIDE_COWL = 332;
    uint16 internal constant ACTIVITY_DRAGONHIDE_CHAPS = 333;
    uint16 internal constant ACTIVITY_DRAGONHIDE_BODY = 334;
    uint16 internal constant ACTIVITY_COOK_TROUT = 335;
    uint16 internal constant ACTIVITY_COOK_COD = 336;
    uint16 internal constant ACTIVITY_COOK_TUNA = 337;
    uint16 internal constant ACTIVITY_COOK_MANTA = 338;
    uint16 internal constant ACTIVITY_COOK_LEVIATHAN = 339;

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
        if (itemId == COOKED_COD) return 9;
        if (itemId == COOKED_TUNA) return 13;
        if (itemId == COOKED_MANTA) return 20;
        if (itemId == COOKED_LEVIATHAN) return 34;
        return 0;
    }

    bytes internal constant GATHER_DATA =
        hex"0000000000000000000000000000000000000000000200020000001201030005"
        hex"00000000000000000000000000000000000000000002001e0000001401050007"
        hex"00000000000000000000000000000000000000000002001f0000001401050007"
        hex"0000000000000000000000000000000000000000000200080000001401040006"
        hex"0000000000000000000000000000000000000000000200030000002004030007"
        hex"0000000000000000000000000000000000000000000200040000003808030009"
        hex"0000000000000000000000000000000000000000000100050000005f1003000d"
        hex"000000000000000000000000000000000000000000010006000000961c030011"
        hex"0000000000000000000000000000000000000000000100070000011330030019"
        hex"00000000000000000000000000000000000000000001000a0000002605040008"
        hex"00000000000000000000000000000000000000000001000c000000420c04000a"
        hex"00000000000000000000000000000000000000000001000e000000761804000e"
        hex"000000000000000000000000000000000000000000010010000000cd26040014"
        hex"000000000000000000000000000000000000000000010012000001a43a040020"
        hex"0000000000000000000000000000000000000000000200200000002208050008"
        hex"000000000000000000000000000000000000000000010021000000481905000c"
        hex"0000000000000000000000000000000000000000000100250000008c37050012";

    function getGatherActivity(uint16 activityId) external pure returns (uint256 config) {
        if (activityId < ACTIVITY_ASH_GROVE || activityId > ACTIVITY_TUNGSTEN_LODE) {
            revert BadActivity();
        }

        uint256 offset = uint256(activityId - ACTIVITY_ASH_GROVE) * 32;
        bytes memory data = GATHER_DATA;

        assembly {
            config := mload(add(add(data, 0x20), offset))
        }
    }

    bytes internal constant ARTISAN_DATA =
        hex"000000000000000000000000000000000000000000000000000000100106000600000000000000000000000000000000000000000000000000000000000300020000000000000000000000000000000000000000000100340001003300010032"
        hex"0000000000000000000000000000000000000000000000000000001a010600080000000000000000000000000000000000000000000100020001001f0001001e0000000000000000000000000000000000000000000000000000000000010028"
        hex"0000000000000000000000000000000000000000000000000000002a0406000a00000000000000000000000000000000000000000000000000020002000300280000000000000000000000000000000000000000000000000000000000010035"
        hex"00000000000000000000000000000000012c00000dac00090000000e0107000400000000000000000000000000000000000000000000000000000000000100080000000000000000000000000000000000000000000000000000000000000000"
        hex"000000000000000000000000000000000000000000000000000000140206000700000000000000000000000000000000000000000000000000010046000200020000000000000000000000000000000000000000000000000000000000010041"
        hex"0000000000000000000000000000000000000000000000000000003e0806000b00000000000000000000000000000000000000000000000000010021000200200000000000000000000000000000000000000000000000000000000000010029"
        hex"000000000000000000000000000000000000000000000000000000360606000c00000000000000000000000000000000000000000000000000010046000400280000000000000000000000000000000000000000000000000001003700010036"
        hex"0000000000000000000000000000000000000000000000000000003a0706000d00000000000000000000000000000000000000000000000000010046000300280000000000000000000000000000000000000000000000000000000000010042"
        hex"0000000000000000000000000000000000000000000000000000004a0a06000d00000000000000000000000000000000000000000000000000010003000300290000000000000000000000000000000000000000000000000000000000010038"
        hex"0000000000000000000000000000000000000000000000000000005e1006000f00000000000000000000000000000000000000000000000000020046000500290000000000000000000000000000000000000000000000000001003a00010039"
        hex"000000000000000000000000000000000000000000000000000000691206001000000000000000000000000000000000000000000000000000020046000400290000000000000000000000000000000000000000000000000000000000010043"
        hex"000000000000000000000000000000000000000000000000000000702306000f0000000000000000000000000000000000000000000000000002002100020029000000000000000000000000000000000000000000000000000000000001002a"
        hex"0000000000000000000000000000000000000000000000000000009626060012000000000000000000000000000000000000000000000000000100480003002a000000000000000000000000000000000000000000000000000000000001003b"
        hex"000000000000000000000000000000000000000000000000000000a628060013000000000000000000000000000000000000000000000000000300490005002a0000000000000000000000000000000000000000000000000001003d0001003c"
        hex"000000000000000000000000000000000000000000000000000000b92a060014000000000000000000000000000000000000000000000000000200490004002a0000000000000000000000000000000000000000000000000000000000010044"
        hex"000000000000000000000000000000000000000000000000000000e6370600160000000000000000000000000000000000000000000000000002002100020025000000000000000000000000000000000000000000000000000000000001002b"
        hex"0000000000000000000000000000000000000000000000000000013b3c06001a000000000000000000000000000000000000000000000000000300480003002b000000000000000000000000000000000000000000000000000000000001003e"
        hex"0000000000000000000000000000000000000000000000000000015e3e06001d000000000000000000000000000000000000000000000000000400480005002b000000000000000000000000000000000000000000000000000100400001003f"
        hex"000000000000000000000000000000000000000000000000000001724006001e000000000000000000000000000000000000000000000000000300480004002b0000000000000000000000000000000000000000000000000000000000010045"
        hex"0000000000000000000000000000000000000000000000000000000f0108000500000000000000000000000000000000000000000000000000010002000200460000000000000000000000000000000000000000000000000000000000010050"
        hex"00000000000000000000000000000000000000000000000000000018030800060000000000000000000000000000000000000000000000000001000200030046000000000000000000000000000000000000000000000000000000000001005a"
        hex"0000000000000000000000000000000000000000000000000000001e0408000700000000000000000000000000000000000000000000000000010002000400460000000000000000000000000000000000000000000000000000000000010051"
        hex"000000000000000000000000000000000000000000000000000000320a08000900000000000000000000000000000000000000000000000000010003000200490000000000000000000000000000000000000000000000000000000000010052"
        hex"000000000000000000000000000000000000000000000000000000440c08000a0000000000000000000000000000000000000000000000000001000300030049000000000000000000000000000000000000000000000000000000000001005b"
        hex"000000000000000000000000000000000000000000000000000000550f08000b00000000000000000000000000000000000000000000000000010003000400490000000000000000000000000000000000000000000000000000000000010053"
        hex"0000000000000000000000000000000000000000000000000000006e1908000d000000000000000000000000000000000000000000000000000100040002004a0000000000000000000000000000000000000000000000000000000000010054"
        hex"000000000000000000000000000000000000000000000000000000871c08000e000000000000000000000000000000000000000000000000000100040003004a000000000000000000000000000000000000000000000000000000000001005c"
        hex"000000000000000000000000000000000000000000000000000000a02008000f000000000000000000000000000000000000000000000000000100040004004a0000000000000000000000000000000000000000000000000000000000010055"
        hex"000000000000000000000000000000000000000000000000000000d22d080012000000000000000000000000000000000000000000000000000100050002004b0000000000000000000000000000000000000000000000000000000000010056"
        hex"0000000000000000000000000000000000000000000000000000010430080014000000000000000000000000000000000000000000000000000100050003004b000000000000000000000000000000000000000000000000000000000001005d"
        hex"0000000000000000000000000000000000000000000000000000014034080016000000000000000000000000000000000000000000000000000100050004004b0000000000000000000000000000000000000000000000000000000000010057"
        hex"0000000000000000000000000000000000000000000000000000019041080019000000000000000000000000000000000000000000000000000100060002004c0000000000000000000000000000000000000000000000000000000000010058"
        hex"000000000000000000000000000000000000000000000000000001f44408001b000000000000000000000000000000000000000000000000000100060003004c000000000000000000000000000000000000000000000000000000000001005e"
        hex"000000000000000000000000000000000000000000000000000002584808001e000000000000000000000000000000000000000000000000000100060004004c0000000000000000000000000000000000000000000000000000000000010059"
        hex"0000000000000000000000000000000000fa01f41388000b0000001e05070006000000000000000000000000000000000000000000000000000000000001000a0000000000000000000000000000000000000000000000000000000000000000"
        hex"0000000000000000000000000000000000c802581770000d000000300c070007000000000000000000000000000000000000000000000000000000000001000c0000000000000000000000000000000000000000000000000000000000000000"
        hex"0000000000000000000000000000000000aa03201d4c000f0000005218070009000000000000000000000000000000000000000000000000000000000001000e0000000000000000000000000000000000000000000000000000000000000000"
        hex"0000000000000000000000000000000000a003e8251c0011000000912607000c00000000000000000000000000000000000000000000000000000000000100100000000000000000000000000000000000000000000000000000000000000000"
        hex"00000000000000000000000000000000008c04b02af80013000001363a07001100000000000000000000000000000000000000000000000000000000000100120000000000000000000000000000000000000000000000000000000000000000";

    function getArtisanActivity(uint16 activityId)
        external
        pure
        returns (uint256 config, uint256 costs, uint256 rewards)
    {
        if (activityId < ACTIVITY_WOOD_ARMORY || activityId > ACTIVITY_COOK_LEVIATHAN) {
            revert BadActivity();
        }

        uint256 offset = uint256(activityId - ACTIVITY_WOOD_ARMORY) * 96;
        bytes memory data = ARTISAN_DATA;

        assembly {
            let ptr := add(add(data, 0x20), offset)
            config := mload(ptr)
            costs := mload(add(ptr, 0x20))
            rewards := mload(add(ptr, 0x40))
        }
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
