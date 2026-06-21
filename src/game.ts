export type SkillId =
  | 'attack'
  | 'defence'
  | 'hitpoints'
  | 'woodcutting'
  | 'fishing'
  | 'mining'
  | 'smithing'
  | 'cooking'
  | 'crafting'

export type ItemId =
  | 'crowns'
  | 'ashLog'
  | 'pineLog'
  | 'oakLog'
  | 'ironbarkLog'
  | 'elderLog'
  | 'spiritwoodLog'
  | 'rawMinnow'
  | 'cookedMinnow'
  | 'rawTrout'
  | 'cookedTrout'
  | 'rawCod'
  | 'cookedCod'
  | 'rawTuna'
  | 'cookedTuna'
  | 'rawManta'
  | 'cookedManta'
  | 'rawLeviathan'
  | 'cookedLeviathan'
  | 'treantBark'
  | 'hollowSeed'
  | 'copperOre'
  | 'tinOre'
  | 'ironOre'
  | 'coalOre'
  | 'cobaltOre'
  | 'tungstenOre'
  | 'bronzeBar'
  | 'ironBar'
  | 'steelBar'
  | 'tungstenBar'
  | 'woodClub'
  | 'barkShield'
  | 'barkVest'
  | 'barkLeggings'
  | 'copperDagger'
  | 'copperHelm'
  | 'copperPlate'
  | 'copperLegs'
  | 'ironSword'
  | 'ironHelm'
  | 'ironPlate'
  | 'ironLegs'
  | 'steelLongsword'
  | 'steelHelm'
  | 'steelPlate'
  | 'steelLegs'
  | 'tungstenBlade'
  | 'tungstenHelm'
  | 'tungstenPlate'
  | 'tungstenLegs'
  | 'tannedHide'
  | 'thickHide'
  | 'ruggedHide'
  | 'cobaltScale'
  | 'wyrmHide'
  | 'leatherCowl'
  | 'leatherBody'
  | 'leatherChaps'
  | 'hardleatherCowl'
  | 'hardleatherBody'
  | 'hardleatherChaps'
  | 'carapaceCowl'
  | 'carapaceBody'
  | 'carapaceLegs'
  | 'cobaltMeshCowl'
  | 'cobaltMeshBody'
  | 'cobaltMeshLegs'
  | 'dragonhideCowl'
  | 'dragonhideBody'
  | 'dragonhideChaps'
  | 'fieldCharm'
  | 'runeDust'

export type ActivityGroup = 'Gather' | 'Combat' | 'Artisan'

export type ActivityId =
  | 'ashGrove'
  | 'pineStand'
  | 'oakwood'
  | 'ironbarkTrees'
  | 'elderwoodGrove'
  | 'spiritwoodGrove'
  | 'riverBend'
  | 'lakeDock'
  | 'coastalNet'
  | 'deepwaterLine'
  | 'stormPier'
  | 'abyssalPool'
  | 'copperRidge'
  | 'tinHollow'
  | 'ironVein'
  | 'coalCut'
  | 'tungstenLode'
  | 'trainingYard'
  | 'fieldRat'
  | 'mossCamp'
  | 'goblinForager'
  | 'giantSpider'
  | 'direWolf'
  | 'venomousDrake'
  | 'caveBat'
  | 'banditScout'
  | 'cryptKnight'
  | 'hollowTreant'
  | 'woodArmory'
  | 'barkLeggingsCraft'
  | 'smelter'
  | 'ironSmelter'
  | 'copperArmory'
  | 'copperArmorForge'
  | 'copperLegsForge'
  | 'ironSwordForge'
  | 'ironArmorForge'
  | 'ironLegsForge'
  | 'steelSmelter'
  | 'steelArmory'
  | 'steelArmorForge'
  | 'steelLegsForge'
  | 'tungstenSmelter'
  | 'tungstenArmory'
  | 'tungstenArmorForge'
  | 'tungstenLegsForge'
  | 'craftLeatherCowl'
  | 'craftLeatherChaps'
  | 'craftLeatherBody'
  | 'craftHardleatherCowl'
  | 'craftHardleatherChaps'
  | 'craftHardleatherBody'
  | 'craftCarapaceCowl'
  | 'craftCarapaceLegs'
  | 'craftCarapaceBody'
  | 'craftCobaltMeshCowl'
  | 'craftCobaltMeshLegs'
  | 'craftCobaltMeshBody'
  | 'craftDragonhideCowl'
  | 'craftDragonhideChaps'
  | 'craftDragonhideBody'
  | 'cookMinnow'
  | 'cookTrout'
  | 'cookCod'
  | 'cookTuna'
  | 'cookManta'
  | 'cookLeviathan'

export type EquipmentSlot = 'weapon' | 'shield' | 'helm' | 'chest' | 'legs' | 'trinket'
export type EquipmentTier = 'T1' | 'T2' | 'T3' | 'T4' | 'T5'
export type MarketSeller = 'Realm' | 'Player' | 'Trader'
export type MarketSide = 'buy' | 'sell'
export type MarketCategory = 'All' | 'Resources' | 'Materials' | 'Food' | 'Equipment' | 'Rare'
export type AreaId = 'starterArea' | 'outerIsles'

export type Inventory = Record<ItemId, number>
export type SkillBook = Record<SkillId, { xp: number }>
export type Equipment = Record<EquipmentSlot, ItemId | null>

export interface MarketOrder {
  id: string
  itemId: ItemId
  seller: MarketSeller
  side: MarketSide
  quantity: number
  unitPrice: number
  createdAt: number
}

export interface CombatSettings {
  autoEat: boolean
  stopAtHitpoints: number
  foodItemId: ItemId | null
  maxFoodPerClaim: number
}

export interface GameState {
  skills: SkillBook
  inventory: Inventory
  equipment: Equipment
  marketOrders: MarketOrder[]
  combatSettings: CombatSettings
  currentHitpoints: number
  currentAreaId: AreaId
  unlockedAreaIds: AreaId[]
  active: {
    id: ActivityId
    startedAt: number
    lastClaimAt: number
  } | null
  log: string[]
}

export interface SkillDefinition {
  id: SkillId
  name: string
  tone: string
}

export interface ItemDefinition {
  id: ItemId
  name: string
  kind: string
  slot?: EquipmentSlot
  tier?: EquipmentTier
  stats?: EquipmentStats
  healAmount?: number
  marketPrice: number
  transferClass: 'ERC-1155' | 'soulbound'
}

export interface EquipmentStats {
  attack?: number
  defence?: number
  hitpoints?: number
  speed?: number
}

export interface CombatRules {
  damageChance: number
  minDamage: number
  maxDamage: number
  boss?: boolean
  dropTable?: DropTableEntry[]
}

export interface DropTableEntry {
  itemId: ItemId
  amount: number
  chance: number
  rarity: 'common' | 'uncommon' | 'rare' | 'ultra'
}

export interface CookingRules {
  rawItem: ItemId
  cookedItem: ItemId
  baseBurnChance: number
  minBurnChance: number
  burnReductionPerLevel: number
}

export interface ActivityDefinition {
  id: ActivityId
  name: string
  zone: string
  group: ActivityGroup
  scene: 'forest' | 'river' | 'mine' | 'arena' | 'forge'
  primarySkill: SkillId
  levelReqs: Partial<Record<SkillId, number>>
  cycleMs: number
  xp: Partial<Record<SkillId, number>>
  rewards: Partial<Record<ItemId, number>>
  costs?: Partial<Record<ItemId, number>>
  requiredEquipment?: ItemId
  combat?: CombatRules
  cooking?: CookingRules
}

export interface AreaDefinition {
  id: AreaId
  name: string
  dockName: string
  description: string
  shipCost: number
  routeLabel: string
}

export interface ClaimPreview {
  cycles: number
  progressPct: number
  elapsedMs: number
  cycleMs: number
  xp: Partial<Record<SkillId, number>>
  rewards: Partial<Record<ItemId, number>>
  costs: Partial<Record<ItemId, number>>
  burned: Partial<Record<ItemId, number>>
  rareDrops: Partial<Record<ItemId, number>>
  autoEaten: Partial<Record<ItemId, number>>
  hpRestored: number
  hpLost: number
  stoppedByHp: boolean
  stoppedBySafety: boolean
  deathPenalty: DeathPenalty
}

export interface DeathPenalty {
  lostCrowns: number
  lostEquipment: ItemId[]
}

export const STORAGE_KEY = 'idle-isles-save-v1'
export const LEGACY_STORAGE_KEYS = ['idle-odyssey-save-v1']
export const AFK_CAP_MS = 8 * 60 * 60 * 1000
export const STARTER_AREA_ID: AreaId = 'starterArea'
export const AREAS: AreaDefinition[] = [
  {
    id: STARTER_AREA_ID,
    name: 'Starter Area',
    dockName: 'Hearthline Dock',
    description: 'Safe local routes for the first skills, gear, and crowns.',
    shipCost: 0,
    routeLabel: 'Return to harbor',
  },
  {
    id: 'outerIsles',
    name: 'Outer Isles',
    dockName: 'Breakwater Merchant',
    description: 'Rougher waters with higher-tier forests, mines, coasts, and fights.',
    shipCost: 50000,
    routeLabel: 'Charter ship',
  },
]
export const AREA_BY_ID = Object.fromEntries(
  AREAS.map((area) => [area.id, area]),
) as Record<AreaId, AreaDefinition>

const ZONE_AREAS: Record<string, AreaId> = {
  Greywild: 'outerIsles',
  Rootvault: 'outerIsles',
  Saltmarsh: 'outerIsles',
  'Storm Coast': 'outerIsles',
  'Mooncut Mine': 'outerIsles',
  'Deep Crucible': 'outerIsles',
  'Ridge Road': 'outerIsles',
  'Old Crypt': 'outerIsles',
}
const BOOT_MARKET_TIME = Date.now()
const LEVEL_XP_QUADRATIC = 75
const LEVEL_XP_CUBIC = 45
const LEVEL_XP_QUARTIC = 1
const XP_RATE_MULTIPLIER = 2
const CRAFTING_PREMIUM_NUMERATOR = 135
const CRAFTING_PREMIUM_DENOMINATOR = 100
const REALM_SCAVENGER_BPS = 500
const BPS_DENOMINATOR = 10_000

function craftingOutputMarketPrice(inputMarketPrice: number): number {
  return Math.floor((inputMarketPrice * CRAFTING_PREMIUM_NUMERATOR) / CRAFTING_PREMIUM_DENOMINATOR)
}

export function realmScavengerBuyPrice(marketPrice: number): number {
  return Math.max(1, Math.floor((marketPrice * REALM_SCAVENGER_BPS) / BPS_DENOMINATOR))
}

export const EQUIPMENT_SLOTS: EquipmentSlot[] = [
  'weapon',
  'shield',
  'helm',
  'chest',
  'legs',
  'trinket',
]

export const SKILLS: SkillDefinition[] = [
  { id: 'attack', name: 'Attack', tone: 'crimson' },
  { id: 'defence', name: 'Defence', tone: 'steel' },
  { id: 'hitpoints', name: 'Hitpoints', tone: 'heart' },
  { id: 'woodcutting', name: 'Woodcutting', tone: 'green' },
  { id: 'fishing', name: 'Fishing', tone: 'blue' },
  { id: 'mining', name: 'Mining', tone: 'violet' },
  { id: 'smithing', name: 'Smithing', tone: 'ember' },
  { id: 'cooking', name: 'Cooking', tone: 'copper' },
  { id: 'crafting', name: 'Crafting', tone: 'teal' },
]

export const MARKET_CATEGORIES: MarketCategory[] = [
  'All',
  'Resources',
  'Materials',
  'Food',
  'Equipment',
  'Rare',
]

