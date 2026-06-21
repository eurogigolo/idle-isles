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
}

export const MEGAETH_CHAIN_ID_HEX = `0x${megaethTestnet.id.toString(16)}`
const CHAIN_MARKET_SCAN_LIMIT = 120

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
  'function activeTask(address player) view returns (uint16 activityId, uint64 startedAt, uint64 lastResolvedAt)',
  'function balanceOf(address account, uint256 id) view returns (uint256)',
  'function buy(uint256 orderId, uint64 amount)',
  'function claim()',
  'function cancelOrder(uint256 orderId)',
  'function createOrder(uint256 itemId, uint64 amount, uint128 priceEach)',
  'function createProfile()',
  'function currentAreaId(address player) view returns (uint8)',
  'function currentHitpoints(address player) view returns (uint16)',
  'function eatFood(uint256 itemId)',
  'function equip(uint256 itemId)',
  'function equippedItem(address player, uint8 slot) view returns (uint256)',
  'function hasProfile(address player) view returns (bool)',
  'function isAreaUnlocked(address player, uint8 areaId) view returns (bool)',
  'function maxHitpoints(address player) view returns (uint256)',
  'function nextOrderId() view returns (uint256)',
  'function orders(uint256 orderId) view returns (address seller, uint256 itemId, uint128 priceEach, uint64 amountRemaining)',
  'function pendingCycles(address player) view returns (uint256)',
  'function skillXp(address player, uint8 skill) view returns (uint64)',
  'function startArtisan(uint16 activityId)',
  'function startCombat(uint16 activityId)',
  'function startGather(uint16 activityId)',
  'function travelToArea(uint8 areaId)',
  'function unequip(uint8 slot)',
])

const publicClient = createPublicClient({
  chain: megaethTestnet,
  transport: http(),
})

export function getIdleIslesAddress(): Address | null {
  const address =
    import.meta.env.VITE_IDLE_ISLES_ADDRESS ?? import.meta.env.VITE_IDLE_ODYSSEY_ADDRESS
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

export async function readChainSnapshot(account: Address): Promise<ChainSnapshot> {
  const address = requireIdleIslesAddress()
  const [hasProfile, marketOrders] = await Promise.all([
    publicClient.readContract({
      address,
      abi: idleIslesAbi,
      functionName: 'hasProfile',
      args: [account],
    }),
    readChainMarketOrders(address, account),
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
  }
}

export async function writeCreateProfile(provider: BrowserEthereumProvider, account: Address) {
  const walletClient = createIdleWalletClient(provider, account)
  const hash = await walletClient.writeContract({
    address: requireIdleIslesAddress(),
    abi: idleIslesAbi,
    functionName: 'createProfile',
  })

  await waitForTransaction(hash)
  return hash
}

export async function writeClaim(provider: BrowserEthereumProvider, account: Address) {
  const walletClient = createIdleWalletClient(provider, account)
  const hash = await walletClient.writeContract({
    address: requireIdleIslesAddress(),
    abi: idleIslesAbi,
    functionName: 'claim',
  })

  await waitForTransaction(hash)
  return hash
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
    const walletClient = createIdleWalletClient(provider, account)
    const hash = await walletClient.writeContract({
      address: requireIdleIslesAddress(),
      abi: idleIslesAbi,
      functionName: 'startCombat',
      args: [activity.id],
    })

    await waitForTransaction(hash)
    return hash
  }

  if (activity.kind === 'gather') {
    const walletClient = createIdleWalletClient(provider, account)
    const hash = await walletClient.writeContract({
      address: requireIdleIslesAddress(),
      abi: idleIslesAbi,
      functionName: 'startGather',
      args: [activity.id],
    })

    await waitForTransaction(hash)
    return hash
  }

  const walletClient = createIdleWalletClient(provider, account)
  const hash = await walletClient.writeContract({
    address: requireIdleIslesAddress(),
    abi: idleIslesAbi,
    functionName: 'startArtisan',
    args: [activity.id],
  })

  await waitForTransaction(hash)
  return hash
}

export async function writeEquip(
  provider: BrowserEthereumProvider,
  account: Address,
  itemId: ItemId,
) {
  const walletClient = createIdleWalletClient(provider, account)
  const hash = await walletClient.writeContract({
    address: requireIdleIslesAddress(),
    abi: idleIslesAbi,
    functionName: 'equip',
    args: [getContractItemId(itemId)],
  })

  await waitForTransaction(hash)
  return hash
}

export async function writeUnequip(
  provider: BrowserEthereumProvider,
  account: Address,
  slotIndex: number,
) {
  const walletClient = createIdleWalletClient(provider, account)
  const hash = await walletClient.writeContract({
    address: requireIdleIslesAddress(),
    abi: idleIslesAbi,
    functionName: 'unequip',
    args: [slotIndex],
  })

  await waitForTransaction(hash)
  return hash
}

export async function writeEatFood(
  provider: BrowserEthereumProvider,
  account: Address,
  itemId: ItemId,
) {
  const walletClient = createIdleWalletClient(provider, account)
  const hash = await walletClient.writeContract({
    address: requireIdleIslesAddress(),
    abi: idleIslesAbi,
    functionName: 'eatFood',
    args: [getContractItemId(itemId)],
  })

  await waitForTransaction(hash)
  return hash
}

export async function writeTravelToArea(
  provider: BrowserEthereumProvider,
  account: Address,
  areaId: AreaId,
) {
  const walletClient = createIdleWalletClient(provider, account)
  const hash = await walletClient.writeContract({
    address: requireIdleIslesAddress(),
    abi: idleIslesAbi,
    functionName: 'travelToArea',
    args: [CONTRACT_AREA_IDS[areaId]],
  })

  await waitForTransaction(hash)
  return hash
}

export async function writeCreateOrder(
  provider: BrowserEthereumProvider,
  account: Address,
  itemId: ItemId,
  amount: number,
  priceEach: number,
) {
  const walletClient = createIdleWalletClient(provider, account)
  const hash = await walletClient.writeContract({
    address: requireIdleIslesAddress(),
    abi: idleIslesAbi,
    functionName: 'createOrder',
    args: [getContractItemId(itemId), BigInt(amount), BigInt(priceEach)],
  })

  await waitForTransaction(hash)
  return hash
}

export async function writeBuyOrder(
  provider: BrowserEthereumProvider,
  account: Address,
  orderId: bigint,
  amount = 1,
) {
  const walletClient = createIdleWalletClient(provider, account)
  const hash = await walletClient.writeContract({
    address: requireIdleIslesAddress(),
    abi: idleIslesAbi,
    functionName: 'buy',
    args: [orderId, BigInt(amount)],
  })

  await waitForTransaction(hash)
  return hash
}

export async function writeCancelOrder(
  provider: BrowserEthereumProvider,
  account: Address,
  orderId: bigint,
) {
  const walletClient = createIdleWalletClient(provider, account)
  const hash = await walletClient.writeContract({
    address: requireIdleIslesAddress(),
    abi: idleIslesAbi,
    functionName: 'cancelOrder',
    args: [orderId],
  })

  await waitForTransaction(hash)
  return hash
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

async function readChainMarketOrders(
  address: Address,
  account: Address,
): Promise<MarketOrder[]> {
  const nextOrderId = await publicClient.readContract({
    address,
    abi: idleIslesAbi,
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
        abi: idleIslesAbi,
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
