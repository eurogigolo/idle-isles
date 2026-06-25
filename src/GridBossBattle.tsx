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

interface BattleState {
  bossCoreCol: number
  bossCoreRow: number
  bossHp: number
  playerCol: number
  playerHp: number
  playerRow: number
  projectiles: Projectile[]
  status: 'active' | 'won' | 'lost'
  telegraphs: Telegraph[]
}

const ROWS = 3
const COLUMNS = 6
const PLAYER_COLUMNS = 3
const BOSS_ZONE_START = PLAYER_COLUMNS
const PLAYER_MAX_HP = 6
const BOSS_MAX_HP = 14
const PLAYER_MOVE_COOLDOWN_MS = 95
const PLAYER_SHOT_COOLDOWN_MS = 240
const BOSS_MOVE_COOLDOWN_MS = 560
const BOSS_SHOT_COOLDOWN_MS = 760
const BOSS_SPECIAL_COOLDOWN_MS = 3200
const BOSS_SPECIAL_TELEGRAPH_MS = 620

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
    playerCol: 1,
    playerHp: PLAYER_MAX_HP,
    playerRow: 1,
    projectiles: [],
    status: 'active',
    telegraphs: [],
  })
  const pressedKeys = useRef(new Set<string>())
  const overlayRef = useRef<HTMLDivElement | null>(null)
  const projectileId = useRef(1)
  const telegraphId = useRef(1)
  const frameId = useRef<number | null>(null)
  const lastFrameAt = useRef<number | null>(null)
  const lastMoveAt = useRef(0)
  const lastPlayerShotAt = useRef(0)
  const lastBossMoveAt = useRef(0)
  const lastBossShotAt = useRef(0)
  const lastBossSpecialAt = useRef(0)
  const bossPatternIndex = useRef(0)

  useEffect(() => {
    overlayRef.current?.focus()
  }, [])

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

    lastMoveAt.current = now
    return {
      ...current,
      playerCol: clamp(current.playerCol + colDelta, 0, PLAYER_COLUMNS - 1),
      playerRow: clamp(current.playerRow + rowDelta, 0, ROWS - 1),
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
      return {
        ...current,
        telegraphs: [
          ...current.telegraphs,
          {
            fireAt: now + BOSS_SPECIAL_TELEGRAPH_MS,
            id: telegraphId.current++,
            row: current.bossCoreRow,
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
        const bossPanelX = BOSS_ZONE_START + current.bossCoreCol
        const hitBoss =
          nextProjectile.row === current.bossCoreRow &&
          nextProjectile.x >= bossPanelX - 0.42 &&
          nextProjectile.x <= bossPanelX + 0.72

        if (hitBoss) {
          bossHp -= 1
          continue
        }
        if (nextProjectile.x > COLUMNS + 0.4) continue
        projectiles.push(nextProjectile)
        continue
      }

      const collisionReach = nextProjectile.kind === 'wide' ? 0.9 : 0.42
      const hitPlayer =
        nextProjectile.row === current.playerRow &&
        nextProjectile.x <= current.playerCol + 0.55 &&
        nextProjectile.x >= current.playerCol - collisionReach

      if (hitPlayer) {
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

      if (lastBossSpecialAt.current === 0) {
        lastBossSpecialAt.current = now
      }

      setBattle((current) => {
        if (current.status !== 'active') return current

        let next = applyPlayerMovement(current, pressedKeys.current, now)
        next = applyPlayerFire(next, pressedKeys.current, now)
        next = applyBossMovement(next, now)
        next = applyTelegraphs(next, now)
        next = applyBossFire(next, now)
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

  const resultTitle = battle.status === 'won' ? 'Victory' : battle.status === 'lost' ? 'Retreat' : ''
  const resultText =
    battle.status === 'won'
      ? 'Rift Warden signal broken. Return to command when ready.'
      : battle.status === 'lost'
        ? 'Ship systems disengaged. Return to command when ready.'
        : 'Dodge fixed fire lanes and punish the boss grid.'

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
            return (
              <div
                className={col < PLAYER_COLUMNS ? 'grid-panel player-zone' : 'grid-panel boss-zone'}
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

          {battle.status !== 'active' && (
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
          {battle.status === 'active' ? (
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