export const ITEMS: Record<ItemId, ItemDefinition> = {
  crowns: {
    id: 'crowns',
    name: 'Crowns',
    kind: 'Currency',
    marketPrice: 1,
    transferClass: 'ERC-1155',
  },
  ashLog: {
    id: 'ashLog',
    name: 'Ash Logs',
    kind: 'Resource',
    marketPrice: 3,
    transferClass: 'ERC-1155',
  },
  pineLog: {
    id: 'pineLog',
    name: 'Pine Logs',
    kind: 'Resource',
    marketPrice: 7,
    transferClass: 'ERC-1155',
  },
  oakLog: {
    id: 'oakLog',
    name: 'Oak Logs',
    kind: 'Resource',
    marketPrice: 13,
    transferClass: 'ERC-1155',
  },
  ironbarkLog: {
    id: 'ironbarkLog',
    name: 'Ironbark Logs',
    kind: 'Resource',
    marketPrice: 28,
    transferClass: 'ERC-1155',
  },
  elderLog: {
    id: 'elderLog',
    name: 'Elder Logs',
    kind: 'Resource',
    marketPrice: 64,
    transferClass: 'ERC-1155',
  },
  spiritwoodLog: {
    id: 'spiritwoodLog',
    name: 'Spiritwood Logs',
    kind: 'Resource',
    marketPrice: 145,
    transferClass: 'ERC-1155',
  },
  rawMinnow: {
    id: 'rawMinnow',
    name: 'Raw Minnow',
    kind: 'Raw Food',
    marketPrice: 5,
    transferClass: 'ERC-1155',
  },
  cookedMinnow: {
    id: 'cookedMinnow',
    name: 'Cooked Minnow',
    kind: 'Food',
    healAmount: 3,
    marketPrice: 9,
    transferClass: 'ERC-1155',
  },
  rawTrout: {
    id: 'rawTrout',
    name: 'Raw Trout',
    kind: 'Raw Food',
    marketPrice: 11,
    transferClass: 'ERC-1155',
  },
  cookedTrout: {
    id: 'cookedTrout',
    name: 'Cooked Trout',
    kind: 'Food',
    healAmount: 6,
    marketPrice: 18,
    transferClass: 'ERC-1155',
  },
  rawCod: {
    id: 'rawCod',
    name: 'Raw Cod',
    kind: 'Raw Food',
    marketPrice: 20,
    transferClass: 'ERC-1155',
  },
  cookedCod: {
    id: 'cookedCod',
    name: 'Cooked Cod',
    kind: 'Food',
    healAmount: 9,
    marketPrice: 32,
    transferClass: 'ERC-1155',
  },
  rawTuna: {
    id: 'rawTuna',
    name: 'Raw Tuna',
    kind: 'Raw Food',
    marketPrice: 36,
    transferClass: 'ERC-1155',
  },
  cookedTuna: {
    id: 'cookedTuna',
    name: 'Cooked Tuna',
    kind: 'Food',
    healAmount: 14,
    marketPrice: 58,
    transferClass: 'ERC-1155',
  },
  rawManta: {
    id: 'rawManta',
    name: 'Raw Manta',
    kind: 'Raw Food',
    marketPrice: 82,
    transferClass: 'ERC-1155',
  },
  cookedManta: {
    id: 'cookedManta',
    name: 'Cooked Manta',
    kind: 'Food',
    healAmount: 21,
    marketPrice: 128,
    transferClass: 'ERC-1155',
  },
  rawLeviathan: {
    id: 'rawLeviathan',
    name: 'Raw Leviathan',
    kind: 'Raw Food',
    marketPrice: 170,
    transferClass: 'ERC-1155',
  },
  cookedLeviathan: {
    id: 'cookedLeviathan',
    name: 'Cooked Leviathan',
    kind: 'Food',
    healAmount: 34,
    marketPrice: 260,
    transferClass: 'ERC-1155',
  },
  treantBark: {
    id: 'treantBark',
    name: 'Treant Bark',
    kind: 'Boss Material',
    marketPrice: 90,
    transferClass: 'ERC-1155',
  },
  hollowSeed: {
    id: 'hollowSeed',
    name: 'Hollow Seed',
    kind: 'Ultra Rare',
    marketPrice: 2200,
    transferClass: 'ERC-1155',
  },
  copperOre: {
    id: 'copperOre',
    name: 'Copper Ore',
    kind: 'Ore',
    marketPrice: 5,
    transferClass: 'ERC-1155',
  },
  tinOre: {
    id: 'tinOre',
    name: 'Tin Ore',
    kind: 'Ore',
    marketPrice: 5,
    transferClass: 'ERC-1155',
  },
  ironOre: {
    id: 'ironOre',
    name: 'Iron Ore',
    kind: 'Ore',
    marketPrice: 9,
    transferClass: 'ERC-1155',
  },
  coalOre: {
    id: 'coalOre',
    name: 'Coal',
    kind: 'Ore',
    marketPrice: 18,
    transferClass: 'ERC-1155',
  },
  cobaltOre: {
    id: 'cobaltOre',
    name: 'Cobalt Ore',
    kind: 'Ore',
    marketPrice: 34,
    transferClass: 'ERC-1155',
  },
  tungstenOre: {
    id: 'tungstenOre',
    name: 'Tungsten Ore',
    kind: 'Ore',
    marketPrice: 46,
    transferClass: 'ERC-1155',
  },
  bronzeBar: {
    id: 'bronzeBar',
    name: 'Copper Bar',
    kind: 'Material',
    marketPrice: 20,
    transferClass: 'ERC-1155',
  },
  ironBar: {
    id: 'ironBar',
    name: 'Iron Bar',
    kind: 'Material',
    marketPrice: 32,
    transferClass: 'ERC-1155',
  },
  steelBar: {
    id: 'steelBar',
    name: 'Steel Bar',
    kind: 'Material',
    marketPrice: 58,
    transferClass: 'ERC-1155',
  },
  tungstenBar: {
    id: 'tungstenBar',
    name: 'Tungsten Bar',
    kind: 'Material',
    marketPrice: 130,
    transferClass: 'ERC-1155',
  },
  woodClub: {
    id: 'woodClub',
    name: 'Wood Club',
    kind: 'Weapon',
    slot: 'weapon',
    tier: 'T1',
    stats: { attack: 1 },
    marketPrice: 24,
    transferClass: 'ERC-1155',
  },
  barkShield: {
    id: 'barkShield',
    name: 'Bark Shield',
    kind: 'Shield',
    slot: 'shield',
    tier: 'T1',
    stats: { defence: 1 },
    marketPrice: 32,
    transferClass: 'ERC-1155',
  },
  barkVest: {
    id: 'barkVest',
    name: 'Bark Vest',
    kind: 'Armor',
    slot: 'chest',
    tier: 'T1',
    stats: { defence: 1, hitpoints: 1 },
    marketPrice: 40,
    transferClass: 'ERC-1155',
  },
  barkLeggings: {
    id: 'barkLeggings',
    name: 'Bark Leggings',
    kind: 'Armor',
    slot: 'legs',
    tier: 'T1',
    stats: { defence: 1, hitpoints: 1 },
    marketPrice: 36,
    transferClass: 'ERC-1155',
  },
  copperDagger: {
    id: 'copperDagger',
    name: 'Copper Dagger',
    kind: 'Weapon',
    slot: 'weapon',
    tier: 'T2',
    stats: { attack: 2, speed: 1 },
    marketPrice: 96,
    transferClass: 'ERC-1155',
  },
  copperHelm: {
    id: 'copperHelm',
    name: 'Copper Helm',
    kind: 'Armor',
    slot: 'helm',
    tier: 'T2',
    stats: { defence: 1 },
    marketPrice: 72,
    transferClass: 'ERC-1155',
  },
  copperPlate: {
    id: 'copperPlate',
    name: 'Copper Plate',
    kind: 'Armor',
    slot: 'chest',
    tier: 'T2',
    stats: { defence: 3, hitpoints: 2 },
    marketPrice: 126,
    transferClass: 'ERC-1155',
  },
  copperLegs: {
    id: 'copperLegs',
    name: 'Copper Legs',
    kind: 'Armor',
    slot: 'legs',
    tier: 'T2',
    stats: { defence: 2, hitpoints: 1 },
    marketPrice: 99,
    transferClass: 'ERC-1155',
  },
  ironSword: {
    id: 'ironSword',
    name: 'Iron Sword',
    kind: 'Weapon',
    slot: 'weapon',
    tier: 'T3',
    stats: { attack: 4 },
    marketPrice: 180,
    transferClass: 'ERC-1155',
  },
  ironHelm: {
    id: 'ironHelm',
    name: 'Iron Helm',
    kind: 'Armor',
    slot: 'helm',
    tier: 'T3',
    stats: { defence: 3 },
    marketPrice: 120,
    transferClass: 'ERC-1155',
  },
  ironPlate: {
    id: 'ironPlate',
    name: 'Iron Plate',
    kind: 'Armor',
    slot: 'chest',
    tier: 'T3',
    stats: { defence: 6, hitpoints: 4 },
    marketPrice: 220,
    transferClass: 'ERC-1155',
  },
  ironLegs: {
    id: 'ironLegs',
    name: 'Iron Legs',
    kind: 'Armor',
    slot: 'legs',
    tier: 'T3',
    stats: { defence: 4, hitpoints: 2 },
    marketPrice: 170,
    transferClass: 'ERC-1155',
  },
  steelLongsword: {
    id: 'steelLongsword',
    name: 'Steel Longsword',
    kind: 'Weapon',
    slot: 'weapon',
    tier: 'T4',
    stats: { attack: 7 },
    marketPrice: 410,
    transferClass: 'ERC-1155',
  },
  steelHelm: {
    id: 'steelHelm',
    name: 'Steel Helm',
    kind: 'Armor',
    slot: 'helm',
    tier: 'T4',
    stats: { defence: 5, hitpoints: 2 },
    marketPrice: 260,
    transferClass: 'ERC-1155',
  },
  steelPlate: {
    id: 'steelPlate',
    name: 'Steel Plate',
    kind: 'Armor',
    slot: 'chest',
    tier: 'T4',
    stats: { defence: 10, hitpoints: 8 },
    marketPrice: 520,
    transferClass: 'ERC-1155',
  },
  steelLegs: {
    id: 'steelLegs',
    name: 'Steel Legs',
    kind: 'Armor',
    slot: 'legs',
    tier: 'T4',
    stats: { defence: 7, hitpoints: 4 },
    marketPrice: 390,
    transferClass: 'ERC-1155',
  },
  tungstenBlade: {
    id: 'tungstenBlade',
    name: 'Tungsten Blade',
    kind: 'Weapon',
    slot: 'weapon',
    tier: 'T5',
    stats: { attack: 12 },
    marketPrice: 1200,
    transferClass: 'ERC-1155',
  },
  tungstenHelm: {
    id: 'tungstenHelm',
    name: 'Tungsten Helm',
    kind: 'Armor',
    slot: 'helm',
    tier: 'T5',
    stats: { defence: 8, hitpoints: 4 },
    marketPrice: 740,
    transferClass: 'ERC-1155',
  },
  tungstenPlate: {
    id: 'tungstenPlate',
    name: 'Tungsten Plate',
    kind: 'Armor',
    slot: 'chest',
    tier: 'T5',
    stats: { defence: 16, hitpoints: 14 },
    marketPrice: 1450,
    transferClass: 'ERC-1155',
  },
  tungstenLegs: {
    id: 'tungstenLegs',
    name: 'Tungsten Legs',
    kind: 'Armor',
    slot: 'legs',
    tier: 'T5',
    stats: { defence: 12, hitpoints: 8 },
    marketPrice: 1095,
    transferClass: 'ERC-1155',
  },
  tannedHide: {
    id: 'tannedHide',
    name: 'Tanned Hide',
    kind: 'Resource',
    tier: 'T1',
    marketPrice: 2,
    transferClass: 'ERC-1155',
  },
  thickHide: {
    id: 'thickHide',
    name: 'Thick Hide',
    kind: 'Resource',
    tier: 'T2',
    marketPrice: 4,
    transferClass: 'ERC-1155',
  },
  ruggedHide: {
    id: 'ruggedHide',
    name: 'Rugged Hide',
    kind: 'Resource',
    tier: 'T3',
    marketPrice: 15,
    transferClass: 'ERC-1155',
  },
  cobaltScale: {
    id: 'cobaltScale',
    name: 'Cobalt Scale',
    kind: 'Resource',
    tier: 'T4',
    marketPrice: 39,
    transferClass: 'ERC-1155',
  },
  wyrmHide: {
    id: 'wyrmHide',
    name: 'Wyrm Hide',
    kind: 'Resource',
    tier: 'T5',
    marketPrice: 99,
    transferClass: 'ERC-1155',
  },
  leatherCowl: {
    id: 'leatherCowl',
    name: 'Leather Cowl',
    kind: 'Light Armor',
    slot: 'helm',
    tier: 'T1',
    stats: { defence: 1, speed: 1 },
    marketPrice: craftingOutputMarketPrice(2 * 2 + 3),
    transferClass: 'ERC-1155',
  },
  leatherBody: {
    id: 'leatherBody',
    name: 'Leather Body',
    kind: 'Light Armor',
    slot: 'chest',
    tier: 'T1',
    stats: { defence: 2, speed: 1 },
    marketPrice: craftingOutputMarketPrice(4 * 2 + 3),
    transferClass: 'ERC-1155',
  },
  leatherChaps: {
    id: 'leatherChaps',
    name: 'Leather Chaps',
    kind: 'Light Armor',
    slot: 'legs',
    tier: 'T1',
    stats: { defence: 1, speed: 1 },
    marketPrice: craftingOutputMarketPrice(3 * 2 + 3),
    transferClass: 'ERC-1155',
  },
  hardleatherCowl: {
    id: 'hardleatherCowl',
    name: 'Hardleather Cowl',
    kind: 'Light Armor',
    slot: 'helm',
    tier: 'T2',
    stats: { defence: 2, speed: 2 },
    marketPrice: craftingOutputMarketPrice(2 * 4 + 7),
    transferClass: 'ERC-1155',
  },
  hardleatherBody: {
    id: 'hardleatherBody',
    name: 'Hardleather Body',
    kind: 'Light Armor',
    slot: 'chest',
    tier: 'T2',
    stats: { defence: 4, speed: 2 },
    marketPrice: craftingOutputMarketPrice(4 * 4 + 7),
    transferClass: 'ERC-1155',
  },
  hardleatherChaps: {
    id: 'hardleatherChaps',
    name: 'Hardleather Chaps',
    kind: 'Light Armor',
    slot: 'legs',
    tier: 'T2',
    stats: { defence: 3, speed: 2 },
    marketPrice: craftingOutputMarketPrice(3 * 4 + 7),
    transferClass: 'ERC-1155',
  },
  carapaceCowl: {
    id: 'carapaceCowl',
    name: 'Carapace Cowl',
    kind: 'Light Armor',
    slot: 'helm',
    tier: 'T3',
    stats: { defence: 4, speed: 3 },
    marketPrice: craftingOutputMarketPrice(2 * 15 + 13),
    transferClass: 'ERC-1155',
  },
  carapaceBody: {
    id: 'carapaceBody',
    name: 'Carapace Body',
    kind: 'Light Armor',
    slot: 'chest',
    tier: 'T3',
    stats: { defence: 8, speed: 3 },
    marketPrice: craftingOutputMarketPrice(4 * 15 + 13),
    transferClass: 'ERC-1155',
  },
  carapaceLegs: {
    id: 'carapaceLegs',
    name: 'Carapace Legs',
    kind: 'Light Armor',
    slot: 'legs',
    tier: 'T3',
    stats: { defence: 6, speed: 3 },
    marketPrice: craftingOutputMarketPrice(3 * 15 + 13),
    transferClass: 'ERC-1155',
  },
  cobaltMeshCowl: {
    id: 'cobaltMeshCowl',
    name: 'Cobalt-Mesh Cowl',
    kind: 'Light Armor',
    slot: 'helm',
    tier: 'T4',
    stats: { defence: 6, speed: 4 },
    marketPrice: craftingOutputMarketPrice(2 * 39 + 28),
    transferClass: 'ERC-1155',
  },
  cobaltMeshBody: {
    id: 'cobaltMeshBody',
    name: 'Cobalt-Mesh Body',
    kind: 'Light Armor',
    slot: 'chest',
    tier: 'T4',
    stats: { defence: 12, speed: 4 },
    marketPrice: craftingOutputMarketPrice(4 * 39 + 28),
    transferClass: 'ERC-1155',
  },
  cobaltMeshLegs: {
    id: 'cobaltMeshLegs',
    name: 'Cobalt-Mesh Legs',
    kind: 'Light Armor',
    slot: 'legs',
    tier: 'T4',
    stats: { defence: 9, speed: 4 },
    marketPrice: craftingOutputMarketPrice(3 * 39 + 28),
    transferClass: 'ERC-1155',
  },
  dragonhideCowl: {
    id: 'dragonhideCowl',
    name: 'Dragonhide Cowl',
    kind: 'Light Armor',
    slot: 'helm',
    tier: 'T5',
    stats: { defence: 10, speed: 5 },
    marketPrice: craftingOutputMarketPrice(2 * 99 + 64),
    transferClass: 'ERC-1155',
  },
  dragonhideBody: {
    id: 'dragonhideBody',
    name: 'Dragonhide Body',
    kind: 'Light Armor',
    slot: 'chest',
    tier: 'T5',
    stats: { defence: 20, speed: 5 },
    marketPrice: craftingOutputMarketPrice(4 * 99 + 64),
    transferClass: 'ERC-1155',
  },
  dragonhideChaps: {
    id: 'dragonhideChaps',
    name: 'Dragonhide Chaps',
    kind: 'Light Armor',
    slot: 'legs',
    tier: 'T5',
    stats: { defence: 15, speed: 5 },
    marketPrice: craftingOutputMarketPrice(3 * 99 + 64),
    transferClass: 'ERC-1155',
  },
  fieldCharm: {
    id: 'fieldCharm',
    name: 'Field Charm',
    kind: 'Trinket',
    slot: 'trinket',
    marketPrice: 140,
    transferClass: 'ERC-1155',
  },
  runeDust: {
    id: 'runeDust',
    name: 'Rune Dust',
    kind: 'Rare',
    marketPrice: 165,
    transferClass: 'ERC-1155',
  },
}

