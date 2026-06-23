import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  isAddress,
  parseAbi,
  type Address,
  type EIP1193Provider,
  type Hex,
} from 'viem'
import { mega, type ConnectionStatus, type Permission, type TransactionResult } from '@megaeth-labs/wallet-sdk'
import { megaethTestnet } from 'viem/chains'
import {
  CONTRACT_ACTIVITY_IDS,
  CONTRACT_AREA_IDS,
  CONTRACT_ITEM_IDS,
} from './generated/contentIds'
import {
  AREAS,
  EQUIPMENT_SLOTS,
  ITEMS,
  SKILLS,
  STARTER_AREA_ID,
  type ActivityId,
  type AreaId,
  type CombatTrainingStyle,
  type Equipment,
  type Inventory,
  type ItemId,
  type MarketOrder,
  type SkillBook,
} from './game'

export type BrowserEthereumProvider = EIP1193Provider & {
  on?: (event: string, handler: (...args: unknown[]) => void) => void
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void
}

export interface ChainSnapshot {
  hasProfile: boolean
  skills: SkillBook
  inventory: Inventory
  equipment: Equipment
  marketOrders: MarketOrder[]
  currentHitpoints: number
  maxHitpoints: number
  currentAreaId: AreaId
  unlockedAreaIds: AreaId[]
  active: {
    id: ActivityId
    startedAt: number
    lastClaimAt: number
  } | null
  pendingCycles: number
  combatStylePreference: CombatTrainingStyle
}

export const MEGAETH_CHAIN_ID_HEX = `0x${megaethTestnet.id.toString(16)}`
export const CHAIN_SETTLE_CYCLE_LIMIT = 1_000
export const CHAIN_COMBAT_SETTLE_CYCLE_LIMIT = 200
export const MOSS_GAMEPLAY_SESSION_SECONDS = 24 * 60 * 60
const CHAIN_MARKET_SCAN_LIMIT = 120
const CHAIN_SAFETY_DURATION_SECONDS = 7 * 24 * 60 * 60
const ZERO_ADDRESS: Address = '0x0000000000000000000000000000000000000000'
const GAS_BUFFER_BPS = 5_000n
const MIN_GAS_BUFFER = 100_000n
const CONTRACT_FOOD_ITEMS = new Set<ItemId>([
  'cookedMinnow',
  'cookedTrout',
  'cookedCod',
  'cookedTuna',
  'cookedManta',
  'cookedLeviathan',
])

const MOSS_GAMEPLAY_CALLS = [
  'createProfile()',
  'claim()',
  'startCombat(uint16)',
  'startGather(uint16)',
  'startArtisan(uint16)',
  'eatFood(uint256)',
  'equip(uint256)',
  'unequip(uint8)',
  'configureAutoSettle(address,uint64,uint16,uint16,bool,uint16,uint256)',
  'clearAutoSettle()',
  'setCombatStylePreference(uint8)',
] as const

let mossInitialisePromise: Promise<void> | null = null

export const MEGAETH_TESTNET_PARAMS = {
  chainId: MEGAETH_CHAIN_ID_HEX,
  chainName: 'MegaETH Testnet',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: ['https://carrot.megaeth.com/rpc'],
  blockExplorerUrls: ['https://megaeth-testnet-v2.blockscout.com'],
}

const CONTRACT_ACTIVITY_BY_ID = Object.fromEntries(
  Object.entries(CONTRACT_ACTIVITY_IDS).map(([activityId, value]) => [
    value.id,
    activityId as ActivityId,
  ]),
) as Record<number, ActivityId | undefined>

const ITEM_BY_CONTRACT_ID = Object.fromEntries(
  Object.entries(CONTRACT_ITEM_IDS).map(([itemId, contractId]) => [
    contractId.toString(),
    itemId as ItemId,
  ]),
) as Record<string, ItemId | undefined>

const AREA_BY_CONTRACT_ID = Object.fromEntries(
  Object.entries(CONTRACT_AREA_IDS).map(([areaId, contractId]) => [
    contractId.toString(),
    areaId as AreaId,
  ]),
) as Record<string, AreaId | undefined>

