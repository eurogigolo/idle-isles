import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  isAddress,
  parseAbi,
  type Hash,
  type PublicClient,
  type WalletClient,
} from 'viem'
import { mega, type ConnectionStatus, type Permission, type TransactionResult } from '@megaeth-labs/wallet-sdk'
import { megaethTestnet } from 'viem/chains'
import {
  CONTRACT_ACTIVITY_IDS,
  CONTRACT_ITEM_IDS,
  CONTRACT_SECTOR_IDS,
  type ContractActivityIds,
  type ContractStartKind,
} from './generated/contentIds'
import {
  ITEMS,
  MODULE_SLOTS,
  SECTORS,
  SKILLS,
  createInitialState,
  type ActivityId,
  type CombatSettings,
  type GameState,
  type ItemId,
  type MarketOrder,
  type ModuleSlot,
  type SectorId,
} from './game'

export type Address = `0x${string}`

interface EthereumProvider {
  request(args: { method: string; params?: unknown[] | Record<string, unknown> }): Promise<unknown>
}

declare global {
  interface Window {
    ethereum?: EthereumProvider
  }
}

export interface ChainSnapshot {
  account: Address
  blockNumber: bigint
  game: GameState
  hasProfile: boolean
}

export interface ChainContentIds {
  activities: ContractActivityIds
  items: Record<ItemId, bigint>
  sectors: Record<SectorId, number>
}

export interface ChainWriteRequest {
  functionName:
    | 'createProfile'
    | 'startGathering'
    | 'startProduction'
    | 'startCombat'
    | 'claimMission'
    | 'stopMission'
    | 'equipModule'
    | 'unequipModule'
    | 'repairHull'
    | 'travelToSector'
    | 'setCombatSettings'
  args?: readonly unknown[]
}

interface BrowserClients {
  account: Address
  walletClient: WalletClient
}

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
const MARKET_READ_LIMIT = 120n
export const MEGAETH_CHAIN_ID_HEX = `0x${megaethTestnet.id.toString(16)}`
export const MOSS_GAMEPLAY_SESSION_SECONDS = 24 * 60 * 60

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

let mossInitialisePromise: Promise<void> | null = null

const IDLE_GALACTICA_ABI = parseAbi([
  'function activeMission(address player) view returns (uint16 activityId, uint64 startedAt, uint64 lastResolvedAt)',
  'function balanceOf(address account, uint256 id) view returns (uint256)',
  'function balanceOfBatch(address[] accounts, uint256[] ids) view returns (uint256[])',
  'function claimMission()',
  'function combatSettings(address player) view returns (bool autoRepair, uint16 stopAtHull, uint256 repairItemId, uint16 maxRepairItemsPerClaim)',
  'function createProfile()',
  'function currentHull(address player) view returns (uint16)',
  'function currentSectorId(address player) view returns (uint8)',
  'function equipModule(uint256 itemId)',
  'function hasProfile(address player) view returns (bool)',
  'function isApprovedForAll(address account, address operator) view returns (bool)',
  'function isSectorUnlocked(address player, uint8 sectorId) view returns (bool)',
  'function maxHull(address player) view returns (uint16)',
  'function moduleInSlot(address player, uint8 slot) view returns (uint256)',
  'function repairHull(uint256 itemId)',
  'function setApprovalForAll(address operator, bool approved)',
  'function setCombatSettings(bool autoRepair, uint16 stopAtHull, uint256 repairItemId, uint16 maxRepairItemsPerClaim)',
  'function skillXp(address player, uint8 skill) view returns (uint64)',
  'function startCombat(uint16 activityId)',
  'function startGathering(uint16 activityId)',
  'function startProduction(uint16 activityId)',
  'function stopMission()',
  'function travelToSector(uint8 sectorId)',
  'function unequipModule(uint8 slot)',
])

