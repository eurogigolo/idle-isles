// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC1155} from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import {ERC1155Holder} from "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IIdleIslesProfile {
    function hasProfile(address player) external view returns (bool);
}

contract HoardHall is ERC1155Holder, ReentrancyGuard {
    error BadGame();
    error NoProfile();
    error AmountZero();
    error PriceZero();
    error CrownsNotListed();
    error NotEnoughListed();
    error NotSeller();
    error OrderEmpty();

    uint256 internal constant CROWNS = 1;

    struct Order {
        address seller;
        uint256 itemId;
        uint128 priceEach;
        uint64 amountRemaining;
    }

    IERC1155 internal immutable ITEMS;
    IIdleIslesProfile internal immutable GAME;

    mapping(uint256 => Order) public orders;
    uint256 public nextOrderId = 1;

    event OrderCreated(
        uint256 indexed orderId,
        address indexed seller,
        uint256 indexed itemId,
        uint256 amount,
        uint256 priceEach
    );
    event OrderFilled(uint256 indexed orderId, address indexed buyer, uint256 amount);
    event OrderCancelled(uint256 indexed orderId);

    constructor(address gameAddress) {
        if (gameAddress == address(0)) revert BadGame();
        ITEMS = IERC1155(gameAddress);
        GAME = IIdleIslesProfile(gameAddress);
    }

    function createOrder(uint256 itemId, uint64 amount, uint128 priceEach) external nonReentrant {
        if (!GAME.hasProfile(msg.sender)) revert NoProfile();
        if (amount == 0) revert AmountZero();
        if (priceEach == 0) revert PriceZero();
        if (itemId == CROWNS) revert CrownsNotListed();

        ITEMS.safeTransferFrom(msg.sender, address(this), itemId, amount, "");

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
        if (!GAME.hasProfile(msg.sender)) revert NoProfile();
        if (amount == 0) revert AmountZero();

        Order storage order = orders[orderId];
        if (order.amountRemaining < amount) revert NotEnoughListed();

        order.amountRemaining -= amount;

        ITEMS.safeTransferFrom(
            msg.sender,
            order.seller,
            CROWNS,
            uint256(order.priceEach) * amount,
            ""
        );
        ITEMS.safeTransferFrom(address(this), msg.sender, order.itemId, amount, "");

        emit OrderFilled(orderId, msg.sender, amount);
    }

    function cancelOrder(uint256 orderId) external nonReentrant {
        Order storage order = orders[orderId];
        if (order.seller != msg.sender) revert NotSeller();
        if (order.amountRemaining == 0) revert OrderEmpty();

        uint64 remaining = order.amountRemaining;
        order.amountRemaining = 0;
        ITEMS.safeTransferFrom(address(this), msg.sender, order.itemId, remaining, "");

        emit OrderCancelled(orderId);
    }
}
