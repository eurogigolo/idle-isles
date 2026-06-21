import { readFile } from 'node:fs/promises'

const EVM_DEPLOYED_BYTECODE_LIMIT = 24_576

const contracts = [
  {
    name: 'IdleIsles',
    artifactPath: 'artifacts/contracts/IdleIsles.sol/IdleIsles.json',
    budget: 24_200,
  },
  {
    name: 'IdleIslesContent',
    artifactPath: 'artifacts/contracts/IdleIslesContent.sol/IdleIslesContent.json',
    budget: 12_000,
  },
]

let failed = false

for (const contract of contracts) {
  const artifact = JSON.parse(await readFile(contract.artifactPath, 'utf8'))
  const bytecode = artifact.deployedBytecode
  const hex = typeof bytecode === 'string' ? bytecode : bytecode?.object

  if (!hex || hex === '0x') {
    console.error(`${contract.name}: missing deployed bytecode in ${contract.artifactPath}`)
    failed = true
    continue
  }

  const size = deployedBytecodeSize(hex)
  const hardLimitHeadroom = EVM_DEPLOYED_BYTECODE_LIMIT - size
  const budgetHeadroom = contract.budget - size

  console.log(
    `${contract.name}: ${size.toLocaleString()} bytes ` +
      `(${hardLimitHeadroom.toLocaleString()} under EIP-170, ` +
      `${budgetHeadroom.toLocaleString()} under project budget)`,
  )

  if (size > EVM_DEPLOYED_BYTECODE_LIMIT) {
    console.error(
      `${contract.name}: exceeds EIP-170 deployed bytecode limit of ` +
        `${EVM_DEPLOYED_BYTECODE_LIMIT.toLocaleString()} bytes`,
    )
    failed = true
  }

  if (size > contract.budget) {
    console.error(
      `${contract.name}: exceeds project bytecode budget of ` +
        `${contract.budget.toLocaleString()} bytes`,
    )
    failed = true
  }
}

if (failed) {
  process.exitCode = 1
}

function deployedBytecodeSize(hex) {
  const withoutPrefix = hex.startsWith('0x') ? hex.slice(2) : hex
  return withoutPrefix.length / 2
}
