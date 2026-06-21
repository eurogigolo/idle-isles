# Contributing

Idle Isles accepts contributions through reviewed source changes first. Runtime community
packs and onchain content registries are future work and must not be treated as already safe.

## Local Setup

```bash
npm install
npm run dev
```

Use `npm.cmd` on Windows if PowerShell blocks npm scripts.

## Required Checks

Run this before opening a pull request:

```bash
npm run verify
```

The verification script includes dependency audit and intentionally runs Hardhat build and tests
sequentially. Running multiple Hardhat compile/test commands in parallel can race on the local cache.

## Gameplay Changes

For content or rules changes, keep the duplicated alpha sources aligned:

- `src/game.ts` for local gameplay.
- `src/chain.ts` for frontend contract ID mappings.
- `contracts/IdleIsles.sol` and `contracts/IdleIslesContent.sol` for onchain behavior.
- `test/IdleIsles.ts` for contract coverage.
- `solidity-notes.md` for contract-facing design notes.

If a change is local-only, document that explicitly in the pull request.

## Community Content

Community content must be declarative data, not arbitrary JavaScript or Solidity execution.
Any economy-affecting content needs validation, balance review, and tests before it can be
promoted to chain mode.

## Secrets

Never commit `.env`, private keys, funded wallets, or deployment operator secrets.
