export type SkillId =
  | 'asteroidMining'
  | 'wreckSalvage'
  | 'nebulaSiphoning'
  | 'exoSurveying'
  | 'shipyardFabrication'
  | 'lifeSystemsSynthesis'
  | 'quantumRefining'
  | 'nanofabAssembly'
  | 'gunnery'
  | 'engineering'

export type SectorId = 'orbitalDock' | 'innerBelt'

export type ActivityGroup = 'Gathering' | 'Production' | 'Combat'

export type ModuleSlot =
  | 'hardpoint'
  | 'shieldArray'
  | 'hullPlating'
  | 'sensorSuite'
  | 'engineCore'
  | 'auxiliaryCore'

export type ItemId =
  | 'credits'
  | 'ferriteOre'
  | 'nickelOre'
  | 'waterIce'
  | 'titaniumOre'
  | 'silicateDust'
  | 'hydrogenGas'
  | 'ionizedGas'
  | 'plasmaCondensate'
  | 'fuelCell'
  | 'biomass'
  | 'surveyData'
  | 'xenodata'
  | 'bioSample'
  | 'scrapMetal'
  | 'circuitFragments'
  | 'techFragments'
  | 'damagedCore'
  | 'sensorLens'
  | 'alloyPlate'
  | 'refinedIsotopes'
  | 'powerCore'
  | 'exoticMatter'
  | 'repairGel'
  | 'oxygenCell'
  | 'medPatch'
  | 'hullPatch'
  | 'railSlugs'
  | 'microMissiles'
  | 'plasmaCharges'
  | 'miningLaser'
  | 'salvageBeam'
  | 'gasScoop'
  | 'surveyScanner'
  | 'lightTurret'
  | 'missileLauncher'
  | 'basicShieldGenerator'
  | 'deflectorArray'
  | 'reinforcedHullPlating'
  | 'ablativeArmor'
  | 'basicThrusters'
  | 'droneBay'
  | 'relicCore'
  | 'ancientBlueprint'
  | 'singularityShard'

export type ActivityId =
  | 'targetDrone'
  | 'raiderSkiff'
  | 'rogueSurveyProbe'
  | 'scrapReaver'
  | 'beltRaider'
  | 'shieldedFrigate'
  | 'minefieldSentinel'
  | 'anomalyWarden'
  | 'ghostShipCore'
  | 'rogueBattleship'
  | 'rockHopper'
  | 'beltProspector'
  | 'deepCoreMiner'
  | 'voidExtractor'
  | 'scrapper'
  | 'wreckDiver'
  | 'salvageSpecialist'
  | 'ghostShipHunter'
  | 'gasSkimmer'
  | 'nebulaHarvester'
  | 'plasmaExtractor'
  | 'quantumSiphon'
  | 'surfaceScanner'
  | 'planetarySurveyor'
  | 'exoBiologist'
  | 'basicFabricator'
  | 'moduleAssembler'
  | 'advancedShipwright'
  | 'capitalFabricator'
  | 'basicHydroponics'
  | 'nutrientSynthesizer'
  | 'advancedLifeSupport'
  | 'bioForge'
  | 'basicRefinery'
  | 'isotopeSeparator'
  | 'quantumDistiller'
  | 'antimatterForge'
  | 'basicNanofab'
  | 'precisionFabricator'
  | 'advancedNanofactory'

export type ItemKind =
  | 'currency'
  | 'resource'
  | 'energy'
  | 'organic'
  | 'salvage'
  | 'refined'
  | 'repair'
  | 'ammo'
  | 'module'
  | 'artifact'

export interface SkillProgress {
  xp: number
}

export interface SkillDefinition {
  id: SkillId
  name: string
  category: ActivityGroup
  description: string
}

export interface SectorDefinition {
  id: SectorId
  name: string
  description: string
  unlockCost: number
  levelReqs?: Partial<Record<SkillId, number>>
}

export interface ModuleStats {
  damage?: number
  accuracy?: number
  shielding?: number
  armor?: number
  hull?: number
  speed?: number
  utility?: number
}

export interface ItemDefinition {
  id: ItemId
  name: string
  kind: ItemKind
  description: string
  moduleSlot?: ModuleSlot
  stats?: ModuleStats
  repairAmount?: number
  ammoDamage?: number
  baseValue: number
  tradable: boolean
}

export interface CombatRules {
  threatHull: number
  attack: number
  defense: number
  accuracy: number
  requiredAmmo?: ItemId
}

export interface ActivityDefinition {
  id: ActivityId
  name: string
  group: ActivityGroup
  sectorId: SectorId
  primarySkill: SkillId
  tier: 1 | 2 | 3 | 4 | 5
  description: string
  cycleMs: number
  levelReqs: Partial<Record<SkillId, number>>
  xp: Partial<Record<SkillId, number>>
  rewards: Partial<Record<ItemId, number>>
  costs?: Partial<Record<ItemId, number>>
  requiredModule?: ItemId
  combat?: CombatRules
}

export interface ActiveMission {
  activityId: ActivityId
  startedAt: number
  lastClaimAt: number
}

export interface ShipState {
  currentHull: number
  maxHull: number
  modules: Partial<Record<ModuleSlot, ItemId>>
}

export interface CombatSettings {
  autoRepair: boolean
  stopAtHull: number
  repairItemId: ItemId
  maxRepairItemsPerClaim: number
}

export interface MarketOrder {
  id: string
  itemId: ItemId
  quantity: number
  unitPrice: number
}

export interface GameState {
  version: 1
  skills: Record<SkillId, SkillProgress>
  cargo: Record<ItemId, number>
  ship: ShipState
  currentSectorId: SectorId
  unlockedSectors: Record<SectorId, boolean>
  activeMission: ActiveMission | null
  combatSettings: CombatSettings
  marketOrders: MarketOrder[]
  eventLog: string[]
  lastSeenAt: number
}

export interface ClaimPreview {
  activity: ActivityDefinition | null
  cycles: number
  elapsedMs: number
  xp: Partial<Record<SkillId, number>>
  rewards: Partial<Record<ItemId, number>>
  costs: Partial<Record<ItemId, number>>
  hullDamage: number
  repairItemsUsed: number
  hullFailure: boolean
  lostCredits: number
  lostModules: ItemId[]
  stoppedReason?: string
}

export interface ActivityStatus {
  canStart: boolean
  reasons: string[]
}

export const STORAGE_KEY = 'idle-galactica-save-v1'
export const BASE_MAX_HULL = 100
export const AFK_CAP_MS = 12 * 60 * 60 * 1000

export const SKILLS: SkillDefinition[] = [
  {
    id: 'asteroidMining',
    name: 'Asteroid Mining',
    category: 'Gathering',
    description: 'Extract ores, ice, and dense minerals from asteroid fields.',
  },
  {
    id: 'wreckSalvage',
    name: 'Wreck Salvage',
    category: 'Gathering',
    description: 'Recover scrap, components, and fragments from derelict hulls.',
  },
  {
    id: 'nebulaSiphoning',
    name: 'Nebula Siphoning',
    category: 'Gathering',
    description: 'Collect fuel gases, plasma, and volatile energy resources.',
  },
  {
    id: 'exoSurveying',
    name: 'Exo-Surveying',
    category: 'Gathering',
    description: 'Scan worlds and anomalies for biomass, data, and samples.',
  },
  {
    id: 'shipyardFabrication',
    name: 'Shipyard Fabrication',
    category: 'Production',
    description: 'Build hull systems, weapons, shields, and ship modules.',
  },
  {
    id: 'lifeSystemsSynthesis',
    name: 'Life Systems Synthesis',
    category: 'Production',
    description: 'Produce oxygen, repair gel, med supplies, and crew sustainment.',
  },
  {
    id: 'quantumRefining',
    name: 'Quantum Refining',
    category: 'Production',
    description: 'Refine gases and minerals into fuel, isotopes, and power cores.',
  },
  {
    id: 'nanofabAssembly',
    name: 'Nanofab Assembly',
    category: 'Production',
    description: 'Assemble ammo, drones, precision parts, and advanced modules.',
  },
  {
    id: 'gunnery',
    name: 'Gunnery',
    category: 'Combat',
    description: 'Drive offensive ship combat through hardpoints and ammunition.',
  },
  {
    id: 'engineering',
    name: 'Engineering',
    category: 'Combat',
    description: 'Keep the ship alive with shields, armor, repairs, and mitigation.',
  },
]

