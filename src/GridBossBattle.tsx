import { useEffect, useRef, useState, type CSSProperties } from 'react'

export type GridBossResult = 'win' | 'loss'

interface GridBossBattleProps {
  onComplete: (result: GridBossResult) => void
}

interface Projectile {
  id: number
  owner: 'player' | 'boss'
  row: number
  x: number
  speed: number
}

interface BattleState {
  bossHp: number
  playerCol: number
  playerHp: number
  playerRow: number
  projectiles: Projectile[]
  status: 'active' | 'won' | 'lost'
}

const ROWS = 3
const COLUMNS = 6
const PLAYER_COLUMNS = 3
const PLAYER_MAX_HP = 6
const BOSS_MAX_HP = 14
const PLAYER_MOVE_COOLDOWN_MS = 120
const PLAYER_SHOT_COOLDOWN_MS = 260
const BOSS_SHOT_COOLDOWN_MS = 720

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
    bossHp: BOSS_MAX_HP,
    playerCol: 1,
    playerHp: PLAYER_MAX_HP,
    playerRow: 1,
    projectiles: [],
    status: 'active',
  })
  const pressedKeys = useRef(new Set<string>())
  const overlayRef = useRef<HTMLDivElement | null>(null)
  const projectileId = useRef(1)
  const frameId = useRef<number | null>(null)
  const lastFrameAt = useRef<number | null>(null)
  const lastMoveAt = useRef(0)
  const lastPlayerShotAt = useRef(0)
  const lastBossShotAt = useRef(0)

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

  useEffect(() => {
    if (battle.status === 'active') return

    const result = battle.status === 'won' ? 'win' : 'loss'
    const timeout = window.setTimeout(() => onComplete(result), 1500)
    return () => window.clearTimeout(timeout)
  }, [battle.status, onComplete])

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
          owner: 'player',
          row: current.playerRow,
          x: current.playerCol + 0.72,
          speed: 0.018,
        },
      ],
    }
  }

  function applyBossFire(current: BattleState, now: number): BattleState {
    if (now - lastBossShotAt.current < BOSS_SHOT_COOLDOWN_MS) return current

    lastBossShotAt.current = now
    const aimedRow = current.playerRow
    const waveRow = Math.floor(now / BOSS_SHOT_COOLDOWN_MS) % ROWS
    const row = current.bossHp <= BOSS_MAX_HP / 2 ? waveRow : aimedRow

    return {
      ...current,
      projectiles: [
        ...current.projectiles,
        {
          id: projectileId.current++,
          owner: 'boss',
          row,
          x: 3.2,
          speed: -0.012,
        },
      ],
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
        if (nextProjectile.x >= 3.05) {
          bossHp -= 1
          continue
        }
        projectiles.push(nextProjectile)
        continue
      }

      const hitPlayer =
        nextProjectile.row === current.playerRow &&
        nextProjectile.x <= current.playerCol + 0.5 &&
        nextProjectile.x >= current.playerCol - 0.2

      if (hitPlayer) {
        playerHp -= 1
        continue
      }
      if (nextProjectile.x < -0.4) continue
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

        let next = applyPlayerMovement(current, pressedKeys.current, now)
        next = applyPlayerFire(next, pressedKeys.current, now)
        next = applyBossFire(next, now)
        next = applyProjectileMotion(next, deltaMs)

        if (next.bossHp <= 0) {
          return { ...next, bossHp: 0, status: 'won' }
        }
        if (next.playerHp <= 0) {
          return { ...next, playerHp: 0, status: 'lost' }
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
    pressedKeys.current.add(key)
  }

  function releaseKey(key: string) {
    pressedKeys.current.delete(key)
  }

  const resultText =
    battle.status === 'won'
      ? 'Boss signal broken. Returning to command.'
      : battle.status === 'lost'
        ? 'Ship systems disengaged. Returning to command.'
        : 'Grid encounter active'

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
          <div className="boss-entity" />
          <div
            className="player-ship"
            style={gridPosition(battle.playerCol, battle.playerRow)}
          />
          {battle.projectiles.map((projectile) => (
            <span
              className={`grid-projectile ${projectile.owner}`}
              key={projectile.id}
              style={projectilePosition(projectile)}
            />
          ))}
          {battle.status !== 'active' && (
            <div className="grid-boss-result">
              <strong>{battle.status === 'won' ? 'Victory' : 'Retreat'}</strong>
              <span>{resultText}</span>
            </div>
          )}
        </div>

        <div className="grid-boss-footer">
          <span>{resultText}</span>
          <div className="grid-boss-controls" aria-label="Touch battle controls">
            <button
              onPointerDown={() => holdKey('ArrowUp')}
              onPointerLeave={() => releaseKey('ArrowUp')}
              onPointerUp={() => releaseKey('ArrowUp')}
              type="button"
            >
              Up
            </button>
            <button
              onPointerDown={() => holdKey('ArrowLeft')}
              onPointerLeave={() => releaseKey('ArrowLeft')}
              onPointerUp={() => releaseKey('ArrowLeft')}
              type="button"
            >
              Left
            </button>
            <button
              onPointerDown={() => holdKey(' ')}
              onPointerLeave={() => releaseKey(' ')}
              onPointerUp={() => releaseKey(' ')}
              type="button"
            >
              Fire
            </button>
            <button
              onPointerDown={() => holdKey('ArrowRight')}
              onPointerLeave={() => releaseKey('ArrowRight')}
              onPointerUp={() => releaseKey('ArrowRight')}
              type="button"
            >
              Right
            </button>
            <button
              onPointerDown={() => holdKey('ArrowDown')}
              onPointerLeave={() => releaseKey('ArrowDown')}
              onPointerUp={() => releaseKey('ArrowDown')}
              type="button"
            >
              Down
            </button>
          </div>
        </div>
      </div>
    </div>
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