const TRADE_RELAY_ABI = parseAbi([
  'function buy(uint256 orderId, uint64 amount)',
  'function cancelOrder(uint256 orderId)',
  'function createOrder(uint256 itemId, uint64 amount, uint128 priceEach)',
  'function nextOrderId() view returns (uint256)',
  'function orders(uint256 orderId) view returns (address seller, uint256 itemId, uint128 priceEach, uint64 amountRemaining)',
])

const publicClient = createPublicClient({
  chain: megaethTestnet,
  transport: http(),
})

const ITEM_BY_CHAIN_ID = new Map(
  (Object.entries(CONTRACT_ITEM_IDS) as [ItemId, bigint][]).map(([itemId, chainId]) => [
    chainId,
    itemId,
  ]),
)

const SECTOR_BY_CHAIN_ID = new Map(
  (Object.entries(CONTRACT_SECTOR_IDS) as [SectorId, number][]).map(([sectorId, chainId]) => [
    chainId,
    sectorId,
  ]),
)

const ACTIVITY_BY_CHAIN_ID = new Map(
  (Object.entries(CONTRACT_ACTIVITY_IDS) as [ActivityId, { id: number; kind: ContractStartKind }][]).map(
    ([activityId, entry]) => [entry.id, activityId],
  ),
)

export const CHAIN_CONTENT_IDS: ChainContentIds = {
  sectors: CONTRACT_SECTOR_IDS,
  items: CONTRACT_ITEM_IDS,
  activities: CONTRACT_ACTIVITY_IDS,
}

export const MOSS_GAMEPLAY_CALLS = [
  'createProfile()',
  'startGathering(uint16)',
  'startProduction(uint16)',
  'startCombat(uint16)',
  'claimMission()',
  'stopMission()',
  'equipModule(uint256)',
  'unequipModule(uint8)',
  'repairHull(uint256)',
  'travelToSector(uint8)',
  'setCombatSettings(bool,uint16,uint256,uint16)',
] as const

export function getIdleGalacticaAddress(): Address | null {
  return readAddress('VITE_IDLE_GALACTICA_ADDRESS')
}

export function getTradeRelayAddress(): Address | null {
  return readAddress('VITE_TRADE_RELAY_ADDRESS')
}

export function isChainModeReady(): boolean {
  return Boolean(getIdleGalacticaAddress() && getTradeRelayAddress())
}

export async function connectWallet(): Promise<Address> {
  return requestWalletAccount()
}

export async function addMegaEthTestnet(): Promise<void> {
  await getEthereumProvider().request({
    method: 'wallet_addEthereumChain',
    params: [MEGAETH_TESTNET_PARAMS],
  })
}