const idleIslesAbi = parseAbi([
  'error AreaLocked()',
  'error AreaRequired()',
  'error AutoDisabled()',
  'error AutoExpired()',
  'error BadActivity()',
  'error BadArea()',
  'error BadConfig()',
  'error EquipmentRequired()',
  'error MaterialLow()',
  'error NoFood()',
  'error NoHp()',
  'error NoItem()',
  'error NoProfile()',
  'error NotEquipment()',
  'error NotFood()',
  'error NotOperator()',
  'error ProfileExists()',
  'error RequirementLow()',
  'function activeTask(address player) view returns (uint16 activityId, uint64 startedAt, uint64 lastResolvedAt)',
  'function balanceOf(address account, uint256 id) view returns (uint256)',
  'function claim()',
  'function clearAutoSettle()',
  'function combatStylePreference(address player) view returns (uint8)',
  'function configureAutoSettle(address operator, uint64 expiresAt, uint16 maxCyclesPerSettle, uint16 stopAtHp, bool autoEat, uint16 maxFoodPerSettle, uint256 foodItemId)',
  'function createProfile()',
  'function currentAreaId(address player) view returns (uint8)',
  'function currentHitpoints(address player) view returns (uint16)',
  'function eatFood(uint256 itemId)',
  'function equip(uint256 itemId)',
  'function equippedItem(address player, uint8 slot) view returns (uint256)',
  'function hasProfile(address player) view returns (bool)',
  'function isAreaUnlocked(address player, uint8 areaId) view returns (bool)',
  'function maxHitpoints(address player) view returns (uint256)',
  'function pendingCycles(address player) view returns (uint256)',
  'function skillXp(address player, uint8 skill) view returns (uint64)',
  'function startArtisan(uint16 activityId)',
  'function startCombat(uint16 activityId)',
  'function startGather(uint16 activityId)',
  'function setCombatStylePreference(uint8 style)',
  'function travelToArea(uint8 areaId)',
  'function unequip(uint8 slot)',
])

const erc1155ApprovalAbi = parseAbi([
  'function isApprovedForAll(address account, address operator) view returns (bool)',
  'function setApprovalForAll(address operator, bool approved)',
])

const hoardHallAbi = parseAbi([
  'function buy(uint256 orderId, uint64 amount)',
  'function cancelOrder(uint256 orderId)',
  'function createOrder(uint256 itemId, uint64 amount, uint128 priceEach)',
  'function nextOrderId() view returns (uint256)',
  'function orders(uint256 orderId) view returns (address seller, uint256 itemId, uint128 priceEach, uint64 amountRemaining)',
])

type IdleIslesWriteRequest =
  | { functionName: 'claim'; args: readonly [] }
  | { functionName: 'clearAutoSettle'; args: readonly [] }
  | {
      functionName: 'configureAutoSettle'
      args: readonly [
        operator: Address,
        expiresAt: bigint,
        maxCyclesPerSettle: number,
        stopAtHp: number,
        autoEat: boolean,
        maxFoodPerSettle: number,
        foodItemId: bigint,
      ]
    }
  | { functionName: 'createProfile'; args: readonly [] }
  | { functionName: 'eatFood'; args: readonly [itemId: bigint] }
  | { functionName: 'equip'; args: readonly [itemId: bigint] }
  | { functionName: 'startArtisan'; args: readonly [activityId: number] }
  | { functionName: 'startCombat'; args: readonly [activityId: number] }
  | { functionName: 'startGather'; args: readonly [activityId: number] }
  | { functionName: 'setCombatStylePreference'; args: readonly [style: number] }
  | { functionName: 'travelToArea'; args: readonly [areaId: number] }
  | { functionName: 'unequip'; args: readonly [slot: number] }

type HoardHallWriteRequest =
  | { functionName: 'buy'; args: readonly [orderId: bigint, amount: bigint] }
  | { functionName: 'cancelOrder'; args: readonly [orderId: bigint] }
  | { functionName: 'createOrder'; args: readonly [itemId: bigint, amount: bigint, priceEach: bigint] }

const publicClient = createPublicClient({
  chain: megaethTestnet,
  transport: http(),
})

export function getIdleIslesAddress(): Address | null {
  const address =
    import.meta.env.VITE_IDLE_ISLES_ADDRESS ?? import.meta.env.VITE_IDLE_ODYSSEY_ADDRESS
  return typeof address === 'string' && isAddress(address) ? address : null
}

export function getHoardHallAddress(): Address | null {
  const address = import.meta.env.VITE_HOARD_HALL_ADDRESS
  return typeof address === 'string' && isAddress(address) ? address : null
}

