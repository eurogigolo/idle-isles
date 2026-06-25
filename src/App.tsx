import {
  Activity,
  Box,
  CircleDollarSign,
  Compass,
  Copy,
  Crosshair,
  Factory,
  Gauge,
  Landmark,
  Package,
  Play,
  Rocket,
  Shield,
  ShoppingCart,
  Sparkles,
  Square,
  Wallet,
  Wrench,
  Zap,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { GameScene } from './GameScene'
import { GridBossBattle, type GridBossResult } from './GridBossBattle'
import {
  formatBossModifierSummary,
  getBossBattleModifiers,
  getEquippedBossModuleNames,
  getSectorBoss,
  type BossBattleModifiers,
  type SectorBoss,
} from './bosses'
import type { Address } from './chain'
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
type MissionTab = ActivityGroup | 'Boss'
const MISSION_TABS: MissionTab[] = [...GROUPS, 'Boss']
type MissionSkillFilter = SkillId | 'all'
type WalletMode = 'injected' | 'moss'
type ChainModule = typeof import('./chain')

let chainModulePromise: Promise<ChainModule> | null = null

function loadChain(): Promise<ChainModule> {
  chainModulePromise ??= import('./chain')
  return chainModulePromise
}

function isChainModeConfigured(): boolean {
  return Boolean(readEnvAddress('VITE_IDLE_GALACTICA_ADDRESS') && readEnvAddress('VITE_TRADE_RELAY_ADDRESS'))
}

function readEnvAddress(key: string): Address | null {
  const value = import.meta.env[key]
  return typeof value === 'string' && /^0x[a-fA-F0-9]{40}$/.test(value) ? (value as Address) : null
}

const GROUP_ICONS: Record<ActivityGroup, typeof Activity> = {
  Gathering: Compass,
  Production: Factory,
  Combat: Crosshair,
}
const MISSION_TAB_ICONS: Record<MissionTab, typeof Activity> = {
  ...GROUP_ICONS,
  Boss: Sparkles,
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
const CHAIN_CLAIM_CYCLE_CAP: Record<ActivityGroup, number> = {
  Gathering: 1000,
  Production: 1000,
  Combat: 200,
}
const MOSS_MAX_CLAIM_BATCH_CALLS = 5
const GRID_BOSS_COST = 1
const MOSS_GAMEPLAY_SESSION_TOOLTIP =
  'Allows MOSS to submit approved game actions for 24 hours without repeated popups: mission actions, repairs, combat settings, sector travel, boss encounters, and Trade Relay listings. First-time Trade Relay escrow approval may still ask for confirmation.'

function formatCreditAmount(amount: number) {
  return `${amount.toLocaleString()} ${amount === 1 ? 'Credit' : 'Credits'}`
}

function App() {
  const [game, setGame] = useState<GameState>(() => loadGame())
  const [selectedTab, setSelectedTab] = useState<MissionTab>('Gathering')
  const [selectedSkillFilters, setSelectedSkillFilters] = useState<Record<ActivityGroup, MissionSkillFilter>>({
    Gathering: 'all',
    Production: 'all',
    Combat: 'all',
  })
  const [now, setNow] = useState(() => Date.now())
  const [chainMode, setChainMode] = useState(false)
  const [walletMode, setWalletMode] = useState<WalletMode>('moss')
  const [chainAccount, setChainAccount] = useState<Address | null>(null)
  const [chainHasProfile, setChainHasProfile] = useState(false)
  const [chainBusy, setChainBusy] = useState(false)
  const [mossReady, setMossReady] = useState(false)
  const [mossSessionReady, setMossSessionReady] = useState(false)
  const [chainBossEncounterCost, setChainBossEncounterCost] = useState<number | null>(null)
  const [bossBattleId, setBossBattleId] = useState<number | null>(null)
  const [notice, setNotice] = useState(() =>
    isChainModeConfigured()
      ? 'Local v2 simulation active. Chain mode is available.'
      : 'Local v2 simulation active. Configure v2 contract addresses to enable Chain mode.',
  )
  const chainReady = isChainModeConfigured()

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!chainMode) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(game))
    }
  }, [chainMode, game])

  useEffect(() => {
    if (walletMode !== 'moss') return

    let cancelled = false

    async function prepareMoss() {
      try {
        const chain = await loadChain()
        await chain.initialiseMossWallet()
        const status = await chain.getMossWalletStatus()
        if (cancelled) return

        setMossReady(true)
        if (status.status === 'connected') {
          const address = chain.toAddress(status.address)
          setChainAccount(address)
          setMossSessionReady(address ? await chain.hasMossGameplaySession(address) : false)
        } else {
          setMossSessionReady(false)
        }
      } catch (error) {
        if (!cancelled) {
          setMossReady(false)
          setMossSessionReady(false)
          setNotice(error instanceof Error ? error.message : 'MOSS wallet failed to initialize.')
        }
      }
    }

    void prepareMoss()

    return () => {
      cancelled = true
    }
  }, [walletMode])

  const activeActivity = game.activeMission ? getActivityById(game.activeMission.activityId) : null
  const preview = useMemo(() => getClaimPreview(game, now), [game, now])
  const claimBatchCount =
    chainMode && walletMode === 'moss' ? getMossClaimBatchCount(activeActivity, preview.cycles) : 1
  const sector = getSectorById(game.currentSectorId)
  const sectorBoss = getSectorBoss(game.currentSectorId)
  const bossModifiers = useMemo(() => getBossBattleModifiers(game), [game])
  const bossModifierSummary = formatBossModifierSummary(bossModifiers)
  const equippedBossModuleNames = getEquippedBossModuleNames(game)
  const selectedGroup = selectedTab === 'Boss' ? 'Combat' : selectedTab
  const isBossTab = selectedTab === 'Boss'
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
  const bossEncounterCost = chainBossEncounterCost ?? GRID_BOSS_COST

  function setMissionSkillFilter(filter: MissionSkillFilter) {
    if (isBossTab) return
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

  function handleLocalMode() {
    if (!chainMode) {
      setNotice('Local v2 simulation active.')
      return
    }

    setChainMode(false)
    setChainHasProfile(false)
    setMossSessionReady(false)
    setChainBossEncounterCost(null)
    setGame(loadGame())
    setNotice('Local v2 simulation active.')
  }

  async function handleChainMode() {
    if (chainMode) return
    if (!chainReady) {
      setNotice('Set VITE_IDLE_GALACTICA_ADDRESS and VITE_TRADE_RELAY_ADDRESS before using Chain mode.')
      return
    }

    await connectAndSync()
  }

  function selectWalletMode(nextMode: WalletMode) {
    if (nextMode === walletMode) return

    setWalletMode(nextMode)
    setChainAccount(null)
    setChainHasProfile(false)
    setMossSessionReady(false)
    setChainBossEncounterCost(null)
    if (nextMode === 'injected') {
      setMossReady(false)
    }
    setNotice(nextMode === 'moss' ? 'MOSS selected.' : 'MetaMask selected.')
  }

  async function connectAndSync() {
    if (chainBusy) return
    setChainBusy(true)
    try {
      const account = await connectSelectedWallet()
      setChainAccount(account)
      setChainMode(true)
      await syncChain(account, 'Chain mode synced.')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Wallet connection failed.')
    } finally {
      setChainBusy(false)
    }
  }

  async function connectSelectedWallet(): Promise<Address> {
    const chain = await loadChain()
    if (walletMode === 'moss') {
      const account = await chain.connectMossWallet()
      if (!account) throw new Error('MOSS connection cancelled.')
      setMossReady(true)
      setMossSessionReady(await chain.hasMossGameplaySession(account))
      return account
    }

    return chain.connectWallet()
  }

  async function syncChain(account = chainAccount, success = 'Chain state synced.') {
    if (!account) {
      await connectAndSync()
      return
    }

    const chain = await loadChain()
    const [snapshot, bossCost] = await Promise.all([
      chain.readChainSnapshot(account),
      chain.readBossEncounterCost(),
    ])
    setGame(snapshot.game)
    setChainHasProfile(snapshot.hasProfile)
    setChainBossEncounterCost(bossCost)
    setNotice(
      snapshot.hasProfile
        ? `${success} Block ${snapshot.blockNumber.toString()}.`
        : 'No on-chain profile found. Create a ship profile to begin.',
    )
  }

  async function runChainAction(action: (account: Address) => Promise<unknown>, success: string) {
    if (chainBusy) return
    if (!chainReady) {
      setNotice('Chain mode is not configured.')
      return
    }

    let account = chainAccount
    setChainBusy(true)
    try {
      if (!account) {
        account = await connectSelectedWallet()
        setChainAccount(account)
      }
      await action(account)
      if (walletMode === 'moss') {
        const chain = await loadChain()
        setMossSessionReady(await chain.hasMossGameplaySession(account))
      }
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

  async function repairChainHullForCombatIfNeeded(
    chain: ChainModule,
    activity: ActivityDefinition | null,
  ): Promise<boolean> {
    const repairPlan = getChainCombatRepairPlan(activity)
    if (repairPlan <= 0) return false

    for (let repairIndex = 0; repairIndex < repairPlan; repairIndex += 1) {
      if (walletMode === 'moss') {
        await chain.writeMossRepairHull(game.combatSettings.repairItemId)
      } else {
        await chain.writeRepairHull(game.combatSettings.repairItemId)
      }
    }

    return true
  }

  function getChainCombatRepairPlan(activity: ActivityDefinition | null): number {
    const repairItem = ITEMS[game.combatSettings.repairItemId]
    const repairAmount = repairItem.repairAmount ?? 0

    if (
      activity?.group !== 'Combat' ||
      !game.combatSettings.autoRepair ||
      game.combatSettings.maxRepairItemsPerClaim <= 0 ||
      game.ship.currentHull <= 0 ||
      game.ship.currentHull > game.combatSettings.stopAtHull ||
      game.ship.currentHull >= game.ship.maxHull ||
      game.cargo[game.combatSettings.repairItemId] <= 0 ||
      repairAmount <= 0
    ) {
      return 0
    }

    let hull = game.ship.currentHull
    let available = game.cargo[game.combatSettings.repairItemId]
    let repairs = 0
    while (
      hull <= game.combatSettings.stopAtHull &&
      hull < game.ship.maxHull &&
      available > 0 &&
      repairs < game.combatSettings.maxRepairItemsPerClaim
    ) {
      repairs += 1
      available -= 1
      hull = Math.min(game.ship.maxHull, hull + repairAmount)
    }

    return repairs
  }

  function handleMissionStart(activity: ActivityDefinition) {
    if (chainMode) {
      if (!requireChainProfile()) return
      const shouldClaimBeforeSwitch =
        walletMode === 'moss' &&
        Boolean(activeActivity) &&
        game.activeMission?.activityId !== activity.id &&
        preview.cycles > 0
      const switchWillClearBacklog =
        !shouldClaimBeforeSwitch ||
        preview.cycles <= getClaimCycleCapacity(activeActivity, claimBatchCount)

      void runChainAction(
        async () => {
          const chain = await loadChain()
          const settlementActivity = activeActivity && preview.cycles > 0 ? activeActivity : null
          await repairChainHullForCombatIfNeeded(chain, settlementActivity)
          if (settlementActivity?.group !== 'Combat' && activity.group === 'Combat') {
            await repairChainHullForCombatIfNeeded(chain, activity)
          }

          if (walletMode === 'moss') {
            if (shouldClaimBeforeSwitch) {
              await chain.writeMossClaimMissionBatch(claimBatchCount)
              if (!switchWillClearBacklog) return
            }
            return chain.writeMossStartMission(activity.id)
          }

          return chain.writeStartMission(activity.id)
        },
        getMissionStartSuccessMessage(Boolean(game.activeMission), shouldClaimBeforeSwitch, switchWillClearBacklog, claimBatchCount),
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
      void runChainAction(
        async () => {
          const chain = await loadChain()
          await repairChainHullForCombatIfNeeded(chain, activeActivity)
          return walletMode === 'moss'
            ? chain.writeMossClaimMissionBatch(claimBatchCount)
            : chain.writeClaimMission()
        },
        claimBatchCount > 1 ? `Submitted ${claimBatchCount} claim batches.` : 'Mission cycles claimed.',
      )
      return
    }

    runAction(() => applyClaim(game), 'Mission cycles claimed.')
  }

  function handleStopMission() {
    if (chainMode) {
      if (!requireChainProfile()) return
      const shouldClaimBeforeStop = walletMode === 'moss' && Boolean(activeActivity) && preview.cycles > 0
      const stopWillClearBacklog =
        !shouldClaimBeforeStop ||
        preview.cycles <= getClaimCycleCapacity(activeActivity, claimBatchCount)

      void runChainAction(
        async () => {
          const chain = await loadChain()
          if (preview.cycles > 0) {
            await repairChainHullForCombatIfNeeded(chain, activeActivity)
          }

          if (walletMode === 'moss') {
            if (shouldClaimBeforeStop) {
              await chain.writeMossClaimMissionBatch(claimBatchCount)
              if (!stopWillClearBacklog) return
            }
            return chain.writeMossStopMission()
          }

          return chain.writeStopMission()
        },
        getMissionStopSuccessMessage(shouldClaimBeforeStop, stopWillClearBacklog, claimBatchCount),
      )
      return
    }

    runAction(() => stopActivity(game))
  }

  function handleEquipModule(itemId: ItemId) {
    if (chainMode) {
      if (!requireChainProfile()) return
      void runChainAction(
        async () => {
          const chain = await loadChain()
          return walletMode === 'moss' ? chain.writeMossEquipModule(itemId) : chain.writeEquipModule(itemId)
        },
        `${ITEMS[itemId].name} installed.`,
      )
      return
    }

    runAction(() => equipModule(game, itemId))
  }

  function handleUnequipModule(slot: ModuleSlot) {
    if (chainMode) {
      if (!requireChainProfile()) return
      void runChainAction(
        async () => {
          const chain = await loadChain()
          return walletMode === 'moss' ? chain.writeMossUnequipModule(slot) : chain.writeUnequipModule(slot)
        },
        `${formatModuleSlot(slot)} module removed.`,
      )
      return
    }

    runAction(() => unequipModule(game, slot))
  }

  function handleRepairHull(itemId: ItemId) {
    if (chainMode) {
      if (!requireChainProfile()) return
      void runChainAction(
        async () => {
          const chain = await loadChain()
          return walletMode === 'moss' ? chain.writeMossRepairHull(itemId) : chain.writeRepairHull(itemId)
        },
        `${ITEMS[itemId].name} used.`,
      )
      return
    }

    runAction(() => applyRepairSupply(game, itemId))
  }

  function handleTravelToSector(sectorId: SectorId) {
    if (chainMode) {
      if (!requireChainProfile()) return
      void runChainAction(
        async () => {
          const chain = await loadChain()
          return walletMode === 'moss'
            ? chain.writeMossTravelToSector(sectorId)
            : chain.writeTravelToSector(sectorId)
        },
        `Ship routed to ${getSectorById(sectorId).name}.`,
      )
      return
    }

    runAction(() => travelToSector(game, sectorId))
  }

  function handleBuyRelayItem(orderId: string) {
    if (chainMode) {
      if (!requireChainProfile()) return
      void runChainAction(
        async (account) => {
          const chain = await loadChain()
          return walletMode === 'moss'
            ? chain.writeMossBuyTradeRelayOrder(account, orderId)
            : chain.writeBuyTradeRelayOrder(orderId)
        },
        'Trade Relay order filled.',
      )
      return
    }

    runAction(() => buyRelayItem(game, orderId))
  }

  function handleSellCargoItem(itemId: ItemId) {
    if (chainMode) {
      if (!requireChainProfile()) return
      const unitPrice = Math.max(1, Math.floor(ITEMS[itemId].baseValue * 0.6))
      void runChainAction(
        async (account) => {
          const chain = await loadChain()
          return walletMode === 'moss'
            ? chain.writeMossCreateTradeRelayOrder(account, itemId, unitPrice)
            : chain.writeCreateTradeRelayOrder(itemId, unitPrice)
        },
        `${ITEMS[itemId].name} listed on the Trade Relay.`,
      )
      return
    }

    runAction(() => sellCargoItem(game, itemId))
  }

  function handleBossFight() {
    if (!chainMode) {
      setNotice('Switch to Chain Mode before starting a Grid Boss Encounter.')
      return
    }
    if (!requireChainProfile()) return
    if (chainBossEncounterCost === null) {
      setNotice('The configured game contract does not support Grid Boss Encounters yet.')
      return
    }
    if (game.cargo.credits < bossEncounterCost) {
      setNotice(`${formatCreditAmount(bossEncounterCost)} required for a Grid Boss Encounter.`)
      return
    }

    void runChainAction(
      async () => {
        const chain = await loadChain()
        const hash =
          walletMode === 'moss'
            ? await chain.writeMossStartBossEncounter()
            : await chain.writeStartBossEncounter()
        setBossBattleId(Date.now())
        return hash
      },
      `${formatCreditAmount(bossEncounterCost)} spent. Grid Boss Encounter initialized.`,
    )
  }

  function handleBossBattleComplete(result: GridBossResult) {
    setBossBattleId(null)
    setNotice(
      result === 'win'
        ? 'Grid Boss Encounter complete. Returned to command.'
        : 'Grid Boss Encounter ended. Returned to command.',
    )
  }

  function editCombatSettings(patch: Partial<CombatSettings>) {
    setGame(updateCombatSettings(game, patch))
  }

  function commitCombatSettings(patch: Partial<CombatSettings>) {
    const nextGame = updateCombatSettings(game, patch)
    setGame(nextGame)

    if (chainMode) {
      if (!requireChainProfile()) return
      void runChainAction(
        async () => {
          const chain = await loadChain()
          return walletMode === 'moss'
            ? chain.writeMossCombatSettings(nextGame.combatSettings)
            : chain.writeCombatSettings(nextGame.combatSettings)
        },
        'Combat settings updated.',
      )
    }
  }

  async function enableMossGameplaySession() {
    if (walletMode !== 'moss') {
      setNotice('Select MOSS first.')
      return
    }
    if (!chainAccount) {
      setNotice('Connect MOSS first.')
      return
    }
    if (chainBusy) return

    setChainBusy(true)
    try {
      const chain = await loadChain()
      await chain.grantMossGameplaySession()
      setMossSessionReady(await chain.hasMossGameplaySession(chainAccount))
      setNotice('MOSS gameplay session ready for 24 hours.')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'MOSS gameplay session was not approved.')
    } finally {
      setChainBusy(false)
    }
  }

  async function fundMossWallet() {
    if (walletMode !== 'moss') {
      setNotice('Select MOSS first.')
      return
    }

    try {
      const chain = await loadChain()
      await chain.openMossDeposit()
      setNotice('MOSS funding screen opened.')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to open MOSS funding.')
    }
  }

  async function handleNetworkAction() {
    if (walletMode === 'moss') {
      setNotice('MOSS uses MegaETH Testnet.')
      return
    }

    try {
      const chain = await loadChain()
      await chain.addMegaEthTestnet()
      setNotice('MegaETH Testnet added or selected in wallet.')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to add MegaETH Testnet.')
    }
  }

  async function copyAccountAddress() {
    if (!chainAccount) return

    try {
      await navigator.clipboard.writeText(chainAccount)
      setNotice('Wallet address copied.')
    } catch {
      setNotice(chainAccount)
    }
  }

  return (
    <main className="app-shell">
      {bossBattleId !== null && (
        <GridBossBattle
          boss={sectorBoss}
          key={bossBattleId}
          modifiers={bossModifiers}
          onComplete={handleBossBattleComplete}
        />
      )}
      <header className="topbar">
        <div>
          <p className="eyebrow">On-chain space idle RPG</p>
          <h1>Idle Galactica</h1>
        </div>
        <div className="chain-controls">
          <div className="play-mode-switch" aria-label="Play mode">
            <button
              className={!chainMode ? 'selected' : ''}
              disabled={chainBusy}
              onClick={handleLocalMode}
              type="button"
            >
              Local Mode
            </button>
            <button
              className={chainMode ? 'selected' : ''}
              disabled={chainBusy || !chainReady}
              onClick={() => void handleChainMode()}
              type="button"
            >
              Chain Mode
            </button>
          </div>
          {chainMode && (
            <div className="wallet-mode-switch" aria-label="Wallet mode">
              <button
                className={walletMode === 'injected' ? 'selected' : ''}
                disabled={chainBusy}
                onClick={() => selectWalletMode('injected')}
                type="button"
              >
                MetaMask
              </button>
              <button
                className={walletMode === 'moss' ? 'selected' : ''}
                disabled={chainBusy}
                onClick={() => selectWalletMode('moss')}
                type="button"
              >
                MOSS
              </button>
            </div>
          )}
          {chainMode && (
            <button disabled={chainBusy} onClick={() => void connectAndSync()} type="button">
              <Wallet size={16} />
              {chainAccount ? formatAddress(chainAccount) : walletMode === 'moss' ? 'Connect MOSS' : 'Connect'}
            </button>
          )}
          {chainMode && chainAccount && (
            <button
              disabled={chainBusy}
              onClick={() => void copyAccountAddress()}
              title={chainAccount}
              type="button"
            >
              <Copy size={16} />
              Copy
            </button>
          )}
          {chainMode && walletMode === 'moss' && (
            <button disabled={chainBusy || !mossReady} onClick={() => void fundMossWallet()} type="button">
              <CircleDollarSign size={16} />
              Fund MOSS
            </button>
          )}
          {chainMode && (
            <button disabled={chainBusy} onClick={() => void handleNetworkAction()} type="button">
              <Landmark size={16} />
              {walletMode === 'moss' ? 'MOSS Testnet' : 'MegaETH'}
            </button>
          )}
          {chainMode && walletMode === 'moss' && (
            <button
              aria-label={MOSS_GAMEPLAY_SESSION_TOOLTIP}
              className={mossSessionReady ? 'selected tooltip-button' : 'tooltip-button'}
              data-tooltip={MOSS_GAMEPLAY_SESSION_TOOLTIP}
              disabled={chainBusy || !chainAccount || !mossReady}
              onClick={() => void enableMossGameplaySession()}
              type="button"
            >
              <Sparkles size={16} />
              {mossSessionReady ? 'Session Ready' : 'Enable Gameplay Session'}
            </button>
          )}
          {chainMode && chainAccount && !chainHasProfile && (
            <button
              disabled={chainBusy}
              onClick={() =>
                void runChainAction(
                  async () => {
                    const chain = await loadChain()
                    return walletMode === 'moss' ? chain.writeMossCreateProfile() : chain.writeCreateProfile()
                  },
                  'Ship profile created.',
                )
              }
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
                  Claim {formatClaimButtonSuffix(preview.cycles, claimBatchCount)}
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
            <PanelTitle icon={MISSION_TAB_ICONS[selectedTab]} title="Missions" />
            <div className="segmented">
              {MISSION_TABS.map((tab) => (
                <button
                  className={selectedTab === tab ? 'selected' : ''}
                  key={tab}
                  onClick={() => setSelectedTab(tab)}
                  type="button"
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {isBossTab ? (
            <BossEncounterPanel
              boss={sectorBoss}
              bossModifiers={bossModifiers}
              chainMode={chainMode}
              chainBusy={chainBusy}
              cost={bossEncounterCost}
              contractReady={chainBossEncounterCost !== null}
              credits={game.cargo.credits}
              equippedModules={equippedBossModuleNames}
              hasProfile={chainHasProfile}
              modifierSummary={bossModifierSummary}
              sectorName={sector.name}
              onFight={handleBossFight}
            />
          ) : (
            <>
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
            </>
          )}
        </section>

        <aside className="panel ship-panel">
          <PanelTitle icon={Rocket} title="Ship Status" />
          <div className="ship-summary">
            <StatPill icon={CircleDollarSign} label="Credits" value={game.cargo.credits.toLocaleString()} />
            <StatPill icon={Shield} label="Hull" value={`${Math.ceil(game.ship.currentHull)}/${game.ship.maxHull}`} />
            <StatPill icon={Rocket} label="Sector" value={sector.name} />
          </div>
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
              Auto-repair during combat
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

function getMossClaimBatchCount(activity: ActivityDefinition | null, pendingCycles: number): number {
  if (!activity || pendingCycles <= 0) return 1

  return Math.max(
    1,
    Math.min(MOSS_MAX_CLAIM_BATCH_CALLS, Math.ceil(pendingCycles / getClaimCycleCap(activity))),
  )
}

function getClaimCycleCapacity(activity: ActivityDefinition | null, claimBatchCount: number): number {
  return activity ? getClaimCycleCap(activity) * claimBatchCount : 0
}

function getClaimCycleCap(activity: ActivityDefinition): number {
  return CHAIN_CLAIM_CYCLE_CAP[activity.group]
}

function formatClaimButtonSuffix(pendingCycles: number, claimBatchCount: number): string {
  if (pendingCycles <= 0) return ''
  return claimBatchCount > 1 ? `x${claimBatchCount} (${pendingCycles})` : `(${pendingCycles})`
}

function formatClaimBatchLabel(claimBatchCount: number): string {
  return claimBatchCount === 1 ? 'batch' : 'batches'
}

function getMissionStartSuccessMessage(
  hadActiveMission: boolean,
  claimedBeforeSwitch: boolean,
  backlogCleared: boolean,
  claimBatchCount: number,
): string {
  if (claimedBeforeSwitch && !backlogCleared) {
    return `Submitted ${claimBatchCount} claim ${formatClaimBatchLabel(claimBatchCount)}. More backlog remains before switching.`
  }
  if (claimedBeforeSwitch) return 'Pending cycles claimed. Mission switched.'
  return hadActiveMission ? 'Pending cycles settled. Mission switched.' : 'Mission started.'
}

function getMissionStopSuccessMessage(
  claimedBeforeStop: boolean,
  backlogCleared: boolean,
  claimBatchCount: number,
): string {
  if (claimedBeforeStop && !backlogCleared) {
    return `Submitted ${claimBatchCount} claim ${formatClaimBatchLabel(claimBatchCount)}. More backlog remains before stopping.`
  }
  return claimedBeforeStop ? 'Pending cycles claimed. Mission stopped.' : 'Mission stopped.'
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

interface BossEncounterPanelProps {
  boss: SectorBoss
  bossModifiers: BossBattleModifiers
  chainBusy: boolean
  chainMode: boolean
  contractReady: boolean
  cost: number
  credits: number
  equippedModules: string[]
  hasProfile: boolean
  modifierSummary: string
  onFight: () => void
  sectorName: string
}

function BossEncounterPanel({
  boss,
  bossModifiers,
  chainBusy,
  chainMode,
  contractReady,
  cost,
  credits,
  equippedModules,
  hasProfile,
  modifierSummary,
  onFight,
  sectorName,
}: BossEncounterPanelProps) {
  const hasEnoughCredits = credits >= cost
  const disabled = chainBusy || !chainMode || !contractReady || !hasProfile || !hasEnoughCredits
  const formattedCost = formatCreditAmount(cost)
  const moduleSummary =
    equippedModules.length > 0 ? equippedModules.join(', ') : 'Install ship modules to gain boss-fight bonuses.'

  return (
    <article className="boss-encounter-card">
      <header>
        <Sparkles size={18} />
        <div>
          <h3>{boss.name}</h3>
          <span>{boss.subtitle} - {sectorName}</span>
        </div>
        <b>{formattedCost}</b>
      </header>
      <p>
        {boss.description} Spend Credits on-chain to open a real-time 3 by 6 grid duel.
        Your ship holds the left three columns while the boss controls the right side.
      </p>
      <div className="boss-encounter-rules">
        {boss.mechanics.map((mechanic) => (
          <span key={mechanic}>{mechanic}</span>
        ))}
        <span>Move: WASD / Arrow keys</span>
        <span>Fire: Space / Enter</span>
        <span>No rewards or loss penalties in this MVP</span>
      </div>
      <div className="boss-encounter-modifiers">
        <span>Equipped modules: {moduleSummary}</span>
        <strong>{modifierSummary}</strong>
        {bossModifiers.labels.length === 0 && <small>Hardpoints, shields, plating, engines, sensors, and utility modules all help here.</small>}
      </div>
      <button disabled={disabled} onClick={onFight} type="button">
        <Crosshair size={16} />
        Fight
      </button>
      {!chainMode && <small>Chain Mode required for the {formattedCost} transaction.</small>}
      {chainMode && !contractReady && <small>Fresh boss encounter contract deployment required.</small>}
      {chainMode && !hasProfile && <small>Create an on-chain ship profile first.</small>}
      {chainMode && contractReady && hasProfile && !hasEnoughCredits && (
        <small>
          {formattedCost} required. Current balance: {formatCreditAmount(credits)}.
        </small>
      )}
    </article>
  )
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
    uses.push(`Repair supply: restores ${item.repairAmount} hull manually or through auto-repair during combat.`)
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