export const ACTIVITIES: ActivityDefinition[] = [
  {
    id: 'ashGrove',
    name: 'Ash Grove',
    zone: 'Northvale',
    group: 'Gather',
    scene: 'forest',
    primarySkill: 'woodcutting',
    levelReqs: { woodcutting: 1 },
    cycleMs: 5000,
    xp: { woodcutting: 18 },
    rewards: { ashLog: 2 },
  },
  {
    id: 'pineStand',
    name: 'Pine Stand',
    zone: 'Northvale',
    group: 'Gather',
    scene: 'forest',
    primarySkill: 'woodcutting',
    levelReqs: { woodcutting: 4 },
    cycleMs: 7200,
    xp: { woodcutting: 32 },
    rewards: { pineLog: 2 },
  },
  {
    id: 'oakwood',
    name: 'Oakwood',
    zone: 'Northvale',
    group: 'Gather',
    scene: 'forest',
    primarySkill: 'woodcutting',
    levelReqs: { woodcutting: 8 },
    cycleMs: 9200,
    xp: { woodcutting: 56 },
    rewards: { oakLog: 2 },
  },
  {
    id: 'ironbarkTrees',
    name: 'Ironbark Trees',
    zone: 'Greywild',
    group: 'Gather',
    scene: 'forest',
    primarySkill: 'woodcutting',
    levelReqs: { woodcutting: 16 },
    cycleMs: 13000,
    xp: { woodcutting: 95 },
    rewards: { ironbarkLog: 1 },
  },
  {
    id: 'elderwoodGrove',
    name: 'Elderwood Grove',
    zone: 'Greywild',
    group: 'Gather',
    scene: 'forest',
    primarySkill: 'woodcutting',
    levelReqs: { woodcutting: 28 },
    cycleMs: 17500,
    xp: { woodcutting: 150 },
    rewards: { elderLog: 1 },
  },
  {
    id: 'spiritwoodGrove',
    name: 'Spiritwood Grove',
    zone: 'Rootvault',
    group: 'Gather',
    scene: 'forest',
    primarySkill: 'woodcutting',
    levelReqs: { woodcutting: 48 },
    cycleMs: 25000,
    xp: { woodcutting: 275 },
    rewards: { spiritwoodLog: 1 },
  },
  {
    id: 'riverBend',
    name: 'River Bend',
    zone: 'Willowrun',
    group: 'Gather',
    scene: 'river',
    primarySkill: 'fishing',
    levelReqs: { fishing: 1 },
    cycleMs: 6000,
    xp: { fishing: 20 },
    rewards: { rawMinnow: 2 },
  },
  {
    id: 'lakeDock',
    name: 'Lake Dock',
    zone: 'Willowrun',
    group: 'Gather',
    scene: 'river',
    primarySkill: 'fishing',
    levelReqs: { fishing: 5 },
    cycleMs: 8500,
    xp: { fishing: 38 },
    rewards: { rawTrout: 1 },
  },
  {
    id: 'coastalNet',
    name: 'Coastal Net',
    zone: 'Saltmarsh',
    group: 'Gather',
    scene: 'river',
    primarySkill: 'fishing',
    levelReqs: { fishing: 12 },
    cycleMs: 10500,
    xp: { fishing: 66 },
    rewards: { rawCod: 1 },
  },
  {
    id: 'deepwaterLine',
    name: 'Deepwater Line',
    zone: 'Saltmarsh',
    group: 'Gather',
    scene: 'river',
    primarySkill: 'fishing',
    levelReqs: { fishing: 24 },
    cycleMs: 14500,
    xp: { fishing: 118 },
    rewards: { rawTuna: 1 },
  },
  {
    id: 'stormPier',
    name: 'Storm Pier',
    zone: 'Storm Coast',
    group: 'Gather',
    scene: 'river',
    primarySkill: 'fishing',
    levelReqs: { fishing: 38 },
    cycleMs: 20500,
    xp: { fishing: 205 },
    rewards: { rawManta: 1 },
  },
  {
    id: 'abyssalPool',
    name: 'Abyssal Pool',
    zone: 'Storm Coast',
    group: 'Gather',
    scene: 'river',
    primarySkill: 'fishing',
    levelReqs: { fishing: 58 },
    cycleMs: 32000,
    xp: { fishing: 420 },
    rewards: { rawLeviathan: 1 },
  },
  {
    id: 'copperRidge',
    name: 'Copper Ridge',
    zone: 'Old Quarry',
    group: 'Gather',
    scene: 'mine',
    primarySkill: 'mining',
    levelReqs: { mining: 1 },
    cycleMs: 6500,
    xp: { mining: 20 },
    rewards: { copperOre: 2 },
  },
  {
    id: 'tinHollow',
    name: 'Tin Hollow',
    zone: 'Old Quarry',
    group: 'Gather',
    scene: 'mine',
    primarySkill: 'mining',
    levelReqs: { mining: 1 },
    cycleMs: 6500,
    xp: { mining: 20 },
    rewards: { tinOre: 2 },
  },
  {
    id: 'ironVein',
    name: 'Iron Vein',
    zone: 'Old Quarry',
    group: 'Gather',
    scene: 'mine',
    primarySkill: 'mining',
    levelReqs: { mining: 8 },
    cycleMs: 8200,
    xp: { mining: 34 },
    rewards: { ironOre: 2 },
  },
  {
    id: 'coalCut',
    name: 'Coal Cut',
    zone: 'Mooncut Mine',
    group: 'Gather',
    scene: 'mine',
    primarySkill: 'mining',
    levelReqs: { mining: 25 },
    cycleMs: 12500,
    xp: { mining: 72 },
    rewards: { coalOre: 1 },
  },
  {
    id: 'tungstenLode',
    name: 'Tungsten Lode',
    zone: 'Deep Crucible',
    group: 'Gather',
    scene: 'mine',
    primarySkill: 'mining',
    levelReqs: { mining: 55 },
    cycleMs: 18000,
    xp: { mining: 140 },
    rewards: { tungstenOre: 1 },
  },
  {
    id: 'trainingYard',
    name: 'Training Yard',
    zone: 'Crossroads',
    group: 'Combat',
    scene: 'arena',
    primarySkill: 'attack',
    levelReqs: { attack: 1 },
    cycleMs: 7000,
    xp: { attack: 15, defence: 8, hitpoints: 8 },
    rewards: { tannedHide: 1, crowns: 2 },
    combat: { damageChance: 24, minDamage: 1, maxDamage: 2 },
  },
  {
    id: 'fieldRat',
    name: 'Field Rat',
    zone: 'Crossroads',
    group: 'Combat',
    scene: 'arena',
    primarySkill: 'attack',
    levelReqs: { attack: 4, hitpoints: 3 },
    cycleMs: 8500,
    xp: { attack: 22, defence: 10, hitpoints: 13 },
    rewards: { tannedHide: 1, crowns: 4, rawMinnow: 1 },
    combat: { damageChance: 34, minDamage: 1, maxDamage: 3 },
  },
  {
    id: 'mossCamp',
    name: 'Moss Camp',
    zone: 'Fen Gate',
    group: 'Combat',
    scene: 'arena',
    primarySkill: 'attack',
    levelReqs: { attack: 8, defence: 7, hitpoints: 7 },
    requiredEquipment: 'copperDagger',
    cycleMs: 11000,
    xp: { attack: 35, defence: 22, hitpoints: 20 },
    rewards: { thickHide: 1, crowns: 8, runeDust: 1 },
    combat: { damageChance: 46, minDamage: 2, maxDamage: 5 },
  },
  {
    id: 'goblinForager',
    name: 'Goblin Forager',
    zone: 'Fen Gate',
    group: 'Combat',
    scene: 'arena',
    primarySkill: 'attack',
    levelReqs: { attack: 10, defence: 8, hitpoints: 10 },
    cycleMs: 10000,
    xp: { attack: 42, defence: 28, hitpoints: 25 },
    rewards: { thickHide: 1, crowns: 6 },
    combat: {
      damageChance: 40,
      minDamage: 2,
      maxDamage: 5,
      dropTable: [
        { itemId: 'pineLog', amount: 1, chance: 15, rarity: 'common' },
        { itemId: 'runeDust', amount: 1, chance: 5, rarity: 'uncommon' },
      ],
    },
  },
  {
    id: 'giantSpider',
    name: 'Giant Spider',
    zone: 'Old Quarry',
    group: 'Combat',
    scene: 'arena',
    primarySkill: 'attack',
    levelReqs: { attack: 20, defence: 18, hitpoints: 18 },
    requiredEquipment: 'ironSword',
    cycleMs: 12000,
    xp: { attack: 60, defence: 35, hitpoints: 35 },
    rewards: { ruggedHide: 1, crowns: 12 },
    combat: {
      damageChance: 48,
      minDamage: 3,
      maxDamage: 8,
      dropTable: [
        { itemId: 'rawCod', amount: 1, chance: 10, rarity: 'common' },
        { itemId: 'coalOre', amount: 1, chance: 5, rarity: 'uncommon' },
      ],
    },
  },
  {
    id: 'direWolf',
    name: 'Dire Wolf',
    zone: 'Ridge Road',
    group: 'Combat',
    scene: 'arena',
    primarySkill: 'attack',
    levelReqs: { attack: 35, defence: 30, hitpoints: 32 },
    requiredEquipment: 'steelLongsword',
    cycleMs: 15000,
    xp: { attack: 85, defence: 55, hitpoints: 60 },
    rewards: { cobaltScale: 1, crowns: 45 },
    combat: {
      damageChance: 58,
      minDamage: 5,
      maxDamage: 14,
      dropTable: [
        { itemId: 'rawTuna', amount: 1, chance: 15, rarity: 'common' },
        { itemId: 'cobaltOre', amount: 1, chance: 8, rarity: 'uncommon' },
      ],
    },
  },
  {
    id: 'venomousDrake',
    name: 'Venomous Drake',
    zone: 'Old Crypt',
    group: 'Combat',
    scene: 'arena',
    primarySkill: 'attack',
    levelReqs: { attack: 55, defence: 50, hitpoints: 55 },
    requiredEquipment: 'tungstenBlade',
    cycleMs: 22000,
    xp: { attack: 160, defence: 105, hitpoints: 110 },
    rewards: { wyrmHide: 1, crowns: 90 },
    combat: {
      damageChance: 70,
      minDamage: 8,
      maxDamage: 22,
      dropTable: [
        { itemId: 'rawManta', amount: 1, chance: 12, rarity: 'common' },
        { itemId: 'tungstenOre', amount: 1, chance: 5, rarity: 'uncommon' },
        { itemId: 'runeDust', amount: 1, chance: 10, rarity: 'uncommon' },
      ],
    },
  },
  {
    id: 'caveBat',
    name: 'Cave Bat',
    zone: 'Mooncut Mine',
    group: 'Combat',
    scene: 'arena',
    primarySkill: 'attack',
    levelReqs: { attack: 16, defence: 14, hitpoints: 14 },
    requiredEquipment: 'ironSword',
    cycleMs: 12500,
    xp: { attack: 52, defence: 28, hitpoints: 30 },
    rewards: { tannedHide: 2, crowns: 22 },
    combat: {
      damageChance: 50,
      minDamage: 2,
      maxDamage: 7,
      dropTable: [
        { itemId: 'rawTrout', amount: 1, chance: 18, rarity: 'common' },
        { itemId: 'runeDust', amount: 1, chance: 6, rarity: 'uncommon' },
      ],
    },
  },
  {
    id: 'banditScout',
    name: 'Bandit Scout',
    zone: 'Ridge Road',
    group: 'Combat',
    scene: 'arena',
    primarySkill: 'attack',
    levelReqs: { attack: 24, defence: 21, hitpoints: 21 },
    requiredEquipment: 'ironSword',
    cycleMs: 14000,
    xp: { attack: 68, defence: 38, hitpoints: 42 },
    rewards: { thickHide: 2, crowns: 35 },
    combat: {
      damageChance: 56,
      minDamage: 3,
      maxDamage: 9,
      dropTable: [
        { itemId: 'ironHelm', amount: 1, chance: 3.5, rarity: 'rare' },
        { itemId: 'steelBar', amount: 1, chance: 5, rarity: 'uncommon' },
      ],
    },
  },
  {
    id: 'cryptKnight',
    name: 'Crypt Knight',
    zone: 'Old Crypt',
    group: 'Combat',
    scene: 'arena',
    primarySkill: 'attack',
    levelReqs: { attack: 38, defence: 35, hitpoints: 36 },
    requiredEquipment: 'steelLongsword',
    cycleMs: 17000,
    xp: { attack: 95, defence: 64, hitpoints: 68 },
    rewards: { crowns: 58, runeDust: 1 },
    combat: {
      damageChance: 62,
      minDamage: 5,
      maxDamage: 12,
      dropTable: [
        { itemId: 'steelHelm', amount: 1, chance: 2.5, rarity: 'rare' },
        { itemId: 'steelPlate', amount: 1, chance: 1.5, rarity: 'rare' },
        { itemId: 'tungstenOre', amount: 1, chance: 4, rarity: 'uncommon' },
      ],
    },
  },
  {
    id: 'hollowTreant',
    name: 'Hollow Treant',
    zone: 'Rootvault',
    group: 'Combat',
    scene: 'arena',
    primarySkill: 'attack',
    levelReqs: { attack: 55, defence: 50, hitpoints: 52 },
    requiredEquipment: 'steelLongsword',
    cycleMs: 26000,
    xp: { attack: 180, defence: 120, hitpoints: 120 },
    rewards: { crowns: 140, pineLog: 4, runeDust: 1 },
    combat: {
      boss: true,
      damageChance: 72,
      minDamage: 7,
      maxDamage: 18,
      dropTable: [
        { itemId: 'treantBark', amount: 1, chance: 18, rarity: 'uncommon' },
        { itemId: 'steelPlate', amount: 1, chance: 4, rarity: 'rare' },
        { itemId: 'tungstenOre', amount: 2, chance: 3, rarity: 'rare' },
        { itemId: 'hollowSeed', amount: 1, chance: 0.7, rarity: 'ultra' },
      ],
    },
  },
  {
    id: 'woodArmory',
    name: 'Wood Armory',
    zone: 'Hearthline',
    group: 'Artisan',
    scene: 'forge',
    primarySkill: 'smithing',
    levelReqs: { smithing: 1 },
    cycleMs: 5600,
    xp: { smithing: 16 },
    costs: { ashLog: 3 },
    rewards: { woodClub: 1, barkShield: 1, barkVest: 1 },
  },
  {
    id: 'barkLeggingsCraft',
    name: 'Bark Leggings',
    zone: 'Hearthline',
    group: 'Artisan',
    scene: 'forge',
    primarySkill: 'smithing',
    levelReqs: { smithing: 2 },
    cycleMs: 6500,
    xp: { smithing: 20 },
    costs: { ashLog: 2, tannedHide: 1 },
    rewards: { barkLeggings: 1 },
  },
  {
    id: 'smelter',
    name: 'Copper Smelter',
    zone: 'Stoneward',
    group: 'Artisan',
    scene: 'forge',
    primarySkill: 'smithing',
    levelReqs: { smithing: 1 },
    cycleMs: 8000,
    xp: { smithing: 26 },
    costs: { copperOre: 1, tinOre: 1, ashLog: 1 },
    rewards: { bronzeBar: 1 },
  },
  {
    id: 'ironSmelter',
    name: 'Iron Smelter',
    zone: 'Stoneward',
    group: 'Artisan',
    scene: 'forge',
    primarySkill: 'smithing',
    levelReqs: { smithing: 8 },
    cycleMs: 11000,
    xp: { smithing: 62 },
    costs: { ironOre: 2, coalOre: 1 },
    rewards: { ironBar: 1 },
  },
  {
    id: 'copperArmory',
    name: 'Copper Dagger',
    zone: 'Stoneward',
    group: 'Artisan',
    scene: 'forge',
    primarySkill: 'smithing',
    levelReqs: { smithing: 4 },
    cycleMs: 10000,
    xp: { smithing: 42 },
    costs: { bronzeBar: 3, ashLog: 2 },
    rewards: { copperDagger: 1 },
  },
  {
    id: 'copperArmorForge',
    name: 'Copper Armor',
    zone: 'Stoneward',
    group: 'Artisan',
    scene: 'forge',
    primarySkill: 'smithing',
    levelReqs: { smithing: 6 },
    cycleMs: 12000,
    xp: { smithing: 54 },
    costs: { bronzeBar: 4, tannedHide: 1 },
    rewards: { copperHelm: 1, copperPlate: 1 },
  },
  {
    id: 'copperLegsForge',
    name: 'Copper Legs',
    zone: 'Stoneward',
    group: 'Artisan',
    scene: 'forge',
    primarySkill: 'smithing',
    levelReqs: { smithing: 7 },
    cycleMs: 12500,
    xp: { smithing: 58 },
    costs: { bronzeBar: 3, tannedHide: 1 },
    rewards: { copperLegs: 1 },
  },
  {
    id: 'ironSwordForge',
    name: 'Iron Sword',
    zone: 'Stoneward',
    group: 'Artisan',
    scene: 'forge',
    primarySkill: 'smithing',
    levelReqs: { smithing: 10 },
    cycleMs: 13000,
    xp: { smithing: 74 },
    costs: { ironBar: 3, pineLog: 1 },
    rewards: { ironSword: 1 },
  },
  {
    id: 'ironArmorForge',
    name: 'Iron Armor',
    zone: 'Stoneward',
    group: 'Artisan',
    scene: 'forge',
    primarySkill: 'smithing',
    levelReqs: { smithing: 16 },
    cycleMs: 15000,
    xp: { smithing: 94 },
    costs: { ironBar: 5, tannedHide: 2 },
    rewards: { ironHelm: 1, ironPlate: 1 },
  },
  {
    id: 'ironLegsForge',
    name: 'Iron Legs',
    zone: 'Stoneward',
    group: 'Artisan',
    scene: 'forge',
    primarySkill: 'smithing',
    levelReqs: { smithing: 18 },
    cycleMs: 16000,
    xp: { smithing: 105 },
    costs: { ironBar: 4, tannedHide: 2 },
    rewards: { ironLegs: 1 },
  },
  {
    id: 'steelSmelter',
    name: 'Steel Smelter',
    zone: 'Stoneward',
    group: 'Artisan',
    scene: 'forge',
    primarySkill: 'smithing',
    levelReqs: { smithing: 35 },
    cycleMs: 15000,
    xp: { smithing: 112 },
    costs: { ironBar: 2, coalOre: 2 },
    rewards: { steelBar: 1 },
  },
  {
    id: 'steelArmory',
    name: 'Steel Longsword',
    zone: 'Stoneward',
    group: 'Artisan',
    scene: 'forge',
    primarySkill: 'smithing',
    levelReqs: { smithing: 38 },
    cycleMs: 17500,
    xp: { smithing: 150 },
    costs: { steelBar: 3, runeDust: 1 },
    rewards: { steelLongsword: 1 },
  },
  {
    id: 'steelArmorForge',
    name: 'Steel Armor',
    zone: 'Stoneward',
    group: 'Artisan',
    scene: 'forge',
    primarySkill: 'smithing',
    levelReqs: { smithing: 40 },
    cycleMs: 19000,
    xp: { smithing: 166 },
    costs: { steelBar: 5, thickHide: 3 },
    rewards: { steelHelm: 1, steelPlate: 1 },
  },
  {
    id: 'steelLegsForge',
    name: 'Steel Legs',
    zone: 'Stoneward',
    group: 'Artisan',
    scene: 'forge',
    primarySkill: 'smithing',
    levelReqs: { smithing: 42 },
    cycleMs: 20000,
    xp: { smithing: 185 },
    costs: { steelBar: 4, thickHide: 2 },
    rewards: { steelLegs: 1 },
  },
  {
    id: 'tungstenSmelter',
    name: 'Tungsten Smelter',
    zone: 'Deep Crucible',
    group: 'Artisan',
    scene: 'forge',
    primarySkill: 'smithing',
    levelReqs: { smithing: 55 },
    cycleMs: 22000,
    xp: { smithing: 230 },
    costs: { tungstenOre: 2, coalOre: 2 },
    rewards: { tungstenBar: 1 },
  },
  {
    id: 'tungstenArmory',
    name: 'Tungsten Blade',
    zone: 'Deep Crucible',
    group: 'Artisan',
    scene: 'forge',
    primarySkill: 'smithing',
    levelReqs: { smithing: 60 },
    cycleMs: 26000,
    xp: { smithing: 315 },
    costs: { tungstenBar: 3, runeDust: 3 },
    rewards: { tungstenBlade: 1 },
  },
  {
    id: 'tungstenArmorForge',
    name: 'Tungsten Armor',
    zone: 'Deep Crucible',
    group: 'Artisan',
    scene: 'forge',
    primarySkill: 'smithing',
    levelReqs: { smithing: 62 },
    cycleMs: 29000,
    xp: { smithing: 350 },
    costs: { tungstenBar: 5, runeDust: 4 },
    rewards: { tungstenHelm: 1, tungstenPlate: 1 },
  },
  {
    id: 'tungstenLegsForge',
    name: 'Tungsten Legs',
    zone: 'Deep Crucible',
    group: 'Artisan',
    scene: 'forge',
    primarySkill: 'smithing',
    levelReqs: { smithing: 64 },
    cycleMs: 30000,
    xp: { smithing: 370 },
    costs: { tungstenBar: 4, runeDust: 3 },
    rewards: { tungstenLegs: 1 },
  },
  {
    id: 'craftLeatherCowl',
    name: 'Craft Leather Cowl',
    zone: 'Hearthline',
    group: 'Artisan',
    scene: 'forge',
    primarySkill: 'crafting',
    levelReqs: { crafting: 1 },
    cycleMs: 5000,
    xp: { crafting: 15 },
    costs: { tannedHide: 2, ashLog: 1 },
    rewards: { leatherCowl: 1 },
  },
  {
    id: 'craftLeatherChaps',
    name: 'Craft Leather Chaps',
    zone: 'Hearthline',
    group: 'Artisan',
    scene: 'forge',
    primarySkill: 'crafting',
    levelReqs: { crafting: 3 },
    cycleMs: 6000,
    xp: { crafting: 24 },
    costs: { tannedHide: 3, ashLog: 1 },
    rewards: { leatherChaps: 1 },
  },
  {
    id: 'craftLeatherBody',
    name: 'Craft Leather Body',
    zone: 'Hearthline',
    group: 'Artisan',
    scene: 'forge',
    primarySkill: 'crafting',
    levelReqs: { crafting: 4 },
    cycleMs: 7000,
    xp: { crafting: 30 },
    costs: { tannedHide: 4, ashLog: 1 },
    rewards: { leatherBody: 1 },
  },
  {
    id: 'craftHardleatherCowl',
    name: 'Craft Hardleather Cowl',
    zone: 'Hearthline',
    group: 'Artisan',
    scene: 'forge',
    primarySkill: 'crafting',
    levelReqs: { crafting: 10 },
    cycleMs: 8500,
    xp: { crafting: 50 },
    costs: { thickHide: 2, pineLog: 1 },
    rewards: { hardleatherCowl: 1 },
  },
  {
    id: 'craftHardleatherChaps',
    name: 'Craft Hardleather Chaps',
    zone: 'Hearthline',
    group: 'Artisan',
    scene: 'forge',
    primarySkill: 'crafting',
    levelReqs: { crafting: 12 },
    cycleMs: 9500,
    xp: { crafting: 68 },
    costs: { thickHide: 3, pineLog: 1 },
    rewards: { hardleatherChaps: 1 },
  },
  {
    id: 'craftHardleatherBody',
    name: 'Craft Hardleather Body',
    zone: 'Hearthline',
    group: 'Artisan',
    scene: 'forge',
    primarySkill: 'crafting',
    levelReqs: { crafting: 15 },
    cycleMs: 11000,
    xp: { crafting: 85 },
    costs: { thickHide: 4, pineLog: 1 },
    rewards: { hardleatherBody: 1 },
  },
  {
    id: 'craftCarapaceCowl',
    name: 'Craft Carapace Cowl',
    zone: 'Hearthline',
    group: 'Artisan',
    scene: 'forge',
    primarySkill: 'crafting',
    levelReqs: { crafting: 25 },
    cycleMs: 12500,
    xp: { crafting: 110 },
    costs: { ruggedHide: 2, oakLog: 1 },
    rewards: { carapaceCowl: 1 },
  },
  {
    id: 'craftCarapaceLegs',
    name: 'Craft Carapace Legs',
    zone: 'Hearthline',
    group: 'Artisan',
    scene: 'forge',
    primarySkill: 'crafting',
    levelReqs: { crafting: 28 },
    cycleMs: 13500,
    xp: { crafting: 135 },
    costs: { ruggedHide: 3, oakLog: 1 },
    rewards: { carapaceLegs: 1 },
  },
  {
    id: 'craftCarapaceBody',
    name: 'Craft Carapace Body',
    zone: 'Hearthline',
    group: 'Artisan',
    scene: 'forge',
    primarySkill: 'crafting',
    levelReqs: { crafting: 32 },
    cycleMs: 15000,
    xp: { crafting: 160 },
    costs: { ruggedHide: 4, oakLog: 1 },
    rewards: { carapaceBody: 1 },
  },
  {
    id: 'craftCobaltMeshCowl',
    name: 'Craft Cobalt-Mesh Cowl',
    zone: 'Deep Crucible',
    group: 'Artisan',
    scene: 'forge',
    primarySkill: 'crafting',
    levelReqs: { crafting: 45 },
    cycleMs: 18000,
    xp: { crafting: 210 },
    costs: { cobaltScale: 2, ironbarkLog: 1 },
    rewards: { cobaltMeshCowl: 1 },
  },
  {
    id: 'craftCobaltMeshLegs',
    name: 'Craft Cobalt-Mesh Legs',
    zone: 'Deep Crucible',
    group: 'Artisan',
    scene: 'forge',
    primarySkill: 'crafting',
    levelReqs: { crafting: 48 },
    cycleMs: 20000,
    xp: { crafting: 260 },
    costs: { cobaltScale: 3, ironbarkLog: 1 },
    rewards: { cobaltMeshLegs: 1 },
  },
  {
    id: 'craftCobaltMeshBody',
    name: 'Craft Cobalt-Mesh Body',
    zone: 'Deep Crucible',
    group: 'Artisan',
    scene: 'forge',
    primarySkill: 'crafting',
    levelReqs: { crafting: 52 },
    cycleMs: 22000,
    xp: { crafting: 320 },
    costs: { cobaltScale: 4, ironbarkLog: 1 },
    rewards: { cobaltMeshBody: 1 },
  },
  {
    id: 'craftDragonhideCowl',
    name: 'Craft Dragonhide Cowl',
    zone: 'Deep Crucible',
    group: 'Artisan',
    scene: 'forge',
    primarySkill: 'crafting',
    levelReqs: { crafting: 65 },
    cycleMs: 25000,
    xp: { crafting: 400 },
    costs: { wyrmHide: 2, elderLog: 1 },
    rewards: { dragonhideCowl: 1 },
  },
  {
    id: 'craftDragonhideChaps',
    name: 'Craft Dragonhide Chaps',
    zone: 'Deep Crucible',
    group: 'Artisan',
    scene: 'forge',
    primarySkill: 'crafting',
    levelReqs: { crafting: 68 },
    cycleMs: 27000,
    xp: { crafting: 500 },
    costs: { wyrmHide: 3, elderLog: 1 },
    rewards: { dragonhideChaps: 1 },
  },
  {
    id: 'craftDragonhideBody',
    name: 'Craft Dragonhide Body',
    zone: 'Deep Crucible',
    group: 'Artisan',
    scene: 'forge',
    primarySkill: 'crafting',
    levelReqs: { crafting: 72 },
    cycleMs: 30000,
    xp: { crafting: 600 },
    costs: { wyrmHide: 4, elderLog: 1 },
    rewards: { dragonhideBody: 1 },
  },
  {
    id: 'cookMinnow',
    name: 'Cook Minnow',
    zone: 'Hearthline',
    group: 'Artisan',
    scene: 'forge',
    primarySkill: 'cooking',
    levelReqs: { cooking: 1 },
    cycleMs: 4200,
    xp: { cooking: 14 },
    costs: { rawMinnow: 1 },
    rewards: {},
    cooking: {
      rawItem: 'rawMinnow',
      cookedItem: 'cookedMinnow',
      baseBurnChance: 35,
      minBurnChance: 0,
      burnReductionPerLevel: 3,
    },
  },
  {
    id: 'cookTrout',
    name: 'Cook Trout',
    zone: 'Hearthline',
    group: 'Artisan',
    scene: 'forge',
    primarySkill: 'cooking',
    levelReqs: { cooking: 5 },
    cycleMs: 5600,
    xp: { cooking: 30 },
    costs: { rawTrout: 1 },
    rewards: {},
    cooking: {
      rawItem: 'rawTrout',
      cookedItem: 'cookedTrout',
      baseBurnChance: 50,
      minBurnChance: 5,
      burnReductionPerLevel: 2.5,
    },
  },
  {
    id: 'cookCod',
    name: 'Cook Cod',
    zone: 'Hearthline',
    group: 'Artisan',
    scene: 'forge',
    primarySkill: 'cooking',
    levelReqs: { cooking: 12 },
    cycleMs: 7000,
    xp: { cooking: 48 },
    costs: { rawCod: 1 },
    rewards: {},
    cooking: {
      rawItem: 'rawCod',
      cookedItem: 'cookedCod',
      baseBurnChance: 60,
      minBurnChance: 6,
      burnReductionPerLevel: 2,
    },
  },
  {
    id: 'cookTuna',
    name: 'Cook Tuna',
    zone: 'Hearthline',
    group: 'Artisan',
    scene: 'forge',
    primarySkill: 'cooking',
    levelReqs: { cooking: 24 },
    cycleMs: 8800,
    xp: { cooking: 82 },
    costs: { rawTuna: 1 },
    rewards: {},
    cooking: {
      rawItem: 'rawTuna',
      cookedItem: 'cookedTuna',
      baseBurnChance: 75,
      minBurnChance: 8,
      burnReductionPerLevel: 1.7,
    },
  },
  {
    id: 'cookManta',
    name: 'Cook Manta',
    zone: 'Hearthline',
    group: 'Artisan',
    scene: 'forge',
    primarySkill: 'cooking',
    levelReqs: { cooking: 38 },
    cycleMs: 11500,
    xp: { cooking: 145 },
    costs: { rawManta: 1 },
    rewards: {},
    cooking: {
      rawItem: 'rawManta',
      cookedItem: 'cookedManta',
      baseBurnChance: 95,
      minBurnChance: 10,
      burnReductionPerLevel: 1.6,
    },
  },
  {
    id: 'cookLeviathan',
    name: 'Cook Leviathan',
    zone: 'Hearthline',
    group: 'Artisan',
    scene: 'forge',
    primarySkill: 'cooking',
    levelReqs: { cooking: 58 },
    cycleMs: 17000,
    xp: { cooking: 310 },
    costs: { rawLeviathan: 1 },
    rewards: {},
    cooking: {
      rawItem: 'rawLeviathan',
      cookedItem: 'cookedLeviathan',
      baseBurnChance: 110,
      minBurnChance: 12,
      burnReductionPerLevel: 1.4,
    },
  },
]