export async function initialiseMossWallet(): Promise<void> {
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
  const address = getIdleGalacticaAddress()
  if (!address) return false

  await initialiseMossWallet()
  const permissions = await mega.getPermissions(account ?? undefined)
  const grant = permissions?.permissions
  const expiresSoon = Math.floor(Date.now() / 1000) + 60

  if (!grant || grant.expiry <= expiresSoon) return false

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

export async function grantMossGameplaySession(): Promise<void> {
  await initialiseMossWallet()
  const result = await mega.grantPermissions({
    permissions: createMossGameplayPermission(),
  })

  if (result.status !== 'approved') {
    throw new Error('MOSS gameplay session was not approved.')
  }
}

export function getContractActivity(activityId: ActivityId): {
  id: number
  kind: ContractStartKind
} | null {
  return CONTRACT_ACTIVITY_IDS[activityId] ?? null
}

export function getContractItemId(itemId: ItemId): bigint {
  return CONTRACT_ITEM_IDS[itemId]
}

export function getContractSectorId(sectorId: SectorId): number {
  return CONTRACT_SECTOR_IDS[sectorId]
}

export async function readChainSnapshot(account: Address): Promise<ChainSnapshot> {
  const gameAddress = requireIdleGalacticaAddress()
  const hasProfile = await publicClient.readContract({
    address: gameAddress,
    abi: IDLE_GALACTICA_ABI,
    functionName: 'hasProfile',
    args: [account],
  })
  const marketOrders = await readTradeRelayOrders(publicClient)
  const blockNumber = await publicClient.getBlockNumber()

  if (!hasProfile) {
    return {
      account,
      blockNumber,
      game: createEmptyChainState(marketOrders),
      hasProfile,
    }
  }

  const [
    balances,
    skillXp,
    activeMission,
    settings,
    currentHull,
    maxHull,
    sectorId,
    unlockedSectors,
    modules,
  ] = await Promise.all([
    readCargoBalances(publicClient, account),
    readSkillXp(publicClient, account),
    publicClient.readContract({
      address: gameAddress,
      abi: IDLE_GALACTICA_ABI,
      functionName: 'activeMission',
      args: [account],
    }),
    publicClient.readContract({
      address: gameAddress,
      abi: IDLE_GALACTICA_ABI,
      functionName: 'combatSettings',
      args: [account],
    }),
    publicClient.readContract({
      address: gameAddress,
      abi: IDLE_GALACTICA_ABI,
      functionName: 'currentHull',
      args: [account],
    }),
    publicClient.readContract({
      address: gameAddress,
      abi: IDLE_GALACTICA_ABI,
      functionName: 'maxHull',
      args: [account],
    }),
    publicClient.readContract({
      address: gameAddress,
      abi: IDLE_GALACTICA_ABI,
      functionName: 'currentSectorId',
      args: [account],
    }),
    readUnlockedSectors(publicClient, account),
    readShipModules(publicClient, account),
  ])

  const game = createInitialState(Date.now())
  game.cargo = balances
  game.skills = skillXp
  game.currentSectorId = sectorFromChainId(Number(sectorId))
  game.unlockedSectors = unlockedSectors
  game.ship = {
    currentHull: Number(currentHull),
    maxHull: Number(maxHull),
    modules,
  }
  game.activeMission = activeMissionFromChain(activeMission)
  game.combatSettings = combatSettingsFromChain(settings)
  game.marketOrders = marketOrders
  game.eventLog = [`On-chain profile synced at block ${blockNumber.toString()}.`]
  game.lastSeenAt = Date.now()

  return {
    account,
    blockNumber,
    game,
    hasProfile,
  }
}

export async function writeChainRequest(request: ChainWriteRequest): Promise<Hash> {
  switch (request.functionName) {
    case 'createProfile':
      return writeCreateProfile()
    case 'claimMission':
      return submitGameWrite('claimMission', [])
    case 'stopMission':
      return submitGameWrite('stopMission', [])
    case 'startGathering':
      return submitGameWrite('startGathering', [Number(request.args?.[0] ?? 0)])
    case 'startProduction':
      return submitGameWrite('startProduction', [Number(request.args?.[0] ?? 0)])
    case 'startCombat':
      return submitGameWrite('startCombat', [Number(request.args?.[0] ?? 0)])
    case 'equipModule':
      return submitGameWrite('equipModule', [BigInt(request.args?.[0] as bigint)])
    case 'unequipModule':
      return submitGameWrite('unequipModule', [Number(request.args?.[0] ?? 0)])
    case 'repairHull':
      return submitGameWrite('repairHull', [BigInt(request.args?.[0] as bigint)])
    case 'travelToSector':
      return submitGameWrite('travelToSector', [Number(request.args?.[0] ?? 0)])
    case 'setCombatSettings':
      return submitGameWrite('setCombatSettings', request.args ?? [])
  }
}

export async function writeCreateProfile(): Promise<Hash> {
  return submitGameWrite('createProfile', [])
}

export async function writeStartMission(activityId: ActivityId): Promise<Hash> {
  const activity = getContractActivity(activityId)
  if (!activity) throw new Error('This mission is not registered on-chain.')

  if (activity.kind === 'gathering') {
    return submitGameWrite('startGathering', [activity.id])
  }
  if (activity.kind === 'production') {
    return submitGameWrite('startProduction', [activity.id])
  }
  return submitGameWrite('startCombat', [activity.id])
}

export async function writeStopMission(): Promise<Hash> {
  return submitGameWrite('stopMission', [])
}

export async function writeClaimMission(): Promise<Hash> {
  return submitGameWrite('claimMission', [])
}

export async function writeEquipModule(itemId: ItemId): Promise<Hash> {
  return submitGameWrite('equipModule', [getContractItemId(itemId)])
}

export async function writeUnequipModule(slot: ModuleSlot): Promise<Hash> {
  return submitGameWrite('unequipModule', [MODULE_SLOTS.indexOf(slot)])
}

export async function writeRepairHull(itemId: ItemId): Promise<Hash> {
  return submitGameWrite('repairHull', [getContractItemId(itemId)])
}

export async function writeTravelToSector(sectorId: SectorId): Promise<Hash> {
  return submitGameWrite('travelToSector', [getContractSectorId(sectorId)])
}

export async function writeCombatSettings(settings: CombatSettings): Promise<Hash> {
  return submitGameWrite('setCombatSettings', [
    settings.autoRepair,
    settings.stopAtHull,
    getContractItemId(settings.repairItemId),
    settings.maxRepairItemsPerClaim,
  ])
}

export async function writeMossCreateProfile(): Promise<Hash> {
  return writeMossGameContract('createProfile', [])
}

export async function writeMossStartMission(activityId: ActivityId): Promise<Hash> {
  const activity = getContractActivity(activityId)
  if (!activity) throw new Error('This mission is not registered on-chain.')

  if (activity.kind === 'gathering') {
    return writeMossGameContract('startGathering', [activity.id])
  }
  if (activity.kind === 'production') {
    return writeMossGameContract('startProduction', [activity.id])
  }
  return writeMossGameContract('startCombat', [activity.id])
}

export async function writeMossClaimMission(): Promise<Hash> {
  return writeMossGameContract('claimMission', [])
}

export async function writeMossStopMission(): Promise<Hash> {
  return writeMossGameContract('stopMission', [])
}

export async function writeMossEquipModule(itemId: ItemId): Promise<Hash> {
  return writeMossGameContract('equipModule', [getContractItemId(itemId)])
}

export async function writeMossUnequipModule(slot: ModuleSlot): Promise<Hash> {
  return writeMossGameContract('unequipModule', [MODULE_SLOTS.indexOf(slot)])
}

export async function writeMossRepairHull(itemId: ItemId): Promise<Hash> {
  return writeMossGameContract('repairHull', [getContractItemId(itemId)])
}

export async function writeMossCombatSettings(settings: CombatSettings): Promise<Hash> {
  return writeMossGameContract('setCombatSettings', [
    settings.autoRepair,
    settings.stopAtHull,
    getContractItemId(settings.repairItemId),
    settings.maxRepairItemsPerClaim,
  ])
}

export async function writeMossTravelToSector(sectorId: SectorId): Promise<Hash> {
  return writeMossGameContract('travelToSector', [getContractSectorId(sectorId)], { silent: false })
}

export async function writeBuyTradeRelayOrder(orderId: string): Promise<Hash> {
  await ensureTradeRelayApproval()
  return submitTradeRelayWrite('buy', [BigInt(orderId), 1n])
}

export async function writeCreateTradeRelayOrder(itemId: ItemId, unitPrice: number): Promise<Hash> {
  await ensureTradeRelayApproval()
  return submitTradeRelayWrite('createOrder', [getContractItemId(itemId), 1n, BigInt(unitPrice)])
}

export async function writeMossBuyTradeRelayOrder(account: Address, orderId: string): Promise<Hash> {
  await ensureMossTradeRelayApproval(account)
  return writeMossTradeRelayContract('buy', [BigInt(orderId), 1n])
}

export async function writeMossCreateTradeRelayOrder(
  account: Address,
  itemId: ItemId,
  unitPrice: number,
): Promise<Hash> {
  await ensureMossTradeRelayApproval(account)
  return writeMossTradeRelayContract('createOrder', [getContractItemId(itemId), 1n, BigInt(unitPrice)])
}

async function readCargoBalances(
  publicClient: PublicClient,
  account: Address,
): Promise<GameState['cargo']> {
  const gameAddress = requireIdleGalacticaAddress()
  const itemIds = Object.keys(ITEMS) as ItemId[]
  const balances = await publicClient.readContract({
    address: gameAddress,
    abi: IDLE_GALACTICA_ABI,
    functionName: 'balanceOfBatch',
    args: [itemIds.map(() => account), itemIds.map((itemId) => getContractItemId(itemId))],
  })

  return itemIds.reduce((cargo, itemId, index) => {
    cargo[itemId] = safeNumber(balances[index] ?? 0n)
    return cargo
  }, {} as GameState['cargo'])
}

async function readSkillXp(
  publicClient: PublicClient,
  account: Address,
): Promise<GameState['skills']> {
  const gameAddress = requireIdleGalacticaAddress()
  const xp = await Promise.all(
    SKILLS.map((_, index) =>
      publicClient.readContract({
        address: gameAddress,
        abi: IDLE_GALACTICA_ABI,
        functionName: 'skillXp',
        args: [account, index],
      }),
    ),
  )

  return SKILLS.reduce((skills, skill, index) => {
    skills[skill.id] = { xp: safeNumber(xp[index] ?? 0n) }
    return skills
  }, {} as GameState['skills'])
}

async function readUnlockedSectors(
  publicClient: PublicClient,
  account: Address,
): Promise<GameState['unlockedSectors']> {
  const gameAddress = requireIdleGalacticaAddress()
  const unlocked = await Promise.all(
    SECTORS.map((sector) =>
      publicClient.readContract({
        address: gameAddress,
        abi: IDLE_GALACTICA_ABI,
        functionName: 'isSectorUnlocked',
        args: [account, getContractSectorId(sector.id)],
      }),
    ),
  )

  return SECTORS.reduce((record, sector, index) => {
    record[sector.id] = Boolean(unlocked[index])
    return record
  }, {} as GameState['unlockedSectors'])
}

async function readShipModules(
  publicClient: PublicClient,
  account: Address,
): Promise<GameState['ship']['modules']> {
  const gameAddress = requireIdleGalacticaAddress()
  const moduleIds = await Promise.all(
    MODULE_SLOTS.map((_, index) =>
      publicClient.readContract({
        address: gameAddress,
        abi: IDLE_GALACTICA_ABI,
        functionName: 'moduleInSlot',
        args: [account, index],
      }),
    ),
  )

  return MODULE_SLOTS.reduce((modules, slot, index) => {
    const itemId = itemFromChainId(moduleIds[index] ?? 0n)
    if (itemId) modules[slot] = itemId
    return modules
  }, {} as GameState['ship']['modules'])
}

async function readTradeRelayOrders(publicClient: PublicClient): Promise<MarketOrder[]> {
  const tradeRelayAddress = getTradeRelayAddress()
  if (!tradeRelayAddress) return []

  const nextOrderId = await publicClient.readContract({
    address: tradeRelayAddress,
    abi: TRADE_RELAY_ABI,
    functionName: 'nextOrderId',
  })
  const firstOrderId = nextOrderId > MARKET_READ_LIMIT ? nextOrderId - MARKET_READ_LIMIT : 1n
  const orderIds = rangeBigInt(firstOrderId, nextOrderId)

  const orders = await Promise.all(
    orderIds.map((orderId) =>
      publicClient.readContract({
        address: tradeRelayAddress,
        abi: TRADE_RELAY_ABI,
        functionName: 'orders',
        args: [orderId],
      }),
    ),
  )

  return orders.flatMap((order, index) => {
    const seller = tupleField<Address>(order, 'seller', 0)
    const amountRemaining = tupleField<bigint>(order, 'amountRemaining', 3)
    const itemId = itemFromChainId(tupleField<bigint>(order, 'itemId', 1))

    if (!itemId || seller.toLowerCase() === ZERO_ADDRESS || amountRemaining === 0n) {
      return []
    }

    return [
      {
        id: orderIds[index].toString(),
        itemId,
        quantity: safeNumber(amountRemaining),
        unitPrice: safeNumber(tupleField<bigint>(order, 'priceEach', 2)),
      },
    ]
  })
}

function activeMissionFromChain(activeMission: unknown): GameState['activeMission'] {
  const activityChainId = Number(tupleField<bigint>(activeMission, 'activityId', 0))
  const activityId = ACTIVITY_BY_CHAIN_ID.get(activityChainId)
  if (!activityId) return null

  return {
    activityId,
    startedAt: safeNumber(tupleField<bigint>(activeMission, 'startedAt', 1)) * 1000,
    lastClaimAt: safeNumber(tupleField<bigint>(activeMission, 'lastResolvedAt', 2)) * 1000,
  }
}

function combatSettingsFromChain(settings: unknown): CombatSettings {
  return {
    autoRepair: tupleField<boolean>(settings, 'autoRepair', 0),
    stopAtHull: Number(tupleField<number>(settings, 'stopAtHull', 1)),
    repairItemId: itemFromChainId(tupleField<bigint>(settings, 'repairItemId', 2)) ?? 'repairGel',
    maxRepairItemsPerClaim: Number(tupleField<number>(settings, 'maxRepairItemsPerClaim', 3)),
  }
}

function createEmptyChainState(marketOrders: MarketOrder[]): GameState {
  const game = createInitialState(Date.now())
  for (const itemId of Object.keys(ITEMS) as ItemId[]) {
    game.cargo[itemId] = 0
  }
  for (const skill of SKILLS) {
    game.skills[skill.id] = { xp: 0 }
  }
  game.ship = {
    currentHull: 0,
    maxHull: 100,
    modules: {},
  }
  game.currentSectorId = 'orbitalDock'
  game.unlockedSectors = {
    orbitalDock: true,
    innerBelt: false,
  }
  game.activeMission = null
  game.marketOrders = marketOrders
  game.eventLog = ['No on-chain profile found. Create a ship profile to begin.']
  return game
}

async function submitGameWrite(functionName: string, args: readonly unknown[]): Promise<Hash> {
  const { account, walletClient } = await getBrowserClients()
  const hash = await walletClient.writeContract({
    account,
    chain: null,
    address: requireIdleGalacticaAddress(),
    abi: IDLE_GALACTICA_ABI,
    functionName: functionName as never,
    args: args as never,
  })
  await publicClient.waitForTransactionReceipt({ hash })
  return hash
}

async function writeMossGameContract(
  functionName: string,
  args: readonly unknown[],
  options: { silent?: boolean } = {},
): Promise<Hash> {
  return callMossContract({
    address: requireIdleGalacticaAddress(),
    abi: IDLE_GALACTICA_ABI,
    functionName,
    args: [...args],
    silent: options.silent ?? true,
  })
}

async function submitTradeRelayWrite(functionName: string, args: readonly unknown[]): Promise<Hash> {
  const { account, walletClient } = await getBrowserClients()
  const hash = await walletClient.writeContract({
    account,
    chain: null,
    address: requireTradeRelayAddress(),
    abi: TRADE_RELAY_ABI,
    functionName: functionName as never,
    args: args as never,
  })
  await publicClient.waitForTransactionReceipt({ hash })
  return hash
}

async function writeMossTradeRelayContract(
  functionName: string,
  args: readonly unknown[],
): Promise<Hash> {
  return callMossContract({
    address: requireTradeRelayAddress(),
    abi: TRADE_RELAY_ABI,
    functionName,
    args: [...args],
    silent: false,
  })
}

async function ensureTradeRelayApproval(): Promise<void> {
  const { account, walletClient } = await getBrowserClients()
  const gameAddress = requireIdleGalacticaAddress()
  const tradeRelayAddress = requireTradeRelayAddress()
  const approved = await publicClient.readContract({
    address: gameAddress,
    abi: IDLE_GALACTICA_ABI,
    functionName: 'isApprovedForAll',
    args: [account, tradeRelayAddress],
  })

  if (approved) return

  const hash = await walletClient.writeContract({
    account,
    chain: null,
    address: gameAddress,
    abi: IDLE_GALACTICA_ABI,
    functionName: 'setApprovalForAll',
    args: [tradeRelayAddress, true],
  })
  await publicClient.waitForTransactionReceipt({ hash })
}

async function ensureMossTradeRelayApproval(account: Address): Promise<void> {
  const gameAddress = requireIdleGalacticaAddress()
  const tradeRelayAddress = requireTradeRelayAddress()
  const approved = await publicClient.readContract({
    address: gameAddress,
    abi: IDLE_GALACTICA_ABI,
    functionName: 'isApprovedForAll',
    args: [account, tradeRelayAddress],
  })

  if (approved) return

  await callMossContract({
    address: gameAddress,
    abi: IDLE_GALACTICA_ABI,
    functionName: 'setApprovalForAll',
    args: [tradeRelayAddress, true],
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
}): Promise<Hash> {
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

async function getBrowserClients(preferredAccount?: Address): Promise<BrowserClients> {
  const provider = getEthereumProvider()
  const transport = custom(provider)
  const account = preferredAccount ?? (await requestWalletAccount())

  return {
    account,
    walletClient: createWalletClient({ transport }),
  }
}

async function requestWalletAccount(): Promise<Address> {
  const accounts = await getEthereumProvider().request({ method: 'eth_requestAccounts' })
  const firstAccount = Array.isArray(accounts) ? toAddress(String(accounts[0] ?? '')) : null
  if (!firstAccount) {
    throw new Error('No wallet account was returned.')
  }
  return firstAccount
}

function getEthereumProvider(): EthereumProvider {
  if (!window.ethereum) {
    throw new Error('No injected wallet found. Install or unlock a browser wallet first.')
  }
  return window.ethereum
}

function requireIdleGalacticaAddress(): Address {
  const address = getIdleGalacticaAddress()
  if (!address) throw new Error('VITE_IDLE_GALACTICA_ADDRESS is not configured.')
  return address
}

function requireTradeRelayAddress(): Address {
  const address = getTradeRelayAddress()
  if (!address) throw new Error('VITE_TRADE_RELAY_ADDRESS is not configured.')
  return address
}

function createMossGameplayPermission(): Permission {
  const address = requireIdleGalacticaAddress()

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

function requireMossTransaction(result: TransactionResult): Hash {
  if (result.status !== 'approved') {
    throw new Error(result.error || 'MOSS transaction was not approved.')
  }

  const hash = result.receipt?.hash ?? result.receipts?.[0]?.hash
  if (!hash) {
    throw new Error('MOSS transaction completed without a receipt hash.')
  }

  return hash
}

function readAddress(key: string): Address | null {
  const value = import.meta.env[key]
  return toAddress(value)
}

export function toAddress(value: string | undefined): Address | null {
  return typeof value === 'string' && isAddress(value) ? value : null
}

function sectorFromChainId(chainId: number): SectorId {
  return SECTOR_BY_CHAIN_ID.get(chainId) ?? 'orbitalDock'
}

function itemFromChainId(chainId: bigint): ItemId | null {
  if (chainId === 0n) return null
  return ITEM_BY_CHAIN_ID.get(chainId) ?? null
}

function tupleField<T>(value: unknown, key: string, index: number): T {
  const record = value as Record<string, T>
  const list = value as T[]
  return record[key] ?? list[index]
}

function rangeBigInt(startInclusive: bigint, endExclusive: bigint): bigint[] {
  const values: bigint[] = []
  for (let current = startInclusive; current < endExclusive; current += 1n) {
    values.push(current)
  }
  return values
}

function safeNumber(value: bigint): number {
  return value > BigInt(Number.MAX_SAFE_INTEGER) ? Number.MAX_SAFE_INTEGER : Number(value)
}