export function getContractActivity(activityId: ActivityId) {
  return CONTRACT_ACTIVITY_IDS[activityId] ?? null
}

export function getContractItemId(itemId: ItemId): bigint {
  return CONTRACT_ITEM_IDS[itemId]
}

export function toAddress(value: string | undefined): Address | null {
  return value && isAddress(value) ? value : null
}

export async function initialiseMossWallet() {
  mossInitialisePromise ??= mega
    .initialise({
      network: 'testnet',
      logging: 'error',
    })
    .then(() => undefined)

  return mossInitialisePromise
}

export async function getMossWalletStatus(): Promise<ConnectionStatus> {
  await initialiseMossWallet()
  return mega.status()
}

export async function connectMossWallet(): Promise<Address | null> {
  await initialiseMossWallet()
  const status = await mega.connect()

  return status.status === 'connected' ? toAddress(status.address) : null
}

export async function openMossDeposit(): Promise<void> {
  await initialiseMossWallet()
  await mega.deposit()
}

export async function hasMossGameplaySession(account?: Address | null): Promise<boolean> {
  const address = getIdleIslesAddress()
  if (!address) {
    return false
  }

  await initialiseMossWallet()
  const permissions = await mega.getPermissions(account ?? undefined)
  const grant = permissions?.permissions
  const expiresSoon = Math.floor(Date.now() / 1000) + 60

  if (!grant || grant.expiry <= expiresSoon) {
    return false
  }

  const calls = grant.permissions.calls
  const gameAddress = address.toLowerCase()

  return MOSS_GAMEPLAY_CALLS.every((signature) =>
    calls.some(
      (call) =>
        call.to.toLowerCase() === gameAddress &&
        call.signature.toLowerCase() === signature.toLowerCase(),
    ),
  )
}

export async function grantMossGameplaySession() {
  await initialiseMossWallet()
  const result = await mega.grantPermissions({
    permissions: createMossGameplayPermission(),
  })

  if (result.status !== 'approved') {
    throw new Error('MOSS gameplay session was not approved.')
  }

  return result
}

export async function readChainSnapshot(account: Address): Promise<ChainSnapshot> {
  const address = requireIdleIslesAddress()
  const marketAddress = getHoardHallAddress()
  const [hasProfile, marketOrders] = await Promise.all([
    publicClient.readContract({
      address,
      abi: idleIslesAbi,
      functionName: 'hasProfile',
      args: [account],
    }),
    readChainMarketOrders(marketAddress, account),
  ])

  if (!hasProfile) {
    return {
      hasProfile,
      skills: createEmptySkills(),
      inventory: createEmptyInventory(),
      equipment: createEmptyEquipment(),
      marketOrders,
      currentHitpoints: 0,
      maxHitpoints: 0,
      currentAreaId: STARTER_AREA_ID,
      unlockedAreaIds: [STARTER_AREA_ID],
      active: null,
      pendingCycles: 0,
      combatStylePreference: 'auto',
    }
  }

  const [
    currentHitpoints,
    maxHitpoints,
    activeTask,
    pendingCycles,
    currentAreaValue,
    areaUnlockedValues,
    skillValues,
    balances,
    equippedValues,
    combatStyleValue,
  ] = await Promise.all([
    publicClient.readContract({
      address,
      abi: idleIslesAbi,
      functionName: 'currentHitpoints',
      args: [account],
    }),
    publicClient.readContract({
      address,
      abi: idleIslesAbi,
      functionName: 'maxHitpoints',
      args: [account],
    }),
    publicClient.readContract({
      address,
      abi: idleIslesAbi,
      functionName: 'activeTask',
      args: [account],
    }),
    publicClient.readContract({
      address,
      abi: idleIslesAbi,
      functionName: 'pendingCycles',
      args: [account],
    }),
    publicClient.readContract({
      address,
      abi: idleIslesAbi,
      functionName: 'currentAreaId',
      args: [account],
    }),
    Promise.all(
      AREAS.map((area) =>
        publicClient.readContract({
          address,
          abi: idleIslesAbi,
          functionName: 'isAreaUnlocked',
          args: [account, CONTRACT_AREA_IDS[area.id]],
        }),
      ),
    ),
    Promise.all(
      SKILLS.map((_, index) =>
        publicClient.readContract({
          address,
          abi: idleIslesAbi,
          functionName: 'skillXp',
          args: [account, index],
        }),
      ),
    ),
    Promise.all(
      (Object.keys(CONTRACT_ITEM_IDS) as ItemId[]).map((itemId) =>
        publicClient.readContract({
          address,
          abi: idleIslesAbi,
          functionName: 'balanceOf',
          args: [account, CONTRACT_ITEM_IDS[itemId]],
        }),
      ),
    ),
    Promise.all(
      EQUIPMENT_SLOTS.map((_, index) =>
        publicClient.readContract({
          address,
          abi: idleIslesAbi,
          functionName: 'equippedItem',
          args: [account, index],
        }),
      ),
    ),
    publicClient.readContract({
      address,
      abi: idleIslesAbi,
      functionName: 'combatStylePreference',
      args: [account],
    }),
  ])

  return {
    hasProfile,
    skills: SKILLS.reduce((book, skill, index) => {
      book[skill.id] = { xp: Number(skillValues[index]) }
      return book
    }, {} as SkillBook),
    inventory: (Object.keys(CONTRACT_ITEM_IDS) as ItemId[]).reduce((bag, itemId, index) => {
      bag[itemId] = Number(balances[index])
      return bag
    }, createEmptyInventory()),
    equipment: EQUIPMENT_SLOTS.reduce((gear, slot, index) => {
      gear[slot] = ITEM_BY_CONTRACT_ID[equippedValues[index].toString()] ?? null
      return gear
    }, createEmptyEquipment()),
    marketOrders,
    currentHitpoints: Number(currentHitpoints),
    maxHitpoints: Number(maxHitpoints),
    currentAreaId: formatChainArea(currentAreaValue),
    unlockedAreaIds: formatUnlockedAreas(areaUnlockedValues),
    active: formatActiveTask(activeTask),
    pendingCycles: Number(pendingCycles),
    combatStylePreference: formatCombatStylePreference(combatStyleValue),
  }
}

