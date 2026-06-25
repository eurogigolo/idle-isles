import { Mic, MicOff } from 'lucide-react'
import { useEffect, useRef, useState, type CSSProperties } from 'react'

export type GridBossResult = 'win' | 'loss'

interface GridBossBattleProps {
  onComplete: (result: GridBossResult) => void
}

type ProjectileKind = 'bolt' | 'wide'

interface Projectile {
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
  row: number
}

interface PlayerPanel {
  col: number
  row: number
}

interface BattleState {
  bossCoreCol: number
  bossCoreRow: number
  bossHp: number
  disabledPanels: PlayerPanel[]
  playerCol: number
  playerHp: number
  playerRow: number
  projectiles: Projectile[]
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
const PLAYER_SHOT_COOLDOWN_MS = 240
const BOSS_MOVE_COOLDOWN_MS = 560
const BOSS_SHOT_COOLDOWN_MS = 760
const BOSS_SPECIAL_COOLDOWN_MS = 3200
const BOSS_SPECIAL_TELEGRAPH_MS = 620
const PANEL_LOCKDOWN_COOLDOWN_MS = 3000
const MAX_DISABLED_PLAYER_PANELS = PLAYER_PANEL_COUNT - 1
const COUNTDOWN_START = 3
const PLAYER_HITBOX = { halfHeight: 0.24, halfWidth: 0.29 }
const BOSS_HITBOX = { halfHeight: 0.28, halfWidth: 0.32 }
const BOLT_HITBOX = { halfHeight: 0.055, halfWidth: 0.13 }
const WIDE_HITBOX = { halfHeight: 0.28, halfWidth: 0.62 }

const BOSS_CORE_PATTERN = [
  { col: 1, row: 1 },
  { col: 0, row: 0 },
  { col: 2, row: 1 },
  { col: 1, row: 2 },
  { col: 0, row: 1 },
  { col: 2, row: 0 },
  { col: 1, row: 1 },
  { col: 2, row: 2 },
]

const WIDE_ATTACK_ROWS = [0, 2, 1, 0, 2, 1]

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
    bossCoreCol: 1,
    bossCoreRow: 1,
    bossHp: BOSS_MAX_HP,
    disabledPanels: [],
    playerCol: 1,
    playerHp: PLAYER_MAX_HP,
    playerRow: 1,
    projectiles: [],
    status: 'countdown',
    telegraphs: [],
  })
  const [countdown, setCountdown] = useState(COUNTDOWN_START)
  const [musicMuted, setMusicMuted] = useState(false)
  const pressedKeys = useRef(new Set<string>())
  const overlayRef = useRef<HTMLDivElement | null>(null)
  const musicRef = useRef<BossMusicController | null>(null)
  const projectileId = useRef(1)
  const telegraphId = useRef(1)
  const frameId = useRef<number | null>(null)
  const lastFrameAt = useRef<number | null>(null)
  const lastMoveAt = useRef(0)
  const lastPlayerShotAt = useRef(0)
  const lastBossMoveAt = useRef(0)
  const lastBossShotAt = useRef(0)
  const lastBossSpecialAt = useRef(0)
  const lastPanelLockdownAt = useRef(0)
  const bossPatternIndex = useRef(0)
  const wideAttackIndex = useRef(0)

  useEffect(() => {
    overlayRef.current?.focus()
  }, [])

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
    }

    function handleKeyUp(event: KeyboardEvent) {
      activeKeys.delete(event.key)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      activeKeys.clear()
    }
  }, [])

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
    if (!keys.has(' ') && !keys.has('Enter')) return current
    if (now - lastPlayerShotAt.current < PLAYER_SHOT_COOLDOWN_MS) return current

    lastPlayerShotAt.current = now
    return {
      ...current,
      projectiles: [
        ...current.projectiles,
        {
          id: projectileId.current++,
          kind: 'bolt',
          owner: 'player',
          row: current.playerRow,
          speed: 0.022,
          x: current.playerCol + 0.72,
        },
      ],
    }
  }

  function applyBossMovement(current: BattleState, now: number): BattleState {
    if (now - lastBossMoveAt.current < BOSS_MOVE_COOLDOWN_MS) return current

    lastBossMoveAt.current = now
    bossPatternIndex.current = (bossPatternIndex.current + 1) % BOSS_CORE_PATTERN.length
    const nextCore = BOSS_CORE_PATTERN[bossPatternIndex.current]

    return {
      ...current,
      bossCoreCol: nextCore.col,
      bossCoreRow: nextCore.row,
    }
  }

  function applyBossFire(current: BattleState, now: number): BattleState {
    if (current.telegraphs.length > 0) return current

    if (now - lastBossSpecialAt.current >= BOSS_SPECIAL_COOLDOWN_MS) {
      lastBossSpecialAt.current = now
      const row = WIDE_ATTACK_ROWS[wideAttackIndex.current % WIDE_ATTACK_ROWS.length]
      wideAttackIndex.current += 1
      return {
        ...current,
        telegraphs: [
          ...current.telegraphs,
          {
            fireAt: now + BOSS_SPECIAL_TELEGRAPH_MS,
            id: telegraphId.current++,
            row,
          },
        ],
      }
    }

    if (now - lastBossShotAt.current < BOSS_SHOT_COOLDOWN_MS) return current

    lastBossShotAt.current = now
    return {
      ...current,
      projectiles: [
        ...current.projectiles,
        {
          id: projectileId.current++,
          kind: 'bolt',
          owner: 'boss',
          row: current.bossCoreRow,
          speed: -0.011,
          x: BOSS_ZONE_START + current.bossCoreCol + 0.24,
        },
      ],
    }
  }

  function applyTelegraphs(current: BattleState, now: number): BattleState {
    if (current.telegraphs.length === 0) return current

    const pending: Telegraph[] = []
    const projectiles = [...current.projectiles]

    for (const telegraph of current.telegraphs) {
      if (now < telegraph.fireAt) {
        pending.push(telegraph)
        continue
      }

      projectiles.push({
        id: projectileId.current++,
        kind: 'wide',
        owner: 'boss',
        row: telegraph.row,
        speed: -0.018,
        x: COLUMNS - 0.3,
      })
    }

    return {
      ...current,
      projectiles,
      telegraphs: pending,
    }
  }

  function applyPanelLockdown(current: BattleState, now: number): BattleState {
    if (now - lastPanelLockdownAt.current < PANEL_LOCKDOWN_COOLDOWN_MS) return current
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
      playerCol: fallbackPanel?.col ?? current.playerCol,
      playerRow: fallbackPanel?.row ?? current.playerRow,
    }
  }

  function applyProjectileMotion(current: BattleState, deltaMs: number): BattleState {
    let bossHp = current.bossHp
    let playerHp = current.playerHp
    const projectiles: Projectile[] = []

    for (const projectile of current.projectiles) {
      const nextProjectile = {
        ...projectile,
        x: projectile.x + projectile.speed * deltaMs,
      }

      if (nextProjectile.owner === 'player') {
        if (projectileHitsBoss(nextProjectile, current)) {
          bossHp -= 1
          continue
        }
        if (nextProjectile.x > COLUMNS + 0.4) continue
        projectiles.push(nextProjectile)
        continue
      }

      if (projectileHitsPlayer(nextProjectile, current)) {
        playerHp -= nextProjectile.kind === 'wide' ? 2 : 1
        continue
      }
      if (nextProjectile.x < -0.8) continue
      projectiles.push(nextProjectile)
    }

    return {
      ...current,
      bossHp,
      playerHp,
      projectiles,
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

        let next = applyPlayerMovement(current, pressedKeys.current, now)
        next = applyPlayerFire(next, pressedKeys.current, now)
        next = applyBossMovement(next, now)
        next = applyTelegraphs(next, now)
        next = applyBossFire(next, now)
        next = applyPanelLockdown(next, now)
        next = applyProjectileMotion(next, deltaMs)

        if (next.bossHp <= 0) {
          pressedKeys.current.clear()
          return { ...next, bossHp: 0, projectiles: [], status: 'won', telegraphs: [] }
        }
        if (next.playerHp <= 0) {
          pressedKeys.current.clear()
          return { ...next, playerHp: 0, projectiles: [], status: 'lost', telegraphs: [] }
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
  }, [])

  function holdKey(key: string) {
    if (battle.status !== 'active') return
    pressedKeys.current.add(key)
  }

  function releaseKey(key: string) {
    pressedKeys.current.delete(key)
  }

  function retreat() {
    pressedKeys.current.clear()
    setBattle((current) =>
      current.status === 'active'
        ? { ...current, projectiles: [], status: 'lost', telegraphs: [] }
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

  return (
    <div
      aria-label="Grid Boss Encounter"
      className="grid-boss-overlay"
      ref={overlayRef}
      tabIndex={-1}
    >
      <div className="grid-boss-shell">
        <div className="grid-boss-header">
          <div>
            <span className="eyebrow">Grid Boss Encounter</span>
            <h2>Rift Warden</h2>
          </div>
          <div className="grid-boss-readout">
            <span>Hull {battle.playerHp}/{PLAYER_MAX_HP}</span>
            <span>Boss {battle.bossHp}/{BOSS_MAX_HP}</span>
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

        <div className="grid-boss-arena">
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

          {battle.telegraphs.map((telegraph) => (
            <span
              aria-hidden="true"
              className="boss-telegraph"
              key={telegraph.id}
              style={rowBandPosition(telegraph.row)}
            />
          ))}

          <div
            className="boss-entity"
            style={gridPosition(BOSS_ZONE_START + battle.bossCoreCol, battle.bossCoreRow)}
          >
            <span className="boss-cannon" />
            <span className="boss-core" />
          </div>

          <div
            className="player-ship"
            style={gridPosition(battle.playerCol, battle.playerRow)}
          />

          {battle.projectiles.map((projectile) => (
            <span
              className={`grid-projectile ${projectile.owner} ${projectile.kind}`}
              key={projectile.id}
              style={projectilePosition(projectile)}
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
              <button className="grid-boss-home-button" onClick={goHome} type="button">
                Home
              </button>
            </div>
          )}
        </div>

        <div className="grid-boss-footer">
          <span>{resultText}</span>
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
  const hitbox = projectile.kind === 'wide' ? WIDE_HITBOX : BOLT_HITBOX

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

function rowBandPosition(row: number): CSSProperties {
  return {
    height: `${100 / ROWS}%`,
    top: `${(row / ROWS) * 100}%`,
  }
}
