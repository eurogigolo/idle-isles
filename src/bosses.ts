import { ITEMS, getShipStats, type GameState, type SectorId } from './game'

export type BossPhase = 1 | 2 | 3
export type BossRiftTarget = 'bossRow' | 'cycle' | 'playerRow'
export type BossSpecialKind = 'crush' | 'rift'
export type BossTheme = 'belt' | 'rift'
export type BossVolleyProjectileKind = 'bolt' | 'shrapnel'

export interface BossPhaseConfig {
  boltDamage: number
  movementCooldownMs: number
  panelCooldownMs: number
  riftDamage: number
  shotCooldownMs: number
  specialCooldownMs: number
  telegraphMs: number
  volleyDamage: number
  wideDamage: number
}

export interface SectorBossAttackPattern {
  phaseThreeExtraBolt: boolean
  phaseThreeRiftEvery: number
  phaseThreeSpecialKind: BossSpecialKind
  riftTarget: BossRiftTarget
  riftRows?: number[]
  volleyProjectileKind: BossVolleyProjectileKind
  volleyRows: number[][]
  wideRows: number[]
}

export interface SectorBoss {
  activeHint: string
  defeatText: string
  description: string
  encounterName: string
  id: string
  maxHp: number
  mechanics: string[]
  name: string
  phaseConfig: Record<BossPhase, BossPhaseConfig>
  phaseThreeName: string
  playerMaxHp: number
  sectorId: SectorId
  subtitle: string
  theme: BossTheme
  victoryText: string
  attackPattern: SectorBossAttackPattern
}

export interface BossBattleModifiers {
  chargeDamageBonus: number
  chargeTimeMultiplier: number
  incomingDamageReduction: number
  labels: string[]
  panelLockdownDelayMs: number
  playerDamageBonus: number
  playerMaxHpBonus: number
  telegraphBonusMs: number
  moveCooldownMultiplier: number
}

const DEFAULT_MODIFIERS: BossBattleModifiers = {
  chargeDamageBonus: 0,
  chargeTimeMultiplier: 1,
  incomingDamageReduction: 0,
  labels: [],
  panelLockdownDelayMs: 0,
  playerDamageBonus: 0,
  playerMaxHpBonus: 0,
  telegraphBonusMs: 0,
  moveCooldownMultiplier: 1,
}

export const SECTOR_BOSSES: Record<SectorId, SectorBoss> = {
  orbitalDock: {
    activeHint: 'Dodge fixed rift lanes before your panels burn out.',
    attackPattern: {
      phaseThreeExtraBolt: true,
      phaseThreeRiftEvery: 3,
      phaseThreeSpecialKind: 'rift',
      riftTarget: 'playerRow',
      volleyProjectileKind: 'bolt',
      volleyRows: [
        [0, 2],
        [0, 1],
        [1, 2],
        [2, 0],
      ],
      wideRows: [0, 2, 1, 0, 2, 1],
    },
    defeatText: 'Ship systems disengaged. Return to command when ready.',
    description:
      'A dockside anomaly guard that teaches grid movement, charge shots, panel lockdowns, and rift telegraphs.',
    encounterName: 'Grid Boss Encounter',
    id: 'riftWarden',
    maxHp: 20,
    mechanics: ['Rift lanes', 'Panel lockdown', 'Enrage volleys'],
    name: 'Rift Warden',
    phaseConfig: {
      1: {
        boltDamage: 1,
        movementCooldownMs: 560,
        panelCooldownMs: 3000,
        riftDamage: 3,
        shotCooldownMs: 760,
        specialCooldownMs: 3200,
        telegraphMs: 620,
        volleyDamage: 1,
        wideDamage: 4,
      },
      2: {
        boltDamage: 1,
        movementCooldownMs: 430,
        panelCooldownMs: 2700,
        riftDamage: 3,
        shotCooldownMs: 610,
        specialCooldownMs: 2700,
        telegraphMs: 560,
        volleyDamage: 1,
        wideDamage: 4,
      },
      3: {
        boltDamage: 2,
        movementCooldownMs: 320,
        panelCooldownMs: 2400,
        riftDamage: 3,
        shotCooldownMs: 500,
        specialCooldownMs: 2250,
        telegraphMs: 520,
        volleyDamage: 2,
        wideDamage: 5,
      },
    },
    phaseThreeName: 'Rift Surge',
    playerMaxHp: 6,
    sectorId: 'orbitalDock',
    subtitle: 'Orbital Dock Boss',
    theme: 'rift',
    victoryText: 'Rift Warden signal broken. Return to command when ready.',
  },
  innerBelt: {
    activeHint: 'Read the shrapnel lanes and dodge the crush beam cycles.',
    attackPattern: {
      phaseThreeExtraBolt: true,
      phaseThreeRiftEvery: 2,
      phaseThreeSpecialKind: 'crush',
      riftRows: [2, 0, 1],
      riftTarget: 'cycle',
      volleyProjectileKind: 'shrapnel',
      volleyRows: [
        [0, 1],
        [1, 2],
        [0, 2],
        [0, 1, 2],
      ],
      wideRows: [1, 0, 2, 1, 2, 0],
    },
    defeatText: 'Armor breach contained. Return to command when ready.',
    description:
      'A mining warship that pressures multiple rows with slow shrapnel volleys and cycling crush beams.',
    encounterName: 'Inner Belt Boss',
    id: 'beltBreaker',
    maxHp: 26,
    mechanics: ['Shrapnel volleys', 'Crush beam cycles', 'Cratered panels', 'Armor rupture'],
    name: 'Belt Breaker',
    phaseConfig: {
      1: {
        boltDamage: 1,
        movementCooldownMs: 520,
        panelCooldownMs: 3100,
        riftDamage: 3,
        shotCooldownMs: 700,
        specialCooldownMs: 3000,
        telegraphMs: 640,
        volleyDamage: 1,
        wideDamage: 4,
      },
      2: {
        boltDamage: 2,
        movementCooldownMs: 390,
        panelCooldownMs: 2700,
        riftDamage: 4,
        shotCooldownMs: 560,
        specialCooldownMs: 2550,
        telegraphMs: 560,
        volleyDamage: 2,
        wideDamage: 5,
      },
      3: {
        boltDamage: 2,
        movementCooldownMs: 290,
        panelCooldownMs: 2250,
        riftDamage: 4,
        shotCooldownMs: 460,
        specialCooldownMs: 2050,
        telegraphMs: 500,
        volleyDamage: 2,
        wideDamage: 6,
      },
    },
    phaseThreeName: 'Armor Rupture',
    playerMaxHp: 6,
    sectorId: 'innerBelt',
    subtitle: 'Inner Belt Boss',
    theme: 'belt',
    victoryText: 'Belt Breaker core cracked. Return to command when ready.',
  },
}

