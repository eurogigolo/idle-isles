import {
  Activity,
  Box,
  CircleDollarSign,
  Compass,
  Crosshair,
  Factory,
  Gauge,
  Package,
  Play,
  Rocket,
  Shield,
  ShoppingCart,
  Square,
  Wrench,
  Zap,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { GameScene } from './GameScene'
import {
  ACTIVITIES,
  ITEMS,
  MODULE_SLOTS,
  SECTORS,
  SKILLS,
  STORAGE_KEY,
  applyClaim,
  buyRelayItem,
  createInitialState,
  equipModule,
  formatItemQuantity,
  formatModuleSlot,
  getActivityById,
  getActivityStatus,
  getCargoEntries,
  getClaimPreview,
  getSectorById,
  getSectorUnlockStatus,
  getSkillLevel,
  getXpForNextLevel,
  sellCargoItem,
  startActivity,
  stopActivity,
  travelToSector,
  unequipModule,
  updateCombatSettings,
  useRepairSupply as applyRepairSupply,
  type ActivityDefinition,
  type ActivityGroup,
  type GameState,
  type ItemId,
  type SkillId,
} from './game'

const GROUPS: ActivityGroup[] = ['Gathering', 'Production', 'Combat']

const GROUP_ICONS: Record<ActivityGroup, typeof Activity> = {
  Gathering: Compass,
  Production: Factory,
  Combat: Crosshair,
}

const SKILL_ICONS: Record<SkillId, typeof Activity> = {
  asteroidMining: Gauge,
  wreckSalvage: Package,
  nebulaSiphoning: Zap,
  exoSurveying: Compass,
  shipyardFabrication: Wrench,
  lifeSystemsSynthesis: Activity,
  quantumRefining: Factory,
  nanofabAssembly: Box,
  gunnery: Crosshair,
  engineering: Shield,
}

const REPAIR_ITEMS = (Object.keys(ITEMS) as ItemId[]).filter(
  (itemId) => ITEMS[itemId].kind === 'repair',
)

function App() {
  const [game, setGame] = useState<GameState>(() => loadGame())
  const [selectedGroup, setSelectedGroup] = useState<ActivityGroup>('Gathering')
  const [now, setNow] = useState(() => Date.now())
  const [notice, setNotice] = useState('Local v2 simulation active. Chain mode starts after fresh contracts.')

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(game))
  }, [game])

  const activeActivity = game.activeMission ? getActivityById(game.activeMission.activityId) : null
  const preview = useMemo(() => getClaimPreview(game, now), [game, now])
  const sector = getSectorById(game.currentSectorId)
  const visibleActivities = ACTIVITIES.filter((activity) => activity.group === selectedGroup)
  const hullPct = Math.max(0, Math.min(100, (game.ship.currentHull / game.ship.maxHull) * 100))
  const progressPct = getMissionProgress(activeActivity, game, now)

  function runAction(action: () => GameState, success?: string) {
    try {
      setGame(action())
      if (success) setNotice(success)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Action failed.')
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">On-chain space idle RPG</p>
          <h1>Idle Galactica</h1>
        </div>
        <div className="topbar-stats">
          <StatPill icon={CircleDollarSign} label="Credits" value={game.cargo.credits.toLocaleString()} />
          <StatPill icon={Rocket} label="Sector" value={sector.name} />
          <StatPill
            icon={Shield}
            label="Hull"
            value={`${Math.ceil(game.ship.currentHull)}/${game.ship.maxHull}`}
          />
        </div>
      </header>

      <section className="notice">{notice}</section>

      <section className="dashboard">
        <aside className="panel skill-panel">
          <PanelTitle icon={Activity} title="Skills" />
          <div className="skill-list">
            {SKILLS.map((skill) => {
              const Icon = SKILL_ICONS[skill.id]
              const level = getSkillLevel(game, skill.id)
              const xp = game.skills[skill.id].xp
              const next = getXpForNextLevel(level)
              const progress = Math.min(100, (xp / next) * 100)

              return (
                <div className="skill-row" key={skill.id}>
                  <Icon size={18} />
                  <div>
                    <strong>{skill.name}</strong>
                    <span>{skill.category}</span>
                  </div>
                  <div className="skill-level">
                    <b>{level}</b>
                    <div className="mini-bar">
                      <span style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </aside>

        <section className="panel mission-panel">
          <GameScene activity={activeActivity} isActive={Boolean(game.activeMission)} progress={progressPct} />

          <div className="active-mission">
            <div>
              <span>Current Mission</span>
              <strong>{activeActivity ? activeActivity.name : 'No active mission'}</strong>
            </div>
            <div className="mission-actions">
              <button
                disabled={!game.activeMission || preview.cycles === 0}
                onClick={() => runAction(() => applyClaim(game), 'Mission cycles claimed.')}
                type="button"
              >
                Claim {preview.cycles > 0 ? `(${preview.cycles})` : ''}
              </button>
              <button
                disabled={!game.activeMission}
                onClick={() => runAction(() => stopActivity(game))}
                type="button"
              >
                <Square size={16} />
              </button>
            </div>
          </div>

          <div className="mission-header">
            <PanelTitle icon={GROUP_ICONS[selectedGroup]} title="Missions" />
            <div className="segmented">
              {GROUPS.map((group) => (
                <button
                  className={selectedGroup === group ? 'selected' : ''}
                  key={group}
                  onClick={() => setSelectedGroup(group)}
                  type="button"
                >
                  {group}
                </button>
              ))}
            </div>
          </div>

          <div className="mission-grid">
            {visibleActivities.map((activity) => (
              <MissionCard
                activity={activity}
                game={game}
                key={activity.id}
                onStart={() =>
                  runAction(
                    () => startActivity(game, activity.id),
                    game.activeMission ? 'Pending cycles settled. Mission switched.' : 'Mission started.',
                  )
                }
              />
            ))}
          </div>
        </section>

        <aside className="panel ship-panel">
          <PanelTitle icon={Rocket} title="Ship Status" />
          <div className="hull-card">
            <div className="hull-line">
              <span>Hull Integrity</span>
              <strong>{Math.ceil(game.ship.currentHull)} / {game.ship.maxHull}</strong>
            </div>
            <div className="hull-bar">
              <span style={{ width: `${hullPct}%` }} />
            </div>
          </div>

          <div className="combat-settings">
            <label>
              <input
                checked={game.combatSettings.autoRepair}
                onChange={(event) =>
                  setGame(updateCombatSettings(game, { autoRepair: event.currentTarget.checked }))
                }
                type="checkbox"
              />
              Auto-repair
            </label>
            <label>
              Stop Hull
              <input
                max={Math.max(1, game.ship.maxHull - 1)}
                min={1}
                onChange={(event) =>
                  setGame(updateCombatSettings(game, { stopAtHull: Number(event.currentTarget.value) }))
                }
                type="number"
                value={game.combatSettings.stopAtHull}
              />
            </label>
            <label>
              Repair Supply
              <select
                onChange={(event) =>
                  setGame(updateCombatSettings(game, { repairItemId: event.currentTarget.value as ItemId }))
                }
                value={game.combatSettings.repairItemId}
              >
                {REPAIR_ITEMS.map((itemId) => (
                  <option key={itemId} value={itemId}>
                    {ITEMS[itemId].name} ({game.cargo[itemId]})
                  </option>
                ))}
              </select>
            </label>
          </div>

          <PanelTitle icon={Shield} title="Ship Modules" />
          <div className="module-grid">
            {MODULE_SLOTS.map((slot) => {
              const itemId = game.ship.modules[slot]
              return (
                <div className="module-slot" key={slot}>
                  <span>{formatModuleSlot(slot)}</span>
                  <strong>{itemId ? ITEMS[itemId].name : 'Empty'}</strong>
                  <button
                    disabled={!itemId}
                    onClick={() => runAction(() => unequipModule(game, slot))}
                    type="button"
                  >
                    Remove
                  </button>
                </div>
              )
            })}
          </div>

          <PanelTitle icon={Compass} title="Sectors" />
          <div className="sector-list">
            {SECTORS.map((entry) => {
              const unlock = getSectorUnlockStatus(game, entry)
              const isCurrent = entry.id === game.currentSectorId
              return (
                <button
                  className={isCurrent ? 'sector selected' : 'sector'}
                  disabled={isCurrent || (!game.unlockedSectors[entry.id] && !unlock.canStart)}
                  key={entry.id}
                  onClick={() => runAction(() => travelToSector(game, entry.id))}
                  type="button"
                >
                  <strong>{entry.name}</strong>
                  <span>
                    {game.unlockedSectors[entry.id]
                      ? isCurrent
                        ? 'Current'
                        : 'Unlocked'
                      : unlock.reasons.join(', ')}
                  </span>
                </button>
              )
            })}
          </div>
        </aside>
      </section>

      <section className="lower-grid">
        <section className="panel">
          <PanelTitle icon={Package} title="Cargo Hold" />
          <div className="cargo-grid">
            {getCargoEntries(game).map(([itemId, amount]) => (
              <CargoCard
                amount={amount}
                itemId={itemId}
                key={itemId}
                onEquip={() => runAction(() => equipModule(game, itemId))}
                onRepair={() => runAction(() => applyRepairSupply(game, itemId))}
                onSell={() => runAction(() => sellCargoItem(game, itemId))}
              />
            ))}
          </div>
        </section>

        <section className="panel">
          <PanelTitle icon={ShoppingCart} title="Trade Relay" />
          <div className="trade-list">
            {game.marketOrders.map((order) => (
              <div className="trade-row" key={order.id}>
                <div>
                  <strong>{ITEMS[order.itemId].name}</strong>
                  <span>{order.quantity} available</span>
                </div>
                <button
                  disabled={order.quantity <= 0 || game.cargo.credits < order.unitPrice}
                  onClick={() => runAction(() => buyRelayItem(game, order.id))}
                  type="button"
                >
                  Buy {order.unitPrice}
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <PanelTitle icon={Activity} title="Event Log" />
          <div className="event-log">
            {game.eventLog.map((entry, index) => (
              <p key={`${entry}-${index}`}>{entry}</p>
            ))}
          </div>
        </section>
      </section>
    </main>
  )
}

interface StatPillProps {
  icon: typeof Activity
  label: string
  value: string
}

function StatPill({ icon: Icon, label, value }: StatPillProps) {
  return (
    <div className="stat-pill">
      <Icon size={18} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

interface PanelTitleProps {
  icon: typeof Activity
  title: string
}

function PanelTitle({ icon: Icon, title }: PanelTitleProps) {
  return (
    <div className="panel-title">
      <Icon size={18} />
      <h2>{title}</h2>
    </div>
  )
}

interface MissionCardProps {
  activity: ActivityDefinition
  game: GameState
  onStart: () => void
}

function MissionCard({ activity, game, onStart }: MissionCardProps) {
  const status = getActivityStatus(game, activity)
  const Icon = GROUP_ICONS[activity.group]
  const activeMissionId = game.activeMission?.activityId
  const isRunning = activeMissionId === activity.id
  const canSwitchFromActiveMission = Boolean(activeMissionId && !isRunning)
  const canAttemptStart = status.canStart || canSwitchFromActiveMission

  return (
    <article className="mission-card">
      <header>
        <Icon size={18} />
        <div>
          <h3>{activity.name}</h3>
          <span>{getSectorById(activity.sectorId).name} - Tier {activity.tier}</span>
        </div>
      </header>
      <p>{activity.description}</p>
      <dl>
        <div>
          <dt>Cycle</dt>
          <dd>{Math.round(activity.cycleMs / 1000)}s</dd>
        </div>
        <div>
          <dt>XP</dt>
          <dd>{formatXp(activity)}</dd>
        </div>
        <div>
          <dt>Output</dt>
          <dd>{formatRewards(activity.rewards)}</dd>
        </div>
      </dl>
      {!status.canStart && <small>{status.reasons.join(' ')}</small>}
      <button disabled={!canAttemptStart || isRunning} onClick={onStart} type="button">
        <Play size={16} />
        {isRunning ? 'Running' : canSwitchFromActiveMission ? 'Switch' : 'Start'}
      </button>
    </article>
  )
}

interface CargoCardProps {
  amount: number
  itemId: ItemId
  onEquip: () => void
  onRepair: () => void
  onSell: () => void
}

function CargoCard({ amount, itemId, onEquip, onRepair, onSell }: CargoCardProps) {
  const item = ITEMS[itemId]

  return (
    <article className="cargo-card">
      <div>
        <strong>{item.name}</strong>
        <span>{item.kind}</span>
      </div>
      <b>{amount.toLocaleString()}</b>
      <p>{item.description}</p>
      <div className="cargo-actions">
        {item.kind === 'module' && <button onClick={onEquip} type="button">Install</button>}
        {item.kind === 'repair' && <button onClick={onRepair} type="button">Use</button>}
        {item.tradable && itemId !== 'credits' && <button onClick={onSell} type="button">Sell</button>}
      </div>
    </article>
  )
}

function getMissionProgress(activity: ActivityDefinition | null, game: GameState, now: number): number {
  if (!activity || !game.activeMission) return 0
  const elapsed = now - game.activeMission.lastClaimAt
  return Math.min(100, ((elapsed % activity.cycleMs) / activity.cycleMs) * 100)
}

function formatXp(activity: ActivityDefinition): string {
  return Object.entries(activity.xp)
    .map(([skillId, amount]) => `${amount} ${SKILLS.find((skill) => skill.id === skillId)?.name ?? skillId}`)
    .join(', ')
}

function formatRewards(rewards: Partial<Record<ItemId, number>>): string {
  return Object.entries(rewards)
    .map(([itemId, amount]) => formatItemQuantity(itemId as ItemId, amount ?? 0))
    .join(', ')
}

function loadGame(): GameState {
  const fresh = createInitialState()
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return fresh

  try {
    const parsed = JSON.parse(raw) as GameState
    if (parsed.version !== 1 || !parsed.ship || !parsed.cargo || !parsed.skills) {
      return fresh
    }
    return parsed
  } catch {
    return fresh
  }
}

export default App