export const ACTIVITY_BY_ID = Object.fromEntries(
  ACTIVITIES.map((activity) => [activity.id, activity]),
) as Record<ActivityId, ActivityDefinition>

export function getActivityAreaId(activity: ActivityDefinition): AreaId {
  return ZONE_AREAS[activity.zone] ?? STARTER_AREA_ID
}

export function getAreaActivities(areaId: AreaId): ActivityDefinition[] {
  return ACTIVITIES.filter((activity) => getActivityAreaId(activity) === areaId)
}

export function isAreaUnlocked(state: GameState, areaId: AreaId): boolean {
  return state.unlockedAreaIds.includes(areaId)
}

export function travelToArea(
  state: GameState,
  areaId: AreaId,
): { state: GameState; message: string } {
  const area = AREA_BY_ID[areaId]

  if (!area) {
    return { state, message: 'That route is not charted yet.' }
  }

  if (state.currentAreaId === areaId) {
    return { state, message: `${area.name} is already selected.` }
  }

  if (isAreaUnlocked(state, areaId)) {
    return {
      state: {
        ...state,
        currentAreaId: areaId,
        active: null,
      },
      message: `Sailed to ${area.name}.`,
    }
  }

  if (state.inventory.crowns < area.shipCost) {
    return {
      state,
      message: `${area.dockName} asks ${area.shipCost.toLocaleString()} Crowns for passage.`,
    }
  }

  return {
    state: {
      ...state,
      currentAreaId: areaId,
      unlockedAreaIds: [...state.unlockedAreaIds, areaId],
      inventory: {
        ...state.inventory,
        crowns: state.inventory.crowns - area.shipCost,
      },
      active: null,
    },
    message: `Paid ${area.shipCost.toLocaleString()} Crowns and sailed to ${area.name}.`,
  }
}

