import { readFile } from 'node:fs/promises'

const registryPath = 'content/core/ids.json'
const registry = JSON.parse(await readFile(registryPath, 'utf8'))
const namespace = registry.namespace
const namespacedIdPattern = new RegExp(`^${escapeRegExp(namespace)}:[a-z][A-Za-z0-9]*$`)

let failed = false

validateEntries('sectors', registry.sectors)
validateEntries('items', registry.items)
validateEntries('activities', registry.activities)
validateReferences()

if (failed) {
  process.exitCode = 1
} else {
  const total =
    registry.sectors.length + registry.items.length + registry.activities.length
  console.log(
    `content IDs: ${total} entries checked ` +
      `(${registry.sectors.length} sectors, ${registry.items.length} items, ` +
      `${registry.activities.length} activities)`,
  )
}

function validateEntries(sectionName, entries) {
  if (!Array.isArray(entries)) {
    fail(`${sectionName}: expected an array`)
    return
  }

  const ids = new Set()
  const localIds = new Set()
  const chainIds = new Set()

  for (const entry of entries) {
    if (!namespacedIdPattern.test(entry.id)) {
      fail(`${sectionName}: invalid namespaced id "${entry.id}"`)
    }

    if (ids.has(entry.id)) {
      fail(`${sectionName}: duplicate id "${entry.id}"`)
    }
    ids.add(entry.id)

    if (!entry.localId || localIds.has(entry.localId)) {
      fail(`${sectionName}: duplicate or missing localId "${entry.localId}"`)
    }
    localIds.add(entry.localId)

    if (!Number.isInteger(entry.chainId) || entry.chainId <= 0) {
      fail(`${sectionName}: ${entry.id} has invalid chainId "${entry.chainId}"`)
    }

    if (chainIds.has(entry.chainId)) {
      fail(`${sectionName}: duplicate chainId "${entry.chainId}"`)
    }
    chainIds.add(entry.chainId)
  }
}

function validateReferences() {
  const itemIds = new Set(registry.items.map((item) => item.id))
  const sectorIds = new Set(registry.sectors.map((sector) => sector.id))

  for (const sector of registry.sectors) {
    if (sector.unlockCostItem && !itemIds.has(sector.unlockCostItem)) {
      fail(`${sector.id}: unlockCostItem "${sector.unlockCostItem}" is missing`)
    }
  }

  for (const activity of registry.activities) {
    if (!sectorIds.has(activity.sectorId)) {
      fail(`${activity.id}: sectorId "${activity.sectorId}" is missing`)
    }

    if (!['combat', 'gathering', 'production'].includes(activity.kind)) {
      fail(`${activity.id}: invalid kind "${activity.kind}"`)
    }
  }
}

function fail(message) {
  console.error(message)
  failed = true
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
