import { useEffect, useMemo, useState } from 'react'
import {
  Axe,
  CircleDollarSign,
  Clock,
  Coins,
  Fish,
  Flame,
  Gem,
  Hammer,
  Heart,
  Landmark,
  MapPinned,
  Package,
  Pickaxe,
  Plus,
  Shield,
  Ship,
  ShipWheel,
  ShoppingCart,
  Sparkles,
  Swords,
  TreePine,
  Wallet,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Address } from 'viem'
import {
  ACTIVITIES,
  ACTIVITY_BY_ID,
  AREAS,
  AREA_BY_ID,
  EQUIPMENT_SLOTS,
  type ActivityDefinition,
  type ActivityGroup,
  type ActivityId,
  type AreaId,
  type ClaimPreview,
  type GameState,
  type ItemId,
  ITEMS,
  LEGACY_STORAGE_KEYS,
  MARKET_CATEGORIES,
  type MarketCategory,
  MARKET_ROWS,
  MARKET_ITEMS,
  normalizeState,
  SKILLS,
  type SkillId,
  STORAGE_KEY,
  applyClaim,
  createInitialState,
  eatFood,
  formatDuration,
  getMarketCategory,
  getActivityLock,
  getActivityLocks,
  getBurnChance,
  getClaimPreview,
  getEquipmentStats,
  getFoodItems,
  getActivityAreaId,
  getItemSources,
  getItemUses,
  getMaxHitpoints,
  isAreaUnlocked,
  levelFromXp,
  skillProgress,
  summarizePreview,
  travelToArea,
} from './game'
import {
  MEGAETH_CHAIN_ID_HEX,
  MEGAETH_TESTNET_PARAMS,
  type BrowserEthereumProvider,
  type ChainSnapshot,
  getContractActivity,
  getChainOrderId,
  getIdleIslesAddress,
  readChainSnapshot,
  toAddress,
  writeBuyOrder,
  writeCancelOrder,
  writeClaim,
  writeCreateOrder,
  writeCreateProfile,
  writeEatFood,
  writeEquip,
  writeStartActivity,
  writeUnequip,
} from './chain'
import './App.css'

declare global {
  interface Window {
    ethereum?: BrowserEthereumProvider
  }
}

const SKILL_ICONS: Record<SkillId, LucideIcon> = {
  attack: Swords,
  defence: Shield,
  hitpoints: Heart,
  woodcutting: Axe,
  fishing: Fish,
  mining: Pickaxe,
  smithing: Hammer,
  cooking: Flame,
  crafting: Package,
}

const ITEM_ICONS: Record<ItemId, LucideIcon> = {
  crowns: Coins,
  ashLog: TreePine,
  pineLog: TreePine,
  oakLog: TreePine,
  ironbarkLog: TreePine,
  elderLog: TreePine,
  spiritwoodLog: TreePine,
  rawMinnow: Fish,
  cookedMinnow: Fish,
  rawTrout: Fish,
  cookedTrout: Fish,
  rawCod: Fish,
  cookedCod: Fish,
  rawTuna: Fish,
  cookedTuna: Fish,
  rawManta: Fish,
  cookedManta: Fish,
  rawLeviathan: Fish,
  cookedLeviathan: Fish,
  treantBark: TreePine,
  hollowSeed: Sparkles,
  copperOre: Pickaxe,
  tinOre: Pickaxe,
  ironOre: Pickaxe,
  coalOre: Pickaxe,
  cobaltOre: Pickaxe,
  tungstenOre: Pickaxe,
  bronzeBar: Hammer,
  ironBar: Hammer,
  steelBar: Hammer,
  tungstenBar: Hammer,
  woodClub: Swords,
  barkShield: Shield,
  barkVest: Shield,
  barkLeggings: Shield,
  copperDagger: Swords,
  copperHelm: Shield,
  copperPlate: Shield,
  copperLegs: Shield,
  ironSword: Swords,
  ironHelm: Shield,
  ironPlate: Shield,
  ironLegs: Shield,
  steelLongsword: Swords,
  steelHelm: Shield,
  steelPlate: Shield,
  steelLegs: Shield,
  tungstenBlade: Swords,
  tungstenHelm: Shield,
  tungstenPlate: Shield,
  tungstenLegs: Shield,
  tannedHide: Package,
  thickHide: Package,
  ruggedHide: Package,
  cobaltScale: Gem,
  wyrmHide: Package,
  leatherCowl: Shield,
  leatherBody: Shield,
  leatherChaps: Shield,
  hardleatherCowl: Shield,
  hardleatherBody: Shield,
  hardleatherChaps: Shield,
  carapaceCowl: Shield,
  carapaceBody: Shield,
  carapaceLegs: Shield,
  cobaltMeshCowl: Shield,
  cobaltMeshBody: Shield,
  cobaltMeshLegs: Shield,
  dragonhideCowl: Shield,
  dragonhideBody: Shield,
  dragonhideChaps: Shield,
  fieldCharm: Sparkles,
  runeDust: Gem,
}

const GROUPS: ActivityGroup[] = ['Gather', 'Combat', 'Artisan']
type ActivitySubtabGroup = Extract<ActivityGroup, 'Gather' | 'Artisan'>
const ACTIVITY_SUBTABS: Record<ActivitySubtabGroup, SkillId[]> = {
  Gather: ['woodcutting', 'fishing', 'mining'],
  Artisan: ['smithing', 'crafting', 'cooking'],
}
const SKILL_NAMES = Object.fromEntries(
  SKILLS.map((skill) => [skill.id, skill.name]),
) as Record<SkillId, string>
const BOOT_TIME = Date.now()
type PlayMode = 'local' | 'chain'

function readSave(): GameState {
  try {
    const raw =
      window.localStorage.getItem(STORAGE_KEY) ??
      LEGACY_STORAGE_KEYS.map((key) => window.localStorage.getItem(key)).find(Boolean)
    return raw ? normalizeState(JSON.parse(raw) as Partial<GameState>) : createInitialState()
  } catch {
    return createInitialState()
  }
}

