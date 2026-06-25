import { Mic, MicOff } from 'lucide-react'
import { useEffect, useRef, useState, type CSSProperties } from 'react'

export type GridBossResult = 'win' | 'loss'

interface GridBossBattleProps {
  onComplete: (result: GridBossResult) => void
}

type BossPhase = 1 | 2 | 3
type ProjectileKind = 'bolt' | 'charge' | 'wide' | 'rift'
type TelegraphKind = 'wide' | 'volley' | 'rift'
type ParticleKind = 'spark' | 'burst' | 'trail' | 'rift' | 'core'

interface Projectile {
  damage: number
  id: number
  kind: ProjectileKind
  owner: 'player' | 'boss'
  row: number
  speed: number
  x: number
}

interface Telegraph {
  fireAt: number
  id: number
  kind: TelegraphKind
  rows: number[]
}

interface PlayerPanel {
  col: number
  row: number
}

interface BattleParticle {
  ageMs: number
  id: number
  kind: ParticleKind
  size: number
  ttlMs: number
  vx: number
  vy: number
  x: number
  y: number
}

interface BattleStats {
  chargeShotsFired: number
  chargeShotsHit: number
  damageDealt: number
  damageTaken: number
  endedAt: number | null
  panelsDisabled: number
  shotsFired: number
  shotsHit: number
  startedAt: number | null
}

interface BattleState {
  bossDamageFlashMs: number
  bossCoreCol: number
  bossCoreRow: number
  bossHp: number
  bossPhase: BossPhase
  disabledPanels: PlayerPanel[]
  particles: BattleParticle[]
  phaseFlashMs: number
  playerChargeMs: number
  playerCol: number
  playerHp: number
  playerRow: number
  projectiles: Projectile[]
  screenShake: number
  stats: BattleStats
  status: 'countdown' | 'active' | 'won' | 'lost'
  telegraphs: Telegraph[]
}

const ROWS = 3
const COLUMNS = 6
const PLAYER_COLUMNS = 3
const PLAYER_PANEL_COUNT = ROWS * PLAYER_COLUMNS
const BOSS_ZONE_START = PLAYER_COLUMNS
const PLAYER_MAX_HP = 6
const BOSS_MAX_HP = 20
const PLAYER_MOVE_COOLDOWN_MS = 95
const PLAYER_SHOT_COOLDOWN_MS = 220
const PLAYER_CHARGE_MIN_MS = 360
const PLAYER_CHARGE_MAX_MS = 950
const PLAYER_CHARGE_COOLDOWN_MS = 360
const MAX_DISABLED_PLAYER_PANELS = PLAYER_PANEL_COUNT - 1
const COUNTDOWN_START = 3
const PLAYER_BOLT_SPEED = 0.011
const PLAYER_CHARGE_SPEED = 0.013
const BOSS_BOLT_SPEED = -0.0055
const BOSS_WIDE_SPEED = -0.009
const BOSS_RIFT_SPEED = -0.0048
const PLAYER_BOLT_DAMAGE = 1
const PLAYER_CHARGE_MIN_DAMAGE = 3
const PLAYER_CHARGE_MAX_DAMAGE = 5
const PLAYER_HITBOX = { halfHeight: 0.14, halfWidth: 0.18 }
const BOSS_HITBOX = { halfHeight: 0.2, halfWidth: 0.22 }
const BOLT_HITBOX = { halfHeight: 0.035, halfWidth: 0.07 }
const CHARGE_HITBOX = { halfHeight: 0.06, halfWidth: 0.16 }
const WIDE_HITBOX = { halfHeight: 0.22, halfWidth: 0.46 }
const RIFT_HITBOX = { halfHeight: 0.12, halfWidth: 0.2 }
const PARTICLE_LIMIT = 100

const WIDE_ATTACK_ROWS = [0, 2, 1, 0, 2, 1]
const VOLLEY_ATTACK_ROWS = [
  [0, 2],
  [0, 1],
  [1, 2],
  [2, 0],
]

