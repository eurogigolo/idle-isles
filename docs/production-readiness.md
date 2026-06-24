# Production Readiness

Idle Galactica is a fresh v2 space-game pivot. Local mode is the broad gameplay surface; Chain mode now targets the v2 `IdleGalactica`, `IdleGalacticaContent`, and `TradeRelay` contracts.

## Current Gate

Run before merging or deploying:

```bash
npm run verify
```

This checks linting, dependency audit, content ID validation, Solidity compilation, bytecode budgets, contract tests, and the production frontend build.

## Ready Baseline

- Local and chain content IDs are checked through `content/core/ids.json`.
- Frontend chain ID mappings are generated from the checked registry.
- Contract bytecode budgets are enforced after every Solidity build.
- Contract tests cover profile creation, starter missions, production settlement, combat, modules, repair, sector unlocks, manual stop, and Trade Relay escrow.
- MOSS and injected-wallet paths are available in the frontend.
- MOSS gameplay sessions are scoped to repeated gameplay calls; Trade Relay approvals/listing/buying and sector travel remain explicit.

## Not Production Ready Yet

- Contracts are unaudited.
- Fresh v2 contracts still need a live testnet deployment and wallet QA pass.
- MOSS session behavior needs validation against the deployed v2 contract addresses.
- Main economy content has no formal balance-report gate.
- Deployment records do not yet include content source hashes.
- There is no incident response, pause, migration, or deprecation process for live content.

## Priority Path

1. Keep `npm run verify` green on every change.
2. Deploy fresh v2 contracts to MegaETH Testnet.
3. Set `VITE_IDLE_GALACTICA_ADDRESS` and `VITE_TRADE_RELAY_ADDRESS` in local and Railway environments.
4. QA MetaMask and MOSS flows against the deployed contracts.
5. Validate MOSS gameplay sessions after refresh and across repeated mission actions.
6. Add deployment metadata with content hashes and verification instructions.
7. Commission external Solidity review before any mainnet or valuable public deployment.