function App() {
  const [game, setGame] = useState<GameState>(readSave)
  const [now, setNow] = useState(BOOT_TIME)
  const [playMode, setPlayMode] = useState<PlayMode>('local')
  const [selectedGroup, setSelectedGroup] = useState<ActivityGroup>('Gather')
  const [selectedActivitySkill, setSelectedActivitySkill] = useState<
    Record<ActivitySubtabGroup, SkillId>
  >({
    Gather: 'woodcutting',
    Artisan: 'smithing',
  })
  const [account, setAccount] = useState<Address | null>(null)
  const [chainId, setChainId] = useState<string | null>(null)
  const [walletNote, setWalletNote] = useState('Local profile')
  const [chainSnapshot, setChainSnapshot] = useState<ChainSnapshot | null>(null)
  const [chainLoading, setChainLoading] = useState(false)
  const [chainBusy, setChainBusy] = useState(false)
  const [marketFilter, setMarketFilter] = useState<MarketCategory>('All')
  const [selectedMarketItem, setSelectedMarketItem] = useState<ItemId | null>(null)
  const [listingItem, setListingItem] = useState<ItemId | ''>('')
  const [listingQuantity, setListingQuantity] = useState('1')
  const [listingPrice, setListingPrice] = useState('')

  const isChainMode = playMode === 'chain'
  const chainAddress = getIdleIslesAddress()
  const displayGame = useMemo(
    () => (isChainMode && chainSnapshot ? gameFromChainSnapshot(chainSnapshot, game) : game),
    [chainSnapshot, game, isChainMode],
  )
  const activeActivity = displayGame.active ? ACTIVITY_BY_ID[displayGame.active.id] : null
  const currentArea = AREA_BY_ID[displayGame.currentAreaId]
  const selectedSubtabGroup: ActivitySubtabGroup | null =
    selectedGroup === 'Gather' || selectedGroup === 'Artisan' ? selectedGroup : null
  const activitySubtabs = selectedSubtabGroup ? ACTIVITY_SUBTABS[selectedSubtabGroup] : null
  const selectedActivitySubtab = selectedSubtabGroup
    ? selectedActivitySkill[selectedSubtabGroup]
    : null
  const activityListLabel = selectedActivitySubtab
    ? SKILL_NAMES[selectedActivitySubtab]
    : selectedGroup
  const localPreview = useMemo(() => getClaimPreview(game, now), [game, now])
  const preview = useMemo(
    () =>
      isChainMode && chainSnapshot
        ? getChainPreview(chainSnapshot, activeActivity)
        : localPreview,
    [activeActivity, chainSnapshot, isChainMode, localPreview],
  )
  const visibleActivities = ACTIVITIES.filter(
    (activity) =>
      getActivityAreaId(activity) === displayGame.currentAreaId &&
      activity.group === selectedGroup &&
      (!selectedActivitySubtab || activity.primarySkill === selectedActivitySubtab),
  )
  const visibleInventoryItems = (Object.keys(ITEMS) as ItemId[]).filter(
    (itemId) => itemId !== 'crowns' && displayGame.inventory[itemId] > 0,
  )
  const listableItems = useMemo(
    () =>
      MARKET_ITEMS.filter(
        (itemId) =>
          itemId !== 'crowns' && getListableItemCount(displayGame, itemId, isChainMode) > 0,
      ),
    [displayGame, isChainMode],
  )
  const visibleMarketOrders = useMemo(
    () =>
      displayGame.marketOrders
        .filter(
          (order) =>
            marketFilter === 'All' || getMarketCategory(order.itemId) === marketFilter,
        )
        .sort((a, b) => {
          if (a.seller !== b.seller) {
            return a.seller === 'Player' ? -1 : 1
          }

          return a.unitPrice - b.unitPrice
        }),
    [displayGame.marketOrders, marketFilter],
  )
  const selectedListingItem =
    listingItem && listableItems.includes(listingItem) ? listingItem : (listableItems[0] ?? '')
  const detailItem = selectedMarketItem ?? visibleMarketOrders[0]?.itemId ?? null
  const equipmentStats = getEquipmentStats(displayGame)
  const maxHitpoints = isChainMode && chainSnapshot ? chainSnapshot.maxHitpoints : getMaxHitpoints(displayGame)
  const hitpointPct = maxHitpoints > 0 ? (displayGame.currentHitpoints / maxHitpoints) * 100 : 0
  const totalLevel = SKILLS.reduce(
    (sum, skill) => sum + levelFromXp(displayGame.skills[skill.id].xp),
    0,
  )
  const foodItems = getFoodItems()
  const chainStatus = getChainStatus({
    account,
    chainAddress,
    chainId,
    chainLoading,
    chainSnapshot,
    isChainMode,
  })

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(game))
  }, [game])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!window.ethereum?.on) {
      return
    }

    const handleAccounts = (accounts: unknown) => {
      const next = Array.isArray(accounts) ? toAddress(String(accounts[0] ?? '')) : null
      setAccount(next)
    }

    const handleChain = (nextChainId: unknown) => {
      setChainId(typeof nextChainId === 'string' ? nextChainId : null)
    }

    window.ethereum.on('accountsChanged', handleAccounts)
    window.ethereum.on('chainChanged', handleChain)

    return () => {
      window.ethereum?.removeListener?.('accountsChanged', handleAccounts)
      window.ethereum?.removeListener?.('chainChanged', handleChain)
    }
  }, [])

  useEffect(() => {
    if (!isChainMode) {
      return
    }

    let cancelled = false

    async function loadChainState() {
      if (!account) {
        setChainSnapshot(null)
        setWalletNote('Connect wallet for chain profile')
        return
      }

      if (!chainAddress) {
        setChainSnapshot(null)
        setWalletNote('Set VITE_IDLE_ISLES_ADDRESS')
        return
      }

      setChainLoading(true)

      try {
        const snapshot = await readChainSnapshot(account)
        if (!cancelled) {
          setChainSnapshot(snapshot)
          setWalletNote(snapshot.hasProfile ? 'Onchain profile' : 'Create onchain profile')
        }
      } catch (error) {
        if (!cancelled) {
          setChainSnapshot(null)
          setWalletNote(formatChainError(error))
        }
      } finally {
        if (!cancelled) {
          setChainLoading(false)
        }
      }
    }

    void loadChainState()

    return () => {
      cancelled = true
    }
  }, [account, chainAddress, isChainMode])

  function pushLog(message: string, source = game) {
    return {
      ...source,
      log: [message, ...source.log].slice(0, 8),
    }
  }

  function pushChainLog(message: string) {
    setGame((current) => pushLog(message, current))
  }

  async function refreshChainState() {
    if (!account) {
      setWalletNote('Connect wallet for chain profile')
      return
    }

    if (!chainAddress) {
      setWalletNote('Set VITE_IDLE_ISLES_ADDRESS')
      return
    }

    setChainLoading(true)

    try {
      const snapshot = await readChainSnapshot(account)
      setChainSnapshot(snapshot)
      setWalletNote(snapshot.hasProfile ? 'Onchain profile refreshed' : 'Create onchain profile')
    } catch (error) {
      setWalletNote(formatChainError(error))
    } finally {
      setChainLoading(false)
    }
  }

  async function runChainTransaction(
    action: (provider: BrowserEthereumProvider, account: Address) => Promise<unknown>,
    successMessage: string,
  ) {
    if (!window.ethereum) {
      setWalletNote('No injected wallet')
      return
    }

    if (!account) {
      setWalletNote('Connect wallet for chain mode')
      return
    }

    if (!chainAddress) {
      setWalletNote('Set VITE_IDLE_ISLES_ADDRESS')
      return
    }

    if (chainId !== MEGAETH_CHAIN_ID_HEX) {
      setWalletNote('Switch wallet to MegaETH')
      return
    }

    setChainBusy(true)
    setWalletNote('Confirm transaction')

    try {
      await action(window.ethereum, account)
      setWalletNote(successMessage)
      pushChainLog(successMessage)
      await refreshChainState()
    } catch (error) {
      const message = formatChainError(error)
      setWalletNote(message)
      pushChainLog(message)
    } finally {
      setChainBusy(false)
    }
  }

  useEffect(() => {
    if (isChainMode) {
      return
    }

    const timer = window.setInterval(() => {
      setGame((current) => {
        if (!current.active || !ACTIVITY_BY_ID[current.active.id].combat) {
          return current
        }

        const result = applyClaim(current, Date.now())

        if (
          result.preview.cycles === 0 &&
          !result.preview.stoppedByHp &&
          !result.preview.stoppedBySafety
        ) {
          return current
        }

        return {
          ...result.state,
          log: [`Combat resolved ${summarizePreview(result.preview)}.`, ...result.state.log].slice(
            0,
            8,
          ),
        }
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [isChainMode])

  async function createChainProfile() {
    await runChainTransaction(writeCreateProfile, 'Profile created onchain.')
  }

  async function claim() {
    if (isChainMode) {
      await runChainTransaction(writeClaim, 'Claim confirmed onchain.')
      return
    }

    setGame((current) => {
      const result = applyClaim(current, Date.now())
      if (result.preview.cycles === 0) {
        if (result.preview.stoppedByHp || result.preview.stoppedBySafety) {
          return pushLog(`Combat resolved ${summarizePreview(result.preview)}.`, result.state)
        }

        return pushLog('No completed cycles yet.', current)
      }

      return pushLog(`Claimed ${summarizePreview(result.preview)}.`, result.state)
    })
  }

  function updateCombatSettings(settings: Partial<GameState['combatSettings']>) {
    setGame((current) => ({
      ...current,
      combatSettings: {
        ...current.combatSettings,
        ...settings,
      },
    }))
  }

  async function startActivity(activityId: ActivityId) {
    if (isChainMode) {
      const activity = ACTIVITY_BY_ID[activityId]

      if (!getContractActivity(activityId)) {
        pushChainLog(`${activity.name} is local-only until more contract content is ported.`)
        return
      }

      await runChainTransaction(
        (provider, activeAccount) => writeStartActivity(provider, activeAccount, activityId),
        `Started ${activity.name} onchain.`,
      )
      return
    }

    setGame((current) => {
      const result = applyClaim(current, Date.now())
      const activity = ACTIVITY_BY_ID[activityId]
      const lock = getActivityLock(activity, result.state)

      if (lock) {
        return pushLog(`${activity.name} requires ${lock}.`, result.state)
      }

      const next = {
        ...result.state,
        active: {
          id: activityId,
          startedAt: Date.now(),
          lastClaimAt: Date.now(),
        },
      }

      return pushLog(`Started ${activity.name}.`, next)
    })
  }

  async function equip(itemId: ItemId) {
    const item = ITEMS[itemId]

    if (!item.slot) {
      return
    }

    if (isChainMode) {
      await runChainTransaction(
        (provider, activeAccount) => writeEquip(provider, activeAccount, itemId),
        `Equipped ${item.name} onchain.`,
      )
      return
    }

    const slot = item.slot

    setGame((current) => {
      if (current.inventory[itemId] <= 0) {
        return pushLog(`${item.name} is not in inventory.`, current)
      }

      const currentItem = current.equipment[slot]
      const nextItem = currentItem === itemId ? null : itemId

      return pushLog(nextItem ? `Equipped ${item.name}.` : `Unequipped ${item.name}.`, {
        ...current,
        equipment: {
          ...current.equipment,
          [slot]: nextItem,
        },
      })
    })
  }

  async function unequip(slot: (typeof EQUIPMENT_SLOTS)[number]) {
    const slotIndex = EQUIPMENT_SLOTS.indexOf(slot)
    const itemId = displayGame.equipment[slot]

    if (!itemId) {
      return
    }

    if (isChainMode) {
      await runChainTransaction(
        (provider, activeAccount) => writeUnequip(provider, activeAccount, slotIndex),
        `Unequipped ${ITEMS[itemId].name} onchain.`,
      )
      return
    }

    await equip(itemId)
  }

  async function createListing() {
    const itemId = selectedListingItem
    if (!itemId) {
      setGame((current) => pushLog('No listable items in inventory.', current))
      return
    }

    const requestedQuantity = Math.max(1, Math.floor(Number(listingQuantity) || 1))
    const unitPrice = Math.max(1, Math.floor(Number(listingPrice) || ITEMS[itemId].marketPrice))

    if (isChainMode) {
      const available = getListableItemCount(displayGame, itemId, true)
      const quantity = Math.min(requestedQuantity, available)

      if (quantity <= 0) {
        pushChainLog(`No available ${ITEMS[itemId].name} to list.`)
        return
      }

      await runChainTransaction(
        (provider, activeAccount) =>
          writeCreateOrder(provider, activeAccount, itemId, quantity, unitPrice),
        `Listed ${quantity} ${ITEMS[itemId].name} onchain.`,
      )
      return
    }

    setGame((current) => {
      const available = getAvailableItemCount(current, itemId)

      if (available <= 0) {
        return pushLog(`No available ${ITEMS[itemId].name} to list.`, current)
      }

      const quantity = Math.min(requestedQuantity, available)
      const item = ITEMS[itemId]

      return pushLog(`Listed ${quantity} ${item.name} at ${unitPrice} Crowns each.`, {
        ...current,
        inventory: {
          ...current.inventory,
          [itemId]: current.inventory[itemId] - quantity,
        },
        marketOrders: [
          {
            id: `player-${Date.now()}-${itemId}`,
            itemId,
            seller: 'Player',
            side: 'sell',
            quantity,
            unitPrice,
            createdAt: Date.now(),
          },
          ...current.marketOrders,
        ],
      })
    })
  }

  async function buyOrder(orderId: string) {
    if (isChainMode) {
      const chainOrderId = getChainOrderId(orderId)
      const order = displayGame.marketOrders.find((entry) => entry.id === orderId)

      if (!chainOrderId || !order || order.seller === 'Player') {
        pushChainLog('That order cannot be bought.')
        return
      }

      await runChainTransaction(
        (provider, activeAccount) => writeBuyOrder(provider, activeAccount, chainOrderId),
        `Bought 1 ${ITEMS[order.itemId].name} onchain.`,
      )
      return
    }

    setGame((current) => {
      const order = current.marketOrders.find((entry) => entry.id === orderId)

      if (!order) {
        return pushLog('That order is no longer available.', current)
      }

      if (order.side === 'buy') {
        if (current.inventory[order.itemId] <= 0) {
          return pushLog(`No ${ITEMS[order.itemId].name} to sell.`, current)
        }

        return pushLog(
          `Sold 1 ${ITEMS[order.itemId].name} to Realm Scavenger for ${order.unitPrice} Crowns.`,
          {
            ...current,
            inventory: {
              ...current.inventory,
              crowns: current.inventory.crowns + order.unitPrice,
              [order.itemId]: current.inventory[order.itemId] - 1,
            },
          },
        )
      }

      if (order.seller === 'Player') {
        return pushLog('Cancel your own listing to recover the escrowed items.', current)
      }

      if (current.inventory.crowns < order.unitPrice) {
        return pushLog('Not enough crowns.', current)
      }

      const nextOrders =
        order.quantity <= 1
          ? current.marketOrders.filter((entry) => entry.id !== orderId)
          : current.marketOrders.map((entry) =>
              entry.id === orderId ? { ...entry, quantity: entry.quantity - 1 } : entry,
            )

      return pushLog(`Bought 1 ${ITEMS[order.itemId].name} for ${order.unitPrice} Crowns.`, {
        ...current,
        inventory: {
          ...current.inventory,
          crowns: current.inventory.crowns - order.unitPrice,
          [order.itemId]: current.inventory[order.itemId] + 1,
        },
        marketOrders: nextOrders,
      })
    })
  }

  async function cancelOrder(orderId: string) {
    if (isChainMode) {
      const chainOrderId = getChainOrderId(orderId)
      const order = displayGame.marketOrders.find((entry) => entry.id === orderId)

      if (!chainOrderId || !order || order.seller !== 'Player') {
        pushChainLog('Only your listings can be cancelled.')
        return
      }

      await runChainTransaction(
        (provider, activeAccount) => writeCancelOrder(provider, activeAccount, chainOrderId),
        `Cancelled ${ITEMS[order.itemId].name} listing onchain.`,
      )
      return
    }

    setGame((current) => {
      const order = current.marketOrders.find((entry) => entry.id === orderId)

      if (!order || order.seller !== 'Player') {
        return pushLog('Only your listings can be cancelled.', current)
      }

      return pushLog(`Cancelled ${order.quantity} ${ITEMS[order.itemId].name} listing.`, {
        ...current,
        inventory: {
          ...current.inventory,
          [order.itemId]: current.inventory[order.itemId] + order.quantity,
        },
        marketOrders: current.marketOrders.filter((entry) => entry.id !== orderId),
      })
    })
  }

  async function handleInventoryItem(itemId: ItemId) {
    const item = ITEMS[itemId]

    if (item.slot) {
      await equip(itemId)
      return
    }

    if (!item.healAmount) {
      return
    }

    if (isChainMode) {
      await runChainTransaction(
        (provider, activeAccount) => writeEatFood(provider, activeAccount, itemId),
        `Ate ${item.name} onchain.`,
      )
      return
    }

    setGame((current) => {
      const result = eatFood(current, itemId)

      if (result.reason) {
        return pushLog(result.reason, current)
      }

      return pushLog(`Ate ${item.name} and restored ${result.healed} HP.`, result.state)
    })
  }

  async function connectWallet() {
    if (!window.ethereum) {
      setWalletNote('No injected wallet')
      return
    }

    try {
      const accounts = (await window.ethereum.request({
        method: 'eth_requestAccounts',
      })) as string[]
      const nextChainId = (await window.ethereum.request({
        method: 'eth_chainId',
      })) as string

      setAccount(toAddress(accounts[0]))
      setChainId(nextChainId)
      setWalletNote('Wallet linked')
    } catch {
      setWalletNote('Wallet rejected')
    }
  }

  async function addMegaEth() {
    if (!window.ethereum) {
      setWalletNote('No injected wallet')
      return
    }

    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [MEGAETH_TESTNET_PARAMS],
      })
      setChainId(MEGAETH_CHAIN_ID_HEX)
      setWalletNote('MegaETH selected')
    } catch {
      setWalletNote('Network request rejected')
    }
  }

  async function sailToArea(areaId: AreaId) {
    if (isChainMode) {
      pushChainLog('Ship routes are local-only until contract area support is added.')
      return
    }

    setGame((current) => {
      const result = applyClaim(current, Date.now())
      const voyage = travelToArea(result.state, areaId)
      const claimText =
        result.preview.cycles > 0
          ? `Claimed ${summarizePreview(result.preview)} before sailing. `
          : ''

      return pushLog(`${claimText}${voyage.message}`, voyage.state)
    })
  }

  return (
    <main className="game-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="sigil" aria-hidden="true">
            <ShipWheel size={24} />
          </div>
          <div>
            <h1>Idle Isles</h1>
            <div className="subline">
              <span>Total level {totalLevel}</span>
              <span>{currentArea.name}</span>
              <span>{activeActivity ? activeActivity.name : 'Camp idle'}</span>
            </div>
          </div>
        </div>

        <div className="top-actions">
          <div
            className={`hp-pill ${displayGame.currentHitpoints <= maxHitpoints * 0.35 ? 'low' : ''}`}
          >
            <Heart size={17} />
            <span>
              {displayGame.currentHitpoints}/{maxHitpoints}
            </span>
            <i aria-hidden="true">
              <b style={{ width: `${hitpointPct}%` }} />
            </i>
          </div>
          <div className="currency-pill">
            <Coins size={17} />
            <span>{displayGame.inventory.crowns.toLocaleString()}</span>
          </div>
          <div className="mode-switch" aria-label="Play mode">
            <button
              type="button"
              className={playMode === 'local' ? 'selected' : ''}
              onClick={() => setPlayMode('local')}
            >
              Local
            </button>
            <button
              type="button"
              className={playMode === 'chain' ? 'selected' : ''}
              onClick={() => setPlayMode('chain')}
            >
              Chain
            </button>
          </div>
          <button type="button" className="icon-text-button" onClick={connectWallet}>
            <Wallet size={17} />
            <span>{account ? shortAddress(account) : 'Connect'}</span>
          </button>
          <button type="button" className="icon-text-button secondary" onClick={addMegaEth}>
            <Landmark size={17} />
            <span>{chainId === MEGAETH_CHAIN_ID_HEX ? 'MegaETH' : 'Network'}</span>
          </button>
          {isChainMode && (
            <button
              type="button"
              className="icon-text-button chain-action"
              onClick={() =>
                chainSnapshot?.hasProfile ? void refreshChainState() : void createChainProfile()
              }
              disabled={!account || !chainAddress || chainBusy || chainLoading}
            >
              <Sparkles size={17} />
              <span>{chainSnapshot?.hasProfile ? 'Refresh' : 'Create Profile'}</span>
            </button>
          )}
        </div>
      </header>

      <section className="status-strip" aria-label="Realm status">
        <StatusMetric label="Mode" value={playMode === 'chain' ? 'Contract mode' : 'Local simulation'} />
        <StatusMetric label="Area" value={currentArea.name} />
        <StatusMetric label="Chain" value={chainStatus} />
        <StatusMetric label="Profile" value={walletNote} />
        <StatusMetric
          label="AFK bank"
          value={activeActivity ? formatDuration(preview.elapsedMs) : '0s'}
        />
      </section>

      <div className="realm-grid">
        <aside className="skills-panel panel">
          <PanelTitle icon={Sparkles} title="Skills" />
          <div className="skill-list">
            {SKILLS.map((skill) => {
              const Icon = SKILL_ICONS[skill.id]
              const xp = displayGame.skills[skill.id].xp
              const progress = skillProgress(xp)

              return (
                <div className={`skill-row tone-${skill.tone}`} key={skill.id}>
                  <div className="skill-icon">
                    <Icon size={18} />
                  </div>
                  <div className="skill-copy">
                    <div className="row-between">
                      <strong>{skill.name}</strong>
                      <span>Lv {progress.level}</span>
                    </div>
                    <div className="progress-track">
                      <span style={{ width: `${progress.progress}%` }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </aside>

        <section className="play-panel">
          <div className="scene-wrap">
            <ActivityScene activity={activeActivity} preview={preview} />
            <div className="scene-hud">
              <div>
                <span className="eyebrow">Active</span>
                <strong>{activeActivity ? activeActivity.name : 'Hearth Camp'}</strong>
              </div>
              <div className="cycle-meter">
                <Clock size={15} />
                <span>{activeActivity ? `${preview.cycles} ready` : 'No task'}</span>
              </div>
            </div>
          </div>

          <div className="action-dock panel">
            <div className="dock-heading">
              <div className="activity-tabs">
                <div className="segmented" aria-label="Activity group">
                  {GROUPS.map((group) => (
                    <button
                      type="button"
                      key={group}
                      className={selectedGroup === group ? 'selected' : ''}
                      onClick={() => setSelectedGroup(group)}
                    >
                      <span>{group}</span>
                    </button>
                  ))}
                </div>

                {selectedSubtabGroup && activitySubtabs && (
                  <div className="segmented sub-segmented" aria-label={`${selectedGroup} skill`}>
                    {activitySubtabs.map((skillId) => {
                      const Icon = SKILL_ICONS[skillId]

                      return (
                        <button
                          type="button"
                          key={skillId}
                          className={selectedActivitySubtab === skillId ? 'selected' : ''}
                          onClick={() =>
                            setSelectedActivitySkill((current) => ({
                              ...current,
                              [selectedSubtabGroup]: skillId,
                            }))
                          }
                        >
                          <Icon size={15} />
                          <span>{SKILL_NAMES[skillId]}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
              <button type="button" className="claim-button" onClick={claim}>
                <CircleDollarSign size={18} />
                <span>Claim</span>
              </button>
            </div>

            <div className="activity-list">
              {visibleActivities.length === 0 ? (
                <div className="empty-activities">
                  No {activityListLabel.toLowerCase()} routes in {currentArea.name}
                </div>
              ) : (
                visibleActivities.map((activity) => (
                  <ActivityButton
                    activity={activity}
                    game={displayGame}
                    isActive={displayGame.active?.id === activity.id}
                    modeLock={
                      isChainMode && !getContractActivity(activity.id) ? 'Local only' : null
                    }
                    key={activity.id}
                    onStart={() => startActivity(activity.id)}
                  />
                ))
              )}
            </div>
          </div>
        </section>

        <aside className="right-rail">
          <section className="panel area-panel">
            <PanelTitle icon={MapPinned} title="Harbor Merchant" />
            <div className="area-routes">
              {AREAS.map((area) => {
                const unlocked = isAreaUnlocked(displayGame, area.id)
                const selected = displayGame.currentAreaId === area.id
                const canAfford = displayGame.inventory.crowns >= area.shipCost
                const routeLabel = selected
                  ? 'Current'
                  : isChainMode
                    ? 'Local only'
                    : unlocked
                      ? 'Sail'
                      : canAfford
                        ? `Pay ${area.shipCost.toLocaleString()}`
                        : `Need ${area.shipCost.toLocaleString()}`

                return (
                  <button
                    type="button"
                    className={`area-route ${selected ? 'selected' : ''} ${
                      unlocked ? '' : 'locked'
                    }`}
                    key={area.id}
                    onClick={() => void sailToArea(area.id)}
                    disabled={selected || isChainMode}
                    title={
                      unlocked
                        ? area.routeLabel
                        : `${area.dockName}: ${area.shipCost.toLocaleString()} Crowns`
                    }
                  >
                    <span className="area-route-icon">
                      <Ship size={18} />
                    </span>
                    <span className="area-route-copy">
                      <strong>{area.name}</strong>
                      <small>{area.description}</small>
                    </span>
                    <span className={selected || unlocked ? 'route-chip' : 'route-chip locked'}>
                      {routeLabel}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>

          <section className="panel equipment-panel">
            <PanelTitle icon={Shield} title="Equipment" />
            <div className="equipment-grid">
              {EQUIPMENT_SLOTS.map((slot) => {
                const itemId = displayGame.equipment[slot]
                const item = itemId ? ITEMS[itemId] : null
                const Icon = itemId ? ITEM_ICONS[itemId] : Package

                return (
                  <button
                    type="button"
                    className="equipment-slot"
                    key={slot}
                    onClick={() => itemId && void unequip(slot)}
                    title={item ? `Unequip ${item.name}` : slot}
                  >
                    <Icon size={20} />
                    <span>{item ? item.name : slot}</span>
                  </button>
                )
              })}
            </div>
            <div className="equipment-stats">
              <span>ATK +{equipmentStats.attack}</span>
              <span>DEF +{equipmentStats.defence}</span>
              <span>HP +{equipmentStats.hitpoints}</span>
            </div>
          </section>

          <section className="panel safety-panel">
            <PanelTitle icon={Heart} title="Combat Safety" />
            <div className="safety-controls">
              <label className="safety-toggle">
                <input
                  type="checkbox"
                  checked={displayGame.combatSettings.autoEat}
                  onChange={(event) => updateCombatSettings({ autoEat: event.target.checked })}
                  disabled={isChainMode}
                />
                <span>Auto-eat</span>
              </label>

              <label>
                <span>Food</span>
                <select
                  value={displayGame.combatSettings.foodItemId ?? ''}
                  onChange={(event) =>
                    updateCombatSettings({ foodItemId: (event.target.value as ItemId) || null })
                  }
                  disabled={foodItems.length === 0 || isChainMode}
                >
                  {foodItems.map((itemId) => (
                    <option value={itemId} key={itemId}>
                      {ITEMS[itemId].name} ({displayGame.inventory[itemId]})
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Stop HP</span>
                <input
                  min="1"
                  max={Math.max(1, maxHitpoints - 1)}
                  step="1"
                  type="number"
                  value={displayGame.combatSettings.stopAtHitpoints}
                  onChange={(event) =>
                    updateCombatSettings({
                      stopAtHitpoints: Math.max(1, Math.floor(Number(event.target.value) || 1)),
                    })
                  }
                  disabled={isChainMode}
                />
              </label>

              <label>
                <span>Max food</span>
                <input
                  min="1"
                  max="99"
                  step="1"
                  type="number"
                  value={displayGame.combatSettings.maxFoodPerClaim}
                  onChange={(event) =>
                    updateCombatSettings({
                      maxFoodPerClaim: Math.max(1, Math.floor(Number(event.target.value) || 1)),
                    })
                  }
                  disabled={isChainMode}
                />
              </label>
            </div>
          </section>

          <section className="panel inventory-panel">
            <PanelTitle icon={Package} title="Inventory" />
            <div className="inventory-grid">
              {visibleInventoryItems.length === 0 ? (
                <div className="empty-inventory">No items</div>
              ) : (
                visibleInventoryItems.map((itemId) => {
                  const item = ITEMS[itemId]
                  const Icon = ITEM_ICONS[itemId]
                  const count = displayGame.inventory[itemId]

                  return (
                    <button
                      type="button"
                      className={`item-cell ${item.healAmount ? 'edible' : ''}`}
                      key={itemId}
                      onClick={() => void handleInventoryItem(itemId)}
                      disabled={(!item.slot && !item.healAmount) || count <= 0}
                      title={
                        item.slot
                          ? `Equip ${item.name}`
                          : item.healAmount
                            ? `Eat ${item.name}`
                            : item.name
                      }
                    >
                      <Icon size={19} />
                      <span>{count}</span>
                      <small>{item.name}</small>
                    </button>
                  )
                })
              )}
            </div>
          </section>
        </aside>
      </div>

      <section className="exchange-band">
        <div className="panel exchange-panel">
          <PanelTitle icon={Landmark} title="Hoard Hall" />
          <div className="market-toolbar">
            <div className="market-filters" aria-label="Market filters">
              {MARKET_CATEGORIES.map((category) => (
                <button
                  type="button"
                  className={marketFilter === category ? 'selected' : ''}
                  key={category}
                  onClick={() => setMarketFilter(category)}
                >
                  {category}
                </button>
              ))}
            </div>

            <form
              className="listing-form"
              onSubmit={(event) => {
                event.preventDefault()
                void createListing()
              }}
            >
              <select
                aria-label="Listing item"
                value={selectedListingItem}
                onChange={(event) => {
                  const itemId = event.target.value as ItemId
                  setListingItem(itemId)
                  setListingPrice(String(ITEMS[itemId].marketPrice))
                }}
                disabled={listableItems.length === 0 || chainBusy}
              >
                {listableItems.length === 0 ? (
                  <option value="">No items</option>
                ) : (
                  listableItems.map((itemId) => (
                    <option value={itemId} key={itemId}>
                      {ITEMS[itemId].name} ({getListableItemCount(displayGame, itemId, isChainMode)})
                    </option>
                  ))
                )}
              </select>
              <input
                aria-label="Listing quantity"
                min="1"
                step="1"
                type="number"
                value={listingQuantity}
                onChange={(event) => setListingQuantity(event.target.value)}
                disabled={chainBusy}
              />
              <input
                aria-label="Listing price"
                min="1"
                placeholder={selectedListingItem ? String(ITEMS[selectedListingItem].marketPrice) : '1'}
                step="1"
                type="number"
                value={listingPrice}
                onChange={(event) => setListingPrice(event.target.value)}
                disabled={chainBusy}
              />
              <button type="submit" disabled={listableItems.length === 0 || chainBusy}>
                <Plus size={15} />
                <span>List</span>
              </button>
            </form>
          </div>
          {detailItem && <ItemDetail itemId={detailItem} />}
          <div className="market-list">
            {visibleMarketOrders.length === 0 ? (
              <div className="empty-market">
                {isChainMode ? 'No open chain orders' : 'No open orders'}
              </div>
            ) : (
              visibleMarketOrders.map((order) => {
                const item = ITEMS[order.itemId]
                const Icon = ITEM_ICONS[order.itemId]
                const row = MARKET_ROWS.find((entry) => entry.itemId === order.itemId)

                return (
                  <div
                    className={`market-row ${order.seller === 'Player' ? 'own-order' : ''}`}
                    key={order.id}
                  >
                    <button
                      type="button"
                      className="market-item market-item-button"
                      onClick={() => setSelectedMarketItem(order.itemId)}
                    >
                      <div className="market-icon">
                        <Icon size={18} />
                      </div>
                      <div>
                        <strong>{item.name}</strong>
                        <span>{item.kind}</span>
                      </div>
                    </button>
                    <div className="seller-chip">
                      {order.seller} {order.side === 'buy' ? 'Buy' : 'Sell'}
                    </div>
                    <div className="market-quantity">
                      {order.side === 'buy' && order.seller === 'Realm'
                        ? 'Floor'
                        : `${order.quantity}x`}
                    </div>
                    <div className="sparkline" aria-hidden="true">
                      {(row?.spark ?? []).map((height, index) => (
                        <i key={index} style={{ height }} />
                      ))}
                    </div>
                    <div
                      className={
                        (row?.change ?? 0) >= 0 ? 'market-change up' : 'market-change down'
                      }
                    >
                      {(row?.change ?? 0) >= 0 ? '+' : ''}
                      {row?.change ?? 0}%
                    </div>
                    <div className="market-price">
                      <Coins size={15} />
                      <span>{order.unitPrice}</span>
                    </div>
                    <div className="market-actions">
                      {order.seller === 'Player' ? (
                        <button
                          type="button"
                          className="cancel-order"
                          onClick={() => void cancelOrder(order.id)}
                          disabled={chainBusy}
                        >
                          <X size={15} />
                          <span>Cancel</span>
                        </button>
                      ) : order.side === 'buy' ? (
                        <button
                          type="button"
                          onClick={() => void buyOrder(order.id)}
                          disabled={chainBusy || displayGame.inventory[order.itemId] <= 0}
                        >
                          <CircleDollarSign size={15} />
                          <span>Sell 1</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void buyOrder(order.id)}
                          disabled={chainBusy}
                        >
                          <ShoppingCart size={15} />
                          <span>Buy 1</span>
                        </button>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        <div className="panel log-panel">
          <PanelTitle icon={Clock} title="Log" />
          <div className="event-log">
            {displayGame.log.map((entry, index) => (
              <div className="log-entry" key={`${entry}-${index}`}>
                {entry}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

function ItemDetail({ itemId }: { itemId: ItemId }) {
  const item = ITEMS[itemId]
  const Icon = ITEM_ICONS[itemId]
  const sources = getItemSources(itemId)
  const uses = getItemUses(itemId)

  return (
    <div className="item-detail-panel">
      <div className="item-detail-heading">
        <div className="market-icon">
          <Icon size={18} />
        </div>
        <div>
          <strong>{item.name}</strong>
          <span>
            {item.kind} / {getMarketCategory(itemId)}
          </span>
        </div>
      </div>
      <div className="item-detail-stat">
        <Coins size={14} />
        <span>{item.marketPrice} reference</span>
      </div>
      <div className="item-detail-copy">
        <span>Sources</span>
        <strong>{formatDetailList(sources, 'No current source')}</strong>
      </div>
      <div className="item-detail-copy">
        <span>Uses</span>
        <strong>{formatDetailList(uses, 'No current use')}</strong>
      </div>
    </div>
  )
}

function formatDetailList(entries: string[], fallback: string): string {
  if (entries.length === 0) {
    return fallback
  }

  return entries.slice(0, 4).join(', ')
}

function StatusMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="status-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function getAvailableItemCount(game: GameState, itemId: ItemId): number {
  const equippedCount = Object.values(game.equipment).filter((equipped) => equipped === itemId).length
  return Math.max(0, game.inventory[itemId] - equippedCount)
}

function getListableItemCount(game: GameState, itemId: ItemId, isChainMode: boolean): number {
  if (isChainMode) {
    return Math.max(0, game.inventory[itemId])
  }

  return getAvailableItemCount(game, itemId)
}

function PanelTitle({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
  return (
    <div className="panel-title">
      <Icon size={18} />
      <h2>{title}</h2>
    </div>
  )
}

function ActivityButton({
  activity,
  game,
  isActive,
  modeLock,
  onStart,
}: {
  activity: ActivityDefinition
  game: GameState
  isActive: boolean
  modeLock: string | null
  onStart: () => void | Promise<void>
}) {
  const Icon = SKILL_ICONS[activity.primarySkill]
  const locks = getActivityLocks(activity, game)
  const effectiveLocks = modeLock ? [modeLock, ...locks] : locks
  const lock = effectiveLocks[0] ?? null
  const lockLabel =
    effectiveLocks.length > 1 ? `${effectiveLocks[0]} +${effectiveLocks.length - 1}` : lock
  const costText = formatMap(activity.costs)
  const rewardText = formatActivityOutput(activity)
  const riskText = formatActivityRisk(activity, game)

  return (
    <button
      type="button"
      className={`activity-card ${isActive ? 'running' : ''} ${
        activity.combat?.boss ? 'boss-card' : ''
      }`}
      onClick={() => void onStart()}
      title={effectiveLocks.length > 0 ? `Requires ${effectiveLocks.join(', ')}` : activity.name}
    >
      <span className="activity-emblem">
        <Icon size={20} />
      </span>
      <span className="activity-main">
        <strong>{activity.name}</strong>
        <small>{activity.zone}</small>
      </span>
      <span className="activity-meta">
        <small>{rewardText}</small>
        {riskText && <small className="risk">{riskText}</small>}
        {costText && <small className="cost">{costText}</small>}
      </span>
      <span className={lock ? 'lock-chip' : 'start-chip'}>{lockLabel ?? 'Start'}</span>
    </button>
  )
}

function ActivityScene({
  activity,
  preview,
}: {
  activity: ActivityDefinition | null
  preview: ClaimPreview
}) {
  const scene = activity?.scene ?? 'forest'
  const activityClass = activity ? `activity-${activity.id}` : 'activity-camp'

  return (
    <div className={`activity-scene scene-${scene} ${activityClass}`}>
      <div className="skyline" />
      <div className="cloud cloud-a" />
      <div className="cloud cloud-b" />
      <div className="far-land" />
      <div className="near-land" />
      <div className="scene-prop prop-a" />
      <div className="scene-prop prop-b" />
      <div className="action-target" aria-hidden="true">
        <span className="target-core" />
        <span className="target-detail detail-a" />
        <span className="target-detail detail-b" />
      </div>
      <div className="action-effects" aria-hidden="true">
        <span className="effect effect-a" />
        <span className="effect effect-b" />
        <span className="effect effect-c" />
      </div>
      <div className="loot-pop" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="adventurer">
        <span className="helm" />
        <span className="body" />
        <span className="tool" />
        <span className="offhand" />
      </div>
      <div className="scene-progress">
        <span style={{ width: `${preview.progressPct}%` }} />
      </div>
    </div>
  )
}

function formatMap(map?: Partial<Record<ItemId, number>>) {
  if (!map) {
    return ''
  }

  return Object.entries(map)
    .filter(([, amount]) => amount > 0)
    .map(([itemId, amount]) => `${amount} ${ITEMS[itemId as ItemId].name}`)
    .join(', ')
}

function formatActivityOutput(activity: ActivityDefinition) {
  if (activity.cooking) {
    return `Cooked ${ITEMS[activity.cooking.cookedItem].name}`
  }

  if (activity.combat?.dropTable?.length) {
    const rarest = activity.combat.dropTable.reduce((lowest, entry) =>
      entry.chance < lowest.chance ? entry : lowest,
    )
    return `${formatMap(activity.rewards)} + ${rarest.chance}% ${ITEMS[rarest.itemId].name}`
  }

  return formatMap(activity.rewards)
}

function formatActivityRisk(activity: ActivityDefinition, game: GameState) {
  if (activity.cooking) {
    return `${getBurnChance(activity, game)}% burn chance`
  }

  if (activity.combat) {
    const prefix = activity.combat.boss ? 'Boss: ' : ''
    return `${prefix}${activity.combat.damageChance}% HP hit, ${activity.combat.minDamage}-${activity.combat.maxDamage} dmg`
  }

  return ''
}

function shortAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

function gameFromChainSnapshot(snapshot: ChainSnapshot, fallback: GameState): GameState {
  return {
    ...fallback,
    skills: snapshot.skills,
    inventory: snapshot.inventory,
    equipment: snapshot.equipment,
    marketOrders: snapshot.marketOrders,
    currentHitpoints: snapshot.currentHitpoints,
    active: snapshot.active,
  }
}

function getChainPreview(
  snapshot: ChainSnapshot,
  activity: ActivityDefinition | null,
): ClaimPreview {
  const cycleMs = activity?.cycleMs ?? 0

  return {
    cycles: snapshot.pendingCycles,
    progressPct: 0,
    elapsedMs: snapshot.pendingCycles * cycleMs,
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
    deathPenalty: {
      lostCrowns: 0,
      lostEquipment: [],
    },
  }
}

function getChainStatus({
  account,
  chainAddress,
  chainId,
  chainLoading,
  chainSnapshot,
  isChainMode,
}: {
  account: Address | null
  chainAddress: Address | null
  chainId: string | null
  chainLoading: boolean
  chainSnapshot: ChainSnapshot | null
  isChainMode: boolean
}) {
  if (!isChainMode) {
    return 'MegaETH available'
  }

  if (!chainAddress) {
    return 'No contract address'
  }

  if (!account) {
    return 'Wallet needed'
  }

  if (chainId !== MEGAETH_CHAIN_ID_HEX) {
    return 'Switch network'
  }

  if (chainLoading) {
    return 'Reading chain'
  }

  if (!chainSnapshot) {
    return 'Ready to read'
  }

  return chainSnapshot.hasProfile ? 'MegaETH connected' : 'Profile not minted'
}

function formatChainError(error: unknown): string {
  const details = error as { shortMessage?: unknown; message?: unknown }
  const message =
    typeof details.shortMessage === 'string'
      ? details.shortMessage
      : typeof details.message === 'string'
        ? details.message
        : 'Chain request failed'

  return message.split('\n')[0].slice(0, 110)
}

export default App