export function getSectorBoss(sectorId: SectorId): SectorBoss {
  return SECTOR_BOSSES[sectorId] ?? SECTOR_BOSSES.orbitalDock
}

export function getBossBattleModifiers(game: GameState): BossBattleModifiers {
  const stats = getShipStats(game)
  const playerDamageBonus = Math.min(2, Math.floor(stats.damage / 8))
  const chargeDamageBonus = Math.min(2, Math.floor(stats.damage / 12) + Math.floor(stats.utility / 3))
  const playerMaxHpBonus = Math.min(3, Math.ceil(stats.hull / 15))
  const incomingDamageReduction = Math.min(2, Math.floor((stats.shielding + stats.armor) / 8))
  const telegraphBonusMs = Math.min(220, stats.accuracy * 25 + stats.utility * 20)
  const panelLockdownDelayMs = Math.min(650, stats.utility * 140)
  const moveCooldownMultiplier = Math.max(0.72, 1 - stats.speed * 0.055)
  const chargeTimeMultiplier = Math.max(0.78, 1 - stats.accuracy * 0.025)

  const labels = [
    playerDamageBonus > 0 ? `+${playerDamageBonus} shot damage` : null,
    chargeDamageBonus > 0 ? `+${chargeDamageBonus} charge damage` : null,
    playerMaxHpBonus > 0 ? `+${playerMaxHpBonus} boss hull` : null,
    incomingDamageReduction > 0 ? `-${incomingDamageReduction} incoming damage` : null,
    stats.speed > 0 ? `${Math.round((1 - moveCooldownMultiplier) * 100)}% faster movement` : null,
    telegraphBonusMs > 0 ? `+${telegraphBonusMs}ms telegraphs` : null,
    panelLockdownDelayMs > 0 ? `+${panelLockdownDelayMs}ms panel delay` : null,
  ].filter((label): label is string => Boolean(label))

  return {
    ...DEFAULT_MODIFIERS,
    chargeDamageBonus,
    chargeTimeMultiplier,
    incomingDamageReduction,
    labels,
    panelLockdownDelayMs,
    playerDamageBonus,
    playerMaxHpBonus,
    telegraphBonusMs,
    moveCooldownMultiplier,
  }
}

export function formatBossModifierSummary(modifiers: BossBattleModifiers): string {
  return modifiers.labels.length > 0 ? modifiers.labels.join(' / ') : 'No equipped module bonuses'
}

export function getEquippedBossModuleNames(game: GameState): string[] {
  return Object.values(game.ship.modules)
    .filter((itemId): itemId is keyof typeof ITEMS => Boolean(itemId))
    .map((itemId) => ITEMS[itemId].name)
}