const BOSS_PHASE_CONFIG: Record<
  BossPhase,
  {
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
> = {
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
}

const CONTROL_KEYS = new Set([
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'w',
  'W',
  'a',
  'A',
  's',
  'S',
  'd',
  'D',
  ' ',
  'Enter',
])

export function GridBossBattle({ onComplete }: GridBossBattleProps) {
  const [battle, setBattle] = useState<BattleState>({
    bossDamageFlashMs: 0,
    bossCoreCol: 1,
    bossCoreRow: 1,
    bossHp: BOSS_MAX_HP,
    bossPhase: 1,
    disabledPanels: [],
    particles: [],
    phaseFlashMs: 0,
    playerChargeMs: 0,
    playerCol: 1,
    playerHp: PLAYER_MAX_HP,
    playerRow: 1,
    projectiles: [],
    screenShake: 0,
    stats: {
      chargeShotsFired: 0,
      chargeShotsHit: 0,
      damageDealt: 0,
      damageTaken: 0,
      endedAt: null,
      panelsDisabled: 0,
      shotsFired: 0,
      shotsHit: 0,
      startedAt: null,
    },
    status: 'countdown',
    telegraphs: [],
  })
  const [countdown, setCountdown] = useState(COUNTDOWN_START)
  const [musicMuted, setMusicMuted] = useState(false)
  const battleStatusRef = useRef<BattleState['status']>('countdown')
  const pressedKeys = useRef(new Set<string>())
  const overlayRef = useRef<HTMLDivElement | null>(null)
  const musicRef = useRef<BossMusicController | null>(null)
  const chargeStartedAt = useRef<number | null>(null)
  const normalShotIndex = useRef(0)
  const particleId = useRef(1)
  const projectileId = useRef(1)
  const specialAttackIndex = useRef(0)
  const telegraphId = useRef(1)
  const frameId = useRef<number | null>(null)
  const lastFrameAt = useRef<number | null>(null)
  const lastMoveAt = useRef(0)
  const lastPlayerShotAt = useRef(0)
  const lastBossMoveAt = useRef(0)
  const lastBossShotAt = useRef(0)
  const lastBossSpecialAt = useRef(0)
  const lastPanelLockdownAt = useRef(0)
  const wideAttackIndex = useRef(0)

  useEffect(() => {
    overlayRef.current?.focus()
  }, [])

  useEffect(() => {
    battleStatusRef.current = battle.status
  }, [battle.status])

  useEffect(() => {
    if (battle.status !== 'countdown') return

    const intervalId = window.setInterval(() => {
      setCountdown((current) => {
        if (current <= 1) {
          window.clearInterval(intervalId)
          setBattle((activeBattle) =>
            activeBattle.status === 'countdown' ? { ...activeBattle, status: 'active' } : activeBattle,
          )
          return 0
        }

        return current - 1
      })
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [battle.status])

  useEffect(() => {
    if (musicMuted || battle.status !== 'active') {
      musicRef.current?.stop()
      musicRef.current = null
      return
    }

    const music = createBossMusic()
    musicRef.current = music
    void music?.start()

    return () => {
      music?.stop()
      if (musicRef.current === music) {
        musicRef.current = null
      }
    }
  }, [battle.status, musicMuted])

  useEffect(() => {
    const activeKeys = pressedKeys.current

    function handleKeyDown(event: KeyboardEvent) {
      if (!CONTROL_KEYS.has(event.key)) return
      event.preventDefault()
      activeKeys.add(event.key)
      if (isFireKey(event.key) && battleStatusRef.current === 'active' && chargeStartedAt.current === null) {
        chargeStartedAt.current = performance.now()
      }
    }

    function handleKeyUp(event: KeyboardEvent) {
      activeKeys.delete(event.key)
      if (!isFireKey(event.key)) return

      const now = performance.now()
      setBattle((current) => (current.status === 'active' ? applyPlayerFire(current, activeKeys, now) : current))
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      activeKeys.clear()
    }
    // The input loop intentionally owns a stable key set and charge refs for the life of the battle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function createParticleBurst(
    kind: ParticleKind,
    x: number,
    y: number,
    count: number,
  ): BattleParticle[] {
    return Array.from({ length: count }, () => {
      const angle = Math.random() * Math.PI * 2
      const speed = kind === 'core' ? 0.0048 : kind === 'rift' ? 0.0034 : 0.0028

      return {
        ageMs: 0,
        id: particleId.current++,
        kind,
        size: kind === 'core' ? 0.62 : kind === 'burst' ? 0.48 : kind === 'rift' ? 0.42 : 0.28,
        ttlMs: kind === 'trail' ? 220 : kind === 'core' ? 760 : kind === 'rift' ? 520 : 420,
        vx: Math.cos(angle) * speed * (0.45 + Math.random()),
        vy: Math.sin(angle) * speed * (0.45 + Math.random()),
        x,
        y,
      }
    })
  }

  function applyPlayerMovement(
    current: BattleState,
    keys: Set<string>,
    now: number,
  ): BattleState {
    if (now - lastMoveAt.current < PLAYER_MOVE_COOLDOWN_MS) return current

    const up = keys.has('ArrowUp') || keys.has('w') || keys.has('W')
    const down = keys.has('ArrowDown') || keys.has('s') || keys.has('S')
    const left = keys.has('ArrowLeft') || keys.has('a') || keys.has('A')
    const right = keys.has('ArrowRight') || keys.has('d') || keys.has('D')
    const rowDelta = up ? -1 : down ? 1 : 0
    const colDelta = left ? -1 : right ? 1 : 0
    if (rowDelta === 0 && colDelta === 0) return current

    const nextPlayerCol = clamp(current.playerCol + colDelta, 0, PLAYER_COLUMNS - 1)
    const nextPlayerRow = clamp(current.playerRow + rowDelta, 0, ROWS - 1)
    if (isPanelDisabled(current.disabledPanels, nextPlayerCol, nextPlayerRow)) return current

    lastMoveAt.current = now
    return {
      ...current,
      playerCol: nextPlayerCol,
      playerRow: nextPlayerRow,
    }
  }

  function applyPlayerFire(
    current: BattleState,
    keys: Set<string>,
    now: number,
  ): BattleState {
    const fireHeld = isFireHeld(keys)
    if (fireHeld) {
      if (chargeStartedAt.current === null) {
        chargeStartedAt.current = now
      }

      const playerChargeMs = Math.min(PLAYER_CHARGE_MAX_MS, now - chargeStartedAt.current)
      return playerChargeMs === current.playerChargeMs ? current : { ...current, playerChargeMs }
    }

    if (chargeStartedAt.current === null) {
      return current.playerChargeMs > 0 ? { ...current, playerChargeMs: 0 } : current
    }

    const chargeMs = Math.min(PLAYER_CHARGE_MAX_MS, now - chargeStartedAt.current)
    const charged = chargeMs >= PLAYER_CHARGE_MIN_MS
    const cooldown = charged ? PLAYER_CHARGE_COOLDOWN_MS : PLAYER_SHOT_COOLDOWN_MS
    chargeStartedAt.current = null

    if (now - lastPlayerShotAt.current < cooldown) {
      return { ...current, playerChargeMs: 0 }
    }

    const damage = charged ? getChargeShotDamage(chargeMs) : PLAYER_BOLT_DAMAGE
    const projectileKind: ProjectileKind = charged ? 'charge' : 'bolt'

    lastPlayerShotAt.current = now
    return {
      ...current,
      particles: addParticles(
        current.particles,
        createParticleBurst(charged ? 'burst' : 'spark', current.playerCol + 0.92, current.playerRow + 0.5, charged ? 10 : 4),
      ),
      playerChargeMs: 0,
      projectiles: [
        ...current.projectiles,
        {
          damage,
          id: projectileId.current++,
          kind: projectileKind,
          owner: 'player',
          row: current.playerRow,
          speed: charged ? PLAYER_CHARGE_SPEED : PLAYER_BOLT_SPEED,
          x: current.playerCol + 0.72,
        },
      ],
      stats: {
        ...current.stats,
        chargeShotsFired: current.stats.chargeShotsFired + (charged ? 1 : 0),
        shotsFired: current.stats.shotsFired + 1,
      },
    }
  }

  function applyBossMovement(current: BattleState, now: number): BattleState {
    const config = BOSS_PHASE_CONFIG[current.bossPhase]
    if (now - lastBossMoveAt.current < config.movementCooldownMs) return current

    lastBossMoveAt.current = now
    const nextCore = getRandomBossStep(current.bossCoreCol, current.bossCoreRow)

    return {
      ...current,
      bossCoreCol: nextCore.col,
      bossCoreRow: nextCore.row,
    }
  }

  function applyBossFire(current: BattleState, now: number): BattleState {
    if (current.telegraphs.length > 0) return current
    const config = BOSS_PHASE_CONFIG[current.bossPhase]

    if (now - lastBossSpecialAt.current >= config.specialCooldownMs) {
      lastBossSpecialAt.current = now
      const specialIndex = specialAttackIndex.current
      specialAttackIndex.current += 1

      let kind: TelegraphKind = 'wide'
      let rows: number[]

      if (current.bossPhase === 3 && specialIndex % 3 === 2) {
        kind = 'rift'
        rows = [current.playerRow]
      } else if (current.bossPhase >= 2 && specialIndex % 2 === 1) {
        kind = 'volley'
        rows = VOLLEY_ATTACK_ROWS[specialIndex % VOLLEY_ATTACK_ROWS.length]
      } else {
        rows = [WIDE_ATTACK_ROWS[wideAttackIndex.current % WIDE_ATTACK_ROWS.length]]
        wideAttackIndex.current += 1
      }

      return {
        ...current,
        phaseFlashMs: kind === 'rift' ? Math.max(current.phaseFlashMs, 420) : current.phaseFlashMs,
        screenShake: kind === 'wide' || kind === 'rift' ? Math.max(current.screenShake, 0.32) : current.screenShake,
        telegraphs: [
          ...current.telegraphs,
          {
            fireAt: now + config.telegraphMs,
            id: telegraphId.current++,
            kind,
            rows,
          },
        ],
      }
    }

    if (now - lastBossShotAt.current < config.shotCooldownMs) return current

    lastBossShotAt.current = now
    const rows = [current.bossCoreRow]
    if (current.bossPhase === 3 && normalShotIndex.current % 2 === 1) {
      rows.push((current.bossCoreRow + 1) % ROWS)
    }
    normalShotIndex.current += 1

    return {
      ...current,
      projectiles: [
        ...current.projectiles,
        ...uniqueRows(rows).map<Projectile>((row) => ({
          damage: config.boltDamage,
          id: projectileId.current++,
          kind: 'bolt',
          owner: 'boss',
          row,
          speed: BOSS_BOLT_SPEED,
          x: BOSS_ZONE_START + current.bossCoreCol + 0.24,
        })),
      ],
    }
  }

  function applyTelegraphs(current: BattleState, now: number): BattleState {
    if (current.telegraphs.length === 0) return current

    const config = BOSS_PHASE_CONFIG[current.bossPhase]
    const pending: Telegraph[] = []
    const projectiles = [...current.projectiles]
    let particles = current.particles
    let screenShake = current.screenShake

    for (const telegraph of current.telegraphs) {
      if (now < telegraph.fireAt) {
        pending.push(telegraph)
        continue
      }

      if (telegraph.kind === 'wide') {
        for (const row of telegraph.rows) {
          projectiles.push({
            damage: config.wideDamage,
            id: projectileId.current++,
            kind: 'wide',
            owner: 'boss',
            row,
            speed: BOSS_WIDE_SPEED,
            x: COLUMNS - 0.3,
          })
          particles = addParticles(particles, createParticleBurst('rift', COLUMNS - 0.3, row + 0.5, 8))
        }
        screenShake = Math.max(screenShake, 0.72)
        continue
      }

      if (telegraph.kind === 'rift') {
        for (const row of telegraph.rows) {
          projectiles.push({
            damage: config.riftDamage,
            id: projectileId.current++,
            kind: 'rift',
            owner: 'boss',
            row,
            speed: BOSS_RIFT_SPEED,
            x: COLUMNS - 0.36,
          })
          particles = addParticles(particles, createParticleBurst('rift', COLUMNS - 0.35, row + 0.5, 12))
        }
        screenShake = Math.max(screenShake, 0.82)
        continue
      }

      for (const row of telegraph.rows) {
        projectiles.push({
          damage: config.volleyDamage,
          id: projectileId.current++,
          kind: 'bolt',
          owner: 'boss',
          row,
          speed: BOSS_BOLT_SPEED,
          x: BOSS_ZONE_START + current.bossCoreCol + 0.24,
        })
      }
    }

    return {
      ...current,
      particles,
      projectiles,
      screenShake,
      telegraphs: pending,
    }
  }

  function applyPanelLockdown(current: BattleState, now: number): BattleState {
    const config = BOSS_PHASE_CONFIG[current.bossPhase]
    if (now - lastPanelLockdownAt.current < config.panelCooldownMs) return current
    if (current.disabledPanels.length >= MAX_DISABLED_PLAYER_PANELS) return current

    const panel = getRandomPanelLockdownTarget(current.disabledPanels)
    if (!panel) return current

    lastPanelLockdownAt.current = now
    const disabledPanels = [...current.disabledPanels, panel]
    const playerPanelLocked = panel.col === current.playerCol && panel.row === current.playerRow
    const fallbackPanel = playerPanelLocked
      ? findNearestOpenPlayerPanel(current.playerCol, current.playerRow, disabledPanels)
      : null

    return {
      ...current,
      disabledPanels,
      particles: addParticles(current.particles, createParticleBurst('rift', panel.col + 0.5, panel.row + 0.5, 8)),
      playerCol: fallbackPanel?.col ?? current.playerCol,
      playerRow: fallbackPanel?.row ?? current.playerRow,
      screenShake: Math.max(current.screenShake, 0.22),
      stats: {
        ...current.stats,
        panelsDisabled: current.stats.panelsDisabled + 1,
      },
    }
  }

  function applyProjectileMotion(current: BattleState, deltaMs: number): BattleState {
    let bossHp = current.bossHp
    let bossDamageFlashMs = current.bossDamageFlashMs
    let bossPhase = current.bossPhase
    let phaseFlashMs = current.phaseFlashMs
    let playerHp = current.playerHp
    let screenShake = current.screenShake
    let particles = current.particles
    const stats = { ...current.stats }
    const projectiles: Projectile[] = []

    for (const projectile of current.projectiles) {
      const nextProjectile = {
        ...projectile,
        x: projectile.x + projectile.speed * deltaMs,
      }
      const projectileCenterX = nextProjectile.x + 0.5
      const projectileCenterY = nextProjectile.row + 0.5

      if (Math.random() < getTrailChance(nextProjectile.kind)) {
        particles = addParticles(
          particles,
          createParticleBurst(
            nextProjectile.owner === 'player' ? 'trail' : 'rift',
            projectileCenterX,
            projectileCenterY,
            nextProjectile.kind === 'charge' || nextProjectile.kind === 'rift' ? 2 : 1,
          ),
        )
      }

      if (nextProjectile.owner === 'player') {
        if (projectileHitsBoss(nextProjectile, current)) {
          const damageDealt = Math.min(projectile.damage, bossHp)
          bossHp -= damageDealt
          stats.damageDealt += damageDealt
          stats.shotsHit += 1
          stats.chargeShotsHit += nextProjectile.kind === 'charge' ? 1 : 0
          bossDamageFlashMs = Math.max(bossDamageFlashMs, nextProjectile.kind === 'charge' ? 260 : 160)
          particles = addParticles(
            particles,
            createParticleBurst(
              nextProjectile.kind === 'charge' ? 'burst' : 'spark',
              BOSS_ZONE_START + current.bossCoreCol + 0.5,
              current.bossCoreRow + 0.5,
              nextProjectile.kind === 'charge' ? 18 : 9,
            ),
          )
          screenShake = Math.max(screenShake, nextProjectile.kind === 'charge' ? 0.7 : 0.34)

          const nextPhase = getBossPhase(bossHp)
          if (nextPhase !== bossPhase) {
            bossPhase = nextPhase
            phaseFlashMs = Math.max(phaseFlashMs, 780)
            screenShake = Math.max(screenShake, 0.95)
            particles = addParticles(
              particles,
              createParticleBurst('core', BOSS_ZONE_START + current.bossCoreCol + 0.5, current.bossCoreRow + 0.5, 24),
            )
          }
          continue
        }
        if (nextProjectile.x > COLUMNS + 0.4) continue
        projectiles.push(nextProjectile)
        continue
      }

      if (projectileHitsPlayer(nextProjectile, current)) {
        playerHp -= nextProjectile.damage
        stats.damageTaken += nextProjectile.damage
        particles = addParticles(
          particles,
          createParticleBurst('spark', current.playerCol + 0.5, current.playerRow + 0.5, nextProjectile.kind === 'bolt' ? 8 : 14),
        )
        screenShake = Math.max(
          screenShake,
          nextProjectile.kind === 'wide' || nextProjectile.kind === 'rift' ? 0.9 : 0.46,
        )
        continue
      }
      if (nextProjectile.x < -0.8) continue
      projectiles.push(nextProjectile)
    }

    return {
      ...current,
      bossDamageFlashMs,
      bossHp,
      bossPhase,
      particles,
      phaseFlashMs,
      playerHp,
      projectiles,
      screenShake,
      stats,
    }
  }

  function applyTimedEffects(current: BattleState, deltaMs: number, now: number): BattleState {
    return {
      ...current,
      bossDamageFlashMs: Math.max(0, current.bossDamageFlashMs - deltaMs),
      particles: advanceParticles(current.particles, deltaMs),
      phaseFlashMs: Math.max(0, current.phaseFlashMs - deltaMs),
      screenShake: Math.max(0, current.screenShake - deltaMs / 260),
      stats:
        current.stats.startedAt === null
          ? {
              ...current.stats,
              startedAt: now,
            }
          : current.stats,
    }
  }

  function finishBattle(current: BattleState, status: 'won' | 'lost', now: number): BattleState {
    chargeStartedAt.current = null
    pressedKeys.current.clear()

    return {
      ...current,
      bossHp: status === 'won' ? 0 : current.bossHp,
      particles:
        status === 'won'
          ? addParticles(
              current.particles,
              createParticleBurst('core', BOSS_ZONE_START + current.bossCoreCol + 0.5, current.bossCoreRow + 0.5, 34),
            )
          : current.particles,
      playerChargeMs: 0,
      playerHp: status === 'lost' ? 0 : current.playerHp,
      projectiles: [],
      screenShake: Math.max(current.screenShake, status === 'won' ? 1 : 0.42),
      stats: {
        ...current.stats,
        endedAt: current.stats.endedAt ?? now,
      },
      status,
      telegraphs: [],
    }
  }

  useEffect(() => {
    function tick(now: number) {
      const previous = lastFrameAt.current ?? now
      const deltaMs = Math.min(40, now - previous)
      lastFrameAt.current = now

      setBattle((current) => {
        if (current.status !== 'active') return current

        if (lastBossMoveAt.current === 0) {
          lastBossMoveAt.current = now
        }
        if (lastBossShotAt.current === 0) {
          lastBossShotAt.current = now
        }
        if (lastBossSpecialAt.current === 0) {
          lastBossSpecialAt.current = now
        }
        if (lastPanelLockdownAt.current === 0) {
          lastPanelLockdownAt.current = now
        }

        let next = applyTimedEffects(current, deltaMs, now)
        next = applyPlayerMovement(next, pressedKeys.current, now)
        next = applyPlayerFire(next, pressedKeys.current, now)
        next = applyBossMovement(next, now)
        next = applyTelegraphs(next, now)
        next = applyBossFire(next, now)
        next = applyPanelLockdown(next, now)
        next = applyProjectileMotion(next, deltaMs)

        if (next.bossHp <= 0) {
          return finishBattle(next, 'won', now)
        }
        if (next.playerHp <= 0) {
          return finishBattle(next, 'lost', now)
        }
        return next
      })

      frameId.current = window.requestAnimationFrame(tick)
    }

    frameId.current = window.requestAnimationFrame(tick)
    return () => {
      if (frameId.current !== null) {
        window.cancelAnimationFrame(frameId.current)
      }
    }
    // The RAF loop intentionally runs once and reads mutable refs plus functional state updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function holdKey(key: string) {
    if (battle.status !== 'active') return
    pressedKeys.current.add(key)
    if (isFireKey(key) && chargeStartedAt.current === null) {
      chargeStartedAt.current = performance.now()
    }
  }

  function releaseKey(key: string) {
    pressedKeys.current.delete(key)
    if (!isFireKey(key) || battle.status !== 'active') return

    const now = performance.now()
    setBattle((current) => (current.status === 'active' ? applyPlayerFire(current, pressedKeys.current, now) : current))
  }

  function retreat() {
    const now = performance.now()
    setBattle((current) =>
      current.status === 'active'
        ? finishBattle({ ...current, projectiles: [], telegraphs: [] }, 'lost', now)
        : current,
    )
  }

  function goHome() {
    onComplete(battle.status === 'won' ? 'win' : 'loss')
  }

  function toggleMusic() {
    setMusicMuted((current) => !current)
  }

  const resultTitle = battle.status === 'won' ? 'Victory' : battle.status === 'lost' ? 'Retreat' : ''
  const resultText =
    battle.status === 'won'
      ? 'Rift Warden signal broken. Return to command when ready.'
      : battle.status === 'lost'
        ? 'Ship systems disengaged. Return to command when ready.'
        : battle.status === 'countdown'
          ? 'Grid sync starting.'
          : 'Dodge fixed fire lanes before your panels burn out.'
  const battleEnded = battle.status === 'won' || battle.status === 'lost'
  const chargeProgress = Math.min(1, battle.playerChargeMs / PLAYER_CHARGE_MAX_MS)
  const footerText =
    battle.status === 'active' && battle.playerChargeMs > 0
      ? chargeProgress >= 1
        ? 'Charge shot armed. Release Fire.'
        : `Charging shot ${Math.round(chargeProgress * 100)}%`
      : resultText
  const shellClassName = [
    'grid-boss-shell',
    battle.screenShake > 0.58 ? 'shake-strong' : battle.screenShake > 0 ? 'shake-light' : '',
    battle.phaseFlashMs > 0 ? 'rift-active' : '',
  ]
    .filter(Boolean)
    .join(' ')
  const arenaClassName = ['grid-boss-arena', `phase-${battle.bossPhase}`].join(' ')
  const playerShipStyle = {
    ...gridPosition(battle.playerCol, battle.playerRow),
    '--charge-progress': chargeProgress,
  } as CSSProperties
  const resultDurationMs = getBattleDurationMs(battle.stats)
  const resultAccuracy = getAccuracy(battle.stats)
  const resultRating = getPerformanceRating(battle.status, battle.stats)

  return (
    <div
      aria-label="Grid Boss Encounter"
      className="grid-boss-overlay"
      ref={overlayRef}
      tabIndex={-1}
    >
      <div className={shellClassName}>
        <div className="grid-boss-header">
          <div>
            <span className="eyebrow">Grid Boss Encounter</span>
            <h2>Rift Warden</h2>
          </div>
          <div className="grid-boss-readout">
            <span>Hull {battle.playerHp}/{PLAYER_MAX_HP}</span>
            <span>Boss {battle.bossHp}/{BOSS_MAX_HP}</span>
            <span>Phase {battle.bossPhase}</span>
            <span>Panels {PLAYER_PANEL_COUNT - battle.disabledPanels.length}/{PLAYER_PANEL_COUNT}</span>
            {battle.status === 'active' && (
              <button className="grid-boss-retreat-button" onClick={retreat} type="button">
                Retreat
              </button>
            )}
          </div>
        </div>

        <div className="grid-boss-bars" aria-hidden="true">
          <span style={{ width: `${(battle.playerHp / PLAYER_MAX_HP) * 100}%` }} />
          <span style={{ width: `${(battle.bossHp / BOSS_MAX_HP) * 100}%` }} />
        </div>

        <div className={arenaClassName}>
          {Array.from({ length: ROWS * COLUMNS }, (_, index) => {
            const col = index % COLUMNS
            const row = Math.floor(index / COLUMNS)
            const isPlayerZone = col < PLAYER_COLUMNS
            const isDisabled = isPlayerZone && isPanelDisabled(battle.disabledPanels, col, row)
            return (
              <div
                className={[
                  'grid-panel',
                  isPlayerZone ? 'player-zone' : 'boss-zone',
                  isDisabled ? 'disabled-panel' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                key={index}
              />
            )
          })}

          {battle.telegraphs.flatMap((telegraph) =>
            telegraph.rows.map((row) => (
              <span
                aria-hidden="true"
                className={`boss-telegraph ${telegraph.kind}`}
                key={`${telegraph.id}-${row}`}
                style={rowBandPosition(row)}
              />
            )),
          )}

          <div
            className={[
              'boss-entity',
              `phase-${battle.bossPhase}`,
              battle.bossDamageFlashMs > 0 ? 'damaged' : '',
              battle.phaseFlashMs > 0 ? 'phase-shift' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            style={gridPosition(BOSS_ZONE_START + battle.bossCoreCol, battle.bossCoreRow)}
          >
            <span className="boss-cannon" />
            <span className="boss-core" />
          </div>

          <div
            className={[
              'player-ship',
              battle.playerChargeMs > 0 ? 'charging' : '',
              chargeProgress >= 1 ? 'charged' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            style={playerShipStyle}
          >
            <span className="player-charge-ring" />
          </div>

          {battle.projectiles.map((projectile) => (
            <span
              className={`grid-projectile ${projectile.owner} ${projectile.kind}`}
              key={projectile.id}
              style={projectilePosition(projectile)}
            />
          ))}

          {battle.particles.map((particle) => (
            <span
              aria-hidden="true"
              className={`grid-particle ${particle.kind}`}
              key={particle.id}
              style={particlePosition(particle)}
            />
          ))}

          {battle.status === 'countdown' && (
            <div className="grid-boss-countdown">
              <strong>{countdown}</strong>
              <span>Grid lock engaging</span>
            </div>
          )}

          {battleEnded && (
            <div className="grid-boss-result">
              <strong>{resultTitle}</strong>
              <span>{resultText}</span>
              <dl className="grid-boss-stat-grid">
                <div>
                  <dt>Damage</dt>
                  <dd>{battle.stats.damageDealt}</dd>
                </div>
                <div>
                  <dt>Accuracy</dt>
                  <dd>{Math.round(resultAccuracy * 100)}%</dd>
                </div>
                <div>
                  <dt>Time</dt>
                  <dd>{formatDuration(resultDurationMs)}</dd>
                </div>
                <div>
                  <dt>Panels</dt>
                  <dd>{battle.stats.panelsDisabled}</dd>
                </div>
                <div>
                  <dt>Charge Hits</dt>
                  <dd>
                    {battle.stats.chargeShotsHit}/{battle.stats.chargeShotsFired}
                  </dd>
                </div>
                <div>
                  <dt>Rating</dt>
                  <dd>{resultRating}</dd>
                </div>
              </dl>
              <button className="grid-boss-home-button" onClick={goHome} type="button">
                Home
              </button>
            </div>
          )}
        </div>

        <div className="grid-boss-footer">
          <span>{footerText}</span>
          <button
            aria-label={musicMuted ? 'Unmute boss music' : 'Mute boss music'}
            aria-pressed={!musicMuted}
            className={`grid-boss-mute-button ${musicMuted ? 'muted' : ''}`}
            onClick={toggleMusic}
            title={musicMuted ? 'Unmute boss music' : 'Mute boss music'}
            type="button"
          >
            {musicMuted ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
          {!battleEnded ? (
            <div className="grid-boss-controls" aria-label="Touch battle controls">
              <ControlButton label="Up" onHold={() => holdKey('ArrowUp')} onRelease={() => releaseKey('ArrowUp')} />
              <ControlButton
                label="Left"
                onHold={() => holdKey('ArrowLeft')}
                onRelease={() => releaseKey('ArrowLeft')}
              />
              <ControlButton label="Fire" onHold={() => holdKey(' ')} onRelease={() => releaseKey(' ')} />
              <ControlButton
                label="Right"
                onHold={() => holdKey('ArrowRight')}
                onRelease={() => releaseKey('ArrowRight')}
              />
              <ControlButton
                label="Down"
                onHold={() => holdKey('ArrowDown')}
                onRelease={() => releaseKey('ArrowDown')}
              />
            </div>
          ) : (
            <button className="grid-boss-home-button compact" onClick={goHome} type="button">
              Home
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

interface ControlButtonProps {
  label: string
  onHold: () => void
  onRelease: () => void
}

interface BossMusicController {
  start: () => Promise<void>
  stop: () => void
}

interface Hitbox {
  centerX: number
  centerY: number
  halfHeight: number
  halfWidth: number
}

function ControlButton({ label, onHold, onRelease }: ControlButtonProps) {
  return (
    <button
      onBlur={onRelease}
      onPointerCancel={onRelease}
      onPointerDown={onHold}
      onPointerLeave={onRelease}
      onPointerUp={onRelease}
      type="button"
    >
      {label}
    </button>
  )
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function addParticles(existing: BattleParticle[], particles: BattleParticle[]): BattleParticle[] {
  if (particles.length === 0) return existing
  return [...existing, ...particles].slice(-PARTICLE_LIMIT)
}

function advanceParticles(particles: BattleParticle[], deltaMs: number): BattleParticle[] {
  return particles
    .map((particle) => ({
      ...particle,
      ageMs: particle.ageMs + deltaMs,
      x: particle.x + particle.vx * deltaMs,
      y: particle.y + particle.vy * deltaMs,
    }))
    .filter((particle) => particle.ageMs < particle.ttlMs)
}

function getBossPhase(bossHp: number): BossPhase {
  const hpRatio = bossHp / BOSS_MAX_HP
  if (hpRatio <= 0.3) return 3
  if (hpRatio <= 0.65) return 2
  return 1
}

function getChargeShotDamage(chargeMs: number): number {
  if (chargeMs >= PLAYER_CHARGE_MAX_MS) return PLAYER_CHARGE_MAX_DAMAGE
  return PLAYER_CHARGE_MIN_DAMAGE
}

function getTrailChance(kind: ProjectileKind): number {
  if (kind === 'charge' || kind === 'rift') return 0.65
  if (kind === 'wide') return 0.42
  return 0.22
}

function isFireHeld(keys: Set<string>): boolean {
  return keys.has(' ') || keys.has('Enter')
}

function isFireKey(key: string): boolean {
  return key === ' ' || key === 'Enter'
}

function uniqueRows(rows: number[]): number[] {
  return Array.from(new Set(rows.map((row) => clamp(row, 0, ROWS - 1))))
}

function getRandomBossStep(col: number, row: number): PlayerPanel {
  const steps: PlayerPanel[] = [
    { col, row: row - 1 },
    { col, row: row + 1 },
    { col: col - 1, row },
    { col: col + 1, row },
  ].filter((step) => step.col >= 0 && step.col < PLAYER_COLUMNS && step.row >= 0 && step.row < ROWS)

  return steps[Math.floor(Math.random() * steps.length)] ?? { col, row }
}

function getRandomPanelLockdownTarget(disabledPanels: PlayerPanel[]): PlayerPanel | null {
  const openPanels: PlayerPanel[] = []

  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < PLAYER_COLUMNS; col += 1) {
      if (!isPanelDisabled(disabledPanels, col, row)) {
        openPanels.push({ col, row })
      }
    }
  }

  if (openPanels.length === 0) return null
  return openPanels[Math.floor(Math.random() * openPanels.length)]
}

function findNearestOpenPlayerPanel(
  currentCol: number,
  currentRow: number,
  disabledPanels: PlayerPanel[],
): PlayerPanel | null {
  const openPanels: PlayerPanel[] = []

  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < PLAYER_COLUMNS; col += 1) {
      if (!isPanelDisabled(disabledPanels, col, row)) {
        openPanels.push({ col, row })
      }
    }
  }

  openPanels.sort((a, b) => {
    const aDistance = Math.abs(a.col - currentCol) + Math.abs(a.row - currentRow)
    const bDistance = Math.abs(b.col - currentCol) + Math.abs(b.row - currentRow)
    return aDistance - bDistance
  })

  return openPanels[0] ?? null
}

function isPanelDisabled(disabledPanels: PlayerPanel[], col: number, row: number): boolean {
  return disabledPanels.some((panel) => panel.col === col && panel.row === row)
}

function projectileHitsBoss(projectile: Projectile, battle: BattleState): boolean {
  return hitboxesOverlap(getProjectileHitbox(projectile), {
    centerX: BOSS_ZONE_START + battle.bossCoreCol + 0.5,
    centerY: battle.bossCoreRow + 0.5,
    ...BOSS_HITBOX,
  })
}

function projectileHitsPlayer(projectile: Projectile, battle: BattleState): boolean {
  return hitboxesOverlap(getProjectileHitbox(projectile), {
    centerX: battle.playerCol + 0.5,
    centerY: battle.playerRow + 0.5,
    ...PLAYER_HITBOX,
  })
}

function getProjectileHitbox(projectile: Projectile): Hitbox {
  const hitbox =
    projectile.kind === 'wide'
      ? WIDE_HITBOX
      : projectile.kind === 'charge'
        ? CHARGE_HITBOX
        : projectile.kind === 'rift'
          ? RIFT_HITBOX
          : BOLT_HITBOX

  return {
    centerX: projectile.x + 0.5,
    centerY: projectile.row + 0.5,
    ...hitbox,
  }
}

function hitboxesOverlap(a: Hitbox, b: Hitbox): boolean {
  return (
    Math.abs(a.centerX - b.centerX) <= a.halfWidth + b.halfWidth &&
    Math.abs(a.centerY - b.centerY) <= a.halfHeight + b.halfHeight
  )
}

function createBossMusic(): BossMusicController | null {
  const audioWindow = window as Window & {
    webkitAudioContext?: typeof AudioContext
  }
  const AudioContextConstructor = window.AudioContext ?? audioWindow.webkitAudioContext
  if (!AudioContextConstructor) return null

  const context = new AudioContextConstructor()
  const master = context.createGain()
  let intervalId: number | null = null
  let step = 0

  master.gain.value = 0.055
  master.connect(context.destination)

  function playTone(
    frequency: number,
    duration: number,
    gainLevel: number,
    type: OscillatorType,
    when: number,
  ) {
    const oscillator = context.createOscillator()
    const gain = context.createGain()

    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, when)
    gain.gain.setValueAtTime(0.001, when)
    gain.gain.exponentialRampToValueAtTime(gainLevel, when + 0.018)
    gain.gain.exponentialRampToValueAtTime(0.001, when + duration)
    oscillator.connect(gain)
    gain.connect(master)
    oscillator.start(when)
    oscillator.stop(when + duration + 0.04)
  }

  function scheduleStep() {
    const now = context.currentTime + 0.035
    const bassLine = [55, 55, 65.41, 55, 82.41, 73.42, 65.41, 49]
    const leadLine = [220, 246.94, 293.66, 329.63, 293.66, 246.94, 196, 164.81]
    const bass = bassLine[step % bassLine.length]

    playTone(bass, 0.16, 0.34, 'sawtooth', now)
    if (step % 2 === 0) playTone(bass / 2, 0.12, 0.2, 'square', now + 0.04)
    if (step % 4 === 2) playTone(leadLine[step % leadLine.length], 0.22, 0.18, 'triangle', now + 0.06)
    if (step % 8 === 7) playTone(110, 0.34, 0.26, 'sawtooth', now + 0.08)
    step += 1
  }

  return {
    async start() {
      try {
        await context.resume()
      } catch {
        return
      }

      scheduleStep()
      intervalId = window.setInterval(scheduleStep, 185)
    },
    stop() {
      if (intervalId !== null) {
        window.clearInterval(intervalId)
        intervalId = null
      }

      master.gain.setTargetAtTime(0.001, context.currentTime, 0.02)
      window.setTimeout(() => {
        void context.close()
      }, 80)
    },
  }
}

function gridPosition(col: number, row: number): CSSProperties {
  return {
    left: `${((col + 0.5) / COLUMNS) * 100}%`,
    top: `${((row + 0.5) / ROWS) * 100}%`,
  }
}

function projectilePosition(projectile: Projectile): CSSProperties {
  return {
    left: `${((projectile.x + 0.5) / COLUMNS) * 100}%`,
    top: `${((projectile.row + 0.5) / ROWS) * 100}%`,
  }
}

function particlePosition(particle: BattleParticle): CSSProperties {
  const progress = particle.ageMs / particle.ttlMs

  return {
    '--particle-size': `${particle.size}rem`,
    left: `${(particle.x / COLUMNS) * 100}%`,
    opacity: Math.max(0, 1 - progress),
    top: `${(particle.y / ROWS) * 100}%`,
    transform: `translate(-50%, -50%) scale(${1 + progress * 0.65})`,
  } as CSSProperties
}

function rowBandPosition(row: number): CSSProperties {
  return {
    height: `${100 / ROWS}%`,
    top: `${(row / ROWS) * 100}%`,
  }
}

function getBattleDurationMs(stats: BattleStats): number {
  if (stats.startedAt === null) return 0
  return Math.max(0, (stats.endedAt ?? stats.startedAt) - stats.startedAt)
}

function getAccuracy(stats: BattleStats): number {
  if (stats.shotsFired === 0) return 0
  return stats.shotsHit / stats.shotsFired
}

function formatDuration(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.round(milliseconds / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return minutes > 0 ? `${minutes}:${seconds.toString().padStart(2, '0')}` : `${seconds}s`
}

function getPerformanceRating(status: BattleState['status'], stats: BattleStats): string {
  const accuracy = getAccuracy(stats)
  const durationSeconds = getBattleDurationMs(stats) / 1000

  if (status === 'won' && accuracy >= 0.7 && stats.damageTaken <= 2 && durationSeconds <= 45) return 'S'
  if (status === 'won' && accuracy >= 0.5) return 'A'
  if (status === 'won') return 'B'
  if (stats.damageDealt >= Math.ceil(BOSS_MAX_HP * 0.5)) return 'C'
  return 'D'
}