export const SECTORS: SectorDefinition[] = [
  {
    id: 'orbitalDock',
    name: 'Orbital Dock',
    description: 'Starter traffic lanes, training drones, dockside wrecks, and safe resource pockets.',
    unlockCost: 0,
  },
  {
    id: 'innerBelt',
    name: 'Inner Belt',
    description: 'A denser belt with better salvage, sharper raiders, and richer extraction sites.',
    unlockCost: 2500,
    levelReqs: {
      asteroidMining: 5,
      engineering: 4,
    },
  },
]

export const MODULE_SLOTS: ModuleSlot[] = [
  'hardpoint',
  'shieldArray',
  'hullPlating',
  'sensorSuite',
  'engineCore',
  'auxiliaryCore',
]

export const ITEMS: Record<ItemId, ItemDefinition> = {
  credits: {
    id: 'credits',
    name: 'Credits',
    kind: 'currency',
    description: 'Settlement currency used for sector unlocks and Trade Relay orders.',
    baseValue: 1,
    tradable: false,
  },
  ferriteOre: {
    id: 'ferriteOre',
    name: 'Ferrite Ore',
    kind: 'resource',
    description: 'Common metallic ore used in early fabrication.',
    baseValue: 3,
    tradable: true,
  },
  nickelOre: {
    id: 'nickelOre',
    name: 'Nickel Ore',
    kind: 'resource',
    description: 'Conductive ore used in plating and module frames.',
    baseValue: 4,
    tradable: true,
  },
  waterIce: {
    id: 'waterIce',
    name: 'Water Ice',
    kind: 'resource',
    description: 'Frozen volatile stock for oxygen and life systems.',
    baseValue: 3,
    tradable: true,
  },
  titaniumOre: {
    id: 'titaniumOre',
    name: 'Titanium Ore',
    kind: 'resource',
    description: 'Tough ore for stronger hull and module shells.',
    baseValue: 9,
    tradable: true,
  },
  silicateDust: {
    id: 'silicateDust',
    name: 'Silicate Dust',
    kind: 'resource',
    description: 'Powdered mineral feedstock for glassy quantum components.',
    baseValue: 5,
    tradable: true,
  },
  hydrogenGas: {
    id: 'hydrogenGas',
    name: 'Hydrogen Gas',
    kind: 'energy',
    description: 'Starter fuel gas collected from quiet nebula edges.',
    baseValue: 4,
    tradable: true,
  },
  ionizedGas: {
    id: 'ionizedGas',
    name: 'Ionized Gas',
    kind: 'energy',
    description: 'Charged nebula gas used in fuel cells and shields.',
    baseValue: 7,
    tradable: true,
  },
  plasmaCondensate: {
    id: 'plasmaCondensate',
    name: 'Plasma Condensate',
    kind: 'energy',
    description: 'Hot condensed plasma for advanced power systems.',
    baseValue: 14,
    tradable: true,
  },
  fuelCell: {
    id: 'fuelCell',
    name: 'Fuel Cell',
    kind: 'energy',
    description: 'Refined portable power for ships and production systems.',
    baseValue: 16,
    tradable: true,
  },
  biomass: {
    id: 'biomass',
    name: 'Biomass',
    kind: 'organic',
    description: 'Organic stock gathered by surface probes and exo scans.',
    baseValue: 4,
    tradable: true,
  },
  surveyData: {
    id: 'surveyData',
    name: 'Survey Data',
    kind: 'organic',
    description: 'Mapped terrain, composition, and life-sign data.',
    baseValue: 6,
    tradable: true,
  },
  xenodata: {
    id: 'xenodata',
    name: 'Xenodata',
    kind: 'organic',
    description: 'Unusual biological and environmental telemetry.',
    baseValue: 12,
    tradable: true,
  },
  bioSample: {
    id: 'bioSample',
    name: 'Bio-Sample',
    kind: 'organic',
    description: 'Preserved sample used in advanced life support synthesis.',
    baseValue: 10,
    tradable: true,
  },
  scrapMetal: {
    id: 'scrapMetal',
    name: 'Scrap Metal',
    kind: 'salvage',
    description: 'Recovered hull fragments and structural scrap.',
    baseValue: 3,
    tradable: true,
  },
  circuitFragments: {
    id: 'circuitFragments',
    name: 'Circuit Fragments',
    kind: 'salvage',
    description: 'Broken electronics for nanofab and module work.',
    baseValue: 5,
    tradable: true,
  },
  techFragments: {
    id: 'techFragments',
    name: 'Tech Fragments',
    kind: 'salvage',
    description: 'Recoverable technology from tougher wrecks.',
    baseValue: 12,
    tradable: true,
  },
  damagedCore: {
    id: 'damagedCore',
    name: 'Damaged Core',
    kind: 'salvage',
    description: 'Unstable core assembly with recoverable power hardware.',
    baseValue: 22,
    tradable: true,
  },
  sensorLens: {
    id: 'sensorLens',
    name: 'Sensor Lens',
    kind: 'salvage',
    description: 'Recovered optic array used in scanner modules.',
    baseValue: 18,
    tradable: true,
  },
  alloyPlate: {
    id: 'alloyPlate',
    name: 'Alloy Plate',
    kind: 'refined',
    description: 'Refined fabrication plate for ship systems.',
    baseValue: 12,
    tradable: true,
  },
  refinedIsotopes: {
    id: 'refinedIsotopes',
    name: 'Refined Isotopes',
    kind: 'refined',
    description: 'Separated fuel isotopes used in reactors and shields.',
    baseValue: 18,
    tradable: true,
  },
  powerCore: {
    id: 'powerCore',
    name: 'Power Core',
    kind: 'refined',
    description: 'Stable core component for stronger modules.',
    baseValue: 35,
    tradable: true,
  },
  exoticMatter: {
    id: 'exoticMatter',
    name: 'Exotic Matter',
    kind: 'refined',
    description: 'Dangerous advanced material for high-tier systems.',
    baseValue: 65,
    tradable: true,
  },
  repairGel: {
    id: 'repairGel',
    name: 'Repair Gel',
    kind: 'repair',
    description: 'Quick-setting sealant for emergency hull restoration.',
    repairAmount: 18,
    baseValue: 10,
    tradable: true,
  },
  oxygenCell: {
    id: 'oxygenCell',
    name: 'Oxygen Cell',
    kind: 'repair',
    description: 'Life support reserve that stabilizes the ship after damage.',
    repairAmount: 12,
    baseValue: 9,
    tradable: true,
  },
  medPatch: {
    id: 'medPatch',
    name: 'Med Patch',
    kind: 'repair',
    description: 'Crew recovery supply that supports longer combat operations.',
    repairAmount: 24,
    baseValue: 18,
    tradable: true,
  },
  hullPatch: {
    id: 'hullPatch',
    name: 'Hull Patch',
    kind: 'repair',
    description: 'Dense structural patch for major hull recovery.',
    repairAmount: 36,
    baseValue: 28,
    tradable: true,
  },
  railSlugs: {
    id: 'railSlugs',
    name: 'Rail Slugs',
    kind: 'ammo',
    description: 'Dense kinetic rounds for turret hardpoints.',
    ammoDamage: 4,
    baseValue: 3,
    tradable: true,
  },
  microMissiles: {
    id: 'microMissiles',
    name: 'Micro Missiles',
    kind: 'ammo',
    description: 'Guided missiles for burst-damage hardpoints.',
    ammoDamage: 10,
    baseValue: 9,
    tradable: true,
  },
  plasmaCharges: {
    id: 'plasmaCharges',
    name: 'Plasma Charges',
    kind: 'ammo',
    description: 'High-energy ammunition for advanced weapons.',
    ammoDamage: 16,
    baseValue: 15,
    tradable: true,
  },
  miningLaser: {
    id: 'miningLaser',
    name: 'Mining Laser',
    kind: 'module',
    description: 'Utility module for basic asteroid extraction.',
    moduleSlot: 'auxiliaryCore',
    stats: { utility: 1 },
    baseValue: 45,
    tradable: true,
  },
  salvageBeam: {
    id: 'salvageBeam',
    name: 'Salvage Beam',
    kind: 'module',
    description: 'Utility beam that improves wreck recovery.',
    moduleSlot: 'auxiliaryCore',
    stats: { utility: 1 },
    baseValue: 48,
    tradable: true,
  },
  gasScoop: {
    id: 'gasScoop',
    name: 'Gas Scoop',
    kind: 'module',
    description: 'Collection scoop for nebula siphoning.',
    moduleSlot: 'auxiliaryCore',
    stats: { utility: 1 },
    baseValue: 46,
    tradable: true,
  },
  surveyScanner: {
    id: 'surveyScanner',
    name: 'Survey Scanner',
    kind: 'module',
    description: 'Sensor suite for exo scans and weak-point targeting.',
    moduleSlot: 'sensorSuite',
    stats: { accuracy: 2, utility: 2 },
    baseValue: 60,
    tradable: true,
  },
  lightTurret: {
    id: 'lightTurret',
    name: 'Light Turret',
    kind: 'module',
    description: 'Starter hardpoint for basic ship combat.',
    moduleSlot: 'hardpoint',
    stats: { damage: 8, accuracy: 4 },
    baseValue: 80,
    tradable: true,
  },
  missileLauncher: {
    id: 'missileLauncher',
    name: 'Missile Launcher',
    kind: 'module',
    description: 'Ammo-using hardpoint with strong burst damage.',
    moduleSlot: 'hardpoint',
    stats: { damage: 16, accuracy: 2 },
    baseValue: 170,
    tradable: true,
  },
  basicShieldGenerator: {
    id: 'basicShieldGenerator',
    name: 'Basic Shield Generator',
    kind: 'module',
    description: 'Starter shield array for reducing incoming damage.',
    moduleSlot: 'shieldArray',
    stats: { shielding: 5 },
    baseValue: 85,
    tradable: true,
  },
  deflectorArray: {
    id: 'deflectorArray',
    name: 'Deflector Array',
    kind: 'module',
    description: 'Improved shield array for Inner Belt threats.',
    moduleSlot: 'shieldArray',
    stats: { shielding: 11, accuracy: 1 },
    baseValue: 180,
    tradable: true,
  },
  reinforcedHullPlating: {
    id: 'reinforcedHullPlating',
    name: 'Reinforced Hull Plating',
    kind: 'module',
    description: 'Starter armor plating that increases hull and mitigation.',
    moduleSlot: 'hullPlating',
    stats: { armor: 5, hull: 18 },
    baseValue: 90,
    tradable: true,
  },
  ablativeArmor: {
    id: 'ablativeArmor',
    name: 'Ablative Armor',
    kind: 'module',
    description: 'Layered plating for sustained ship combat.',
    moduleSlot: 'hullPlating',
    stats: { armor: 12, hull: 30 },
    baseValue: 190,
    tradable: true,
  },
  basicThrusters: {
    id: 'basicThrusters',
    name: 'Basic Thrusters',
    kind: 'module',
    description: 'Engine core that improves future mobility and current handling.',
    moduleSlot: 'engineCore',
    stats: { speed: 3, accuracy: 1 },
    baseValue: 70,
    tradable: true,
  },
  droneBay: {
    id: 'droneBay',
    name: 'Drone Bay',
    kind: 'module',
    description: 'Auxiliary bay for support drones and salvage helpers.',
    moduleSlot: 'auxiliaryCore',
    stats: { utility: 3, shielding: 1 },
    baseValue: 140,
    tradable: true,
  },
  relicCore: {
    id: 'relicCore',
    name: 'Relic Core',
    kind: 'artifact',
    description: 'Ancient core reserved for late ship systems.',
    baseValue: 180,
    tradable: true,
  },
  ancientBlueprint: {
    id: 'ancientBlueprint',
    name: 'Ancient Blueprint',
    kind: 'artifact',
    description: 'Recovered schematic for future high-end modules.',
    baseValue: 220,
    tradable: true,
  },
  singularityShard: {
    id: 'singularityShard',
    name: 'Singularity Shard',
    kind: 'artifact',
    description: 'Unstable endgame material from extreme space phenomena.',
    baseValue: 320,
    tradable: true,
  },
}