export async function writeCreateProfile(provider: BrowserEthereumProvider, account: Address) {
  return writeIdleIslesContract(provider, account, { functionName: 'createProfile', args: [] })
}

export async function writeClaim(provider: BrowserEthereumProvider, account: Address) {
  return writeIdleIslesContract(provider, account, { functionName: 'claim', args: [] })
}

export async function writeStartActivity(
  provider: BrowserEthereumProvider,
  account: Address,
  activityId: ActivityId,
) {
  const activity = getContractActivity(activityId)
  if (!activity) {
    throw new Error('Activity is not available onchain yet.')
  }

  if (activity.kind === 'combat') {
    return writeIdleIslesContract(provider, account, {
      functionName: 'startCombat',
      args: [activity.id],
    })
  }

  if (activity.kind === 'gather') {
    return writeIdleIslesContract(provider, account, {
      functionName: 'startGather',
      args: [activity.id],
    })
  }

  return writeIdleIslesContract(provider, account, {
    functionName: 'startArtisan',
    args: [activity.id],
  })
}

export async function writeEquip(
  provider: BrowserEthereumProvider,
  account: Address,
  itemId: ItemId,
) {
  return writeIdleIslesContract(provider, account, {
    functionName: 'equip',
    args: [getContractItemId(itemId)],
  })
}

export async function writeUnequip(
  provider: BrowserEthereumProvider,
  account: Address,
  slotIndex: number,
) {
  return writeIdleIslesContract(provider, account, {
    functionName: 'unequip',
    args: [slotIndex],
  })
}

export async function writeEatFood(
  provider: BrowserEthereumProvider,
  account: Address,
  itemId: ItemId,
) {
  return writeIdleIslesContract(provider, account, {
    functionName: 'eatFood',
    args: [getContractItemId(itemId)],
  })
}

export async function writeConfigureCombatSafety(
  provider: BrowserEthereumProvider,
  account: Address,
  settings: {
    autoEat: boolean
    stopAtHitpoints: number
    foodItemId: ItemId | null
    maxFoodPerSettle: number
  },
) {
  if (
    settings.autoEat &&
    (!settings.foodItemId || !CONTRACT_FOOD_ITEMS.has(settings.foodItemId))
  ) {
    throw new Error('Select cooked food for onchain auto-eat.')
  }

  const latestBlock = await publicClient.getBlock()
  const expiresAt = latestBlock.timestamp + BigInt(CHAIN_SAFETY_DURATION_SECONDS)
  const foodItemId =
    settings.autoEat && settings.foodItemId ? getContractItemId(settings.foodItemId) : 0n

  return writeIdleIslesContract(provider, account, {
    functionName: 'configureAutoSettle',
    args: [
      ZERO_ADDRESS,
      expiresAt,
      CHAIN_COMBAT_SETTLE_CYCLE_LIMIT,
      settings.stopAtHitpoints,
      settings.autoEat,
      settings.maxFoodPerSettle,
      foodItemId,
    ],
  })
}

