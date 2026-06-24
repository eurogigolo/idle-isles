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
  connectWallet,
  isChainModeReady,
  readChainSnapshot,
  writeBuyTradeRelayOrder,
  writeClaimMission,
  writeCombatSettings,
  writeCreateProfile,
  writeCreateTradeRelayOrder,
  writeEquipModule,
  writeRepairHull,
  writeStartMission,
  writeStopMission,
  writeTravelToSector,
  writeUnequipModule,
  type Address,
} from './chain'
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
  getSkillName,
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
  type CombatSettings,
  type GameState,
  type ItemId,
  type ModuleStats,
  type ModuleSlot,
  type SectorId,
  type SkillId,
} from './game'

const GROUPS: ActivityGroup[] = ['Gathering', 'Production', 'Combat']
type MissionSkillFilter = SkillId | 'all'

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
  const [selectedSkillFilters, setSelectedSkillFilters] = useState<Record<ActivityGroup, MissionSkillFilter>>({
    Gathering: 'all',
    Production: 'all',
    Combat: 'all',
  })
  const [now, setNow] = useState(() => Date.now())
  const [chainMode, setChainMode] = useState(false)
  const [chainAccount, setChainAccount] = useState<Address | null>(null)
  const [chainHasProfile, setChainHasProfile] = useState(false)
  const [chainBusy, setChainBusy] = useState(false)
  const [notice, setNotice] = useState(() =>
    isChainModeReady()
      ? 'Local v2 simulation active. Chain mode is available.'
      : 'Local v2 simulation active. Configure v2 contract addresses to enable Chain mode.',
  )
  const chainReady = isChainModeReady()

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!chainMode) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(game))
    }
  }, [chainMode, game])

  const activeActivity = game.activeMission ? getActivityById(game.activeMission.activityId) : null
  const preview = useMemo(() => getClaimPreview(game, now), [game, now])
  const sector = getSectorById(game.currentSectorId)
  const selectedSkillFilter = selectedSkillFilters[selectedGroup]
  const groupSkills = SKILLS.filter((skill) => skill.category === selectedGroup)
  const groupActivities = ACTIVITIES.filter((activity) => activity.group === selectedGroup)
  const visibleActivities = sortMissionActivities(
    groupActivities.filter(
      (activity) => selectedSkillFilter === 'all' || activityMatchesSkill(activity, selectedSkillFilter),
    ),
    selectedGroup,
    selectedSkillFilter,
  )
  const hullPct = Math.max(0, Math.min(100, (game.ship.currentHull / game.ship.maxHull) * 100))
  const progressPct = getMissionProgress(activeActivity, game, now)

  function setMissionSkillFilter(filter: MissionSkillFilter) {
    setSelectedSkillFilters((current) => ({
      ...current,
      [selectedGroup]: filter,
    }))
  }

  function runAction(action: () => GameState, success?: string) {
    try {
      setGame(action())
      if (success) setNotice(success)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Action failed.')
    }
  }

  async function handleChainToggle() {
    if (chainMode) {
      setChainMode(false)
      setChainHasProfile(false)
      setGame(loadGame())
      setNotice('Local v2 simulation active.')
      return
    }

    if (!chainReady) {
      setNotice('Set VITE_IDLE_GALACTICA_ADDRESS and VITE_TRADE_RELAY_ADDRESS before using Chain mode.')
      return
    }

    await connectAndSync()
  }

  async function connectAndSync() {
    if (chainBusy) return
    setChainBusy(true)
    try {
      const account = await connectWallet()
      setChainAccount(account)
      setChainMode(true)
      await syncChain(account, 'Chain mode synced.')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Wallet connection failed.')
    } finally {
      setChainBusy(false)
    }
  }

  async function syncChain(account = chainAccount, success = 'Chain state synced.') {
    if (!account) {
      await connectAndSync()
      return
    }

    const snapshot = await readChainSnapshot(account)
    setGame(snapshot.game)
    setChainHasProfile(snapshot.hasProfile)
    setNotice(
      snapshot.hasProfile
        ? `${success} Block ${snapshot.blockNumber.toString()}.`
        : 'No on-chain profile found. Create a ship profile to begin.',
    )
  }

  async function runChainAction(action: () => Promise<unknown>, success: string) {
    if (chainBusy) return
    if (!chainReady) {
      setNotice('Chain mode is not configured.')
      return
    }

    let account = chainAccount
    setChainBusy(true)
    try {
      if (!account) {
        account = await connectWallet()
        setChainAccount(account)
      }
      await action()
      await syncChain(account, success)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Chain transaction failed.')
    } finally {
      setChainBusy(false)
    }
  }

  function requireChainProfile(): boolean {
    if (!chainMode || chainHasProfile) return true
    setNotice('Create an on-chain ship profile first.')
    return false
  }

  function handleMissionStart(activity: ActivityDefinition) {
    if (chainMode) {
      if (!requireChainProfile()) return
      void runChainAction(
        () => writeStartMission(activity.id),
        game.activeMission ? 'Pending cycles settled. Mission switched.' : 'Mission started.',
      )
      return
    }

    runAction(
      () => startActivity(game, activity.id),
      game.activeMission ? 'Pending cycles settled. Mission switched.' : 'Mission started.',
    )
  }

  function handleClaimMission() {
    if (chainMode) {
      if (!requireChainProfile()) return
      void runChainAction(() => writeClaimMission(), 'Mission cycles claimed.')
      return
    }

    runAction(() => applyClaim(game), 'Mission cycles claimed.')
  }

  function handleStopMission() {
    if (chainMode) {
      if (!requireChainProfile()) return
      void runChainAction(() => writeStopMission(), 'Mission stopped.')
      return
    }

    runAction(() => stopActivity(game))
  }

  function handleEquipModule(itemId: ItemId) {
    if (chainMode) {
      if (!requireChainProfile()) return
      void runChainAction(() => writeEquipModule(itemId), `${ITEMS[itemId].name} installed.`)
      return
    }

    runAction(() => equipModule(game, itemId))
  }

  function handleUnequipModule(slot: ModuleSlot) {
    if (chainMode) {
      if (!requireChainProfile()) return
      void runChainAction(() => writeUnequipModule(slot), `${formatModuleSlot(slot)} module removed.`)
      return
    }

    runAction(() => unequipModule(game, slot))
  }

  function handleRepairHull(itemId: ItemId) {
    if (chainMode) {
      if (!requireChainProfile()) return
      void runChainAction(() => writeRepairHull(itemId), `${ITEMS[itemId].name} used.`)
      return
    }

    runAction(() => applyRepairSupply(game, itemId))
  }

  function handleTravelToSector(sectorId: SectorId) {
    if (chainMode) {
      if (!requireChainProfile()) return
      void runChainAction(() => writeTravelToSector(sectorId), `Ship routed to ${getSectorById(sectorId).name}.`)
      return
    }

    runAction(() => travelToSector(game, sectorId))
  }

  function handleBuyRelayItem(orderId: string) {
    if (chainMode) {
      if (!requireChainProfile()) return
      void runChainAction(() => writeBuyTradeRelayOrder(orderId), 'Trade Relay order filled.')
      return
    }

    runAction(() => buyRelayItem(game, orderId))
  }

  function handleSellCargoItem(itemId: ItemId) {
    if (chainMode) {
      if (!requireChainProfile()) return
      const unitPrice = Math.max(1, Math.floor(ITEMS[itemId].baseValue * 0.6))
      void runChainAction(
        () => writeCreateTradeRelayOrder(itemId, unitPrice),
        `${ITEMS[itemId].name} listed on the Trade Relay.`,
      )
      return
    }

    runAction(() => sellCargoItem(game, itemId))
  }

  function editCombatSettings(patch: Partial<CombatSettings>) {
    setGame(updateCombatSettings(game, patch))
  }

  function commitCombatSettings(patch: Partial<CombatSettings>) {
    const nextGame = updateCombatSettings(game, patch)
    setGame(nextGame)

    if (chainMode) {
      if (!requireChainProfile()) return
      void runChainAction(() => writeCombatSettings(nextGame.combatSettings), 'Combat settings updated.')
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
        <div className="chain-controls">
          <button disabled={chainBusy || !chainReady} onClick={() => void handleChainToggle()} type="button">
            {chainMode ? 'Local Mode' : 'Chain Mode'}
          </button>
          {chainMode && (
            <button disabled={chainBusy} onClick={() => void connectAndSync()} type="button">
              {chainAccount ? formatAddress(chainAccount) : 'Connect'}
            </button>
          )}
          {chainMode && chainAccount && !chainHasProfile && (
            <button
              disabled={chainBusy}
              onClick={() => void runChainAction(() => writeCreateProfile(), 'Ship profile created.')}
              type="button"
            >
              Create Profile
            </button>
          )}
          {chainMode && chainAccount && (
            <button disabled={chainBusy} onClick={() => void syncChain()} type="button">
              Sync
            </button>
          )}
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
                <div
                  aria-label={`${skill.name}: ${skill.description}`}
                  className="skill-row"
                  data-tooltip={skill.description}
                  key={skill.id}
                  tabIndex={0}
                  title={skill.description}
                >
                  <Icon size={15} />
                  <div className="skill-name">
                    <strong>{skill.name}</strong>
                  </div>
                  <span className={`skill-category ${skill.category.toLowerCase()}`}>{skill.category}</span>
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
          <GameScene activity={activeActivity} isActive={Boolean(game.activeMission)} />

          <div className={game.activeMission ? 'active-mission active' : 'active-mission'}>
            <div className="active-mission-top">
              <div>
                <span>Current Mission</span>
                <strong>{activeActivity ? activeActivity.name : 'No active mission'}</strong>
              </div>
              <div className="mission-actions">
                <button
                  disabled={!game.activeMission || preview.cycles === 0 || chainBusy}
                  onClick={handleClaimMission}
                  type="button"
                >
                  Claim {preview.cycles > 0 ? `(${preview.cycles})` : ''}
                </button>
                <button
                  aria-label="Stop mission"
                  disabled={!game.activeMission || chainBusy}
                  onClick={handleStopMission}
                  title="Stop mission"
                  type="button"
                >
                  <Square size={16} />
                </button>
              </div>
            </div>

            <div className="mission-progress-large">
              <span style={{ width: `${progressPct}%` }} />
            </div>

            <div className="mission-readouts">
              <div>
                <span>Cycle</span>
                <strong>{activeActivity ? `${Math.round(activeActivity.cycleMs / 1000)}s` : '--'}</strong>
              </div>
              <div>
                <span>Pending</span>
                <strong>{preview.cycles}</strong>
              </div>
              <div>
                <span>Hull Delta</span>
                <strong>{preview.hullDamage > 0 ? `-${preview.hullDamage}` : 'Stable'}</strong>
              </div>
              <div className="wide">
                <span>Per Cycle</span>
                <strong>{activeActivity ? formatRewards(activeActivity.rewards) : 'No output'}</strong>
              </div>
              <div className="wide">
                <span>Claimable</span>
                <strong>{preview.cycles > 0 ? formatRewards(preview.rewards) : 'No claim ready'}</strong>
              </div>
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

          <div className={`mission-skill-filter filter-${selectedGroup.toLowerCase()}`}>
            <span>Skill</span>
            <button
              className={selectedSkillFilter === 'all' ? 'selected' : ''}
              onClick={() => setMissionSkillFilter('all')}
              type="button"
            >
              All
              <b>{groupActivities.length}</b>
            </button>
            {groupSkills.map((skill) => {
              const skillActivityCount = groupActivities.filter((activity) => activityMatchesSkill(activity, skill.id)).length
              return (
                <button
                  className={selectedSkillFilter === skill.id ? 'selected' : ''}
                  key={skill.id}
                  onClick={() => setMissionSkillFilter(skill.id)}
                  type="button"
                >
                  {skill.name}
                  <b>{skillActivityCount}</b>
                </button>
              )
            })}
          </div>

          <div className="mission-grid">
            {visibleActivities.map((activity) => (
              <MissionCard
                activity={activity}
                game={game}
                key={activity.id}
                onStart={() => handleMissionStart(activity)}
              />
            ))}
          </div>
        </section>

        <aside className="panel ship-panel">
          <PanelTitle icon={Rocket} title="Ship Status" />
          <div className={hullPct <= 35 ? 'hull-card low-hull' : 'hull-card'}>
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
                disabled={chainBusy}
                onChange={(event) => commitCombatSettings({ autoRepair: event.currentTarget.checked })}
                type="checkbox"
              />
              Auto-repair
            </label>
            <label>
              Stop Hull
              <input
                max={Math.max(1, game.ship.maxHull - 1)}
                min={1}
                disabled={chainBusy}
                onChange={(event) =>
                  editCombatSettings({ stopAtHull: Number(event.currentTarget.value) })
                }
                onBlur={(event) => commitCombatSettings({ stopAtHull: Number(event.currentTarget.value) })}
                type="number"
                value={game.combatSettings.stopAtHull}
              />
            </label>
            <label>
              Repair Supply
              <select
                disabled={chainBusy}
                onChange={(event) => commitCombatSettings({ repairItemId: event.currentTarget.value as ItemId })}
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
                <div className={`module-slot slot-${slot} ${itemId ? 'filled' : ''}`} key={slot}>
                  <span>{formatModuleSlot(slot)}</span>
                  <strong>{itemId ? ITEMS[itemId].name : 'Empty'}</strong>
                  <em>{itemId ? formatModuleStats(ITEMS[itemId].stats) : 'Offline'}</em>
                  <button
                    disabled={!itemId || chainBusy}
                    onClick={() => handleUnequipModule(slot)}
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
                  disabled={chainBusy || isCurrent || (!game.unlockedSectors[entry.id] && !unlock.canStart)}
                  key={entry.id}
                  onClick={() => handleTravelToSector(entry.id)}
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
                onEquip={() => handleEquipModule(itemId)}
                onRepair={() => handleRepairHull(itemId)}
                onSell={() => handleSellCargoItem(itemId)}
              />
            ))}
          </div>
        </section>

        <section className="panel">
          <PanelTitle icon={ShoppingCart} title="Trade Relay" />
          <div className="trade-list">
            {game.marketOrders.map((order) => (
              <div className="trade-row" key={order.id}>
                <div className="trade-item">
                  <strong>{ITEMS[order.itemId].name}</strong>
                </div>
                <div className="trade-action">
                  <span>{order.quantity} available</span>
                  <button
                    disabled={chainBusy || order.quantity <= 0 || game.cargo.credits < order.unitPrice}
                    onClick={() => handleBuyRelayItem(order.id)}
                    type="button"
                  >
                    Buy <span aria-hidden="true" className="button-divider" /> {order.unitPrice}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <PanelTitle icon={Activity} title="Event Log" />
          <div className="event-log">
            {game.eventLog.map((entry, index) => (
              <p className={`event-${getEventLogKind(entry)}`} key={`${entry}-${index}`}>{entry}</p>
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
      <Icon size={16} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function formatAddress(address: Address): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

interface PanelTitleProps {
  icon: typeof Activity
  title: string
}

function PanelTitle({ icon: Icon, title }: PanelTitleProps) {
  return (
    <div className="panel-title">
      <Icon size={16} />
      <h2>{title}</h2>
    </div>
  )
}

interface MissionCardProps {
  activity: ActivityDefinition
  game: GameState
  onStart: () => void
}

interface RequirementItem {
  detail?: string
  label: string
  tooltip?: string
}

interface RequirementGroup {
  items: RequirementItem[]
  label: string
  tone: 'route' | 'level' | 'cargo' | 'module' | 'ship'
}

function MissionCard({ activity, game, onStart }: MissionCardProps) {
  const status = getActivityStatus(game, activity)
  const requirementGroups = getMissionRequirementGroups(game, activity)
  const Icon = GROUP_ICONS[activity.group]
  const activeMissionId = game.activeMission?.activityId
  const isRunning = activeMissionId === activity.id
  const canSwitchFromActiveMission = Boolean(activeMissionId && !isRunning)
  const canAttemptStart = status.canStart || canSwitchFromActiveMission

  const groupClass = activity.group.toLowerCase()

  return (
    <article className={`mission-card mission-${groupClass} ${isRunning ? 'running' : ''}`}>
      <header>
        <Icon size={16} />
        <div>
          <h3>{activity.name}</h3>
          <span>{getSectorById(activity.sectorId).name} - Tier {activity.tier}</span>
        </div>
        <b className="mission-type">{activity.group}</b>
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
      {!status.canStart && <MissionRequirements fallback={status.reasons} groups={requirementGroups} />}
      <button disabled={!canAttemptStart || isRunning} onClick={onStart} type="button">
        <Play size={16} />
        {isRunning ? 'Running' : canSwitchFromActiveMission ? 'Switch' : 'Start'}
      </button>
    </article>
  )
}

function MissionRequirements({ fallback, groups }: { fallback: string[]; groups: RequirementGroup[] }) {
  if (groups.length === 0) {
    return <small className="mission-requirement-fallback">{fallback.join(' ')}</small>
  }

  return (
    <div aria-label="Mission requirements" className="mission-requirements">
      {groups.map((group) => (
        <div className={`requirement-group req-${group.tone}`} key={group.label}>
          <span>{group.label}</span>
          <ul>
            {group.items.map((item) => (
              <li
                className={item.tooltip ? 'has-tooltip' : undefined}
                data-tooltip={item.tooltip}
                key={`${group.label}-${item.label}-${item.detail ?? ''}`}
                tabIndex={item.tooltip ? 0 : undefined}
                title={item.tooltip}
              >
                <span>{item.label}</span>
                {item.detail && <em>{item.detail}</em>}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
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
  const useTooltip = formatCargoUseTooltip(itemId)

  return (
    <article className="cargo-card">
      <div>
        <strong
          className="cargo-name"
          data-tooltip={useTooltip}
          tabIndex={0}
          title={useTooltip}
        >
          {item.name}
        </strong>
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

function sortMissionActivities(
  activities: ActivityDefinition[],
  selectedGroup: ActivityGroup,
  selectedSkillFilter: MissionSkillFilter,
): ActivityDefinition[] {
  if (selectedSkillFilter !== 'all' || (selectedGroup !== 'Gathering' && selectedGroup !== 'Production')) {
    return activities
  }

  const skillOrder = new Map(SKILLS.map((skill, index) => [skill.id, index]))
  const originalOrder = new Map(ACTIVITIES.map((activity, index) => [activity.id, index]))

  return [...activities].sort((left, right) => {
    const tierDelta = left.tier - right.tier
    if (tierDelta !== 0) return tierDelta

    const skillDelta = (skillOrder.get(left.primarySkill) ?? 0) - (skillOrder.get(right.primarySkill) ?? 0)
    if (skillDelta !== 0) return skillDelta

    return (originalOrder.get(left.id) ?? 0) - (originalOrder.get(right.id) ?? 0)
  })
}

function formatXp(activity: ActivityDefinition): string {
  return Object.entries(activity.xp)
    .map(([skillId, amount]) => `${amount} ${SKILLS.find((skill) => skill.id === skillId)?.name ?? skillId}`)
    .join(', ')
}

function activityMatchesSkill(activity: ActivityDefinition, skillId: SkillId): boolean {
  return activity.primarySkill === skillId || (activity.xp[skillId] ?? 0) > 0
}

function getMissionRequirementGroups(game: GameState, activity: ActivityDefinition): RequirementGroup[] {
  const groups: RequirementGroup[] = []
  const sector = getSectorById(activity.sectorId)
  const routeItems: RequirementItem[] = []

  if (!game.unlockedSectors[activity.sectorId]) {
    routeItems.push({ label: `${sector.name} locked` })
  }

  if (game.currentSectorId !== activity.sectorId) {
    routeItems.push({ label: `Travel to ${sector.name}` })
  }

  if (routeItems.length > 0) {
    groups.push({ items: routeItems, label: 'Route', tone: 'route' })
  }

  const levelItems = (Object.entries(activity.levelReqs) as [SkillId, number][])
    .filter(([skillId, level]) => getSkillLevel(game, skillId) < level)
    .map(([skillId, level]) => ({ label: `Level ${level} ${getSkillName(skillId)}` }))

  if (levelItems.length > 0) {
    groups.push({ items: levelItems, label: 'Level', tone: 'level' })
  }

  const moduleItems: RequirementItem[] = []
  if (activity.requiredModule && !hasItemEquippedOrInCargo(game, activity.requiredModule)) {
    moduleItems.push({ label: ITEMS[activity.requiredModule].name })
  }

  if (activity.combat && !game.ship.modules.hardpoint) {
    moduleItems.push({ label: 'Hardpoint module' })
  }

  if (moduleItems.length > 0) {
    groups.push({ items: moduleItems, label: 'Module', tone: 'module' })
  }

  const shipItems: RequirementItem[] = []
  if (activity.combat && game.ship.currentHull <= 0) {
    shipItems.push({ label: 'Repair hull before combat' })
  }

  if (shipItems.length > 0) {
    groups.push({ items: shipItems, label: 'Ship', tone: 'ship' })
  }

  const cargoItems = (Object.entries(activity.costs ?? {}) as [ItemId, number][])
    .filter(([itemId, amount]) => game.cargo[itemId] < amount)
    .map(([itemId, amount]) => ({
      detail: `have ${game.cargo[itemId]}`,
      label: formatItemQuantity(itemId, amount),
      tooltip: formatCargoSourceTooltip(game, itemId),
    }))

  if (cargoItems.length > 0) {
    groups.push({ items: cargoItems, label: 'Cargo', tone: 'cargo' })
  }

  return groups
}

function hasItemEquippedOrInCargo(game: GameState, itemId: ItemId): boolean {
  const item = ITEMS[itemId]
  return game.cargo[itemId] > 0 || Boolean(item.moduleSlot && game.ship.modules[item.moduleSlot] === itemId)
}

function formatRewards(rewards: Partial<Record<ItemId, number>>): string {
  const entries = Object.entries(rewards)
  if (entries.length === 0) return 'None'

  return entries
    .map(([itemId, amount]) => formatItemQuantity(itemId as ItemId, amount ?? 0))
    .join(', ')
}

function formatModuleStats(stats: ModuleStats = {}): string {
  const labels = [
    ['damage', 'DMG'],
    ['accuracy', 'ACC'],
    ['shielding', 'SHD'],
    ['armor', 'ARM'],
    ['hull', 'HULL'],
    ['speed', 'SPD'],
    ['utility', 'UTIL'],
  ] as const

  const summary = labels
    .filter(([key]) => stats[key])
    .map(([key, label]) => `+${stats[key]} ${label}`)

  return summary.length > 0 ? summary.join(' / ') : 'No stat bonus'
}

function formatCargoSourceTooltip(game: GameState, itemId: ItemId): string {
  const item = ITEMS[itemId]
  const sources: string[] = []
  const activitySources = ACTIVITIES.filter((activity) => (activity.rewards[itemId] ?? 0) > 0)
  const relayOrder = game.marketOrders.find((order) => order.itemId === itemId && order.quantity > 0)

  if (activitySources.length > 0) {
    sources.push(`Obtain from ${formatActivitySourceList(activitySources, itemId)}.`)
  }

  if (relayOrder) {
    sources.push(`Trade Relay: ${relayOrder.quantity} available at ${relayOrder.unitPrice} Credits each.`)
  }

  return sources.length > 0 ? sources.join(' ') : `No current source listed. ${item.description}`
}

function formatActivitySourceList(activities: ActivityDefinition[], itemId: ItemId): string {
  const entries = activities
    .filter((activity) => (activity.rewards[itemId] ?? 0) > 0)
    .slice(0, 4)
    .map((activity) => `${activity.name} (${getSectorById(activity.sectorId).name})`)

  if (activities.length > 4) {
    entries.push(`+${activities.length - 4} more`)
  }

  return entries.join(', ')
}

function formatCargoUseTooltip(itemId: ItemId): string {
  const item = ITEMS[itemId]
  const uses: string[] = []

  if (itemId === 'credits') {
    uses.push('Spend on Trade Relay orders and sector unlocks.')
  }

  if (item.kind === 'module' && item.moduleSlot) {
    uses.push(`Install in ${formatModuleSlot(item.moduleSlot)}: ${formatModuleStats(item.stats)}.`)
  }

  if (item.kind === 'repair' && item.repairAmount) {
    uses.push(`Repair supply: restores ${item.repairAmount} hull manually or through auto-repair.`)
  }

  if (item.kind === 'ammo') {
    uses.push(
      item.ammoDamage
        ? `Ammunition payload: adds ${item.ammoDamage} damage when consumed by combat missions.`
        : 'Ammunition stockpile for combat loadouts.',
    )
  }

  const recipeUses = ACTIVITIES.filter((activity) => (activity.costs?.[itemId] ?? 0) > 0)
  if (recipeUses.length > 0) {
    uses.push(`Recipe input for ${formatActivityUseList(recipeUses)}.`)
  }

  const moduleRequirements = ACTIVITIES.filter((activity) => activity.requiredModule === itemId)
  if (moduleRequirements.length > 0) {
    uses.push(`Required module for ${formatActivityUseList(moduleRequirements)}.`)
  }

  const ammoRequirements = ACTIVITIES.filter((activity) => activity.combat?.requiredAmmo === itemId)
  if (ammoRequirements.length > 0) {
    uses.push(`Required ammo for ${formatActivityUseList(ammoRequirements)}.`)
  }

  if (item.tradable && itemId !== 'credits') {
    uses.push(`Can be sold to the Trade Relay for ${Math.max(1, Math.floor(item.baseValue * 0.6))} Credits.`)
  }

  return uses.length > 0 ? uses.join(' ') : item.description
}

function formatActivityUseList(activities: ActivityDefinition[]): string {
  const names = activities.map((activity) => activity.name)
  if (names.length <= 4) return names.join(', ')

  return `${names.slice(0, 4).join(', ')} +${names.length - 4} more`
}

function getEventLogKind(entry: string): string {
  const activity = ACTIVITIES.find((candidate) => entry.startsWith(`${candidate.name}:`))
  if (activity) return activity.group.toLowerCase()

  const normalized = entry.toLowerCase()
  if (normalized.includes('hull failure') || normalized.includes('depleted') || normalized.includes('safety')) {
    return 'danger'
  }
  if (normalized.includes('bought') || normalized.includes('sold') || normalized.includes('trade relay')) {
    return 'market'
  }
  if (
    normalized.includes('installed') ||
    normalized.includes('removed') ||
    normalized.includes('restored') ||
    normalized.includes('ship routed') ||
    normalized.includes('mission')
  ) {
    return 'ship'
  }
  return 'system'
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