export const ACTIVITIES: ActivityDefinition[] = [
  {
    id: 'rockHopper',
    name: 'Rock Hopper',
    group: 'Gathering',
    sectorId: 'orbitalDock',
    primarySkill: 'asteroidMining',
    tier: 1,
    description: 'Mine small dockside asteroids for basic fabrication ore.',
    cycleMs: 6000,
    levelReqs: { asteroidMining: 1 },
    xp: { asteroidMining: 12 },
    rewards: { ferriteOre: 2, waterIce: 1 },
  },
  {
    id: 'beltProspector',
    name: 'Belt Prospector',
    group: 'Gathering',
    sectorId: 'orbitalDock',
    primarySkill: 'asteroidMining',
    tier: 2,
    description: 'Work richer rocks on the edge of the Inner Belt.',
    cycleMs: 8500,
    levelReqs: { asteroidMining: 5 },
    xp: { asteroidMining: 24 },
    rewards: { ferriteOre: 2, nickelOre: 2, silicateDust: 1 },
  },
  {
    id: 'deepCoreMiner',
    name: 'Deep Core Miner',
    group: 'Gathering',
    sectorId: 'innerBelt',
    primarySkill: 'asteroidMining',
    tier: 3,
    description: 'Crack dense cores for stronger metals.',
    cycleMs: 12000,
    levelReqs: { asteroidMining: 14, engineering: 8 },
    xp: { asteroidMining: 42, engineering: 4 },
    rewards: { titaniumOre: 2, nickelOre: 2 },
    requiredModule: 'miningLaser',
  },
  {
    id: 'voidExtractor',
    name: 'Void Extractor',
    group: 'Gathering',
    sectorId: 'innerBelt',
    primarySkill: 'asteroidMining',
    tier: 4,
    description: 'Risk unstable pockets for high-value mineral output.',
    cycleMs: 18000,
    levelReqs: { asteroidMining: 23, quantumRefining: 12 },
    xp: { asteroidMining: 70, engineering: 8 },
    rewards: { titaniumOre: 3, exoticMatter: 1 },
    requiredModule: 'miningLaser',
  },
  {
    id: 'scrapper',
    name: 'Scrapper',
    group: 'Gathering',
    sectorId: 'orbitalDock',
    primarySkill: 'wreckSalvage',
    tier: 1,
    description: 'Strip safe wreckage for scrap and loose circuits.',
    cycleMs: 6500,
    levelReqs: { wreckSalvage: 1 },
    xp: { wreckSalvage: 12 },
    rewards: { scrapMetal: 2, circuitFragments: 1 },
  },
  {
    id: 'wreckDiver',
    name: 'Wreck Diver',
    group: 'Gathering',
    sectorId: 'orbitalDock',
    primarySkill: 'wreckSalvage',
    tier: 2,
    description: 'Cut deeper into damaged hulls for better components.',
    cycleMs: 9000,
    levelReqs: { wreckSalvage: 6, engineering: 5 },
    xp: { wreckSalvage: 26, engineering: 3 },
    rewards: { scrapMetal: 2, circuitFragments: 2, sensorLens: 1 },
  },
  {
    id: 'salvageSpecialist',
    name: 'Salvage Specialist',
    group: 'Gathering',
    sectorId: 'innerBelt',
    primarySkill: 'wreckSalvage',
    tier: 3,
    description: 'Board dangerous wrecks for advanced tech fragments.',
    cycleMs: 13000,
    levelReqs: { wreckSalvage: 15, gunnery: 8 },
    xp: { wreckSalvage: 46, engineering: 5 },
    rewards: { techFragments: 2, damagedCore: 1 },
    requiredModule: 'salvageBeam',
  },
  {
    id: 'ghostShipHunter',
    name: 'Ghost Ship Hunter',
    group: 'Gathering',
    sectorId: 'innerBelt',
    primarySkill: 'wreckSalvage',
    tier: 4,
    description: 'Track silent derelicts for rare ship components.',
    cycleMs: 19000,
    levelReqs: { wreckSalvage: 25, engineering: 18 },
    xp: { wreckSalvage: 76, engineering: 8 },
    rewards: { damagedCore: 2, relicCore: 1 },
    requiredModule: 'salvageBeam',
  },
  {
    id: 'gasSkimmer',
    name: 'Gas Skimmer',
    group: 'Gathering',
    sectorId: 'orbitalDock',
    primarySkill: 'nebulaSiphoning',
    tier: 1,
    description: 'Skim calm gas clouds for starter fuel stock.',
    cycleMs: 6000,
    levelReqs: { nebulaSiphoning: 1 },
    xp: { nebulaSiphoning: 12 },
    rewards: { hydrogenGas: 2 },
  },
  {
    id: 'nebulaHarvester',
    name: 'Nebula Harvester',
    group: 'Gathering',
    sectorId: 'orbitalDock',
    primarySkill: 'nebulaSiphoning',
    tier: 2,
    description: 'Compress charged gases into better fuel inputs.',
    cycleMs: 8500,
    levelReqs: { nebulaSiphoning: 6 },
    xp: { nebulaSiphoning: 25 },
    rewards: { hydrogenGas: 2, ionizedGas: 1 },
  },
  {
    id: 'plasmaExtractor',
    name: 'Plasma Extractor',
    group: 'Gathering',
    sectorId: 'innerBelt',
    primarySkill: 'nebulaSiphoning',
    tier: 3,
    description: 'Extract hot plasma from active nebula pockets.',
    cycleMs: 12500,
    levelReqs: { nebulaSiphoning: 15, engineering: 10 },
    xp: { nebulaSiphoning: 44, engineering: 4 },
    rewards: { ionizedGas: 2, plasmaCondensate: 1 },
    requiredModule: 'gasScoop',
  },
  {
    id: 'quantumSiphon',
    name: 'Quantum Siphon',
    group: 'Gathering',
    sectorId: 'innerBelt',
    primarySkill: 'nebulaSiphoning',
    tier: 4,
    description: 'Stabilize exotic pockets for dangerous energy resources.',
    cycleMs: 18500,
    levelReqs: { nebulaSiphoning: 25, quantumRefining: 18 },
    xp: { nebulaSiphoning: 74, quantumRefining: 5 },
    rewards: { plasmaCondensate: 2, exoticMatter: 1 },
    requiredModule: 'gasScoop',
  },
  {
    id: 'surfaceScanner',
    name: 'Surface Scanner',
    group: 'Gathering',
    sectorId: 'orbitalDock',
    primarySkill: 'exoSurveying',
    tier: 1,
    description: 'Launch probes to scan nearby worlds for biomass and data.',
    cycleMs: 6500,
    levelReqs: { exoSurveying: 1 },
    xp: { exoSurveying: 12 },
    rewards: { biomass: 2, surveyData: 1 },
  },
  {
    id: 'planetarySurveyor',
    name: 'Planetary Surveyor',
    group: 'Gathering',
    sectorId: 'orbitalDock',
    primarySkill: 'exoSurveying',
    tier: 2,
    description: 'Run deeper scans for better samples and survey packets.',
    cycleMs: 9500,
    levelReqs: { exoSurveying: 8 },
    xp: { exoSurveying: 28 },
    rewards: { biomass: 2, surveyData: 2, bioSample: 1 },
  },
  {
    id: 'exoBiologist',
    name: 'Exo-Biologist',
    group: 'Gathering',
    sectorId: 'innerBelt',
    primarySkill: 'exoSurveying',
    tier: 3,
    description: 'Analyze alien ecosystems for high-value biological data.',
    cycleMs: 14000,
    levelReqs: { exoSurveying: 17, lifeSystemsSynthesis: 10 },
    xp: { exoSurveying: 48, lifeSystemsSynthesis: 4 },
    rewards: { xenodata: 2, bioSample: 2 },
    requiredModule: 'surveyScanner',
  },
  {
    id: 'basicFabricator',
    name: 'Basic Fabricator',
    group: 'Production',
    sectorId: 'orbitalDock',
    primarySkill: 'shipyardFabrication',
    tier: 1,
    description: 'Fabricate light modules and starter ship hardware.',
    cycleMs: 7000,
    levelReqs: { shipyardFabrication: 1 },
    xp: { shipyardFabrication: 14 },
    costs: { ferriteOre: 2, scrapMetal: 1 },
    rewards: { alloyPlate: 1 },
  },
  {
    id: 'moduleAssembler',
    name: 'Module Assembler',
    group: 'Production',
    sectorId: 'orbitalDock',
    primarySkill: 'shipyardFabrication',
    tier: 2,
    description: 'Assemble starter combat and shield modules.',
    cycleMs: 10000,
    levelReqs: { shipyardFabrication: 6 },
    xp: { shipyardFabrication: 32 },
    costs: { alloyPlate: 2, circuitFragments: 2 },
    rewards: { lightTurret: 1, basicShieldGenerator: 1 },
  },
  {
    id: 'advancedShipwright',
    name: 'Advanced Shipwright',
    group: 'Production',
    sectorId: 'innerBelt',
    primarySkill: 'shipyardFabrication',
    tier: 3,
    description: 'Build Inner Belt modules from stronger components.',
    cycleMs: 15000,
    levelReqs: { shipyardFabrication: 15, wreckSalvage: 10 },
    xp: { shipyardFabrication: 56 },
    costs: { techFragments: 2, powerCore: 1, alloyPlate: 2 },
    rewards: { missileLauncher: 1, deflectorArray: 1 },
  },
  {
    id: 'capitalFabricator',
    name: 'Capital Fabricator',
    group: 'Production',
    sectorId: 'innerBelt',
    primarySkill: 'shipyardFabrication',
    tier: 4,
    description: 'Prototype heavy systems for late-game ship frames.',
    cycleMs: 22000,
    levelReqs: { shipyardFabrication: 25, quantumRefining: 18 },
    xp: { shipyardFabrication: 90 },
    costs: { exoticMatter: 2, damagedCore: 2 },
    rewards: { ablativeArmor: 1 },
  },
  {
    id: 'basicHydroponics',
    name: 'Basic Hydroponics',
    group: 'Production',
    sectorId: 'orbitalDock',
    primarySkill: 'lifeSystemsSynthesis',
    tier: 1,
    description: 'Turn biomass and ice into oxygen and simple repair supplies.',
    cycleMs: 7000,
    levelReqs: { lifeSystemsSynthesis: 1 },
    xp: { lifeSystemsSynthesis: 14 },
    costs: { biomass: 1, waterIce: 1 },
    rewards: { oxygenCell: 1, repairGel: 1 },
  },
  {
    id: 'nutrientSynthesizer',
    name: 'Nutrient Synthesizer',
    group: 'Production',
    sectorId: 'orbitalDock',
    primarySkill: 'lifeSystemsSynthesis',
    tier: 2,
    description: 'Process better organics into crew and hull support supplies.',
    cycleMs: 9500,
    levelReqs: { lifeSystemsSynthesis: 5, exoSurveying: 5 },
    xp: { lifeSystemsSynthesis: 30 },
    costs: { biomass: 2, bioSample: 1 },
    rewards: { medPatch: 1, repairGel: 2 },
  },
  {
    id: 'advancedLifeSupport',
    name: 'Advanced Life Support',
    group: 'Production',
    sectorId: 'innerBelt',
    primarySkill: 'lifeSystemsSynthesis',
    tier: 3,
    description: 'Synthesize stronger recovery systems for dangerous missions.',
    cycleMs: 14500,
    levelReqs: { lifeSystemsSynthesis: 14, exoSurveying: 10 },
    xp: { lifeSystemsSynthesis: 52 },
    costs: { bioSample: 2, refinedIsotopes: 1 },
    rewards: { hullPatch: 1, medPatch: 1 },
  },
  {
    id: 'bioForge',
    name: 'Bio-Forge',
    group: 'Production',
    sectorId: 'innerBelt',
    primarySkill: 'lifeSystemsSynthesis',
    tier: 4,
    description: 'Use xenodata to make high-value sustainment supplies.',
    cycleMs: 21000,
    levelReqs: { lifeSystemsSynthesis: 23, quantumRefining: 12 },
    xp: { lifeSystemsSynthesis: 82 },
    costs: { xenodata: 2, exoticMatter: 1 },
    rewards: { hullPatch: 2 },
  },
  {
    id: 'basicRefinery',
    name: 'Basic Refinery',
    group: 'Production',
    sectorId: 'orbitalDock',
    primarySkill: 'quantumRefining',
    tier: 1,
    description: 'Refine raw gas into usable fuel cells.',
    cycleMs: 7000,
    levelReqs: { quantumRefining: 1 },
    xp: { quantumRefining: 14 },
    costs: { hydrogenGas: 2 },
    rewards: { fuelCell: 1 },
  },
  {
    id: 'isotopeSeparator',
    name: 'Isotope Separator',
    group: 'Production',
    sectorId: 'orbitalDock',
    primarySkill: 'quantumRefining',
    tier: 2,
    description: 'Separate charged gases into refined isotopes.',
    cycleMs: 10500,
    levelReqs: { quantumRefining: 8, nebulaSiphoning: 5 },
    xp: { quantumRefining: 34 },
    costs: { ionizedGas: 2, silicateDust: 1 },
    rewards: { refinedIsotopes: 1, fuelCell: 1 },
  },
  {
    id: 'quantumDistiller',
    name: 'Quantum Distiller',
    group: 'Production',
    sectorId: 'innerBelt',
    primarySkill: 'quantumRefining',
    tier: 3,
    description: 'Distill plasma into power cores.',
    cycleMs: 15500,
    levelReqs: { quantumRefining: 17, nebulaSiphoning: 12 },
    xp: { quantumRefining: 58 },
    costs: { plasmaCondensate: 2, refinedIsotopes: 1 },
    rewards: { powerCore: 1 },
  },
  {
    id: 'antimatterForge',
    name: 'Antimatter Forge',
    group: 'Production',
    sectorId: 'innerBelt',
    primarySkill: 'quantumRefining',
    tier: 4,
    description: 'Stabilize exotic matter for advanced modules.',
    cycleMs: 23000,
    levelReqs: { quantumRefining: 28, engineering: 18 },
    xp: { quantumRefining: 96, engineering: 8 },
    costs: { exoticMatter: 2, powerCore: 1 },
    rewards: { singularityShard: 1 },
  },
  {
    id: 'basicNanofab',
    name: 'Basic Nanofab',
    group: 'Production',
    sectorId: 'orbitalDock',
    primarySkill: 'nanofabAssembly',
    tier: 1,
    description: 'Print rail ammunition from scrap and metal.',
    cycleMs: 6500,
    levelReqs: { nanofabAssembly: 1 },
    xp: { nanofabAssembly: 13 },
    costs: { scrapMetal: 1, ferriteOre: 1 },
    rewards: { railSlugs: 6 },
  },
  {
    id: 'precisionFabricator',
    name: 'Precision Fabricator',
    group: 'Production',
    sectorId: 'orbitalDock',
    primarySkill: 'nanofabAssembly',
    tier: 2,
    description: 'Make stronger munitions and support parts.',
    cycleMs: 10000,
    levelReqs: { nanofabAssembly: 8, wreckSalvage: 5 },
    xp: { nanofabAssembly: 34 },
    costs: { circuitFragments: 2, alloyPlate: 1 },
    rewards: { microMissiles: 3, droneBay: 1 },
  },
  {
    id: 'advancedNanofactory',
    name: 'Advanced Nanofactory',
    group: 'Production',
    sectorId: 'innerBelt',
    primarySkill: 'nanofabAssembly',
    tier: 3,
    description: 'Print advanced ammo and high-end module components.',
    cycleMs: 16000,
    levelReqs: { nanofabAssembly: 17, shipyardFabrication: 12 },
    xp: { nanofabAssembly: 62 },
    costs: { techFragments: 2, refinedIsotopes: 1 },
    rewards: { plasmaCharges: 3, powerCore: 1 },
  },
  {
    id: 'targetDrone',
    name: 'Target Drone',
    group: 'Combat',
    sectorId: 'orbitalDock',
    primarySkill: 'gunnery',
    tier: 1,
    description: 'Low-risk drone target for first turret calibration.',
    cycleMs: 7000,
    levelReqs: { gunnery: 1 },
    xp: { gunnery: 16, engineering: 5 },
    rewards: { scrapMetal: 1, credits: 8 },
    combat: { threatHull: 16, attack: 7, defense: 12, accuracy: 90 },
  },
  {
    id: 'raiderSkiff',
    name: 'Raider Skiff',
    group: 'Combat',
    sectorId: 'orbitalDock',
    primarySkill: 'gunnery',
    tier: 1,
    description: 'Fast raider craft with light incoming damage.',
    cycleMs: 8500,
    levelReqs: { gunnery: 3, engineering: 2 },
    xp: { gunnery: 24, engineering: 10 },
    rewards: { scrapMetal: 1, circuitFragments: 1, credits: 14 },
    combat: { threatHull: 26, attack: 12, defense: 18, accuracy: 82 },
  },
  {
    id: 'rogueSurveyProbe',
    name: 'Rogue Survey Probe',
    group: 'Combat',
    sectorId: 'orbitalDock',
    primarySkill: 'gunnery',
    tier: 2,
    description: 'A malfunctioning probe with useful data banks.',
    cycleMs: 9500,
    levelReqs: { gunnery: 6, engineering: 5 },
    xp: { gunnery: 32, engineering: 14 },
    rewards: { surveyData: 1, techFragments: 1, credits: 20 },
    combat: { threatHull: 34, attack: 16, defense: 24, accuracy: 78 },
  },
  {
    id: 'scrapReaver',
    name: 'Scrap Reaver',
    group: 'Combat',
    sectorId: 'orbitalDock',
    primarySkill: 'gunnery',
    tier: 2,
    description: 'Improvised raider ship guarding salvage piles.',
    cycleMs: 10500,
    levelReqs: { gunnery: 8, engineering: 6 },
    xp: { gunnery: 38, engineering: 16 },
    rewards: { scrapMetal: 2, damagedCore: 1, credits: 28 },
    combat: { threatHull: 42, attack: 20, defense: 28, accuracy: 74 },
  },
  {
    id: 'beltRaider',
    name: 'Belt Raider',
    group: 'Combat',
    sectorId: 'innerBelt',
    primarySkill: 'gunnery',
    tier: 3,
    description: 'A hardened Inner Belt raider with better armor.',
    cycleMs: 12500,
    levelReqs: { gunnery: 15, engineering: 12 },
    xp: { gunnery: 55, engineering: 24 },
    rewards: { techFragments: 2, credits: 45 },
    combat: { threatHull: 64, attack: 30, defense: 42, accuracy: 70 },
  },
  {
    id: 'shieldedFrigate',
    name: 'Shielded Frigate',
    group: 'Combat',
    sectorId: 'innerBelt',
    primarySkill: 'gunnery',
    tier: 3,
    description: 'A slow frigate that rewards sustained engineering.',
    cycleMs: 14500,
    levelReqs: { gunnery: 18, engineering: 15 },
    xp: { gunnery: 66, engineering: 32 },
    rewards: { powerCore: 1, credits: 62 },
    combat: { threatHull: 82, attack: 36, defense: 54, accuracy: 68 },
  },
  {
    id: 'minefieldSentinel',
    name: 'Minefield Sentinel',
    group: 'Combat',
    sectorId: 'innerBelt',
    primarySkill: 'gunnery',
    tier: 4,
    description: 'Automated sentinel guarding volatile mining lanes.',
    cycleMs: 16000,
    levelReqs: { gunnery: 23, engineering: 20 },
    xp: { gunnery: 82, engineering: 40 },
    rewards: { refinedIsotopes: 2, credits: 78 },
    combat: { threatHull: 96, attack: 44, defense: 66, accuracy: 64 },
  },
  {
    id: 'anomalyWarden',
    name: 'Anomaly Warden',
    group: 'Combat',
    sectorId: 'innerBelt',
    primarySkill: 'gunnery',
    tier: 4,
    description: 'A strange machine orbiting a hazardous anomaly.',
    cycleMs: 17500,
    levelReqs: { gunnery: 25, engineering: 23 },
    xp: { gunnery: 92, engineering: 46 },
    rewards: { exoticMatter: 1, credits: 90 },
    combat: { threatHull: 112, attack: 50, defense: 72, accuracy: 60 },
  },
  {
    id: 'ghostShipCore',
    name: 'Ghost Ship Core',
    group: 'Combat',
    sectorId: 'innerBelt',
    primarySkill: 'gunnery',
    tier: 5,
    description: 'The awakened command core of a dead ship.',
    cycleMs: 21000,
    levelReqs: { gunnery: 35, engineering: 30 },
    xp: { gunnery: 125, engineering: 62 },
    rewards: { relicCore: 1, credits: 140 },
    combat: { threatHull: 160, attack: 68, defense: 92, accuracy: 55, requiredAmmo: 'microMissiles' },
  },
  {
    id: 'rogueBattleship',
    name: 'Rogue Battleship',
    group: 'Combat',
    sectorId: 'innerBelt',
    primarySkill: 'gunnery',
    tier: 5,
    description: 'A major aspirational threat for the first v2 content slice.',
    cycleMs: 26000,
    levelReqs: { gunnery: 38, engineering: 35 },
    xp: { gunnery: 160, engineering: 80 },
    rewards: { ancientBlueprint: 1, singularityShard: 1, credits: 220 },
    combat: { threatHull: 220, attack: 84, defense: 110, accuracy: 50, requiredAmmo: 'plasmaCharges' },
  },
]