export const MARKET_ITEMS: ItemId[] = [
  'ashLog',
  'pineLog',
  'oakLog',
  'ironbarkLog',
  'elderLog',
  'spiritwoodLog',
  'rawMinnow',
  'cookedMinnow',
  'rawTrout',
  'cookedTrout',
  'rawCod',
  'cookedCod',
  'rawTuna',
  'cookedTuna',
  'rawManta',
  'cookedManta',
  'rawLeviathan',
  'cookedLeviathan',
  'treantBark',
  'hollowSeed',
  'copperOre',
  'tinOre',
  'ironOre',
  'coalOre',
  'cobaltOre',
  'tungstenOre',
  'bronzeBar',
  'ironBar',
  'steelBar',
  'tungstenBar',
  'woodClub',
  'barkShield',
  'barkVest',
  'barkLeggings',
  'copperDagger',
  'copperHelm',
  'copperPlate',
  'copperLegs',
  'ironSword',
  'ironHelm',
  'ironPlate',
  'ironLegs',
  'steelLongsword',
  'steelHelm',
  'steelPlate',
  'steelLegs',
  'tungstenBlade',
  'tungstenHelm',
  'tungstenPlate',
  'tungstenLegs',
  'tannedHide',
  'thickHide',
  'ruggedHide',
  'cobaltScale',
  'wyrmHide',
  'leatherCowl',
  'leatherBody',
  'leatherChaps',
  'hardleatherCowl',
  'hardleatherBody',
  'hardleatherChaps',
  'carapaceCowl',
  'carapaceBody',
  'carapaceLegs',
  'cobaltMeshCowl',
  'cobaltMeshBody',
  'cobaltMeshLegs',
  'dragonhideCowl',
  'dragonhideBody',
  'dragonhideChaps',
  'fieldCharm',
  'runeDust',
]

