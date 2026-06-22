// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IdleIsles} from "../IdleIsles.sol";

contract IdleIslesHarness is IdleIsles {
    constructor(string memory metadataUri, address contentAddress)
        IdleIsles(metadataUri, contentAddress)
    {}

    function mintForTest(address player, uint256 itemId, uint256 amount) external {
        _mint(player, itemId, amount, "");
    }

    function setSkillXpForTest(address player, uint8 skill, uint64 xp) external {
        skillXp[player][skill] = xp;
    }
}