export const MARKET_ITEMS: ItemId[] = (Object.keys(ITEMS) as ItemId[]).filter(
  (itemId) => ITEMS[itemId].tradable,
)

export function createInitialState(now = Date.now()): GameState {
  const skills = createSkillRecord()
  const cargo = createCargoRecord()

  cargo.credits = 120
  cargo.repairGel = 4
  cargo.oxygenCell = 2
  cargo.lightTurret = 1
  cargo.basicShieldGenerator = 1
  cargo.reinforcedHullPlating = 1
  cargo.miningLaser = 1
  cargo.salvageBeam = 1
  cargo.gasScoop = 1
  cargo.surveyScanner = 1

  const ship: ShipState = {
    currentHull: BASE_MAX_HULL,
    maxHull: BASE_MAX_HULL,
    modules: {},
  }

  return {
    version: 1,
    skills,
    cargo,
    ship,
    currentSectorId: 'orbitalDock',
    unlockedSectors: {
      orbitalDock: true,
      innerBelt: false,
    },
    activeMission: null,
    combatSettings: {
      autoRepair: true,
      stopAtHull: 35,
      repairItemId: 'repairGel',
      maxRepairItemsPerClaim: 12,
    },
    marketOrders: createRelayOrders(),
    eventLog: ['Fresh ship profile initialized at Orbital Dock.'],
    lastSeenAt: now,
  }
}