export const MARKET_ROWS = MARKET_ITEMS.map((itemId, index) => {
  const item = ITEMS[itemId]
  const change = Math.round(Math.sin(index * 1.7) * 9)
  return {
    itemId,
    price: item.marketPrice,
    buyPrice: realmScavengerBuyPrice(item.marketPrice),
    sellPrice: item.marketPrice,
    change,
    volume: 1200 + index * 317,
    spark: Array.from({ length: 8 }, (_, point) =>
      Math.max(8, 28 + Math.round(Math.sin(point + index) * 18)),
    ),
  }
})

export function createSeedMarketOrders(): MarketOrder[] {
  return MARKET_ROWS.map((row, index) => ({
    id: `realm-${row.itemId}`,
    itemId: row.itemId,
    seller: 'Realm',
    side: 'buy',
    quantity: Number.MAX_SAFE_INTEGER,
    unitPrice: row.buyPrice,
    createdAt: BOOT_MARKET_TIME - index * 60_000,
  }))
}

export function getMarketCategory(itemId: ItemId): Exclude<MarketCategory, 'All'> {
  const item = ITEMS[itemId]

  if (item.slot) {
    return 'Equipment'
  }

  if (item.kind === 'Food' || item.kind === 'Raw Food') {
    return 'Food'
  }

  if (item.kind === 'Material' || item.kind === 'Currency') {
    return 'Materials'
  }

  if (item.kind === 'Rare' || item.kind === 'Boss Material' || item.kind === 'Ultra Rare') {
    return 'Rare'
  }

  return 'Resources'
}

export function getItemSources(itemId: ItemId): string[] {
  const sources = ACTIVITIES.flatMap((activity) => {
    const entries: string[] = []

    if ((activity.rewards[itemId] ?? 0) > 0) {
      entries.push(activity.name)
    }

    if (activity.cooking?.cookedItem === itemId) {
      entries.push(activity.name)
    }

    for (const drop of activity.combat?.dropTable ?? []) {
      if (drop.itemId === itemId) {
        entries.push(`${activity.name} drop`)
      }
    }

    return entries
  })

  return [...new Set(sources)]
}

export function getItemUses(itemId: ItemId): string[] {
  const item = ITEMS[itemId]
  const uses = ACTIVITIES.flatMap((activity) =>
    (activity.costs?.[itemId] ?? 0) > 0 ? [activity.name] : [],
  )

  if (item.slot) {
    uses.unshift(`Equip in ${item.slot}`)
  }

  if (item.healAmount) {
    uses.unshift(`Eat for ${item.healAmount} HP`)
  }

  return [...new Set(uses)]
}

export function createInitialState(): GameState {
  return {
    skills: SKILLS.reduce((book, skill) => {
      book[skill.id] = { xp: 0 }
      return book
    }, {} as SkillBook),
    inventory: Object.keys(ITEMS).reduce((bag, key) => {
      bag[key as ItemId] = key === 'crowns' ? 80 : 0
      return bag
    }, {} as Inventory),
    equipment: {
      weapon: null,
      shield: null,
      helm: null,
      chest: null,
      legs: null,
      trinket: null,
    },
    marketOrders: createSeedMarketOrders(),
    combatSettings: {
      autoEat: false,
      stopAtHitpoints: 6,
      foodItemId: 'cookedMinnow',
      maxFoodPerClaim: 12,
    },
    currentHitpoints: 10,
    currentAreaId: STARTER_AREA_ID,
    unlockedAreaIds: [STARTER_AREA_ID],
    active: null,
    log: ['Profile minted locally.'],
  }
}

export function normalizeState(value: Partial<GameState> | null): GameState {
  const initial = createInitialState()

  if (!value) {
    return initial
  }

  const unlockedAreaIds = normalizeUnlockedAreaIds(value.unlockedAreaIds)
  const requestedAreaId = value.currentAreaId && AREA_BY_ID[value.currentAreaId]
    ? value.currentAreaId
    : STARTER_AREA_ID
  const currentAreaId = unlockedAreaIds.includes(requestedAreaId)
    ? requestedAreaId
    : STARTER_AREA_ID

  const activeActivity = value.active ? ACTIVITY_BY_ID[value.active.id] : null
  const active =
    value.active && activeActivity && unlockedAreaIds.includes(getActivityAreaId(activeActivity))
      ? {
          id: value.active.id,
          startedAt: Number(value.active.startedAt) || Date.now(),
          lastClaimAt: Number(value.active.lastClaimAt) || Date.now(),
        }
      : null

  const skills = SKILLS.reduce((book, skill) => {
    book[skill.id] = {
      xp: Math.max(0, Number(value.skills?.[skill.id]?.xp ?? 0)),
    }
    return book
  }, {} as SkillBook)

  const equipment = {
    weapon: normalizeEquipmentSlot(value.equipment, 'weapon'),
    shield: normalizeEquipmentSlot(value.equipment, 'shield'),
    helm: normalizeEquipmentSlot(value.equipment, 'helm'),
    chest: normalizeEquipmentSlot(value.equipment, 'chest'),
    legs: normalizeEquipmentSlot(value.equipment, 'legs'),
    trinket: normalizeEquipmentSlot(value.equipment, 'trinket'),
  }
  const maxHp =
    getMaxHitpointsFromSkills(skills) +
    getEquipmentStats({
      ...initial,
      skills,
      equipment,
    }).hitpoints

  return {
    skills,
    inventory: (Object.keys(ITEMS) as ItemId[]).reduce((bag, itemId) => {
      const sourceInventory = value.inventory as
        | Partial<Record<ItemId | 'hide', number>>
        | undefined
      const savedAmount =
        itemId === 'tannedHide'
          ? sourceInventory?.tannedHide ?? sourceInventory?.hide
          : sourceInventory?.[itemId]

      bag[itemId] = Math.max(
        0,
        Math.floor(Number(savedAmount ?? initial.inventory[itemId])),
      )
      return bag
    }, {} as Inventory),
    equipment,
    marketOrders: normalizeMarketOrders(value.marketOrders, initial.marketOrders),
    combatSettings: normalizeCombatSettings(value.combatSettings, initial.combatSettings),
    currentHitpoints: Math.max(
      0,
      Math.min(maxHp, Math.floor(Number(value.currentHitpoints ?? maxHp))),
    ),
    currentAreaId,
    unlockedAreaIds,
    active,
    log: Array.isArray(value.log) ? value.log.slice(0, 8) : initial.log,
  }
}

export function xpForLevel(level: number): number {
  const step = Math.max(0, level - 1)
  return (
    LEVEL_XP_QUADRATIC * step ** 2 +
    LEVEL_XP_CUBIC * step ** 3 +
    LEVEL_XP_QUARTIC * step ** 4
  )
}

