import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { network } from "hardhat";

describe("IdleIsles", async function () {
  const { networkHelpers, viem } = await network.create();
  const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
  const CROWNS = 1n;
  const ASH_LOG = 2n;
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
  const TRAINING_YARD = 101;
  const CAVE_BAT = 104;
  const ASH_GROVE = 201;
  const COPPER_RIDGE = 202;
  const TIN_HOLLOW = 203;
  const RIVER_BEND = 204;
  const WOOD_ARMORY = 301;
  const COPPER_SMELTER = 302;
  const COPPER_DAGGER_FORGE = 303;
  const COOK_MINNOW = 304;
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

  it("settles completed combat cycles and grants training rewards", async function () {
    const [player] = await viem.getWalletClients();
    const game = await deployIdleIsles();

    await game.write.createProfile();
    await game.write.startCombat([101]);
    await networkHelpers.time.increase(7);
    await game.write.claim();

    assert.equal(await game.read.balanceOf([player.account.address, 70n]), 1n);
    assert.equal(await game.read.balanceOf([player.account.address, 1n]), 84n);
    assert.equal(await game.read.skillXp([player.account.address, 0]), 30n);
    assert.equal(await game.read.skillXp([player.account.address, 1]), 16n);
    assert.equal(await game.read.skillXp([player.account.address, 2]), 16n);
  });

  it("stops auto-settle at the configured HP threshold without death loss", async function () {
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

    assert.equal(activeTask[0], 0);
    assert.equal(await game.read.currentHitpoints([player.account.address]), 10);
    assert.equal(await game.read.balanceOf([player.account.address, CROWNS]), 80n);
    assert.equal(await game.read.balanceOf([player.account.address, HIDE]), 0n);
  });

  it("escrows listed items and transfers them to buyers", async function () {
    const [seller, buyer] = await viem.getWalletClients();
    const game = await deployIdleIsles();

    await game.write.createProfile();
    await game.write.createProfile({ account: buyer.account });
    await game.write.startCombat([TRAINING_YARD]);
    await networkHelpers.time.increase(7);
    await game.write.claim();

    await game.write.createOrder([HIDE, 1n, 10n]);

    const order = await game.read.orders([1n]);

    assert.equal(order[0].toLowerCase(), seller.account.address.toLowerCase());
    assert.equal(order[1], HIDE);
    assert.equal(order[2], 10n);
    assert.equal(order[3], 1n);
    assert.equal(await game.read.balanceOf([seller.account.address, HIDE]), 0n);
    assert.equal(await game.read.balanceOf([game.address, HIDE]), 1n);

    await game.write.buy([1n, 1n], { account: buyer.account });

    const filledOrder = await game.read.orders([1n]);

    assert.equal(filledOrder[3], 0n);
    assert.equal(await game.read.balanceOf([buyer.account.address, HIDE]), 1n);
    assert.equal(await game.read.balanceOf([buyer.account.address, CROWNS]), 70n);
    assert.equal(await game.read.balanceOf([seller.account.address, CROWNS]), 94n);
    assert.equal(await game.read.balanceOf([game.address, HIDE]), 0n);
  });

  it("returns escrowed items when a seller cancels an order", async function () {
    const [seller] = await viem.getWalletClients();
    const game = await deployIdleIsles();

    await game.write.createProfile();
    await game.write.startCombat([TRAINING_YARD]);
    await networkHelpers.time.increase(7);
    await game.write.claim();
    await game.write.createOrder([HIDE, 1n, 10n]);

    assert.equal(await game.read.balanceOf([seller.account.address, HIDE]), 0n);
    assert.equal(await game.read.balanceOf([game.address, HIDE]), 1n);

    await game.write.cancelOrder([1n]);

    const cancelledOrder = await game.read.orders([1n]);

    assert.equal(cancelledOrder[3], 0n);
    assert.equal(await game.read.balanceOf([seller.account.address, HIDE]), 1n);
    assert.equal(await game.read.balanceOf([game.address, HIDE]), 0n);
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

  it("settles capped gather backlog without double-paying claimed cycles", async function () {
    const [player] = await viem.getWalletClients();
    const game = await deployIdleIsles();

    await game.write.createProfile();
    await game.write.startGather([ASH_GROVE]);
    await networkHelpers.time.increase(1250);

    assert.equal(await game.read.pendingCycles([player.account.address]), 250n);

    await game.write.claim();

    assert.equal(await game.read.balanceOf([player.account.address, ASH_LOG]), 400n);
    assert.equal(await game.read.skillXp([player.account.address, 3]), 7200n);
    assert.equal(await game.read.pendingCycles([player.account.address]), 50n);

    await game.write.claim();

    assert.equal(await game.read.balanceOf([player.account.address, ASH_LOG]), 500n);
    assert.equal(await game.read.skillXp([player.account.address, 3]), 9000n);
    assert.equal(await game.read.pendingCycles([player.account.address]), 0n);

    await game.write.claim();

    assert.equal(await game.read.balanceOf([player.account.address, ASH_LOG]), 500n);
    assert.equal(await game.read.skillXp([player.account.address, 3]), 9000n);
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
    const preDeathCrowns = 80n + successfulCycles * 4n;
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
