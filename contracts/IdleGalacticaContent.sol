// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IIdleGalacticaContent} from "./IIdleGalacticaContent.sol";

contract IdleGalacticaContent is IIdleGalacticaContent {
    error BadActivity();
    error BadSector();

    function moduleSlot(uint256 itemId) external pure returns (bool isModule, uint8 slot) {
        if (itemId == 400) return (true, 5);
        if (itemId == 401) return (true, 5);
        if (itemId == 402) return (true, 5);
        if (itemId == 403) return (true, 3);
        if (itemId == 404) return (true, 0);
        if (itemId == 405) return (true, 0);
        if (itemId == 406) return (true, 1);
        if (itemId == 407) return (true, 1);
        if (itemId == 408) return (true, 2);
        if (itemId == 409) return (true, 2);
        if (itemId == 410) return (true, 4);
        if (itemId == 411) return (true, 5);
        return (false, 0);
    }

    function moduleStatsOf(uint256 itemId) external pure returns (ModuleStats memory stats) {
        if (itemId == 400) return ModuleStats(0, 0, 0, 0, 0, 0, 1);
        if (itemId == 401) return ModuleStats(0, 0, 0, 0, 0, 0, 1);
        if (itemId == 402) return ModuleStats(0, 0, 0, 0, 0, 0, 1);
        if (itemId == 403) return ModuleStats(0, 2, 0, 0, 0, 0, 2);
        if (itemId == 404) return ModuleStats(8, 4, 0, 0, 0, 0, 0);
        if (itemId == 405) return ModuleStats(16, 2, 0, 0, 0, 0, 0);
        if (itemId == 406) return ModuleStats(0, 0, 5, 0, 0, 0, 0);
        if (itemId == 407) return ModuleStats(0, 1, 11, 0, 0, 0, 0);
        if (itemId == 408) return ModuleStats(0, 0, 0, 5, 18, 0, 0);
        if (itemId == 409) return ModuleStats(0, 0, 0, 12, 30, 0, 0);
        if (itemId == 410) return ModuleStats(0, 1, 0, 0, 0, 3, 0);
        if (itemId == 411) return ModuleStats(0, 0, 1, 0, 0, 0, 3);
    }

    function repairAmount(uint256 itemId) external pure returns (uint16) {
        if (itemId == 250) return 18;
        if (itemId == 251) return 12;
        if (itemId == 252) return 24;
        if (itemId == 253) return 36;
        return 0;
    }

    function ammoDamage(uint256 itemId) external pure returns (uint16) {
        if (itemId == 300) return 4;
        if (itemId == 301) return 10;
        if (itemId == 302) return 16;
        return 0;
    }

    function sectorUnlock(uint8 sectorId)
        external
        pure
        returns (uint256 costItem, uint256 cost, uint256 levelReqs)
    {
        if (sectorId == 1) return (0, 0, 0);
        if (sectorId == 2) return (1, 2500, _pairs(0, 5, 9, 4, 0, 0, 0, 0));
        revert BadSector();
    }

    function getActivity(uint16 activityId) external pure returns (Activity memory activity) {
        if (activityId == 201) {
            return Activity(
                201,
                2,
                1,
                0,
                1,
                6,
                0,
                _pairs(0, 1, 0, 0, 0, 0, 0, 0),
                _pairs(0, 12, 0, 0, 0, 0, 0, 0),
                _pairs(0, 0, 0, 0, 0, 0, 0, 0),
                _pairs(10, 2, 12, 1, 0, 0, 0, 0),
                CombatRules(0, 0, 0, 0, 0)
            );
        }
        if (activityId == 202) {
            return Activity(
                202,
                2,
                1,
                0,
                2,
                9,
                0,
                _pairs(0, 5, 0, 0, 0, 0, 0, 0),
                _pairs(0, 24, 0, 0, 0, 0, 0, 0),
                _pairs(0, 0, 0, 0, 0, 0, 0, 0),
                _pairs(10, 2, 11, 2, 14, 1, 0, 0),
                CombatRules(0, 0, 0, 0, 0)
            );
        }
        if (activityId == 203) {
            return Activity(
                203,
                2,
                2,
                0,
                3,
                12,
                400,
                _pairs(0, 14, 9, 8, 0, 0, 0, 0),
                _pairs(0, 42, 9, 4, 0, 0, 0, 0),
                _pairs(0, 0, 0, 0, 0, 0, 0, 0),
                _pairs(13, 2, 11, 2, 0, 0, 0, 0),
                CombatRules(0, 0, 0, 0, 0)
            );
        }
        if (activityId == 204) {
            return Activity(
                204,
                2,
                2,
                0,
                4,
                18,
                400,
                _pairs(0, 23, 6, 12, 0, 0, 0, 0),
                _pairs(0, 70, 9, 8, 0, 0, 0, 0),
                _pairs(0, 0, 0, 0, 0, 0, 0, 0),
                _pairs(13, 3, 203, 1, 0, 0, 0, 0),
                CombatRules(0, 0, 0, 0, 0)
            );
        }
        if (activityId == 205) {
            return Activity(
                205,
                2,
                1,
                1,
                1,
                7,
                0,
                _pairs(1, 1, 0, 0, 0, 0, 0, 0),
                _pairs(1, 12, 0, 0, 0, 0, 0, 0),
                _pairs(0, 0, 0, 0, 0, 0, 0, 0),
                _pairs(130, 2, 131, 1, 0, 0, 0, 0),
                CombatRules(0, 0, 0, 0, 0)
            );
        }
        if (activityId == 206) {
            return Activity(
                206,
                2,
                1,
                1,
                2,
                9,
                0,
                _pairs(1, 6, 9, 5, 0, 0, 0, 0),
                _pairs(1, 26, 9, 3, 0, 0, 0, 0),
                _pairs(0, 0, 0, 0, 0, 0, 0, 0),
                _pairs(130, 2, 131, 2, 134, 1, 0, 0),
                CombatRules(0, 0, 0, 0, 0)
            );
        }
        if (activityId == 207) {
            return Activity(
                207,
                2,
                2,
                1,
                3,
                13,
                401,
                _pairs(1, 15, 8, 8, 0, 0, 0, 0),
                _pairs(1, 46, 9, 5, 0, 0, 0, 0),
                _pairs(0, 0, 0, 0, 0, 0, 0, 0),
                _pairs(132, 2, 133, 1, 0, 0, 0, 0),
                CombatRules(0, 0, 0, 0, 0)
            );
        }
        if (activityId == 208) {
            return Activity(
                208,
                2,
                2,
                1,
                4,
                19,
                401,
                _pairs(1, 25, 9, 18, 0, 0, 0, 0),
                _pairs(1, 76, 9, 8, 0, 0, 0, 0),
                _pairs(0, 0, 0, 0, 0, 0, 0, 0),
                _pairs(133, 2, 700, 1, 0, 0, 0, 0),
                CombatRules(0, 0, 0, 0, 0)
            );
        }
        if (activityId == 209) {
            return Activity(
                209,
                2,
                1,
                2,
                1,
                6,
                0,
                _pairs(2, 1, 0, 0, 0, 0, 0, 0),
                _pairs(2, 12, 0, 0, 0, 0, 0, 0),
                _pairs(0, 0, 0, 0, 0, 0, 0, 0),
                _pairs(50, 2, 0, 0, 0, 0, 0, 0),
                CombatRules(0, 0, 0, 0, 0)
            );
        }
        if (activityId == 210) {
            return Activity(
                210,
                2,
                1,
                2,
                2,
                9,
                0,
                _pairs(2, 6, 0, 0, 0, 0, 0, 0),
                _pairs(2, 25, 0, 0, 0, 0, 0, 0),
                _pairs(0, 0, 0, 0, 0, 0, 0, 0),
                _pairs(50, 2, 51, 1, 0, 0, 0, 0),
                CombatRules(0, 0, 0, 0, 0)
            );
        }
        if (activityId == 211) {
            return Activity(
                211,
                2,
                2,
                2,
                3,
                13,
                402,
                _pairs(2, 15, 9, 10, 0, 0, 0, 0),
                _pairs(2, 44, 9, 4, 0, 0, 0, 0),
                _pairs(0, 0, 0, 0, 0, 0, 0, 0),
                _pairs(51, 2, 52, 1, 0, 0, 0, 0),
                CombatRules(0, 0, 0, 0, 0)
            );
        }
        if (activityId == 212) {
            return Activity(
                212,
                2,
                2,
                2,
                4,
                19,
                402,
                _pairs(2, 25, 6, 18, 0, 0, 0, 0),
                _pairs(2, 74, 6, 5, 0, 0, 0, 0),
                _pairs(0, 0, 0, 0, 0, 0, 0, 0),
                _pairs(52, 2, 203, 1, 0, 0, 0, 0),
                CombatRules(0, 0, 0, 0, 0)
            );
        }
        if (activityId == 213) {
            return Activity(
                213,
                2,
                1,
                3,
                1,
                7,
                0,
                _pairs(3, 1, 0, 0, 0, 0, 0, 0),
                _pairs(3, 12, 0, 0, 0, 0, 0, 0),
                _pairs(0, 0, 0, 0, 0, 0, 0, 0),
                _pairs(90, 2, 91, 1, 0, 0, 0, 0),
                CombatRules(0, 0, 0, 0, 0)
            );
        }
        if (activityId == 214) {
            return Activity(
                214,
                2,
                1,
                3,
                2,
                10,
                0,
                _pairs(3, 8, 0, 0, 0, 0, 0, 0),
                _pairs(3, 28, 0, 0, 0, 0, 0, 0),
                _pairs(0, 0, 0, 0, 0, 0, 0, 0),
                _pairs(90, 2, 91, 2, 93, 1, 0, 0),
                CombatRules(0, 0, 0, 0, 0)
            );
        }
        if (activityId == 215) {
            return Activity(
                215,
                2,
                2,
                3,
                3,
                14,
                403,
                _pairs(3, 17, 5, 10, 0, 0, 0, 0),
                _pairs(3, 48, 5, 4, 0, 0, 0, 0),
                _pairs(0, 0, 0, 0, 0, 0, 0, 0),
                _pairs(92, 2, 93, 2, 0, 0, 0, 0),
                CombatRules(0, 0, 0, 0, 0)
            );
        }
        if (activityId == 301) {
            return Activity(
                301,
                3,
                1,
                4,
                1,
                7,
                0,
                _pairs(4, 1, 0, 0, 0, 0, 0, 0),
                _pairs(4, 14, 0, 0, 0, 0, 0, 0),
                _pairs(10, 2, 130, 1, 0, 0, 0, 0),
                _pairs(200, 1, 0, 0, 0, 0, 0, 0),
                CombatRules(0, 0, 0, 0, 0)
            );
        }
        if (activityId == 302) {
            return Activity(
                302,
                3,
                1,
                4,
                2,
                10,
                0,
                _pairs(4, 6, 0, 0, 0, 0, 0, 0),
                _pairs(4, 32, 0, 0, 0, 0, 0, 0),
                _pairs(200, 2, 131, 2, 0, 0, 0, 0),
                _pairs(404, 1, 406, 1, 0, 0, 0, 0),
                CombatRules(0, 0, 0, 0, 0)
            );
        }
        if (activityId == 303) {
            return Activity(
                303,
                3,
                2,
                4,
                3,
                15,
                0,
                _pairs(4, 15, 1, 10, 0, 0, 0, 0),
                _pairs(4, 56, 0, 0, 0, 0, 0, 0),
                _pairs(132, 2, 202, 1, 200, 2, 0, 0),
                _pairs(405, 1, 407, 1, 0, 0, 0, 0),
                CombatRules(0, 0, 0, 0, 0)
            );
        }
        if (activityId == 304) {
            return Activity(
                304,
                3,
                2,
                4,
                4,
                22,
                0,
                _pairs(4, 25, 6, 18, 0, 0, 0, 0),
                _pairs(4, 90, 0, 0, 0, 0, 0, 0),
                _pairs(203, 2, 133, 2, 0, 0, 0, 0),
                _pairs(409, 1, 0, 0, 0, 0, 0, 0),
                CombatRules(0, 0, 0, 0, 0)
            );
        }
        if (activityId == 305) {
            return Activity(
                305,
                3,
                1,
                5,
                1,
                7,
                0,
                _pairs(5, 1, 0, 0, 0, 0, 0, 0),
                _pairs(5, 14, 0, 0, 0, 0, 0, 0),
                _pairs(90, 1, 12, 1, 0, 0, 0, 0),
                _pairs(251, 1, 250, 1, 0, 0, 0, 0),
                CombatRules(0, 0, 0, 0, 0)
            );
        }
        if (activityId == 306) {
            return Activity(
                306,
                3,
                1,
                5,
                2,
                10,
                0,
                _pairs(5, 5, 3, 5, 0, 0, 0, 0),
                _pairs(5, 30, 0, 0, 0, 0, 0, 0),
                _pairs(90, 2, 93, 1, 0, 0, 0, 0),
                _pairs(252, 1, 250, 2, 0, 0, 0, 0),
                CombatRules(0, 0, 0, 0, 0)
            );
        }
        if (activityId == 307) {
            return Activity(
                307,
                3,
                2,
                5,
                3,
                15,
                0,
                _pairs(5, 14, 3, 10, 0, 0, 0, 0),
                _pairs(5, 52, 0, 0, 0, 0, 0, 0),
                _pairs(93, 2, 201, 1, 0, 0, 0, 0),
                _pairs(253, 1, 252, 1, 0, 0, 0, 0),
                CombatRules(0, 0, 0, 0, 0)
            );
        }
        if (activityId == 308) {
            return Activity(
                308,
                3,
                2,
                5,
                4,
                21,
                0,
                _pairs(5, 23, 6, 12, 0, 0, 0, 0),
                _pairs(5, 82, 0, 0, 0, 0, 0, 0),
                _pairs(92, 2, 203, 1, 0, 0, 0, 0),
                _pairs(253, 2, 0, 0, 0, 0, 0, 0),
                CombatRules(0, 0, 0, 0, 0)
            );
        }
        if (activityId == 309) {
            return Activity(
                309,
                3,
                1,
                6,
                1,
                7,
                0,
                _pairs(6, 1, 0, 0, 0, 0, 0, 0),
                _pairs(6, 14, 0, 0, 0, 0, 0, 0),
                _pairs(50, 2, 0, 0, 0, 0, 0, 0),
                _pairs(53, 1, 0, 0, 0, 0, 0, 0),
                CombatRules(0, 0, 0, 0, 0)
            );
        }
        if (activityId == 310) {
            return Activity(
                310,
                3,
                1,
                6,
                2,
                11,
                0,
                _pairs(6, 8, 2, 5, 0, 0, 0, 0),
                _pairs(6, 34, 0, 0, 0, 0, 0, 0),
                _pairs(51, 2, 14, 1, 0, 0, 0, 0),
                _pairs(201, 1, 53, 1, 0, 0, 0, 0),
                CombatRules(0, 0, 0, 0, 0)
            );
        }
        if (activityId == 311) {
            return Activity(
                311,
                3,
                2,
                6,
                3,
                16,
                0,
                _pairs(6, 17, 2, 12, 0, 0, 0, 0),
                _pairs(6, 58, 0, 0, 0, 0, 0, 0),
                _pairs(52, 2, 201, 1, 0, 0, 0, 0),
                _pairs(202, 1, 0, 0, 0, 0, 0, 0),
                CombatRules(0, 0, 0, 0, 0)
            );
        }
        if (activityId == 312) {
            return Activity(
                312,
                3,
                2,
                6,
                4,
                23,
                0,
                _pairs(6, 28, 9, 18, 0, 0, 0, 0),
                _pairs(6, 96, 9, 8, 0, 0, 0, 0),
                _pairs(203, 2, 202, 1, 0, 0, 0, 0),
                _pairs(702, 1, 0, 0, 0, 0, 0, 0),
                CombatRules(0, 0, 0, 0, 0)
            );
        }
        if (activityId == 313) {
            return Activity(
                313,
                3,
                1,
                7,
                1,
                7,
                0,
                _pairs(7, 1, 0, 0, 0, 0, 0, 0),
                _pairs(7, 13, 0, 0, 0, 0, 0, 0),
                _pairs(130, 1, 10, 1, 0, 0, 0, 0),
                _pairs(300, 6, 0, 0, 0, 0, 0, 0),
                CombatRules(0, 0, 0, 0, 0)
            );
        }
        if (activityId == 314) {
            return Activity(
                314,
                3,
                1,
                7,
                2,
                10,
                0,
                _pairs(7, 8, 1, 5, 0, 0, 0, 0),
                _pairs(7, 34, 0, 0, 0, 0, 0, 0),
                _pairs(131, 2, 200, 1, 0, 0, 0, 0),
                _pairs(301, 3, 411, 1, 0, 0, 0, 0),
                CombatRules(0, 0, 0, 0, 0)
            );
        }
        if (activityId == 315) {
            return Activity(
                315,
                3,
                2,
                7,
                3,
                16,
                0,
                _pairs(7, 17, 4, 12, 0, 0, 0, 0),
                _pairs(7, 62, 0, 0, 0, 0, 0, 0),
                _pairs(132, 2, 201, 1, 0, 0, 0, 0),
                _pairs(302, 3, 202, 1, 0, 0, 0, 0),
                CombatRules(0, 0, 0, 0, 0)
            );
        }
        if (activityId == 101) {
            return Activity(
                101,
                1,
                1,
                8,
                1,
                7,
                0,
                _pairs(8, 1, 0, 0, 0, 0, 0, 0),
                _pairs(8, 16, 9, 5, 0, 0, 0, 0),
                _pairs(0, 0, 0, 0, 0, 0, 0, 0),
                _pairs(130, 1, 1, 8, 0, 0, 0, 0),
                CombatRules(16, 7, 12, 90, 0)
            );
        }
        if (activityId == 102) {
            return Activity(
                102,
                1,
                1,
                8,
                1,
                9,
                0,
                _pairs(8, 3, 9, 2, 0, 0, 0, 0),
                _pairs(8, 24, 9, 10, 0, 0, 0, 0),
                _pairs(0, 0, 0, 0, 0, 0, 0, 0),
                _pairs(130, 1, 131, 1, 1, 14, 0, 0),
                CombatRules(26, 12, 18, 82, 0)
            );
        }
        if (activityId == 103) {
            return Activity(
                103,
                1,
                1,
                8,
                2,
                10,
                0,
                _pairs(8, 6, 9, 5, 0, 0, 0, 0),
                _pairs(8, 32, 9, 14, 0, 0, 0, 0),
                _pairs(0, 0, 0, 0, 0, 0, 0, 0),
                _pairs(91, 1, 132, 1, 1, 20, 0, 0),
                CombatRules(34, 16, 24, 78, 0)
            );
        }
        if (activityId == 104) {
            return Activity(
                104,
                1,
                1,
                8,
                2,
                11,
                0,
                _pairs(8, 8, 9, 6, 0, 0, 0, 0),
                _pairs(8, 38, 9, 16, 0, 0, 0, 0),
                _pairs(0, 0, 0, 0, 0, 0, 0, 0),
                _pairs(130, 2, 133, 1, 1, 28, 0, 0),
                CombatRules(42, 20, 28, 74, 0)
            );
        }
        if (activityId == 105) {
            return Activity(
                105,
                1,
                2,
                8,
                3,
                13,
                0,
                _pairs(8, 15, 9, 12, 0, 0, 0, 0),
                _pairs(8, 55, 9, 24, 0, 0, 0, 0),
                _pairs(0, 0, 0, 0, 0, 0, 0, 0),
                _pairs(132, 2, 1, 45, 0, 0, 0, 0),
                CombatRules(64, 30, 42, 70, 0)
            );
        }
        if (activityId == 106) {
            return Activity(
                106,
                1,
                2,
                8,
                3,
                15,
                0,
                _pairs(8, 18, 9, 15, 0, 0, 0, 0),
                _pairs(8, 66, 9, 32, 0, 0, 0, 0),
                _pairs(0, 0, 0, 0, 0, 0, 0, 0),
                _pairs(202, 1, 1, 62, 0, 0, 0, 0),
                CombatRules(82, 36, 54, 68, 0)
            );
        }
        if (activityId == 107) {
            return Activity(
                107,
                1,
                2,
                8,
                4,
                16,
                0,
                _pairs(8, 23, 9, 20, 0, 0, 0, 0),
                _pairs(8, 82, 9, 40, 0, 0, 0, 0),
                _pairs(0, 0, 0, 0, 0, 0, 0, 0),
                _pairs(201, 2, 1, 78, 0, 0, 0, 0),
                CombatRules(96, 44, 66, 64, 0)
            );
        }
        if (activityId == 108) {
            return Activity(
                108,
                1,
                2,
                8,
                4,
                18,
                0,
                _pairs(8, 25, 9, 23, 0, 0, 0, 0),
                _pairs(8, 92, 9, 46, 0, 0, 0, 0),
                _pairs(0, 0, 0, 0, 0, 0, 0, 0),
                _pairs(203, 1, 1, 90, 0, 0, 0, 0),
                CombatRules(112, 50, 72, 60, 0)
            );
        }
        if (activityId == 109) {
            return Activity(
                109,
                1,
                2,
                8,
                5,
                21,
                0,
                _pairs(8, 35, 9, 30, 0, 0, 0, 0),
                _pairs(8, 125, 9, 62, 0, 0, 0, 0),
                _pairs(0, 0, 0, 0, 0, 0, 0, 0),
                _pairs(700, 1, 1, 140, 0, 0, 0, 0),
                CombatRules(160, 68, 92, 55, 301)
            );
        }
        if (activityId == 110) {
            return Activity(
                110,
                1,
                2,
                8,
                5,
                26,
                0,
                _pairs(8, 38, 9, 35, 0, 0, 0, 0),
                _pairs(8, 160, 9, 80, 0, 0, 0, 0),
                _pairs(0, 0, 0, 0, 0, 0, 0, 0),
                _pairs(701, 1, 702, 1, 1, 220, 0, 0),
                CombatRules(220, 84, 110, 50, 302)
            );
        }
        revert BadActivity();
    }

    function _pairs(
        uint256 id0,
        uint256 amount0,
        uint256 id1,
        uint256 amount1,
        uint256 id2,
        uint256 amount2,
        uint256 id3,
        uint256 amount3
    ) internal pure returns (uint256) {
        return
            _pair(id0, amount0) |
            (_pair(id1, amount1) << 64) |
            (_pair(id2, amount2) << 128) |
            (_pair(id3, amount3) << 192);
    }

    function _pair(uint256 id, uint256 amount) internal pure returns (uint256) {
        return uint16(id) | (uint256(uint32(amount)) << 16);
    }
}