export function levelFromXp(xp: number): number {
  let level = 1
  while (level < 99 && xp >= xpForLevel(level + 1)) {
    level += 1
  }
  return level
}

export function skillProgress(xp: number) {
  const level = levelFromXp(xp)
  const current = xpForLevel(level)
  const next = xpForLevel(level + 1)
  const progress = next === current ? 0 : ((xp - current) / (next - current)) * 100

  return {
    level,
    nextXp: next,
    currentXp: current,
    progress: Math.max(0, Math.min(100, progress)),
  }
}

export function getMaxHitpoints(state: GameState): number {
  return getMaxHitpointsFromSkills(state.skills) + getEquipmentStats(state).hitpoints
}

export function getEquipmentStats(state: GameState): Required<EquipmentStats> {
  return EQUIPMENT_SLOTS.reduce(
    (stats, slot) => {
      const itemId = state.equipment[slot]
      const itemStats = itemId ? ITEMS[itemId].stats : null

      if (!itemStats) {
        return stats
      }

      stats.attack += itemStats.attack ?? 0
      stats.defence += itemStats.defence ?? 0
      stats.hitpoints += itemStats.hitpoints ?? 0
      stats.speed += itemStats.speed ?? 0

      return stats
    },
    {
      attack: 0,
      defence: 0,
      hitpoints: 0,
      speed: 0,
    },
  )
}

export function getBurnChance(activity: ActivityDefinition, state: GameState): number | null {
  if (!activity.cooking) {
    return null
  }

  const cookingLevel = levelFromXp(state.skills.cooking.xp)
  const chance =
    activity.cooking.baseBurnChance -
    (cookingLevel - 1) * activity.cooking.burnReductionPerLevel

  return Math.max(activity.cooking.minBurnChance, Math.round(chance * 10) / 10)
}

export function getCycleMs(activity: ActivityDefinition, state: GameState): number {
  let multiplier = 1
  const stats = getEquipmentStats(state)

  if (activity.group === 'Combat') {
    multiplier *= Math.max(0.68, 1 - stats.speed * 0.025 - stats.attack * 0.012)
  } else {
    multiplier *= Math.max(0.8, 1 - stats.speed * 0.015)
  }

  return Math.max(2500, Math.round(activity.cycleMs * multiplier))
}

export function getActivityLock(
  activity: ActivityDefinition,
  state: GameState,
): string | null {
  return getActivityLocks(activity, state)[0] ?? null
}

export function getActivityLocks(
  activity: ActivityDefinition,
  state: GameState,
): string[] {
  const locks: string[] = []
  const activityAreaId = getActivityAreaId(activity)
  const activityArea = AREA_BY_ID[activityAreaId]

  if (!isAreaUnlocked(state, activityAreaId)) {
    locks.push(`${activityArea.name} ship ride`)
  } else if (state.currentAreaId !== activityAreaId) {
    locks.push(`${activityArea.name} area`)
  }

  for (const [skillId, requiredLevel] of Object.entries(activity.levelReqs)) {
    const currentLevel = levelFromXp(state.skills[skillId as SkillId].xp)
    if (currentLevel < requiredLevel) {
      locks.push(`${SKILLS.find((skill) => skill.id === skillId)?.name} ${requiredLevel}`)
    }
  }

  if (activity.combat && state.currentHitpoints <= 0) {
    locks.push('Hitpoints above 0')
  }

  if (
    activity.requiredEquipment &&
    !Object.values(state.equipment).includes(activity.requiredEquipment)
  ) {
    locks.push(ITEMS[activity.requiredEquipment].name)
  }

  for (const [itemId, amount] of Object.entries(activity.costs ?? {})) {
    const requiredAmount = amount ?? 0
    const currentAmount = state.inventory[itemId as ItemId] ?? 0
    if (requiredAmount > 0 && currentAmount < requiredAmount) {
      locks.push(`${requiredAmount} ${ITEMS[itemId as ItemId].name}`)
    }
  }

  return locks
}

export function getClaimPreview(state: GameState, now = Date.now()): ClaimPreview {
  if (!state.active) {
    return emptyPreview(0)
  }

  const activity = ACTIVITY_BY_ID[state.active.id]
  const cycleMs = getCycleMs(activity, state)
  const elapsedMs = Math.max(0, Math.min(now - state.active.lastClaimAt, AFK_CAP_MS))
  const rawCycles = Math.floor(elapsedMs / cycleMs)
  const affordableCycles = getAffordableCycles(activity, state.inventory)
  const possibleCycles = Math.max(0, Math.min(rawCycles, affordableCycles))
  const combatResult = getCombatCycleResult(activity, state, possibleCycles, cycleMs)
  const cycles = activity.combat ? combatResult.cycles : possibleCycles
  const cookingOutcome = getCookingOutcome(activity, state, cycles, cycleMs)
  const rareDrops = getRareDropOutcome(activity, state, cycles, cycleMs)

  return {
    cycles,
    progressPct: ((elapsedMs % cycleMs) / cycleMs) * 100,
    elapsedMs,
    cycleMs,
    xp: multiplyXpMap(activity.xp, cycles),
    rewards: {
      ...multiplyMap(activity.rewards, cycles),
      ...cookingOutcome.rewards,
      ...rareDrops,
    },
    costs: multiplyMap(activity.costs ?? {}, cycles),
    burned: cookingOutcome.burned,
    rareDrops,
    autoEaten: combatResult.autoEaten,
    hpRestored: combatResult.hpRestored,
    hpLost: combatResult.hpLost,
    stoppedByHp: combatResult.stoppedByHp,
    stoppedBySafety: combatResult.stoppedBySafety,
    deathPenalty: emptyDeathPenalty(),
  }
}

export function applyClaim(state: GameState, now = Date.now()) {
  const preview = getClaimPreview(state, now)

  if (!state.active || preview.cycles === 0) {
    if (preview.stoppedByHp) {
      const inventory = applyConsumedFood(state.inventory, preview.autoEaten)
      const maxHp = getMaxHitpoints(state)
      const currentHitpoints = Math.max(
        0,
        Math.min(maxHp, state.currentHitpoints + preview.hpRestored - preview.hpLost),
      )
      const penalty = getDeathPenalty(inventory, state.equipment)
      const penalized = applyDeathPenalty(
        {
          ...state,
          inventory,
          currentHitpoints,
          active: null,
        },
        penalty,
      )

      return {
        state: penalized,
        preview: {
          ...preview,
          deathPenalty: penalty,
        },
      }
    }

    if (preview.stoppedBySafety) {
      const inventory = applyConsumedFood(state.inventory, preview.autoEaten)
      const maxHp = getMaxHitpoints(state)

      return {
        state: {
          ...state,
          inventory,
          currentHitpoints: Math.max(
            0,
            Math.min(maxHp, state.currentHitpoints + preview.hpRestored - preview.hpLost),
          ),
          active: null,
        },
        preview,
      }
    }

    return { state, preview }
  }

  const inventory = { ...state.inventory }
  const skills = { ...state.skills }

  for (const [itemId, amount] of Object.entries(preview.costs)) {
    inventory[itemId as ItemId] -= amount
  }

  for (const [itemId, amount] of Object.entries(preview.autoEaten)) {
    inventory[itemId as ItemId] -= amount
  }

  for (const [itemId, amount] of Object.entries(preview.rewards)) {
    inventory[itemId as ItemId] += amount
  }

  for (const [skillId, xp] of Object.entries(preview.xp)) {
    skills[skillId as SkillId] = {
      xp: skills[skillId as SkillId].xp + xp,
    }
  }

  const maxHp = getMaxHitpoints({
    ...state,
    skills,
  })
  let currentHitpoints = Math.max(
    0,
    Math.min(maxHp, state.currentHitpoints + preview.hpRestored - preview.hpLost),
  )
  let nextInventory = inventory
  let nextEquipment = state.equipment
  let finalPreview = preview

  if (preview.stoppedByHp) {
    const penalty = getDeathPenalty(inventory, state.equipment)
    const penalized = applyDeathPenalty(
      {
        ...state,
        inventory,
        equipment: state.equipment,
        currentHitpoints,
      },
      penalty,
    )

    currentHitpoints = 0
    nextInventory = penalized.inventory
    nextEquipment = penalized.equipment
    finalPreview = {
      ...preview,
      deathPenalty: penalty,
    }
  }

  return {
    state: {
      ...state,
      skills,
      inventory: nextInventory,
      equipment: nextEquipment,
      currentHitpoints,
      active: preview.stoppedByHp || preview.stoppedBySafety
        ? null
        : {
            ...state.active,
            lastClaimAt: state.active.lastClaimAt + preview.cycles * preview.cycleMs,
          },
    },
    preview: finalPreview,
  }
}

export function eatFood(state: GameState, itemId: ItemId) {
  const item = ITEMS[itemId]
  const maxHp = getMaxHitpoints(state)

  if (!item.healAmount) {
    return { state, healed: 0, reason: `${item.name} cannot be eaten.` }
  }

  if (state.inventory[itemId] <= 0) {
    return { state, healed: 0, reason: `No ${item.name} in inventory.` }
  }

  if (state.currentHitpoints >= maxHp) {
    return { state, healed: 0, reason: 'Hitpoints are already full.' }
  }

  const nextHp = Math.min(maxHp, state.currentHitpoints + item.healAmount)

  return {
    state: {
      ...state,
      currentHitpoints: nextHp,
      inventory: {
        ...state.inventory,
        [itemId]: state.inventory[itemId] - 1,
      },
    },
    healed: nextHp - state.currentHitpoints,
    reason: null,
  }
}

export function getFoodItems(): ItemId[] {
  return (Object.keys(ITEMS) as ItemId[]).filter((itemId) => Boolean(ITEMS[itemId].healAmount))
}

export function summarizePreview(preview: ClaimPreview): string {
  const rewards = Object.entries(preview.rewards)
    .filter(([, amount]) => amount > 0)
    .map(([itemId, amount]) => `${amount} ${ITEMS[itemId as ItemId].name}`)
    .join(', ')

  const burned = Object.entries(preview.burned)
    .filter(([, amount]) => amount > 0)
    .map(([itemId, amount]) => `${amount} ${ITEMS[itemId as ItemId].name} burned`)
    .join(', ')

  const rareDrops = Object.entries(preview.rareDrops)
    .filter(([, amount]) => amount > 0)
    .map(([itemId, amount]) => `${amount} ${ITEMS[itemId as ItemId].name} drop`)
    .join(', ')

  const autoEaten = Object.entries(preview.autoEaten)
    .filter(([, amount]) => amount > 0)
    .map(([itemId, amount]) => `${amount} ${ITEMS[itemId as ItemId].name} auto-eaten`)
    .join(', ')

  const hpRestored = preview.hpRestored > 0 ? `${preview.hpRestored} HP restored` : ''
  const hpLost = preview.hpLost > 0 ? `${preview.hpLost} HP lost` : ''
  const lostCrowns =
    preview.deathPenalty.lostCrowns > 0
      ? `${preview.deathPenalty.lostCrowns} Crowns lost`
      : ''
  const lostEquipment =
    preview.deathPenalty.lostEquipment.length > 0
      ? `lost ${preview.deathPenalty.lostEquipment
          .map((itemId) => ITEMS[itemId].name)
          .join(', ')}`
      : ''

  const xp = Object.entries(preview.xp)
    .filter(([, amount]) => amount > 0)
    .map(([skillId, amount]) => {
      const skill = SKILLS.find((entry) => entry.id === skillId)
      return `${amount} ${skill?.name ?? skillId} XP`
    })
    .join(', ')

  const stopped = preview.stoppedByHp
    ? 'combat stopped'
    : preview.stoppedBySafety
      ? 'combat safety stop'
      : ''

  return [
    rewards,
    rareDrops,
    burned,
    autoEaten,
    hpRestored,
    hpLost,
    lostCrowns,
    lostEquipment,
    xp,
    stopped,
  ]
    .filter(Boolean)
    .join(' | ')
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  }

  return `${seconds}s`
}