export async function writeClearCombatSafety(provider: BrowserEthereumProvider, account: Address) {
  return writeIdleIslesContract(provider, account, { functionName: 'clearAutoSettle', args: [] })
}

export async function writeSetCombatStylePreference(
  provider: BrowserEthereumProvider,
  account: Address,
  style: CombatTrainingStyle,
) {
  return writeIdleIslesContract(provider, account, {
    functionName: 'setCombatStylePreference',
    args: [getContractCombatStyle(style)],
  })
}

export async function writeTravelToArea(
  provider: BrowserEthereumProvider,
  account: Address,
  areaId: AreaId,
) {
  return writeIdleIslesContract(provider, account, {
    functionName: 'travelToArea',
    args: [CONTRACT_AREA_IDS[areaId]],
  })
}

export async function writeCreateOrder(
  provider: BrowserEthereumProvider,
  account: Address,
  itemId: ItemId,
  amount: number,
  priceEach: number,
) {
  const hoardHallAddress = requireHoardHallAddress()
  await ensureHoardHallApproval(provider, account, hoardHallAddress)

  return writeHoardHallContract(provider, account, {
    functionName: 'createOrder',
    args: [getContractItemId(itemId), BigInt(amount), BigInt(priceEach)],
  })
}

export async function writeBuyOrder(
  provider: BrowserEthereumProvider,
  account: Address,
  orderId: bigint,
  amount = 1,
) {
  const hoardHallAddress = requireHoardHallAddress()
  await ensureHoardHallApproval(provider, account, hoardHallAddress)

  return writeHoardHallContract(provider, account, {
    functionName: 'buy',
    args: [orderId, BigInt(amount)],
  })
}

export async function writeCancelOrder(
  provider: BrowserEthereumProvider,
  account: Address,
  orderId: bigint,
) {
  return writeHoardHallContract(provider, account, {
    functionName: 'cancelOrder',
    args: [orderId],
  })
}

export async function writeMossCreateProfile() {
  return writeMossIdleIslesContract({ functionName: 'createProfile', args: [] })
}

export async function writeMossClaim() {
  return writeMossIdleIslesContract({ functionName: 'claim', args: [] })
}

export async function writeMossStartActivity(activityId: ActivityId) {
  const activity = getContractActivity(activityId)
  if (!activity) {
    throw new Error('Activity is not available onchain yet.')
  }

  if (activity.kind === 'combat') {
    return writeMossIdleIslesContract({
      functionName: 'startCombat',
      args: [activity.id],
    })
  }

  if (activity.kind === 'gather') {
    return writeMossIdleIslesContract({
      functionName: 'startGather',
      args: [activity.id],
    })
  }

  return writeMossIdleIslesContract({
    functionName: 'startArtisan',
    args: [activity.id],
  })
}

export async function writeMossEquip(itemId: ItemId) {
  return writeMossIdleIslesContract({
    functionName: 'equip',
    args: [getContractItemId(itemId)],
  })
}

export async function writeMossUnequip(slotIndex: number) {
  return writeMossIdleIslesContract({
    functionName: 'unequip',
    args: [slotIndex],
  })
}

export async function writeMossEatFood(itemId: ItemId) {
  return writeMossIdleIslesContract({
    functionName: 'eatFood',
    args: [getContractItemId(itemId)],
  })
}