export function getLevelForXp(xp: number): number {
  return Math.max(1, Math.floor(Math.sqrt(Math.max(0, xp) / 45)) + 1)
}

export function getXpForNextLevel(level: number): number {
  return level * level * 45
}

export function getSkillLevel(state: GameState, skillId: SkillId): number {
  return getLevelForXp(state.skills[skillId].xp)
}

export function getActivityById(activityId: ActivityId): ActivityDefinition {
  const activity = ACTIVITIES.find((entry) => entry.id === activityId)
  if (!activity) {
    throw new Error(`Unknown mission: ${activityId}`)
  }
  return activity
}

export function getSectorById(sectorId: SectorId): SectorDefinition {
  const sector = SECTORS.find((entry) => entry.id === sectorId)
  if (!sector) {
    throw new Error(`Unknown sector: ${sectorId}`)
  }
  return sector
}

export function getShipStats(state: GameState): Required<ModuleStats> {
  const stats: Required<ModuleStats> = {
    damage: 0,
    accuracy: 0,
    shielding: 0,
    armor: 0,
    hull: 0,
    speed: 0,
    utility: 0,
  }

  for (const itemId of Object.values(state.ship.modules)) {
    if (!itemId) continue
    const moduleStats = ITEMS[itemId].stats
    if (!moduleStats) continue

    stats.damage += moduleStats.damage ?? 0
    stats.accuracy += moduleStats.accuracy ?? 0
    stats.shielding += moduleStats.shielding ?? 0
    stats.armor += moduleStats.armor ?? 0
    stats.hull += moduleStats.hull ?? 0
    stats.speed += moduleStats.speed ?? 0
    stats.utility += moduleStats.utility ?? 0
  }

  return stats
}

