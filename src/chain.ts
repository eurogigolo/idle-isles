import {
  CONTRACT_ACTIVITY_IDS,
  CONTRACT_ITEM_IDS,
  CONTRACT_SECTOR_IDS,
  type ContractActivityIds,
  type ContractStartKind,
} from './generated/contentIds'
import type { ActivityId, CombatSettings, GameState, ItemId, ModuleSlot, SectorId } from './game'

export type Address = `0x${string}`

export interface ChainSnapshot {
  account: Address
  game: GameState
  blockNumber: bigint
}

export interface ChainContentIds {
  sectors: Record<SectorId, number>
  items: Record<ItemId, bigint>
  activities: ContractActivityIds
}

export interface ChainWriteRequest {
  functionName:
    | 'createProfile'
    | 'startGathering'
    | 'startProduction'
    | 'startCombat'
    | 'claimMission'
    | 'equipModule'
    | 'unequipModule'
    | 'repairHull'
    | 'travelToSector'
    | 'setCombatSettings'
  args?: readonly unknown[]
}

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

export async function readChainSnapshot(_account: Address): Promise<ChainSnapshot> {
  void _account
  throw chainDisabledError()
}

export async function writeChainRequest(_request: ChainWriteRequest): Promise<`0x${string}`> {
  void _request
  throw chainDisabledError()
}

export async function writeStartMission(_activityId: ActivityId): Promise<`0x${string}`> {
  void _activityId
  throw chainDisabledError()
}

export async function writeEquipModule(_itemId: ItemId): Promise<`0x${string}`> {
  void _itemId
  throw chainDisabledError()
}

export async function writeUnequipModule(_slot: ModuleSlot): Promise<`0x${string}`> {
  void _slot
  throw chainDisabledError()
}

export async function writeRepairHull(_itemId: ItemId): Promise<`0x${string}`> {
  void _itemId
  throw chainDisabledError()
}

export async function writeTravelToSector(_sectorId: SectorId): Promise<`0x${string}`> {
  void _sectorId
  throw chainDisabledError()
}

export async function writeCombatSettings(_settings: CombatSettings): Promise<`0x${string}`> {
  void _settings
  throw chainDisabledError()
}

function chainDisabledError(): Error {
  return new Error('Chain mode is disabled until fresh Idle Galactica v2 contracts are deployed.')
}

function readAddress(key: string): Address | null {
  const value = import.meta.env[key]
  return typeof value === 'string' && /^0x[a-fA-F0-9]{40}$/.test(value)
    ? (value as Address)
    : null
}
