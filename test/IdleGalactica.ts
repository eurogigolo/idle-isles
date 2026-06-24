import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { network } from "hardhat";

describe("Idle Galactica contracts", async function () {
  const { networkHelpers, viem } = await network.create();

  const CREDITS = 1n;
  const FERRITE_ORE = 10n;
  const WATER_ICE = 12n;
  const BIOMASS = 90n;
  const SCRAP_METAL = 130n;
  const REPAIR_GEL = 250n;
  const OXYGEN_CELL = 251n;
  const LIGHT_TURRET = 404n;
  const BASIC_SHIELD_GENERATOR = 406n;
  const REINFORCED_HULL_PLATING = 408n;
  const MINING_LASER = 400n;
  const SALVAGE_BEAM = 401n;
  const GAS_SCOOP = 402n;
  const SURVEY_SCANNER = 403n;

  const TARGET_DRONE = 101;
  const ROCK_HOPPER = 201;
  const SCRAPPER = 205;
  const BASIC_HYDROPONICS = 305;
  const ISOTOPE_SEPARATOR = 310;

  const SLOT_HARDPOINT = 0;
  const SLOT_HULL_PLATING = 2;

  const SKILL_ASTEROID_MINING = 0;
  const SKILL_LIFE_SYSTEMS_SYNTHESIS = 5;
  const SKILL_GUNNERY = 8;
  const SKILL_ENGINEERING = 9;

  async function deployContent() {
    return viem.deployContract("IdleGalacticaContent");
  }

  async function deployIdleGalactica() {
    const content = await deployContent();
    const game = await viem.deployContract("IdleGalactica", [
      "ipfs://idle-galactica/{id}.json",
      content.address,
    ]);
    return { content, game };
  }

  async function deployIdleGalacticaHarness() {
    const content = await deployContent();
    const game = await viem.deployContract("IdleGalacticaHarness", [
      "ipfs://idle-galactica/{id}.json",
      content.address,
    ]);
    return { content, game };
  }

  async function deployWithTradeRelay() {
    const { content, game } = await deployIdleGalactica();
    const tradeRelay = await viem.deployContract("TradeRelay", [game.address]);
    return { content, game, tradeRelay };
  }

  function asBigInt(value: unknown): bigint {
    return BigInt(value as string | number | bigint);
  }

  function field<T = unknown>(value: unknown, key: string, index: number): T {
    const record = value as Record<string, T>;
    const list = value as T[];
    return record[key] ?? list[index];
  }

  function pairAt(packed: bigint, index: number) {
    const pair = (packed >> BigInt(index * 64)) & 0xffffffffffffffffn;
    return {
      id: pair & 0xffffn,
      amount: (pair >> 16n) & 0xffffffffn,
    };
  }

  function xpRequiredForLevel(level: number): bigint {
    const progress = BigInt(level - 1);
    return progress * progress * 45n;
  }

  it("exposes v2 content for modules, repair supplies, missions, and combat rules", async function () {
    const content = await deployContent();

    const moduleSlot = await content.read.moduleSlot([LIGHT_TURRET]);
    assert.equal(field<boolean>(moduleSlot, "isModule", 0), true);
    assert.equal(asBigInt(field(moduleSlot, "slot", 1)), 0n);

    const turretStats = await content.read.moduleStatsOf([LIGHT_TURRET]);
    assert.equal(asBigInt(field(turretStats, "damage", 0)), 8n);
    assert.equal(asBigInt(field(turretStats, "accuracy", 1)), 4n);
    assert.equal(await content.read.repairAmount([REPAIR_GEL]), 18);

    const rockHopper = await content.read.getActivity([ROCK_HOPPER]);
    assert.equal(asBigInt(field(rockHopper, "kind", 1)), 2n);
    assert.equal(asBigInt(field(rockHopper, "sectorId", 2)), 1n);
    assert.equal(asBigInt(field(rockHopper, "primarySkill", 3)), 0n);
    assert.equal(asBigInt(field(rockHopper, "cycleSeconds", 5)), 6n);
    assert.deepEqual(pairAt(asBigInt(field(rockHopper, "rewards", 10)), 0), {
      id: FERRITE_ORE,
      amount: 2n,
    });
    assert.deepEqual(pairAt(asBigInt(field(rockHopper, "rewards", 10)), 1), {
      id: WATER_ICE,
      amount: 1n,
    });

    const isotopeSeparator = await content.read.getActivity([ISOTOPE_SEPARATOR]);
    assert.deepEqual(pairAt(asBigInt(field(isotopeSeparator, "levelReqs", 7)), 0), {
      id: 6n,
      amount: 8n,
    });
    assert.deepEqual(pairAt(asBigInt(field(isotopeSeparator, "levelReqs", 7)), 1), {
      id: 2n,
      amount: 5n,
    });

    const targetDrone = await content.read.getActivity([TARGET_DRONE]);
    const combat = field(targetDrone, "combat", 11);
    assert.equal(asBigInt(field(combat, "attack", 1)), 7n);
    assert.equal(asBigInt(field(combat, "defense", 2)), 12n);
    assert.deepEqual(pairAt(asBigInt(field(targetDrone, "rewards", 10)), 1), {
      id: CREDITS,
      amount: 8n,
    });
  });

  it("creates a ship profile with starter cargo, hull, sector, and settings", async function () {
    const { game } = await deployIdleGalactica();
    const [player] = await viem.getWalletClients();

    await game.write.createProfile();

    assert.equal(await game.read.hasProfile([player.account.address]), true);
    assert.equal(asBigInt(await game.read.currentHull([player.account.address])), 100n);
    assert.equal(asBigInt(await game.read.currentSectorId([player.account.address])), 1n);
    assert.equal(await game.read.isSectorUnlocked([player.account.address, 1]), true);
    assert.equal(await game.read.isSectorUnlocked([player.account.address, 2]), false);

    assert.equal(await game.read.balanceOf([player.account.address, CREDITS]), 120n);
    assert.equal(await game.read.balanceOf([player.account.address, REPAIR_GEL]), 4n);
    assert.equal(await game.read.balanceOf([player.account.address, OXYGEN_CELL]), 2n);
    assert.equal(await game.read.balanceOf([player.account.address, LIGHT_TURRET]), 1n);
    assert.equal(await game.read.balanceOf([player.account.address, BASIC_SHIELD_GENERATOR]), 1n);
    assert.equal(await game.read.balanceOf([player.account.address, REINFORCED_HULL_PLATING]), 1n);
    assert.equal(await game.read.balanceOf([player.account.address, MINING_LASER]), 1n);
    assert.equal(await game.read.balanceOf([player.account.address, SALVAGE_BEAM]), 1n);
    assert.equal(await game.read.balanceOf([player.account.address, GAS_SCOOP]), 1n);
    assert.equal(await game.read.balanceOf([player.account.address, SURVEY_SCANNER]), 1n);
  });

  it("settles a gathering mission and grants cargo plus XP", async function () {
    const { game } = await deployIdleGalactica();
    const [player] = await viem.getWalletClients();

    await game.write.createProfile();
    await game.write.startGathering([ROCK_HOPPER]);
    await networkHelpers.time.increase(6);
    await game.write.claimMission();

    assert.equal(await game.read.balanceOf([player.account.address, FERRITE_ORE]), 2n);
    assert.equal(await game.read.balanceOf([player.account.address, WATER_ICE]), 1n);
    assert.equal(
      await game.read.skillXp([player.account.address, SKILL_ASTEROID_MINING]),
      12n,
    );
  });

  it("claims pending mission cycles before switching to a new mission", async function () {
    const { game } = await deployIdleGalactica();
    const [player] = await viem.getWalletClients();

    await game.write.createProfile();
    await game.write.startGathering([ROCK_HOPPER]);
    await networkHelpers.time.increase(6);
    await game.write.startGathering([SCRAPPER]);

    assert.equal(await game.read.balanceOf([player.account.address, FERRITE_ORE]), 2n);
    assert.equal(await game.read.balanceOf([player.account.address, WATER_ICE]), 1n);

    const mission = await game.read.activeMission([player.account.address]);
    assert.equal(asBigInt(field(mission, "activityId", 0)), BigInt(SCRAPPER));
  });

  it("settles pending cycles before manually stopping a mission", async function () {
    const { game } = await deployIdleGalactica();
    const [player] = await viem.getWalletClients();

    await game.write.createProfile();
    await game.write.startGathering([ROCK_HOPPER]);
    await networkHelpers.time.increase(6);
    await game.write.stopMission();

    assert.equal(await game.read.balanceOf([player.account.address, FERRITE_ORE]), 2n);
    assert.equal(await game.read.balanceOf([player.account.address, WATER_ICE]), 1n);

    const mission = await game.read.activeMission([player.account.address]);
    assert.equal(asBigInt(field(mission, "activityId", 0)), 0n);
  });

  it("settles production, burns inputs, and stops when cargo is depleted", async function () {
    const { game } = await deployIdleGalacticaHarness();
    const [player] = await viem.getWalletClients();

    await game.write.createProfile();
    await game.write.mintForTest([player.account.address, BIOMASS, 2n]);
    await game.write.mintForTest([player.account.address, WATER_ICE, 2n]);

    await game.write.startProduction([BASIC_HYDROPONICS]);
    await networkHelpers.time.increase(21);
    await game.write.claimMission();

    assert.equal(await game.read.balanceOf([player.account.address, BIOMASS]), 0n);
    assert.equal(await game.read.balanceOf([player.account.address, WATER_ICE]), 0n);
    assert.equal(await game.read.balanceOf([player.account.address, OXYGEN_CELL]), 4n);
    assert.equal(await game.read.balanceOf([player.account.address, REPAIR_GEL]), 6n);
    assert.equal(
      await game.read.skillXp([player.account.address, SKILL_LIFE_SYSTEMS_SYNTHESIS]),
      28n,
    );

    const mission = await game.read.activeMission([player.account.address]);
    assert.equal(asBigInt(field(mission, "activityId", 0)), 0n);
  });

  it("escrows equipped modules, restores them on unequip, and applies hull stats", async function () {
    const { game } = await deployIdleGalactica();
    const [player] = await viem.getWalletClients();

    await game.write.createProfile();
    await game.write.equipModule([LIGHT_TURRET]);
    assert.equal(await game.read.balanceOf([player.account.address, LIGHT_TURRET]), 0n);
    assert.equal(
      asBigInt(await game.read.moduleInSlot([player.account.address, SLOT_HARDPOINT])),
      LIGHT_TURRET,
    );

    await game.write.equipModule([REINFORCED_HULL_PLATING]);
    assert.equal(asBigInt(await game.read.maxHull([player.account.address])), 118n);

    await game.write.unequipModule([SLOT_HARDPOINT]);
    assert.equal(await game.read.balanceOf([player.account.address, LIGHT_TURRET]), 1n);
    assert.equal(asBigInt(await game.read.moduleInSlot([player.account.address, SLOT_HARDPOINT])), 0n);

    await game.write.unequipModule([SLOT_HULL_PLATING]);
    assert.equal(asBigInt(await game.read.maxHull([player.account.address])), 100n);
  });

  it("requires a hardpoint for combat and settles the starter threat", async function () {
    const { game } = await deployIdleGalactica();
    const [player] = await viem.getWalletClients();

    await game.write.createProfile();
    await assert.rejects(() => game.write.startCombat([TARGET_DRONE]));

    await game.write.equipModule([LIGHT_TURRET]);
    await game.write.startCombat([TARGET_DRONE]);
    await networkHelpers.time.increase(7);
    await game.write.claimMission();

    assert.equal(await game.read.balanceOf([player.account.address, SCRAP_METAL]), 1n);
    assert.equal(await game.read.balanceOf([player.account.address, CREDITS]), 128n);
    assert.equal(await game.read.skillXp([player.account.address, SKILL_GUNNERY]), 16n);
    assert.equal(await game.read.skillXp([player.account.address, SKILL_ENGINEERING]), 5n);
    assert.ok(asBigInt(await game.read.currentHull([player.account.address])) < 100n);
  });

  it("repairs hull with repair supplies", async function () {
    const { game } = await deployIdleGalacticaHarness();
    const [player] = await viem.getWalletClients();

    await game.write.createProfile();
    await game.write.setCurrentHullForTest([player.account.address, 40]);
    await game.write.repairHull([REPAIR_GEL]);

    assert.equal(asBigInt(await game.read.currentHull([player.account.address])), 58n);
    assert.equal(await game.read.balanceOf([player.account.address, REPAIR_GEL]), 3n);
  });

  it("auto-repairs before combat safety stop when hull starts below threshold", async function () {
    const { game } = await deployIdleGalacticaHarness();
    const [player] = await viem.getWalletClients();

    await game.write.createProfile();
    await game.write.equipModule([LIGHT_TURRET]);
    await game.write.equipModule([BASIC_SHIELD_GENERATOR]);
    await game.write.equipModule([REINFORCED_HULL_PLATING]);
    await game.write.setCurrentHullForTest([player.account.address, 1]);

    await game.write.startCombat([TARGET_DRONE]);
    await networkHelpers.time.increase(7);
    await game.write.claimMission();

    assert.equal(await game.read.balanceOf([player.account.address, REPAIR_GEL]), 2n);
    assert.equal(asBigInt(await game.read.currentHull([player.account.address])), 37n);

    const mission = await game.read.activeMission([player.account.address]);
    assert.equal(asBigInt(field(mission, "activityId", 0)), BigInt(TARGET_DRONE));
  });

  it("unlocks and travels to Inner Belt after credit and skill requirements", async function () {
    const { game } = await deployIdleGalacticaHarness();
    const [player] = await viem.getWalletClients();

    await game.write.createProfile();
    await game.write.mintForTest([player.account.address, CREDITS, 2380n]);
    await game.write.setSkillXpForTest([
      player.account.address,
      SKILL_ASTEROID_MINING,
      xpRequiredForLevel(5),
    ]);
    await game.write.setSkillXpForTest([
      player.account.address,
      SKILL_ENGINEERING,
      xpRequiredForLevel(4),
    ]);

    await game.write.travelToSector([2]);

    assert.equal(await game.read.isSectorUnlocked([player.account.address, 2]), true);
    assert.equal(asBigInt(await game.read.currentSectorId([player.account.address])), 2n);
    assert.equal(await game.read.balanceOf([player.account.address, CREDITS]), 0n);
  });

  it("escrows listed cargo and trades it for credits through the Trade Relay", async function () {
    const { game, tradeRelay } = await deployWithTradeRelay();
    const [seller, buyer] = await viem.getWalletClients();

    await game.write.createProfile();
    await game.write.createProfile({ account: buyer.account });

    await game.write.setApprovalForAll([tradeRelay.address, true]);
    await tradeRelay.write.createOrder([REPAIR_GEL, 1n, 12n]);

    assert.equal(await game.read.balanceOf([seller.account.address, REPAIR_GEL]), 3n);
    assert.equal(await game.read.balanceOf([tradeRelay.address, REPAIR_GEL]), 1n);

    await game.write.setApprovalForAll([tradeRelay.address, true], { account: buyer.account });
    await tradeRelay.write.buy([1n, 1n], { account: buyer.account });

    assert.equal(await game.read.balanceOf([buyer.account.address, REPAIR_GEL]), 5n);
    assert.equal(await game.read.balanceOf([buyer.account.address, CREDITS]), 108n);
    assert.equal(await game.read.balanceOf([seller.account.address, CREDITS]), 132n);
    assert.equal(await game.read.balanceOf([tradeRelay.address, REPAIR_GEL]), 0n);
  });
});