export function getMaxHull(state: GameState): number {
  const engineeringLevel = getSkillLevel(state, 'engineering')
  return BASE_MAX_HULL + getShipStats(state).hull + (engineeringLevel - 1) * 2
}

export function syncMaxHull(state: GameState): GameState {
  const maxHull = getMaxHull(state)
  return {
    ...state,
    ship: {
      ...state.ship,
      maxHull,
      currentHull: Math.min(state.ship.currentHull, maxHull),
    },
  }
}

export function getActivityStatus(state: GameState, activity: ActivityDefinition): ActivityStatus {
  const reasons: string[] = []

  if (!state.unlockedSectors[activity.sectorId]) {
    reasons.push(`${getSectorById(activity.sectorId).name} is locked.`)
  }

  if (state.currentSectorId !== activity.sectorId) {
    reasons.push(`Travel to ${getSectorById(activity.sectorId).name}.`)
  }

  for (const [skillId, level] of Object.entries(activity.levelReqs) as [SkillId, number][]) {
    if (getSkillLevel(state, skillId) < level) {
      reasons.push(`${getSkillName(skillId)} ${level} required.`)
    }
  }

  if (activity.requiredModule && !hasModuleEquippedOrInCargo(state, activity.requiredModule)) {
    reasons.push(`${ITEMS[activity.requiredModule].name} required.`)
  }

  if (activity.combat && !state.ship.modules.hardpoint) {
    reasons.push('Hardpoint module required.')
  }

  if (activity.combat && state.ship.currentHull <= 0) {
    reasons.push('Repair hull before combat.')
  }

  if (activity.costs) {
    for (const [itemId, amount] of Object.entries(activity.costs) as [ItemId, number][]) {
      if (state.cargo[itemId] < amount) {
        reasons.push(`${amount} ${ITEMS[itemId].name} required.`)
      }
    }
  }

  return {
    canStart: reasons.length === 0,
    reasons,
  }
}

export function startActivity(state: GameState, activityId: ActivityId, now = Date.now()): GameState {
  const activity = getActivityById(activityId)
  const status = getActivityStatus(state, activity)
  if (!status.canStart) {
    throw new Error(status.reasons[0] ?? 'Mission cannot start.')
  }

  return addLog(
    {
      ...state,
      activeMission: {
        activityId,
        startedAt: now,
        lastClaimAt: now,
      },
      lastSeenAt: now,
    },
    `Mission started: ${activity.name}.`,
  )
}

export function stopActivity(state: GameState): GameState {
  if (!state.activeMission) return state
  return addLog({ ...state, activeMission: null }, 'Mission stopped.')
}

export function getClaimPreview(state: GameState, now = Date.now()): ClaimPreview {
  if (!state.activeMission) {
    return emptyPreview()
  }

  const activity = getActivityById(state.activeMission.activityId)
  const elapsedMs = Math.min(now - state.activeMission.lastClaimAt, AFK_CAP_MS)
  const possibleCycles = Math.max(0, Math.floor(elapsedMs / activity.cycleMs))
  if (possibleCycles === 0) {
    return {
      ...emptyPreview(),
      activity,
      elapsedMs,
    }
  }

  return simulateClaim(state, activity, possibleCycles)
}

