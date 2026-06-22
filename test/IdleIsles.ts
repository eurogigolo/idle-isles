import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { network } from "hardhat";

describe("IdleIsles", async function () {
  const { networkHelpers, viem } = await network.create();
  const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
  const CROWNS = 1n;
  const ASH_LOG = 2n;
  const PINE_LOG = 3n;
  const RAW_MINNOW = 8n;
  const COOKED_MINNOW = 9n;
  const COPPER_ORE = 30n;
  const TIN_ORE = 31n;
  const COPPER_BAR = 40n;
  const WOOD_CLUB = 50n;
  const BARK_SHIELD = 51n;
  const BARK_VEST = 52n;
  const COPPER_DAGGER = 53n;
  const BARK_LEGGINGS = 65n;
  const HIDE = 70n;
  const FIELD_CHARM = 71n;
  const RUNE_DUST = 72n;
  const FEATHER = 77n;
  const LEATHER_COWL = 80n;
  const BRONZE_ARROWTIPS = 95n;
  const ASH_BOW = 120n;
  const BRONZE_ARROW = 130n;
  const TUNGSTEN_ARROW = 133n;
  const TRAINING_YARD = 101;
  const MOSS_CAMP = 103;
  const CAVE_BAT = 104;
  const GOBLIN_FORAGER = 108;
  const GIANT_SPIDER = 109;
  const DIRE_WOLF = 110;
  const VENOMOUS_DRAKE = 111;
  const FEATHER_HAWK = 112;
  const ASH_GROVE = 201;
  const COPPER_RIDGE = 202;
  const TIN_HOLLOW = 203;
  const RIVER_BEND = 204;
  const PINE_STAND = 205;
  const TUNGSTEN_LODE = 217;
  const WOOD_ARMORY = 301;
  const COPPER_SMELTER = 302;
  const COPPER_DAGGER_FORGE = 303;
  const COOK_MINNOW = 304;
  const BARK_LEGGINGS_CRAFT = 305;
  const CRAFT_LEATHER_COWL = 320;
  const BRONZE_ARROWTIPS_FORGE = 340;
  const ASH_BOW_CRAFT = 344;
  const BRONZE_ARROWS_CRAFT = 348;
  const SLOT_WEAPON = 0;
  const SLOT_CHEST = 3;
  const SLOT_LEGS = 4;
  const SLOT_TRINKET = 5;
  const AREA_STARTER = 1;
  const AREA_OUTER_ISLES = 2;

  async function deployIdleIsles() {
    const content = await viem.deployContract("IdleIslesContent");
    return viem.deployContract("IdleIsles", ["ipfs://idle-isles/{id}.json", content.address]);
  }

  async function deployIdleIslesHarness() {
    const content = await viem.deployContract("IdleIslesContent");
    return viem.deployContract("IdleIslesHarness", ["ipfs://idle-isles/{id}.json", content.address]);
  }

  async function deployIdleIslesWithHoardHall() {
    const game = await deployIdleIsles();
    const hoardHall = await viem.deployContract("HoardHall", [game.address]);
    return { game, hoardHall };
  }

  async function craftStarterGear(game: Awaited<ReturnType<typeof deployIdleIsles>>) {
    await game.write.startGather([ASH_GROVE]);
    await networkHelpers.time.increase(10);
    await game.write.claim();
    await game.write.startArtisan([WOOD_ARMORY]);
    await networkHelpers.time.increase(6);
    await game.write.claim();
  }

  async function gatherCopperDaggerMaterials(game: Awaited<ReturnType<typeof deployIdleIsles>>) {
    await game.write.startGather([ASH_GROVE]);
    await networkHelpers.time.increase(945);
    await game.write.claim();
    await game.write.startArtisan([WOOD_ARMORY]);
    await networkHelpers.time.increase(744);
    await game.write.claim();
    await game.write.startGather([COPPER_RIDGE]);
    await networkHelpers.time.increase(14);
    await game.write.claim();
    await game.write.startGather([TIN_HOLLOW]);
    await networkHelpers.time.increase(14);
    await game.write.claim();
  }

  async function cookMinnows(game: Awaited<ReturnType<typeof deployIdleIsles>>) {
    await game.write.startGather([RIVER_BEND]);
    await networkHelpers.time.increase(300);
    await game.write.claim();
    await game.write.startArtisan([COOK_MINNOW]);
    await networkHelpers.time.increase(400);
    await game.write.claim();
  }

  function decodeRecipePair(packedItems: bigint, index: number) {
    const pair = (packedItems >> BigInt(index * 32)) & 0xffffffffn;
    return {
      itemId: pair & 0xffffn,
      amount: (pair >> 16n) & 0xffffn,
    };
  }

  function decodeRecipeConfig(config: bigint) {
    return {
      cycleSeconds: Number(config & 0xffffn),
      skill: Number((config >> 16n) & 0xffn),
      reqLevel: Number((config >> 24n) & 0xffn),
      xp: Number((config >> 32n) & 0xffffffffn),
      cookedItem: (config >> 64n) & 0xffffn,
    };
  }

  function decodeGatherConfig(config: bigint) {
    return {
      cycleSeconds: Number(config & 0xffffn),
      skill: Number((config >> 16n) & 0xffn),
      reqLevel: Number((config >> 24n) & 0xffn),
      xp: Number((config >> 32n) & 0xffffffffn),
      rewardItem: (config >> 64n) & 0xffffn,
      rewardAmount: (config >> 80n) & 0xffffn,
    };
  }

  it("uses the shared alpha level curve thresholds", async function () {
    const game = await deployIdleIsles();

    assert.equal(await game.read.xpRequiredForLevel([1]), 0n);
    assert.equal(await game.read.xpRequiredForLevel([2]), 121n);
    assert.equal(await game.read.xpRequiredForLevel([5]), 4336n);
    assert.equal(await game.read.xpRequiredForLevel([10]), 45441n);
    assert.equal(await game.read.xpRequiredForLevel([25]), 997056n);
    assert.equal(await game.read.xpRequiredForLevel([35]), 3191716n);
    assert.equal(await game.read.xpRequiredForLevel([55]), 15807636n);
    assert.equal(await game.read.xpRequiredForLevel([70]), 37807101n);
    assert.equal(await game.read.xpRequiredForLevel([99]), 135310756n);
  });

  it("maps legs and trinkets to the expanded equipment slots", async function () {
    const content = await viem.deployContract("IdleIslesContent");

    assert.deepEqual(await content.read.itemSlot([BARK_LEGGINGS]), [true, SLOT_LEGS]);
    assert.deepEqual(await content.read.itemSlot([FIELD_CHARM]), [true, SLOT_TRINKET]);

    const stats = await content.read.itemStatsOf([BARK_LEGGINGS]);
    assert.equal(stats.defence, 1);
    assert.equal(stats.hitpoints, 1);
  });

  it("exposes packed recipe data for expanded artisan content", async function () {
    const content = await viem.deployContract("IdleIslesContent");

    const [config, costs, rewards] = await content.read.getArtisanActivity([CRAFT_LEATHER_COWL]);
    const decodedConfig = decodeRecipeConfig(config);

    assert.deepEqual(decodedConfig, {
      cycleSeconds: 5,
      skill: 8,
      reqLevel: 1,
      xp: 15,
      cookedItem: 0n,
    });
    assert.deepEqual(decodeRecipePair(costs, 0), { itemId: HIDE, amount: 2n });
    assert.deepEqual(decodeRecipePair(costs, 1), { itemId: ASH_LOG, amount: 1n });
    assert.deepEqual(decodeRecipePair(rewards, 0), { itemId: LEATHER_COWL, amount: 1n });
  });

  it("exposes packed gather data for expanded source content", async function () {
    const content = await viem.deployContract("IdleIslesContent");

    assert.deepEqual(decodeGatherConfig(await content.read.getGatherActivity([PINE_STAND])), {
      cycleSeconds: 7,
      skill: 3,
      reqLevel: 4,
      xp: 32,
      rewardItem: PINE_LOG,
      rewardAmount: 2n,
    });
    assert.deepEqual(decodeGatherConfig(await content.read.getGatherActivity([TUNGSTEN_LODE])), {
      cycleSeconds: 18,
      skill: 5,
      reqLevel: 55,
      xp: 140,
      rewardItem: 37n,
      rewardAmount: 1n,
    });
  });

  it("exposes ranged item stats, recipes, and feather drops", async function () {
    const content = await viem.deployContract("IdleIslesContent");

    assert.deepEqual(await content.read.itemSlot([ASH_BOW]), [true, SLOT_WEAPON]);

    const weaponStats = await content.read.weaponStatsOf([ASH_BOW]);
    assert.equal(weaponStats.style, 2);
    assert.equal(weaponStats.damage, 2);
    assert.equal(weaponStats.accuracy, 10);

    const [tipsConfig, tipsCosts, tipsRewards] =
      await content.read.getArtisanActivity([BRONZE_ARROWTIPS_FORGE]);
    assert.deepEqual(decodeRecipeConfig(tipsConfig), {
      cycleSeconds: 6,
      skill: 6,
      reqLevel: 4,
      xp: 18,
      cookedItem: 0n,
    });
    assert.deepEqual(decodeRecipePair(tipsCosts, 0), { itemId: COPPER_BAR, amount: 1n });
    assert.deepEqual(decodeRecipePair(tipsRewards, 0), {
      itemId: BRONZE_ARROWTIPS,
      amount: 15n,
    });

    const [bowConfig, bowCosts, bowRewards] =
      await content.read.getArtisanActivity([ASH_BOW_CRAFT]);
    assert.deepEqual(decodeRecipeConfig(bowConfig), {
      cycleSeconds: 6,
      skill: 8,
      reqLevel: 1,
      xp: 18,
      cookedItem: 0n,
    });
    assert.deepEqual(decodeRecipePair(bowCosts, 0), { itemId: ASH_LOG, amount: 3n });
    assert.deepEqual(decodeRecipePair(bowRewards, 0), { itemId: ASH_BOW, amount: 1n });

    const [, arrowCosts, arrowRewards] =
      await content.read.getArtisanActivity([BRONZE_ARROWS_CRAFT]);
    assert.deepEqual(decodeRecipePair(arrowCosts, 0), { itemId: ASH_LOG, amount: 1n });
    assert.deepEqual(decodeRecipePair(arrowCosts, 1), {
      itemId: BRONZE_ARROWTIPS,
      amount: 15n,
    });
    assert.deepEqual(decodeRecipePair(arrowCosts, 2), { itemId: FEATHER, amount: 15n });
    assert.deepEqual(decodeRecipePair(arrowRewards, 0), { itemId: BRONZE_ARROW, amount: 15n });

    const featherDrop = await content.read.getDrop([CAVE_BAT, 2]);
    assert.equal(featherDrop.itemId, FEATHER);
    assert.equal(featherDrop.amount, 2n);
    assert.equal(featherDrop.chanceBps, 1200);

    const featherHawk = await content.read.getCombatActivity([FEATHER_HAWK]);
    assert.equal(featherHawk.cycleSeconds, 10);
    assert.equal(featherHawk.reqAttack, 4);
    assert.equal(featherHawk.reqDefence, 1);
    assert.equal(featherHawk.reqHitpoints, 1);
    assert.equal(featherHawk.requiredEquipment, 0n);
    assert.equal(featherHawk.xpAttack, 44);
    assert.equal(featherHawk.damageChanceBps, 4200);
    assert.equal(featherHawk.minDamage, 2);
    assert.equal(featherHawk.maxDamage, 5);

    const hawkDrop = await content.read.getDrop([FEATHER_HAWK, 0]);
    assert.equal(hawkDrop.itemId, FEATHER);
    assert.equal(hawkDrop.amount, 2n);
    assert.equal(hawkDrop.chanceBps, 2500);

    const mossCamp = await content.read.getCombatActivity([MOSS_CAMP]);
    assert.equal(mossCamp.damageChanceBps, 5600);
    assert.equal(mossCamp.minDamage, 2);
    assert.equal(mossCamp.maxDamage, 5);

    const goblinForager = await content.read.getCombatActivity([GOBLIN_FORAGER]);
    assert.equal(goblinForager.damageChanceBps, 5000);
    assert.equal(goblinForager.minDamage, 2);
    assert.equal(goblinForager.maxDamage, 5);

    const giantSpider = await content.read.getCombatActivity([GIANT_SPIDER]);
    assert.equal(giantSpider.damageChanceBps, 6800);
    assert.equal(giantSpider.minDamage, 3);
    assert.equal(giantSpider.maxDamage, 8);

    const direWolf = await content.read.getCombatActivity([DIRE_WOLF]);
    assert.equal(direWolf.minDamage, 8);
    assert.equal(direWolf.maxDamage, 19);

    const venomousDrake = await content.read.getCombatActivity([VENOMOUS_DRAKE]);
    assert.equal(venomousDrake.minDamage, 12);
    assert.equal(venomousDrake.maxDamage, 30);
  });

  it("creates a profile with starter HP and Crowns", async function () {
    const [player] = await viem.getWalletClients();
    const game = await deployIdleIsles();

    await game.write.createProfile();

    assert.equal(await game.read.hasProfile([player.account.address]), true);
    assert.equal(await game.read.currentHitpoints([player.account.address]), 10);
    assert.equal(await game.read.balanceOf([player.account.address, 1n]), 80n);
    assert.equal(await game.read.maxHitpoints([player.account.address]), 10n);
    assert.equal(await game.read.currentAreaId([player.account.address]), AREA_STARTER);
    assert.equal(await game.read.isAreaUnlocked([player.account.address, AREA_STARTER]), true);
    assert.equal(await game.read.isAreaUnlocked([player.account.address, AREA_OUTER_ISLES]), false);
  });

  it("requires ship passage before Outer Isles activities can start", async function () {
    const [player] = await viem.getWalletClients();
    const game = await deployIdleIsles();

    await game.write.createProfile();

    await assert.rejects(() => game.write.travelToArea([AREA_OUTER_ISLES]));
    await assert.rejects(() => game.write.startCombat([CAVE_BAT]));

    assert.equal(await game.read.currentAreaId([player.account.address]), AREA_STARTER);
    assert.equal(await game.read.isAreaUnlocked([player.account.address, AREA_OUTER_ISLES]), false);
    assert.equal(await game.read.balanceOf([player.account.address, CROWNS]), 80n);
  });

  it("allows Feather Hawk in the starter area after its combat requirements are met", async function () {
    const [player] = await viem.getWalletClients();
    const game = await deployIdleIslesHarness();

    await game.write.createProfile();
    await game.write.setSkillXpForTest([player.account.address, 0, await game.read.xpRequiredForLevel([4])]);

    await game.write.startCombat([FEATHER_HAWK]);

    const activeTask = await game.read.activeTask([player.account.address]);

    assert.equal(await game.read.currentAreaId([player.account.address]), AREA_STARTER);
    assert.equal(activeTask[0], FEATHER_HAWK);
  });

  it("settles completed combat cycles and grants training rewards", async function () {
    const [player] = await viem.getWalletClients();
    const game = await deployIdleIsles();

    await game.write.createProfile();
    await game.write.startCombat([101]);
    await networkHelpers.time.increase(7);
    await game.write.claim();

    assert.equal(await game.read.balanceOf([player.account.address, 70n]), 1n);
    assert.equal(await game.read.balanceOf([player.account.address, 1n]), 82n);
    assert.equal(await game.read.skillXp([player.account.address, 0]), 30n);
    assert.equal(await game.read.skillXp([player.account.address, 1]), 16n);
    assert.equal(await game.read.skillXp([player.account.address, 2]), 16n);
  });

  it("stops auto-eat safety at the configured HP threshold without death loss", async function () {
    const [player] = await viem.getWalletClients();
    const game = await deployIdleIsles();
    const latest = await networkHelpers.time.latest();

    await game.write.createProfile();
    await game.write.configureAutoSettle([
      ZERO_ADDRESS,
      BigInt(latest + 3600),
      10,
      10,
      true,
      0,
      COOKED_MINNOW,
    ]);
    await game.write.startCombat([TRAINING_YARD]);
    await networkHelpers.time.increase(7);
    await game.write.claim();

    const activeTask = await game.read.activeTask([player.account.address]);

    assert.equal(activeTask[0], 0);
    assert.equal(await game.read.currentHitpoints([player.account.address]), 10);
    assert.equal(await game.read.balanceOf([player.account.address, CROWNS]), 80n);
    assert.equal(await game.read.balanceOf([player.account.address, HIDE]), 0n);
  });

  it("ignores the configured HP threshold when auto-eat is disabled", async function () {
    const [player] = await viem.getWalletClients();
    const game = await deployIdleIsles();
    const latest = await networkHelpers.time.latest();

    await game.write.createProfile();
    await game.write.configureAutoSettle([
      ZERO_ADDRESS,
      BigInt(latest + 3600),
      10,
      10,
      false,
      0,
      0n,
    ]);
    await game.write.startCombat([TRAINING_YARD]);
    await networkHelpers.time.increase(7);
    await game.write.claim();

    const activeTask = await game.read.activeTask([player.account.address]);

    assert.equal(activeTask[0], TRAINING_YARD);
    assert.equal(await game.read.balanceOf([player.account.address, CROWNS]), 82n);
    assert.equal(await game.read.balanceOf([player.account.address, HIDE]), 1n);
  });

  it("escrows listed items and transfers them to buyers", async function () {
    const [seller, buyer] = await viem.getWalletClients();
    const { game, hoardHall } = await deployIdleIslesWithHoardHall();

    await game.write.createProfile();
    await game.write.createProfile({ account: buyer.account });
    await game.write.startCombat([TRAINING_YARD]);
    await networkHelpers.time.increase(7);
    await game.write.claim();

    await game.write.setApprovalForAll([hoardHall.address, true]);
    await hoardHall.write.createOrder([HIDE, 1n, 10n]);

    const order = await hoardHall.read.orders([1n]);

    assert.equal(order[0].toLowerCase(), seller.account.address.toLowerCase());
    assert.equal(order[1], HIDE);
    assert.equal(order[2], 10n);
    assert.equal(order[3], 1n);
    assert.equal(await game.read.balanceOf([seller.account.address, HIDE]), 0n);
    assert.equal(await game.read.balanceOf([hoardHall.address, HIDE]), 1n);

    await game.write.setApprovalForAll([hoardHall.address, true], { account: buyer.account });
    await hoardHall.write.buy([1n, 1n], { account: buyer.account });

    const filledOrder = await hoardHall.read.orders([1n]);

    assert.equal(filledOrder[3], 0n);
    assert.equal(await game.read.balanceOf([buyer.account.address, HIDE]), 1n);
    assert.equal(await game.read.balanceOf([buyer.account.address, CROWNS]), 70n);
    assert.equal(await game.read.balanceOf([seller.account.address, CROWNS]), 92n);
    assert.equal(await game.read.balanceOf([hoardHall.address, HIDE]), 0n);
  });

  it("returns escrowed items when a seller cancels an order", async function () {
    const [seller] = await viem.getWalletClients();
    const { game, hoardHall } = await deployIdleIslesWithHoardHall();

    await game.write.createProfile();
    await game.write.startCombat([TRAINING_YARD]);
    await networkHelpers.time.increase(7);
    await game.write.claim();
    await game.write.setApprovalForAll([hoardHall.address, true]);
    await hoardHall.write.createOrder([HIDE, 1n, 10n]);

    assert.equal(await game.read.balanceOf([seller.account.address, HIDE]), 0n);
    assert.equal(await game.read.balanceOf([hoardHall.address, HIDE]), 1n);

    await hoardHall.write.cancelOrder([1n]);

    const cancelledOrder = await hoardHall.read.orders([1n]);

    assert.equal(cancelledOrder[3], 0n);
    assert.equal(await game.read.balanceOf([seller.account.address, HIDE]), 1n);
    assert.equal(await game.read.balanceOf([hoardHall.address, HIDE]), 0n);
  });

  it("gathers Ash Logs and crafts starter gear through gameplay", async function () {
    const [player] = await viem.getWalletClients();
    const game = await deployIdleIsles();

    await game.write.createProfile();
    await game.write.startGather([ASH_GROVE]);
    await networkHelpers.time.increase(10);
    await game.write.claim();

    assert.equal(await game.read.balanceOf([player.account.address, ASH_LOG]), 4n);
    assert.equal(await game.read.skillXp([player.account.address, 3]), 72n);

    await game.write.startArtisan([WOOD_ARMORY]);
    await networkHelpers.time.increase(6);
    await game.write.claim();

    assert.equal(await game.read.balanceOf([player.account.address, ASH_LOG]), 1n);
    assert.equal(await game.read.balanceOf([player.account.address, WOOD_CLUB]), 1n);
    assert.equal(await game.read.balanceOf([player.account.address, BARK_SHIELD]), 1n);
    assert.equal(await game.read.balanceOf([player.account.address, BARK_VEST]), 1n);
    assert.equal(await game.read.skillXp([player.account.address, 6]), 32n);
  });

  it("gathers expanded source routes through content-driven settlement", async function () {
    const [player] = await viem.getWalletClients();
    const game = await deployIdleIsles();

    await game.write.createProfile();
    await game.write.startGather([ASH_GROVE]);
    await networkHelpers.time.increase(275);
    await game.write.claim();

    assert.equal(await game.read.levelOf([player.account.address, 3]), 4);

    await game.write.startGather([PINE_STAND]);
    await networkHelpers.time.increase(14);
    await game.write.claim();

    assert.equal(await game.read.balanceOf([player.account.address, PINE_LOG]), 4n);
    assert.equal(await game.read.skillXp([player.account.address, 3]), 2108n);
  });

  it("crafts Bark Leggings through the expanded Smithing recipe table", async function () {
    const [player] = await viem.getWalletClients();
    const game = await deployIdleIsles();

    await game.write.createProfile();
    await game.write.startGather([ASH_GROVE]);
    await networkHelpers.time.increase(35);
    await game.write.claim();
    await game.write.startArtisan([WOOD_ARMORY]);
    await networkHelpers.time.increase(24);
    await game.write.claim();
    await game.write.startCombat([TRAINING_YARD]);
    await networkHelpers.time.increase(7);
    await game.write.claim();

    assert.equal(await game.read.levelOf([player.account.address, 6]), 2);

    await game.write.startArtisan([BARK_LEGGINGS_CRAFT]);
    await networkHelpers.time.increase(7);
    await game.write.claim();

    assert.equal(await game.read.balanceOf([player.account.address, BARK_LEGGINGS]), 1n);
    assert.equal(await game.read.balanceOf([player.account.address, HIDE]), 0n);
    assert.equal(await game.read.skillXp([player.account.address, 6]), 168n);
  });

  it("crafts leather gear through the expanded Crafting recipe table", async function () {
    const [player] = await viem.getWalletClients();
    const game = await deployIdleIsles();

    await game.write.createProfile();
    await game.write.startGather([ASH_GROVE]);
    await networkHelpers.time.increase(5);
    await game.write.claim();
    await game.write.startCombat([TRAINING_YARD]);
    await networkHelpers.time.increase(14);
    await game.write.claim();

    await game.write.startArtisan([CRAFT_LEATHER_COWL]);
    await networkHelpers.time.increase(5);
    await game.write.claim();

    assert.equal(await game.read.balanceOf([player.account.address, LEATHER_COWL]), 1n);
    assert.equal(await game.read.balanceOf([player.account.address, HIDE]), 0n);
    assert.equal(await game.read.balanceOf([player.account.address, ASH_LOG]), 1n);
    assert.equal(await game.read.skillXp([player.account.address, 8]), 30n);
  });

  it("auto-detects bows as ranged weapons and stops combat without arrows", async function () {
    const [player] = await viem.getWalletClients();
    const game = await deployIdleIsles();

    await game.write.createProfile();
    await game.write.startGather([ASH_GROVE]);
    await networkHelpers.time.increase(10);
    await game.write.claim();
    await game.write.startArtisan([ASH_BOW_CRAFT]);
    await networkHelpers.time.increase(6);
    await game.write.claim();
    await game.write.equip([ASH_BOW]);

    await game.write.startCombat([TRAINING_YARD]);
    await networkHelpers.time.increase(7);
    await game.write.claim();

    const activeTask = await game.read.activeTask([player.account.address]);

    assert.equal(activeTask[0], 0);
    assert.equal(await game.read.balanceOf([player.account.address, ASH_BOW]), 0n);
    assert.equal(await game.read.skillXp([player.account.address, 0]), 0n);
    assert.equal(await game.read.skillXp([player.account.address, 9]), 0n);
    assert.equal(await game.read.balanceOf([player.account.address, HIDE]), 0n);
  });

  it("uses an explicit Attack training preference instead of ranged weapon auto-detection", async function () {
    const [player] = await viem.getWalletClients();
    const game = await deployIdleIslesHarness();

    await game.write.createProfile();
    await game.write.mintForTest([player.account.address, ASH_BOW, 1n]);
    await game.write.equip([ASH_BOW]);
    await game.write.setCombatStylePreference([1]);
    await game.write.startCombat([TRAINING_YARD]);
    await networkHelpers.time.increase(7);
    await game.write.claim();

    assert.equal(await game.read.combatStylePreference([player.account.address]), 1);
    assert.equal(await game.read.skillXp([player.account.address, 0]), 30n);
    assert.equal(await game.read.skillXp([player.account.address, 9]), 0n);
    assert.equal(await game.read.balanceOf([player.account.address, HIDE]), 1n);
  });

  it("burns exactly one highest-tier arrow for each completed Ranged combat cycle", async function () {
    const [player] = await viem.getWalletClients();
    const game = await deployIdleIslesHarness();

    await game.write.createProfile();
    await game.write.mintForTest([player.account.address, BRONZE_ARROW, 1n]);
    await game.write.mintForTest([player.account.address, TUNGSTEN_ARROW, 1n]);
    await game.write.setCombatStylePreference([2]);
    await game.write.startCombat([TRAINING_YARD]);

    await networkHelpers.time.increase(7);
    await game.write.claim();

    assert.equal(await game.read.balanceOf([player.account.address, TUNGSTEN_ARROW]), 0n);
    assert.equal(await game.read.balanceOf([player.account.address, BRONZE_ARROW]), 1n);
    assert.equal(await game.read.skillXp([player.account.address, 9]), 30n);

    await networkHelpers.time.increase(7);
    await game.write.claim();

    assert.equal(await game.read.balanceOf([player.account.address, BRONZE_ARROW]), 0n);
    assert.equal(await game.read.skillXp([player.account.address, 9]), 60n);
  });

  it("burns Rune Dust for Magic cycles and stops cleanly when runes are missing", async function () {
    const [player] = await viem.getWalletClients();
    const game = await deployIdleIslesHarness();

    await game.write.createProfile();
    await game.write.mintForTest([player.account.address, RUNE_DUST, 1n]);
    await game.write.setCombatStylePreference([3]);
    await game.write.startCombat([TRAINING_YARD]);
    await networkHelpers.time.increase(14);
    await game.write.claim();

    const activeTask = await game.read.activeTask([player.account.address]);

    assert.equal(activeTask[0], 0);
    assert.equal(await game.read.balanceOf([player.account.address, RUNE_DUST]), 0n);
    assert.equal(await game.read.skillXp([player.account.address, 10]), 30n);
    assert.equal(await game.read.balanceOf([player.account.address, HIDE]), 1n);
  });

  it("settles capped gather backlog without double-paying claimed cycles", async function () {
    const [player] = await viem.getWalletClients();
    const game = await deployIdleIsles();

    await game.write.createProfile();
    await game.write.startGather([ASH_GROVE]);
    await networkHelpers.time.increase(6250);

    assert.equal(await game.read.pendingCycles([player.account.address]), 1250n);

    await game.write.claim();

    assert.equal(await game.read.balanceOf([player.account.address, ASH_LOG]), 2000n);
    assert.equal(await game.read.skillXp([player.account.address, 3]), 36000n);
    assert.equal(await game.read.pendingCycles([player.account.address]), 250n);

    await game.write.claim();

    assert.equal(await game.read.balanceOf([player.account.address, ASH_LOG]), 2500n);
    assert.equal(await game.read.skillXp([player.account.address, 3]), 45000n);
    assert.equal(await game.read.pendingCycles([player.account.address]), 0n);

    await game.write.claim();

    assert.equal(await game.read.balanceOf([player.account.address, ASH_LOG]), 2500n);
    assert.equal(await game.read.skillXp([player.account.address, 3]), 45000n);
  });

  it("mines copper and tin and smelts Copper Bars", async function () {
    const [player] = await viem.getWalletClients();
    const game = await deployIdleIsles();

    await game.write.createProfile();
    await game.write.startGather([ASH_GROVE]);
    await networkHelpers.time.increase(5);
    await game.write.claim();
    await game.write.startGather([COPPER_RIDGE]);
    await networkHelpers.time.increase(7);
    await game.write.claim();
    await game.write.startGather([TIN_HOLLOW]);
    await networkHelpers.time.increase(7);
    await game.write.claim();

    assert.equal(await game.read.balanceOf([player.account.address, ASH_LOG]), 2n);
    assert.equal(await game.read.balanceOf([player.account.address, COPPER_ORE]), 2n);
    assert.equal(await game.read.balanceOf([player.account.address, TIN_ORE]), 2n);
    assert.equal(await game.read.skillXp([player.account.address, 5]), 80n);

    await game.write.startArtisan([COPPER_SMELTER]);
    await networkHelpers.time.increase(8);
    await game.write.claim();

    assert.equal(await game.read.balanceOf([player.account.address, ASH_LOG]), 1n);
    assert.equal(await game.read.balanceOf([player.account.address, COPPER_ORE]), 1n);
    assert.equal(await game.read.balanceOf([player.account.address, TIN_ORE]), 1n);
    assert.equal(await game.read.balanceOf([player.account.address, COPPER_BAR]), 1n);
    assert.equal(await game.read.skillXp([player.account.address, 6]), 52n);
  });

  it("crafts a Copper Dagger through the no-admin gameplay path", async function () {
    const [player] = await viem.getWalletClients();
    const game = await deployIdleIsles();

    await game.write.createProfile();
    await gatherCopperDaggerMaterials(game);

    assert.equal(await game.read.levelOf([player.account.address, 6]), 4);

    await game.write.startArtisan([COPPER_SMELTER]);
    await networkHelpers.time.increase(24);
    await game.write.claim();

    assert.equal(await game.read.balanceOf([player.account.address, COPPER_BAR]), 3n);

    await game.write.startArtisan([COPPER_DAGGER_FORGE]);
    await networkHelpers.time.increase(10);
    await game.write.claim();

    assert.equal(await game.read.balanceOf([player.account.address, COPPER_DAGGER]), 1n);
    assert.equal(await game.read.balanceOf([player.account.address, COPPER_BAR]), 0n);

    await game.write.equip([COPPER_DAGGER]);

    assert.equal(await game.read.balanceOf([player.account.address, COPPER_DAGGER]), 0n);
    assert.equal(await game.read.equippedItem([player.account.address, SLOT_WEAPON]), COPPER_DAGGER);
  });

  it("fishes Raw Minnow and rejects raw fish as food", async function () {
    const [player] = await viem.getWalletClients();
    const game = await deployIdleIsles();

    await game.write.createProfile();
    await game.write.startGather([RIVER_BEND]);
    await networkHelpers.time.increase(12);
    await game.write.claim();

    assert.equal(await game.read.balanceOf([player.account.address, RAW_MINNOW]), 4n);
    assert.equal(await game.read.skillXp([player.account.address, 4]), 80n);
    await assert.rejects(() => game.write.eatFood([RAW_MINNOW]));
  });

  it("cooks Raw Minnow into Cooked Minnow and destroys burned attempts", async function () {
    const [player] = await viem.getWalletClients();
    const game = await deployIdleIsles();

    await game.write.createProfile();
    await cookMinnows(game);

    const cookedMinnow = await game.read.balanceOf([player.account.address, COOKED_MINNOW]);

    assert.equal(await game.read.balanceOf([player.account.address, RAW_MINNOW]), 0n);
    assert(cookedMinnow > 0n);
    assert(cookedMinnow < 100n);
    assert.equal(await game.read.skillXp([player.account.address, 4]), 2000n);
    assert.equal(await game.read.skillXp([player.account.address, 7]), 2800n);
  });

  it("settles a thousand cooking cycles in one claim", async function () {
    const [player] = await viem.getWalletClients();
    const game = await deployIdleIsles();

    await game.write.createProfile();
    await game.write.startGather([RIVER_BEND]);
    await networkHelpers.time.increase(3000);
    await game.write.claim();

    assert.equal(await game.read.balanceOf([player.account.address, RAW_MINNOW]), 1000n);

    await game.write.startArtisan([COOK_MINNOW]);
    await networkHelpers.time.increase(4000);
    await game.write.claim();

    const cookedMinnow = await game.read.balanceOf([player.account.address, COOKED_MINNOW]);

    assert.equal(await game.read.balanceOf([player.account.address, RAW_MINNOW]), 0n);
    assert(cookedMinnow > 0n);
    assert(cookedMinnow < 1000n);
    assert.equal(await game.read.skillXp([player.account.address, 4]), 20000n);
    assert.equal(await game.read.skillXp([player.account.address, 7]), 28000n);
  });

  it("heals with Cooked Minnow made through gameplay", async function () {
    const [player] = await viem.getWalletClients();
    const game = await deployIdleIsles();

    await game.write.createProfile();
    await cookMinnows(game);
    await craftStarterGear(game);
    await game.write.equip([BARK_VEST]);

    const cookedBefore = await game.read.balanceOf([player.account.address, COOKED_MINNOW]);
    assert(cookedBefore > 0n);
    assert.equal(await game.read.currentHitpoints([player.account.address]), 10);
    assert.equal(await game.read.maxHitpoints([player.account.address]), 11n);

    await game.write.eatFood([COOKED_MINNOW]);

    assert.equal(await game.read.balanceOf([player.account.address, COOKED_MINNOW]), cookedBefore - 1n);
    assert.equal(await game.read.currentHitpoints([player.account.address]), 11);
  });

  it("auto-eats cooked food during combat settlement", async function () {
    const [player] = await viem.getWalletClients();
    const game = await deployIdleIsles();
    const latest = await networkHelpers.time.latest();

    await game.write.createProfile();
    await cookMinnows(game);
    await craftStarterGear(game);
    await game.write.equip([BARK_VEST]);

    const cookedBefore = await game.read.balanceOf([player.account.address, COOKED_MINNOW]);
    assert(cookedBefore > 0n);

    await game.write.configureAutoSettle([
      ZERO_ADDRESS,
      BigInt(latest + 3600),
      10,
      10,
      true,
      1,
      COOKED_MINNOW,
    ]);
    await game.write.startCombat([TRAINING_YARD]);
    await networkHelpers.time.increase(7);
    await game.write.claim();

    assert.equal(await game.read.balanceOf([player.account.address, COOKED_MINNOW]), cookedBefore - 1n);
    assert.equal(await game.read.balanceOf([player.account.address, HIDE]), 1n);
    assert((await game.read.currentHitpoints([player.account.address])) > 0);
  });

  it("burns crafted gear while equipped and remints it on unequip", async function () {
    const [player] = await viem.getWalletClients();
    const game = await deployIdleIsles();

    await game.write.createProfile();
    await craftStarterGear(game);
    await game.write.equip([WOOD_CLUB]);

    assert.equal(await game.read.balanceOf([player.account.address, WOOD_CLUB]), 0n);
    assert.equal(await game.read.equippedItem([player.account.address, SLOT_WEAPON]), WOOD_CLUB);

    await game.write.unequip([SLOT_WEAPON]);

    assert.equal(await game.read.balanceOf([player.account.address, WOOD_CLUB]), 1n);
    assert.equal(await game.read.equippedItem([player.account.address, SLOT_WEAPON]), 0n);
  });

  it("loses equipped crafted gear and half of Crowns on combat death", async function () {
    const [player] = await viem.getWalletClients();
    const game = await deployIdleIsles();

    await game.write.createProfile();
    await craftStarterGear(game);
    await game.write.equip([WOOD_CLUB]);
    await game.write.equip([BARK_VEST]);
    await game.write.startCombat([TRAINING_YARD]);

    for (let i = 0; i < 20; i++) {
      await networkHelpers.time.increase(1400);
      await game.write.claim();

      const currentHp = await game.read.currentHitpoints([player.account.address]);
      if (currentHp === 0) {
        break;
      }
    }

    const successfulCycles = await game.read.balanceOf([player.account.address, HIDE]);
    const preDeathCrowns = 80n + successfulCycles * 2n;
    const expectedCrownsAfterDeath = preDeathCrowns - preDeathCrowns / 2n;

    assert.equal(await game.read.currentHitpoints([player.account.address]), 0);
    assert.equal(await game.read.balanceOf([player.account.address, CROWNS]), expectedCrownsAfterDeath);
    assert.equal(await game.read.balanceOf([player.account.address, WOOD_CLUB]), 0n);
    assert.equal(await game.read.balanceOf([player.account.address, BARK_VEST]), 0n);
    assert.equal(await game.read.balanceOf([player.account.address, BARK_SHIELD]), 1n);
    assert.equal(await game.read.equippedItem([player.account.address, SLOT_WEAPON]), 0n);
    assert.equal(await game.read.equippedItem([player.account.address, SLOT_CHEST]), 0n);
  });
});
