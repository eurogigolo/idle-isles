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
  EQUIPMENT_SLOTS,
  ITEMS,
  SKILLS,
  type ActivityId,
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
  active: {
    id: ActivityId
    startedAt: number
    lastClaimAt: number
  } | null
  pendingCycles: number
}

type ContractStartKind = 'combat' | 'gather' | 'artisan'

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

export const CONTRACT_ITEM_IDS = {
  crowns: 1n,
  ashLog: 2n,
  pineLog: 3n,
  oakLog: 4n,
  ironbarkLog: 5n,
  elderLog: 6n,
  spiritwoodLog: 7n,
  rawMinnow: 8n,
  cookedMinnow: 9n,
  rawTrout: 10n,
  cookedTrout: 11n,
  rawCod: 12n,
  cookedCod: 13n,
  rawTuna: 14n,
  cookedTuna: 15n,
  rawManta: 16n,
  cookedManta: 17n,
  rawLeviathan: 18n,
  cookedLeviathan: 19n,
  treantBark: 20n,
  hollowSeed: 21n,
  copperOre: 30n,
  tinOre: 31n,
  ironOre: 32n,
  coalOre: 33n,
  cobaltOre: 34n,
  tungstenOre: 37n,
  bronzeBar: 40n,
  ironBar: 41n,
  steelBar: 42n,
  tungstenBar: 43n,
  woodClub: 50n,
  barkShield: 51n,
  barkVest: 52n,
  copperDagger: 53n,
  copperHelm: 54n,
  copperPlate: 55n,
  ironSword: 56n,
  ironHelm: 57n,
  ironPlate: 58n,
  steelLongsword: 59n,
  steelHelm: 60n,
  steelPlate: 61n,
  tungstenBlade: 62n,
  tungstenHelm: 63n,
  tungstenPlate: 64n,
  barkLeggings: 65n,
  copperLegs: 66n,
  ironLegs: 67n,
  steelLegs: 68n,
  tungstenLegs: 69n,
  tannedHide: 70n,
  fieldCharm: 71n,
  runeDust: 72n,
  thickHide: 73n,
  ruggedHide: 74n,
  cobaltScale: 75n,
  wyrmHide: 76n,
  leatherCowl: 80n,
  leatherBody: 81n,
  hardleatherCowl: 82n,
  hardleatherBody: 83n,
  carapaceCowl: 84n,
  carapaceBody: 85n,
  cobaltMeshCowl: 86n,
  cobaltMeshBody: 87n,
  dragonhideCowl: 88n,
  dragonhideBody: 89n,
  leatherChaps: 90n,
  hardleatherChaps: 91n,
  carapaceLegs: 92n,
  cobaltMeshLegs: 93n,
  dragonhideChaps: 94n,
} satisfies Record<ItemId, bigint>

export const CONTRACT_ACTIVITY_IDS: Partial<
  Record<ActivityId, { id: number; kind: ContractStartKind }>
> = {
  trainingYard: { id: 101, kind: 'combat' },
  fieldRat: { id: 102, kind: 'combat' },
  mossCamp: { id: 103, kind: 'combat' },
  caveBat: { id: 104, kind: 'combat' },
  banditScout: { id: 105, kind: 'combat' },
  cryptKnight: { id: 106, kind: 'combat' },
  hollowTreant: { id: 107, kind: 'combat' },
  ashGrove: { id: 201, kind: 'gather' },
  copperRidge: { id: 202, kind: 'gather' },
  tinHollow: { id: 203, kind: 'gather' },
  riverBend: { id: 204, kind: 'gather' },
  woodArmory: { id: 301, kind: 'artisan' },
  smelter: { id: 302, kind: 'artisan' },
  copperArmory: { id: 303, kind: 'artisan' },
  cookMinnow: { id: 304, kind: 'artisan' },
} satisfies Partial<Record<ActivityId, { id: number; kind: ContractStartKind }>>

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

const idleIslesAbi = parseAbi([
  'function activeTask(address player) view returns (uint16 activityId, uint64 startedAt, uint64 lastResolvedAt)',
  'function balanceOf(address account, uint256 id) view returns (uint256)',
  'function buy(uint256 orderId, uint64 amount)',
  'function claim()',
  'function cancelOrder(uint256 orderId)',
  'function createOrder(uint256 itemId, uint64 amount, uint128 priceEach)',
  'function createProfile()',
  'function currentHitpoints(address player) view returns (uint16)',
  'function eatFood(uint256 itemId)',
  'function equip(uint256 itemId)',
  'function equippedItem(address player, uint8 slot) view returns (uint256)',
  'function hasProfile(address player) view returns (bool)',
  'function maxHitpoints(address player) view returns (uint256)',
  'function nextOrderId() view returns (uint256)',
  'function orders(uint256 orderId) view returns (address seller, uint256 itemId, uint128 priceEach, uint64 amountRemaining)',
  'function pendingCycles(address player) view returns (uint256)',
  'function skillXp(address player, uint8 skill) view returns (uint64)',
  'function startArtisan(uint16 activityId)',
  'function startCombat(uint16 activityId)',
  'function startGather(uint16 activityId)',
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
      active: null,
      pendingCycles: 0,
    }
  }

  const [
    currentHitpoints,
    maxHitpoints,
    activeTask,
    pendingCycles,
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