export function applyClaim(state: GameState, now = Date.now()): GameState {
  if (!state.activeMission) return state

  const activity = getActivityById(state.activeMission.activityId)
  const elapsedMs = Math.min(now - state.activeMission.lastClaimAt, AFK_CAP_MS)
  const possibleCycles = Math.max(0, Math.floor(elapsedMs / activity.cycleMs))
  if (possibleCycles === 0) return state

  const preview = simulateClaim(state, activity, possibleCycles)
  if (preview.cycles === 0) {
    return addLog(
      {
        ...state,
        activeMission: preview.stoppedReason ? null : state.activeMission,
      },
      preview.stoppedReason ?? 'No cycles were ready to claim.',
    )
  }

  let next = cloneState(state)

  for (const [skillId, xp] of Object.entries(preview.xp) as [SkillId, number][]) {
    next.skills[skillId].xp += xp
  }

  for (const [itemId, amount] of Object.entries(preview.costs) as [ItemId, number][]) {
    next.cargo[itemId] = Math.max(0, next.cargo[itemId] - amount)
  }

  for (const [itemId, amount] of Object.entries(preview.rewards) as [ItemId, number][]) {
    next.cargo[itemId] += amount
  }

  next.ship.currentHull = Math.max(0, next.ship.currentHull - preview.hullDamage)

  if (preview.repairItemsUsed > 0) {
    const repairItemId = next.combatSettings.repairItemId
    const repairAmount = ITEMS[repairItemId].repairAmount ?? 0
    next.cargo[repairItemId] = Math.max(0, next.cargo[repairItemId] - preview.repairItemsUsed)
    next.ship.currentHull = Math.min(
      next.ship.maxHull,
      next.ship.currentHull + preview.repairItemsUsed * repairAmount,
    )
  }

  if (preview.hullFailure) {
    for (const slot of MODULE_SLOTS) {
      delete next.ship.modules[slot]
    }
    next.cargo.credits = Math.max(0, next.cargo.credits - preview.lostCredits)
    next.ship.currentHull = 0
    next.activeMission = null
  } else if (preview.stoppedReason) {
    next.activeMission = null
  } else {
    next.activeMission = {
      ...next.activeMission!,
      lastClaimAt: next.activeMission!.lastClaimAt + preview.cycles * activity.cycleMs,
    }
  }

  next = syncMaxHull(next)
  next.lastSeenAt = now

  return addLog(next, formatClaimLog(activity, preview))
}

export function equipModule(state: GameState, itemId: ItemId): GameState {
  const item = ITEMS[itemId]
  if (item.kind !== 'module' || !item.moduleSlot) {
    throw new Error(`${item.name} is not a ship module.`)
  }
  if (state.cargo[itemId] <= 0) {
    throw new Error(`${item.name} is not in cargo.`)
  }

  const next = cloneState(state)
  const slot = item.moduleSlot
  const previousItem = next.ship.modules[slot]

  next.cargo[itemId] -= 1
  if (previousItem) {
    next.cargo[previousItem] += 1
  }
  next.ship.modules[slot] = itemId

  return addLog(syncMaxHull(next), `${item.name} installed in ${formatModuleSlot(slot)}.`)
}

export function unequipModule(state: GameState, slot: ModuleSlot): GameState {
  const itemId = state.ship.modules[slot]
  if (!itemId) {
    throw new Error(`${formatModuleSlot(slot)} is empty.`)
  }

  const next = cloneState(state)
  delete next.ship.modules[slot]
  next.cargo[itemId] += 1

  return addLog(syncMaxHull(next), `${ITEMS[itemId].name} removed from ${formatModuleSlot(slot)}.`)
}

export function useRepairSupply(state: GameState, itemId: ItemId): GameState {
  const item = ITEMS[itemId]
  if (item.kind !== 'repair' || !item.repairAmount) {
    throw new Error(`${item.name} is not a repair supply.`)
  }
  if (state.cargo[itemId] <= 0) {
    throw new Error(`${item.name} is not in cargo.`)
  }
  if (state.ship.currentHull >= state.ship.maxHull) {
    throw new Error('Hull is already full.')
  }

  const next = cloneState(state)
  next.cargo[itemId] -= 1
  next.ship.currentHull = Math.min(next.ship.maxHull, next.ship.currentHull + item.repairAmount)
  return addLog(next, `${item.name} restored ${item.repairAmount} hull.`)
}

export function updateCombatSettings(
  state: GameState,
  settings: Partial<CombatSettings>,
): GameState {
  const nextSettings = {
    ...state.combatSettings,
    ...settings,
  }

  nextSettings.stopAtHull = Math.max(1, Math.min(nextSettings.stopAtHull, state.ship.maxHull - 1))
  nextSettings.maxRepairItemsPerClaim = Math.max(0, Math.min(nextSettings.maxRepairItemsPerClaim, 99))

  return {
    ...state,
    combatSettings: nextSettings,
  }
}

export function travelToSector(state: GameState, sectorId: SectorId): GameState {
  const sector = getSectorById(sectorId)
  const next = cloneState(state)

  if (!next.unlockedSectors[sectorId]) {
    const status = getSectorUnlockStatus(next, sector)
    if (!status.canStart) {
      throw new Error(status.reasons[0] ?? `${sector.name} is locked.`)
    }
    next.cargo.credits -= sector.unlockCost
    next.unlockedSectors[sectorId] = true
  }

  next.currentSectorId = sectorId
  next.activeMission = null
  return addLog(next, `Ship routed to ${sector.name}.`)
}

export function getSectorUnlockStatus(
  state: GameState,
  sector: SectorDefinition,
): ActivityStatus {
  const reasons: string[] = []

  if (state.unlockedSectors[sector.id]) {
    return { canStart: true, reasons }
  }

  if (state.cargo.credits < sector.unlockCost) {
    reasons.push(`${sector.unlockCost} Credits required.`)
  }

  for (const [skillId, level] of Object.entries(sector.levelReqs ?? {}) as [SkillId, number][]) {
    if (getSkillLevel(state, skillId) < level) {
      reasons.push(`${getSkillName(skillId)} ${level} required.`)
    }
  }

  return {
    canStart: reasons.length === 0,
    reasons,
  }
}

export function buyRelayItem(state: GameState, orderId: string): GameState {
  const order = state.marketOrders.find((entry) => entry.id === orderId)
  if (!order) throw new Error('Trade Relay order not found.')
  if (order.quantity <= 0) throw new Error('Trade Relay order is empty.')
  if (state.cargo.credits < order.unitPrice) throw new Error('Not enough Credits.')

  const next = cloneState(state)
  const nextOrder = next.marketOrders.find((entry) => entry.id === orderId)!
  nextOrder.quantity -= 1
  next.cargo.credits -= order.unitPrice
  next.cargo[order.itemId] += 1

  return addLog(next, `Bought 1 ${ITEMS[order.itemId].name} for ${order.unitPrice} Credits.`)
}

export function sellCargoItem(state: GameState, itemId: ItemId): GameState {
  const item = ITEMS[itemId]
  if (!item.tradable || itemId === 'credits') {
    throw new Error(`${item.name} cannot be sold.`)
  }
  if (state.cargo[itemId] <= 0) {
    throw new Error(`${item.name} is not in cargo.`)
  }

  const next = cloneState(state)
  const price = Math.max(1, Math.floor(item.baseValue * 0.6))
  next.cargo[itemId] -= 1
  next.cargo.credits += price

  return addLog(next, `Sold 1 ${item.name} to the Trade Relay for ${price} Credits.`)
}

export function getSkillName(skillId: SkillId): string {
  return SKILLS.find((skill) => skill.id === skillId)?.name ?? skillId
}

export function formatModuleSlot(slot: ModuleSlot): string {
  switch (slot) {
    case 'hardpoint':
      return 'Hardpoint'
    case 'shieldArray':
      return 'Shield Array'
    case 'hullPlating':
      return 'Hull Plating'
    case 'sensorSuite':
      return 'Sensor Suite'
    case 'engineCore':
      return 'Engine Core'
    case 'auxiliaryCore':
      return 'Auxiliary Core'
  }
}

export function formatItemQuantity(itemId: ItemId, amount: number): string {
  return `${amount.toLocaleString()} ${ITEMS[itemId].name}`
}

export function getCargoEntries(state: GameState): [ItemId, number][] {
  return (Object.keys(ITEMS) as ItemId[])
    .map((itemId) => [itemId, state.cargo[itemId]] as [ItemId, number])
    .filter(([, amount]) => amount > 0)
}

function createSkillRecord(): Record<SkillId, SkillProgress> {
  return SKILLS.reduce(
    (record, skill) => {
      record[skill.id] = { xp: 0 }
      return record
    },
    {} as Record<SkillId, SkillProgress>,
  )
}

function createCargoRecord(): Record<ItemId, number> {
  return (Object.keys(ITEMS) as ItemId[]).reduce(
    (record, itemId) => {
      record[itemId] = 0
      return record
    },
    {} as Record<ItemId, number>,
  )
}

function createRelayOrders(): MarketOrder[] {
  return [
    { id: 'relay-repair-gel', itemId: 'repairGel', quantity: 50, unitPrice: 12 },
    { id: 'relay-rail-slugs', itemId: 'railSlugs', quantity: 80, unitPrice: 4 },
    { id: 'relay-light-turret', itemId: 'lightTurret', quantity: 5, unitPrice: 95 },
    { id: 'relay-shield', itemId: 'basicShieldGenerator', quantity: 5, unitPrice: 105 },
    { id: 'relay-hull-plating', itemId: 'reinforcedHullPlating', quantity: 5, unitPrice: 115 },
  ]
}