export async function writeMossConfigureCombatSafety(settings: {
  autoEat: boolean
  stopAtHitpoints: number
  foodItemId: ItemId | null
  maxFoodPerSettle: number
}) {
  if (
    settings.autoEat &&
    (!settings.foodItemId || !CONTRACT_FOOD_ITEMS.has(settings.foodItemId))
  ) {
    throw new Error('Select cooked food for onchain auto-eat.')
  }

  const latestBlock = await publicClient.getBlock()
  const expiresAt = latestBlock.timestamp + BigInt(CHAIN_SAFETY_DURATION_SECONDS)
  const foodItemId =
    settings.autoEat && settings.foodItemId ? getContractItemId(settings.foodItemId) : 0n

  return writeMossIdleIslesContract({
    functionName: 'configureAutoSettle',
    args: [
      ZERO_ADDRESS,
      expiresAt,
      CHAIN_COMBAT_SETTLE_CYCLE_LIMIT,
      settings.stopAtHitpoints,
      settings.autoEat,
      settings.maxFoodPerSettle,
      foodItemId,
    ],
  })
}

export async function writeMossClearCombatSafety() {
  return writeMossIdleIslesContract({ functionName: 'clearAutoSettle', args: [] })
}

export async function writeMossSetCombatStylePreference(style: CombatTrainingStyle) {
  return writeMossIdleIslesContract({
    functionName: 'setCombatStylePreference',
    args: [getContractCombatStyle(style)],
  })
}

export async function writeMossTravelToArea(areaId: AreaId) {
  return writeMossIdleIslesContract(
    {
      functionName: 'travelToArea',
      args: [CONTRACT_AREA_IDS[areaId]],
    },
    { silent: false },
  )
}

export async function writeMossCreateOrder(
  account: Address,
  itemId: ItemId,
  amount: number,
  priceEach: number,
) {
  const hoardHallAddress = requireHoardHallAddress()
  await ensureMossHoardHallApproval(account, hoardHallAddress)

  return writeMossHoardHallContract({
    functionName: 'createOrder',
    args: [getContractItemId(itemId), BigInt(amount), BigInt(priceEach)],
  })
}

export async function writeMossBuyOrder(account: Address, orderId: bigint, amount = 1) {
  const hoardHallAddress = requireHoardHallAddress()
  await ensureMossHoardHallApproval(account, hoardHallAddress)

  return writeMossHoardHallContract({
    functionName: 'buy',
    args: [orderId, BigInt(amount)],
  })
}

export async function writeMossCancelOrder(orderId: bigint) {
  return writeMossHoardHallContract({
    functionName: 'cancelOrder',
    args: [orderId],
  })
}

export function getChainOrderId(orderId: string): bigint | null {
  if (!orderId.startsWith('chain-')) {
    return null
  }

  try {
    return BigInt(orderId.slice('chain-'.length))
  } catch {
    return null
  }
}

function createEmptySkills(): SkillBook {
  return SKILLS.reduce((book, skill) => {
    book[skill.id] = { xp: 0 }
    return book
  }, {} as SkillBook)
}

function createEmptyInventory(): Inventory {
  return (Object.keys(ITEMS) as ItemId[]).reduce((bag, itemId) => {
    bag[itemId] = 0
    return bag
  }, {} as Inventory)
}

function createEmptyEquipment(): Equipment {
  return EQUIPMENT_SLOTS.reduce((gear, slot) => {
    gear[slot] = null
    return gear
  }, {} as Equipment)
}

function formatActiveTask(activeTask: readonly [number, bigint, bigint]) {
  const activityId = CONTRACT_ACTIVITY_BY_ID[Number(activeTask[0])]
  if (!activityId) {
    return null
  }

  return {
    id: activityId,
    startedAt: Number(activeTask[1]) * 1000,
    lastClaimAt: Number(activeTask[2]) * 1000,
  }
}

function formatChainArea(areaId: number): AreaId {
  return AREA_BY_CONTRACT_ID[areaId.toString()] ?? STARTER_AREA_ID
}

function formatUnlockedAreas(areaUnlockedValues: readonly boolean[]): AreaId[] {
  const unlockedAreaIds = AREAS.flatMap((area, index) =>
    areaUnlockedValues[index] ? [area.id] : [],
  )

  return unlockedAreaIds.includes(STARTER_AREA_ID)
    ? unlockedAreaIds
    : [STARTER_AREA_ID, ...unlockedAreaIds]
}

function formatCombatStylePreference(value: number): CombatTrainingStyle {
  if (value === 2) {
    return 'ranged'
  }
  if (value === 3) {
    return 'magic'
  }
  if (value === 1) {
    return 'attack'
  }

  return 'auto'
}

