// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IdleGalactica} from "../IdleGalactica.sol";

contract IdleGalacticaHarness is IdleGalactica {
    constructor(string memory metadataUri, address contentAddress)
        IdleGalactica(metadataUri, contentAddress)
    {}

    function mintForTest(address player, uint256 itemId, uint256 amount) external {
        _mint(player, itemId, amount, "");
    }

    function setSkillXpForTest(address player, uint8 skill, uint64 xp) external {
        skillXp[player][skill] = xp;
    }

    function setCurrentHullForTest(address player, uint16 hull) external {
        currentHull[player] = hull;
    }
}