function emptyPreview(): ClaimPreview {
  return {
    activity: null,
    cycles: 0,
    elapsedMs: 0,
    xp: {},
    rewards: {},
    costs: {},
    hullDamage: 0,
    repairItemsUsed: 0,
    hullFailure: false,
    lostCredits: 0,
    lostModules: [],
  }
}

function simulateClaim(
  state: GameState,
  activity: ActivityDefinition,
  possibleCycles: number,
): ClaimPreview {
  const preview: ClaimPreview = {
    ...emptyPreview(),
    activity,
    elapsedMs: possibleCycles * activity.cycleMs,
  }
  const cargo = { ...state.cargo }
  let hull = state.ship.currentHull
  let repairItemsUsed = 0

  for (let cycle = 0; cycle < possibleCycles; cycle += 1) {
    if (activity.costs && !hasCosts(cargo, activity.costs)) {
      preview.stoppedReason = 'Mission stopped: cargo inputs depleted.'
      break
    }

    if (activity.combat && hull <= state.combatSettings.stopAtHull) {
      preview.stoppedReason = 'Mission stopped: hull safety threshold reached.'
      break
    }

    if (activity.combat?.requiredAmmo && cargo[activity.combat.requiredAmmo] <= 0) {
      preview.stoppedReason = `Mission stopped: ${ITEMS[activity.combat.requiredAmmo].name} depleted.`
      break
    }

    if (activity.costs) {
      for (const [itemId, amount] of Object.entries(activity.costs) as [ItemId, number][]) {
        cargo[itemId] -= amount
        preview.costs[itemId] = (preview.costs[itemId] ?? 0) + amount
      }
    }

    if (activity.combat) {
      const combatResult = resolveCombatCycle(state, activity, cycle)

      if (combatResult.ammoUsed) {
        cargo[combatResult.ammoUsed] -= 1
        preview.costs[combatResult.ammoUsed] = (preview.costs[combatResult.ammoUsed] ?? 0) + 1
      }

      if (combatResult.hit) {
        addRewards(preview.rewards, activity.rewards, cargo)
        addXp(preview.xp, { gunnery: activity.xp.gunnery ?? 0 })
      }

      if (combatResult.damageTaken > 0 || combatResult.mitigatedDamage > 0) {
        addXp(preview.xp, { engineering: activity.xp.engineering ?? 0 })
      }

      hull -= combatResult.damageTaken
      preview.hullDamage += combatResult.damageTaken

      if (hull <= 0) {
        preview.hullFailure = true
        preview.lostCredits = Math.floor(state.cargo.credits / 2)
        preview.lostModules = MODULE_SLOTS.map((slot) => state.ship.modules[slot]).filter(
          Boolean,
        ) as ItemId[]
        preview.cycles += 1
        break
      }

      if (
        state.combatSettings.autoRepair &&
        hull <= state.combatSettings.stopAtHull &&
        repairItemsUsed < state.combatSettings.maxRepairItemsPerClaim
      ) {
        const repairItem = ITEMS[state.combatSettings.repairItemId]
        const repairAmount = repairItem.repairAmount ?? 0
        if (cargo[state.combatSettings.repairItemId] > 0 && repairAmount > 0) {
          cargo[state.combatSettings.repairItemId] -= 1
          repairItemsUsed += 1
          hull = Math.min(state.ship.maxHull, hull + repairAmount)
        }
      }
    } else {
      addRewards(preview.rewards, activity.rewards, cargo)
      addXp(preview.xp, activity.xp)
    }

    preview.cycles += 1
  }

  preview.repairItemsUsed = repairItemsUsed
  return preview
}

function resolveCombatCycle(
  state: GameState,
  activity: ActivityDefinition,
  cycle: number,
): { hit: boolean; damageTaken: number; mitigatedDamage: number; ammoUsed?: ItemId } {
  if (!activity.combat) {
    return { hit: false, damageTaken: 0, mitigatedDamage: 0 }
  }

  const stats = getShipStats(state)
  const gunnery = getSkillLevel(state, 'gunnery')
  const engineering = getSkillLevel(state, 'engineering')
  const hardpoint = state.ship.modules.hardpoint
  const hardpointStats = hardpoint ? ITEMS[hardpoint].stats : undefined
  const ammo = activity.combat.requiredAmmo
  const ammoDamage = ammo ? ITEMS[ammo].ammoDamage ?? 0 : 0
  const roll = deterministicRoll(activity.id, cycle)
  const offense =
    gunnery * 4 +
    stats.damage +
    stats.accuracy +
    (hardpointStats?.damage ?? 0) +
    (hardpointStats?.accuracy ?? 0) +
    ammoDamage +
    roll
  const hit = offense >= activity.combat.defense
  const mitigation = Math.floor(engineering / 2) + stats.shielding + stats.armor
  const incoming = Math.max(0, activity.combat.attack - mitigation)
  const glancingSave = deterministicRoll(`${activity.id}-engineering`, cycle) < engineering + stats.shielding
  const damageTaken = Math.max(0, incoming - (glancingSave ? 3 : 0))
  const mitigatedDamage = Math.max(0, activity.combat.attack - damageTaken)

  return {
    hit,
    damageTaken,
    mitigatedDamage,
    ammoUsed: ammo && hit ? ammo : undefined,
  }
}

function deterministicRoll(seed: string, cycle: number): number {
  let hash = 17 + cycle * 31
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 33 + seed.charCodeAt(index)) % 997
  }
  return hash % 100
}

function hasCosts(cargo: Record<ItemId, number>, costs: Partial<Record<ItemId, number>>): boolean {
  return (Object.entries(costs) as [ItemId, number][]).every(
    ([itemId, amount]) => cargo[itemId] >= amount,
  )
}

function addRewards(
  rewards: Partial<Record<ItemId, number>>,
  activityRewards: Partial<Record<ItemId, number>>,
  cargo: Record<ItemId, number>,
): void {
  for (const [itemId, amount] of Object.entries(activityRewards) as [ItemId, number][]) {
    rewards[itemId] = (rewards[itemId] ?? 0) + amount
    cargo[itemId] += amount
  }
}

function addXp(
  xp: Partial<Record<SkillId, number>>,
  activityXp: Partial<Record<SkillId, number>>,
): void {
  for (const [skillId, amount] of Object.entries(activityXp) as [SkillId, number][]) {
    xp[skillId] = (xp[skillId] ?? 0) + amount
  }
}

function hasModuleEquippedOrInCargo(state: GameState, itemId: ItemId): boolean {
  return state.cargo[itemId] > 0 || Object.values(state.ship.modules).includes(itemId)
}

function cloneState(state: GameState): GameState {
  return {
    ...state,
    skills: Object.fromEntries(
      (Object.entries(state.skills) as [SkillId, SkillProgress][]).map(([skillId, progress]) => [
        skillId,
        { ...progress },
      ]),
    ) as Record<SkillId, SkillProgress>,
    cargo: { ...state.cargo },
    ship: {
      ...state.ship,
      modules: { ...state.ship.modules },
    },
    unlockedSectors: { ...state.unlockedSectors },
    activeMission: state.activeMission ? { ...state.activeMission } : null,
    combatSettings: { ...state.combatSettings },
    marketOrders: state.marketOrders.map((order) => ({ ...order })),
    eventLog: [...state.eventLog],
  }
}

function addLog(state: GameState, message: string): GameState {
  return {
    ...state,
    eventLog: [message, ...state.eventLog].slice(0, 40),
  }
}

function formatClaimLog(activity: ActivityDefinition, preview: ClaimPreview): string {
  if (preview.hullFailure) {
    return `${activity.name}: Hull Failure after ${preview.cycles} cycle(s). Lost ${preview.lostCredits} Credits and ${preview.lostModules.length} module(s).`
  }
  if (preview.stoppedReason) {
    return `${activity.name}: claimed ${preview.cycles} cycle(s). ${preview.stoppedReason}`
  }
  return `${activity.name}: claimed ${preview.cycles} cycle(s).`
}