function getMaxHitpointsFromSkills(skills: SkillBook): number {
  return 10 + (levelFromXp(skills.hitpoints.xp) - 1) * 3
}

function normalizeEquipmentSlot(
  equipment: Partial<Equipment> | undefined,
  slot: EquipmentSlot,
): ItemId | null {
  const itemId = equipment?.[slot]

  return itemId && ITEMS[itemId]?.slot === slot ? itemId : null
}

function normalizeMarketOrders(
  value: MarketOrder[] | undefined,
  fallback: MarketOrder[],
): MarketOrder[] {
  if (!Array.isArray(value)) {
    return fallback
  }

  return value
    .map((order, index) => {
      const rawOrder = order as Omit<Partial<MarketOrder>, 'itemId'> & {
        itemId?: ItemId | 'hide'
        side?: MarketSide
      }
      const itemId = rawOrder?.itemId === 'hide' ? 'tannedHide' : rawOrder?.itemId

      if (!itemId || !ITEMS[itemId]) {
        return null
      }

      const seller =
        rawOrder.seller === 'Player' || rawOrder.seller === 'Trader' ? rawOrder.seller : 'Realm'
      const side =
        rawOrder.side === 'buy' || rawOrder.side === 'sell'
          ? rawOrder.side
          : seller === 'Realm'
            ? 'buy'
            : 'sell'

      return {
        id: typeof rawOrder.id === 'string' && rawOrder.id ? rawOrder.id : `order-${index}`,
        itemId,
        seller,
        side,
        quantity:
          seller === 'Realm' && side === 'buy'
            ? Number.MAX_SAFE_INTEGER
            : Math.max(0, Math.floor(Number(rawOrder.quantity) || 0)),
        unitPrice:
          seller === 'Realm' && side === 'buy'
            ? realmScavengerBuyPrice(ITEMS[itemId].marketPrice)
            : Math.max(1, Math.floor(Number(rawOrder.unitPrice) || ITEMS[itemId].marketPrice)),
        createdAt: Math.max(0, Math.floor(Number(rawOrder.createdAt) || BOOT_MARKET_TIME)),
      }
    })
    .filter((order): order is MarketOrder => Boolean(order && order.quantity > 0))
}

function normalizeCombatSettings(
  value: Partial<CombatSettings> | undefined,
  fallback: CombatSettings,
): CombatSettings {
  const foodItemId =
    value?.foodItemId && ITEMS[value.foodItemId]?.healAmount ? value.foodItemId : fallback.foodItemId

  return {
    autoEat: Boolean(value?.autoEat ?? fallback.autoEat),
    stopAtHitpoints: Math.max(
      1,
      Math.min(999, Math.floor(Number(value?.stopAtHitpoints ?? fallback.stopAtHitpoints))),
    ),
    foodItemId,
    maxFoodPerClaim: Math.max(
      1,
      Math.min(99, Math.floor(Number(value?.maxFoodPerClaim ?? fallback.maxFoodPerClaim))),
    ),
  }
}

function normalizeUnlockedAreaIds(value: AreaId[] | undefined): AreaId[] {
  const requested = Array.isArray(value) ? value : []
  const areaIds = new Set<AreaId>([STARTER_AREA_ID])

  for (const areaId of requested) {
    if (AREA_BY_ID[areaId]) {
      areaIds.add(areaId)
    }
  }

  return [...areaIds]
}

function getDeathPenalty(inventory: Inventory, equipment: Equipment): DeathPenalty {
  const lostEquipment = EQUIPMENT_SLOTS.flatMap((slot) => {
    const itemId = equipment[slot]
    return itemId ? [itemId] : []
  })

  return {
    lostCrowns: Math.floor(inventory.crowns / 2),
    lostEquipment,
  }
}

function applyConsumedFood(
  inventory: Inventory,
  autoEaten: Partial<Record<ItemId, number>>,
): Inventory {
  const next = { ...inventory }

  for (const [itemId, amount] of Object.entries(autoEaten)) {
    next[itemId as ItemId] = Math.max(0, next[itemId as ItemId] - amount)
  }

  return next
}

function applyDeathPenalty(state: GameState, penalty: DeathPenalty): GameState {
  const inventory = { ...state.inventory }

  inventory.crowns = Math.max(0, inventory.crowns - penalty.lostCrowns)

  for (const itemId of penalty.lostEquipment) {
    inventory[itemId] = Math.max(0, inventory[itemId] - 1)
  }

  return {
    ...state,
    inventory,
    equipment: EQUIPMENT_SLOTS.reduce((equipment, slot) => {
      equipment[slot] = null
      return equipment
    }, {} as Equipment),
  }
}

function getAffordableCycles(
  activity: ActivityDefinition,
  inventory: Inventory,
): number {
  if (!activity.costs) {
    return Number.POSITIVE_INFINITY
  }

  return Object.entries(activity.costs).reduce((maxCycles, [itemId, amount]) => {
    if (!amount) {
      return maxCycles
    }

    return Math.min(maxCycles, Math.floor(inventory[itemId as ItemId] / amount))
  }, Number.POSITIVE_INFINITY)
}

function getCombatCycleResult(
  activity: ActivityDefinition,
  state: GameState,
  possibleCycles: number,
  cycleMs: number,
) {
  if (!activity.combat) {
    return {
      cycles: possibleCycles,
      hpLost: 0,
      hpRestored: 0,
      autoEaten: {} as Partial<Record<ItemId, number>>,
      stoppedByHp: false,
      stoppedBySafety: false,
    }
  }

  let cycles = 0
  let hpLost = 0
  let hpRestored = 0
  let hp = state.currentHitpoints
  let foodUsed = 0
  const autoEaten: Partial<Record<ItemId, number>> = {}
  const maxHp = getMaxHitpoints(state)
  const settings = state.combatSettings
  const foodItemId = settings.foodItemId
  const stopAtHitpoints = Math.min(settings.stopAtHitpoints, Math.max(1, maxHp - 1))
  let availableFood =
    settings.autoEat && foodItemId && ITEMS[foodItemId].healAmount
      ? state.inventory[foodItemId]
      : 0

  for (let index = 0; index < possibleCycles; index += 1) {
    if (settings.autoEat && hp <= stopAtHitpoints) {
      if (
        foodItemId &&
        availableFood > 0 &&
        foodUsed < settings.maxFoodPerClaim &&
        hp < maxHp
      ) {
        const restored = Math.min(maxHp, hp + (ITEMS[foodItemId].healAmount ?? 0)) - hp
        availableFood -= 1
        foodUsed += 1
        hp += restored
        hpRestored += restored
        autoEaten[foodItemId] = (autoEaten[foodItemId] ?? 0) + 1
      }

      if (hp <= stopAtHitpoints) {
        return {
          cycles,
          hpLost,
          hpRestored,
          autoEaten,
          stoppedByHp: false,
          stoppedBySafety: true,
        }
      }
    }

    const cycleIndex = getCycleIndex(state, cycleMs, index)
    const damage = getCombatDamage(activity, state, cycleIndex)

    if (damage > 0 && hp - damage <= 0) {
      hpLost += hp
      return {
        cycles,
        hpLost,
        hpRestored,
        autoEaten,
        stoppedByHp: true,
        stoppedBySafety: false,
      }
    }

    hp -= damage
    hpLost += damage
    cycles += 1
  }

  return {
    cycles,
    hpLost,
    hpRestored,
    autoEaten,
    stoppedByHp: false,
    stoppedBySafety: false,
  }
}

function getCombatDamage(
  activity: ActivityDefinition,
  state: GameState,
  cycleIndex: number,
): number {
  if (!activity.combat) {
    return 0
  }

  const hitRoll = rollPercent(state.active?.startedAt ?? 0, cycleIndex, 17)
  if (hitRoll >= activity.combat.damageChance) {
    return 0
  }

  const damageRoll = rollPercent(state.active?.startedAt ?? 0, cycleIndex, 31)
  const range = activity.combat.maxDamage - activity.combat.minDamage + 1
  const rawDamage = activity.combat.minDamage + Math.floor((damageRoll / 100) * range)
  const defenceLevel = levelFromXp(state.skills.defence.xp)
  const stats = getEquipmentStats(state)
  const mitigation = Math.floor((defenceLevel - 1) / 5) + Math.floor(stats.defence / 3)

  return Math.max(0, rawDamage - mitigation)
}

function getCookingOutcome(
  activity: ActivityDefinition,
  state: GameState,
  cycles: number,
  cycleMs: number,
) {
  if (!activity.cooking) {
    return {
      rewards: {} as Partial<Record<ItemId, number>>,
      burned: {} as Partial<Record<ItemId, number>>,
    }
  }

  const burnChance = getBurnChance(activity, state) ?? 0
  let cooked = 0
  let burned = 0

  for (let index = 0; index < cycles; index += 1) {
    const cycleIndex = getCycleIndex(state, cycleMs, index)
    const burnRoll = rollPercent(state.active?.startedAt ?? 0, cycleIndex, 53)

    if (burnRoll < burnChance) {
      burned += 1
    } else {
      cooked += 1
    }
  }

  return {
    rewards: cooked > 0 ? { [activity.cooking.cookedItem]: cooked } : {},
    burned: burned > 0 ? { [activity.cooking.rawItem]: burned } : {},
  }
}

function getRareDropOutcome(
  activity: ActivityDefinition,
  state: GameState,
  cycles: number,
  cycleMs: number,
) {
  if (!activity.combat?.dropTable?.length) {
    return {} as Partial<Record<ItemId, number>>
  }

  const drops: Partial<Record<ItemId, number>> = {}

  for (let index = 0; index < cycles; index += 1) {
    const cycleIndex = getCycleIndex(state, cycleMs, index)

    for (const [dropIndex, drop] of activity.combat.dropTable.entries()) {
      const roll = rollPercent(state.active?.startedAt ?? 0, cycleIndex, 71 + dropIndex * 13)

      if (roll < drop.chance) {
        drops[drop.itemId] = (drops[drop.itemId] ?? 0) + drop.amount
      }
    }
  }

  return drops
}

function getCycleIndex(state: GameState, cycleMs: number, offset: number): number {
  if (!state.active) {
    return offset
  }

  return Math.floor((state.active.lastClaimAt - state.active.startedAt) / cycleMs) + offset
}

function emptyPreview(cycleMs: number): ClaimPreview {
  return {
    cycles: 0,
    progressPct: 0,
    elapsedMs: 0,
    cycleMs,
    xp: {},
    rewards: {},
    costs: {},
    burned: {},
    rareDrops: {},
    autoEaten: {},
    hpRestored: 0,
    hpLost: 0,
    stoppedByHp: false,
    stoppedBySafety: false,
    deathPenalty: emptyDeathPenalty(),
  }
}

function emptyDeathPenalty(): DeathPenalty {
  return {
    lostCrowns: 0,
    lostEquipment: [],
  }
}

function multiplyMap<T extends string>(
  map: Partial<Record<T, number>>,
  cycles: number,
): Partial<Record<T, number>> {
  return Object.entries(map).reduce((next, [key, value]) => {
    next[key as T] = Number(value) * cycles
    return next
  }, {} as Partial<Record<T, number>>)
}

function multiplyXpMap<T extends string>(
  map: Partial<Record<T, number>>,
  cycles: number,
): Partial<Record<T, number>> {
  return Object.entries(map).reduce((next, [key, value]) => {
    next[key as T] = Number(value) * cycles * XP_RATE_MULTIPLIER
    return next
  }, {} as Partial<Record<T, number>>)
}

function rollPercent(seedA: number, seedB: number, salt: number): number {
  let hash = Math.imul(Math.floor(seedA) ^ 0x9e3779b9, 0x85ebca6b)
  hash ^= Math.imul(seedB + salt, 0xc2b2ae35)
  hash ^= hash >>> 16
  hash = Math.imul(hash, 0x7feb352d)
  hash ^= hash >>> 15
  hash = Math.imul(hash, 0x846ca68b)
  hash ^= hash >>> 16

  return ((hash >>> 0) % 10000) / 100
}