function getContractCombatStyle(style: CombatTrainingStyle): number {
  if (style === 'ranged') {
    return 2
  }
  if (style === 'magic') {
    return 3
  }
  if (style === 'attack') {
    return 1
  }

  return 0
}

async function readChainMarketOrders(
  address: Address | null,
  account: Address,
): Promise<MarketOrder[]> {
  if (!address) {
    return []
  }

  const nextOrderId = await publicClient.readContract({
    address,
    abi: hoardHallAbi,
    functionName: 'nextOrderId',
  })
  const latestOrderId = toSafeNumber(nextOrderId) - 1

  if (latestOrderId <= 0) {
    return []
  }

  const firstOrderId = Math.max(1, latestOrderId - CHAIN_MARKET_SCAN_LIMIT + 1)
  const orderIds = Array.from(
    { length: latestOrderId - firstOrderId + 1 },
    (_, index) => BigInt(firstOrderId + index),
  )

  const orders = await Promise.all(
    orderIds.map(async (orderId) => {
      const order = await publicClient.readContract({
        address,
        abi: hoardHallAbi,
        functionName: 'orders',
        args: [orderId],
      })

      return formatChainOrder(account, orderId, order)
    }),
  )

  return orders.filter((order): order is MarketOrder => Boolean(order))
}

function formatChainOrder(
  account: Address,
  orderId: bigint,
  order: readonly [Address, bigint, bigint, bigint],
): MarketOrder | null {
  const [seller, contractItemId, priceEach, amountRemaining] = order
  const itemId = ITEM_BY_CONTRACT_ID[contractItemId.toString()]

  if (!itemId || amountRemaining === 0n) {
    return null
  }

  return {
    id: `chain-${orderId.toString()}`,
    itemId,
    seller: seller.toLowerCase() === account.toLowerCase() ? 'Player' : 'Trader',
    side: 'sell',
    quantity: toSafeNumber(amountRemaining),
    unitPrice: Math.max(1, toSafeNumber(priceEach)),
    createdAt: toSafeNumber(orderId),
  }
}

function toSafeNumber(value: bigint): number {
  return Number(value > BigInt(Number.MAX_SAFE_INTEGER) ? BigInt(Number.MAX_SAFE_INTEGER) : value)
}

function createMossGameplayPermission(): Permission {
  const address = requireIdleIslesAddress()

  return {
    expiry: Math.floor(Date.now() / 1000) + MOSS_GAMEPLAY_SESSION_SECONDS,
    permissions: {
      calls: MOSS_GAMEPLAY_CALLS.map((signature) => ({
        to: address,
        signature,
      })),
      spend: [],
    },
  }
}

async function writeMossIdleIslesContract(
  request: IdleIslesWriteRequest,
  options: { silent?: boolean } = {},
) {
  const address = requireIdleIslesAddress()

  return callMossContract({
    address,
    abi: idleIslesAbi,
    functionName: request.functionName,
    args: [...request.args],
    silent: options.silent ?? true,
  })
}

async function writeMossHoardHallContract(request: HoardHallWriteRequest) {
  const address = requireHoardHallAddress()

  return callMossContract({
    address,
    abi: hoardHallAbi,
    functionName: request.functionName,
    args: [...request.args],
    silent: false,
  })
}

async function ensureMossHoardHallApproval(account: Address, hoardHallAddress: Address) {
  const gameAddress = requireIdleIslesAddress()
  const approved = await publicClient.readContract({
    address: gameAddress,
    abi: erc1155ApprovalAbi,
    functionName: 'isApprovedForAll',
    args: [account, hoardHallAddress],
  })

  if (approved) {
    return
  }

  await callMossContract({
    address: gameAddress,
    abi: erc1155ApprovalAbi,
    functionName: 'setApprovalForAll',
    args: [hoardHallAddress, true],
    silent: false,
  })
}

async function callMossContract({
  address,
  abi,
  functionName,
  args,
  silent,
}: {
  address: Address
  abi: unknown
  functionName: string
  args: unknown[]
  silent: boolean
}) {
  await initialiseMossWallet()
  const result = await mega.callContract({
    address,
    abi,
    functionName,
    args,
    silent,
    silentUIApproveFallback: silent,
  })

  return requireMossTransaction(result)
}

function requireMossTransaction(result: TransactionResult): Hex {
  if (result.status !== 'approved') {
    throw new Error(result.error || 'MOSS transaction was not approved.')
  }

  const hash = result.receipt?.hash ?? result.receipts?.[0]?.hash
  if (!hash) {
    throw new Error('MOSS transaction completed without a receipt hash.')
  }

  return hash
}

async function writeIdleIslesContract(
  provider: BrowserEthereumProvider,
  account: Address,
  request: IdleIslesWriteRequest,
) {
  const address = requireIdleIslesAddress()
  const gasEstimate = await publicClient.estimateContractGas({
    account,
    address,
    abi: idleIslesAbi,
    ...request,
  })
  const gas = withGasBuffer(gasEstimate)
  const walletClient = createIdleWalletClient(provider, account)
  const hash = await walletClient.writeContract({
    address,
    abi: idleIslesAbi,
    ...request,
    gas,
  })

  await waitForTransaction(hash)
  return hash
}

async function writeHoardHallContract(
  provider: BrowserEthereumProvider,
  account: Address,
  request: HoardHallWriteRequest,
) {
  const address = requireHoardHallAddress()
  const walletClient = createIdleWalletClient(provider, account)

  if (request.functionName === 'createOrder') {
    const gasEstimate = await publicClient.estimateContractGas({
      account,
      address,
      abi: hoardHallAbi,
      functionName: 'createOrder',
      args: request.args,
    })
    const hash = await walletClient.writeContract({
      address,
      abi: hoardHallAbi,
      functionName: 'createOrder',
      args: request.args,
      gas: withGasBuffer(gasEstimate),
    })

    await waitForTransaction(hash)
    return hash
  }

  if (request.functionName === 'buy') {
    const gasEstimate = await publicClient.estimateContractGas({
      account,
      address,
      abi: hoardHallAbi,
      functionName: 'buy',
      args: request.args,
    })
    const hash = await walletClient.writeContract({
      address,
      abi: hoardHallAbi,
      functionName: 'buy',
      args: request.args,
      gas: withGasBuffer(gasEstimate),
    })

    await waitForTransaction(hash)
    return hash
  }

  const gasEstimate = await publicClient.estimateContractGas({
    account,
    address,
    abi: hoardHallAbi,
    functionName: 'cancelOrder',
    args: request.args,
  })
  const hash = await walletClient.writeContract({
    address,
    abi: hoardHallAbi,
    functionName: 'cancelOrder',
    args: request.args,
    gas: withGasBuffer(gasEstimate),
  })

  await waitForTransaction(hash)
  return hash
}

async function ensureHoardHallApproval(
  provider: BrowserEthereumProvider,
  account: Address,
  hoardHallAddress: Address,
) {
  const gameAddress = requireIdleIslesAddress()
  const approved = await publicClient.readContract({
    address: gameAddress,
    abi: erc1155ApprovalAbi,
    functionName: 'isApprovedForAll',
    args: [account, hoardHallAddress],
  })

  if (approved) {
    return
  }

  const request = {
    functionName: 'setApprovalForAll',
    args: [hoardHallAddress, true] as const,
  } as const
  const gasEstimate = await publicClient.estimateContractGas({
    account,
    address: gameAddress,
    abi: erc1155ApprovalAbi,
    ...request,
  })
  const gas = withGasBuffer(gasEstimate)
  const walletClient = createIdleWalletClient(provider, account)
  const hash = await walletClient.writeContract({
    address: gameAddress,
    abi: erc1155ApprovalAbi,
    ...request,
    gas,
  })

  await waitForTransaction(hash)
}

function withGasBuffer(gasEstimate: bigint): bigint {
  return gasEstimate + (gasEstimate * GAS_BUFFER_BPS) / 10_000n + MIN_GAS_BUFFER
}

function createIdleWalletClient(provider: BrowserEthereumProvider, account: Address) {
  return createWalletClient({
    account,
    chain: megaethTestnet,
    transport: custom(provider),
  })
}

async function waitForTransaction(hash: Hex) {
  await publicClient.waitForTransactionReceipt({ hash })
}

function requireIdleIslesAddress(): Address {
  const address = getIdleIslesAddress()
  if (!address) {
    throw new Error('Set VITE_IDLE_ISLES_ADDRESS to use chain mode.')
  }

  return address
}

function requireHoardHallAddress(): Address {
  const address = getHoardHallAddress()
  if (!address) {
    throw new Error('Set VITE_HOARD_HALL_ADDRESS to use Hoard Hall.')
  }

  return address
}
