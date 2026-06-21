# Production Readiness

Idle Isles is currently an alpha prototype. Local mode is the broad gameplay surface; Chain mode is
a smaller deployed-contract slice. Production readiness requires closing that gap deliberately.

## Current Gate

Run before merging or deploying:

```bash
npm run verify
```

This checks linting, dependency audit, content ID validation, Solidity compilation, bytecode budget,
contract tests, and the production frontend build.

## Ready Baseline

- Local Git repository initialized on `main`.
- Generated dependencies, builds, Hardhat artifacts, cache, and `.env` files are ignored.
- MIT license is declared at the repository and package level.
- CI workflow runs the same ordered verification gate.
- `main` branch protection requires the `verify` check and linear history.
- Contribution and security reporting docs exist.
- Production and development dependency audit currently reports zero vulnerabilities.
- Chain mode has onchain Starter Area/Outer Isles travel and area gating.
- Core area, item, and activity IDs have a checked registry in `content/core/ids.json`.
- Contract bytecode budgets are enforced after every Solidity build.

## Not Production Ready Yet

- Contracts are unaudited.
- Chain mode does not cover all local gameplay systems.
- Many local Outer Isles activities still lack contract settlement parity.
- Community content is not generated from a shared source of truth yet.
- Contract randomness is alpha-grade and not suitable for valuable rare drops.
- Main economy content has no formal balance-report gate.
- Deployment records do not yet include content source hashes.
- There is no incident response, pause, migration, or deprecation process for live content.

## Priority Path

1. Keep `npm run verify` green on every change.
2. Add contract tests for every supported Chain mode path.
3. Extract core content into structured data and generate TypeScript maps from it.
4. Generate frontend chain IDs, Solidity lookup data, and test fixtures from the same source.
5. Port remaining local activity settlement paths into contract parity only after the generator path is in place.
6. Add schema validation and balance-report tooling for full content definitions.
7. Replace alpha rare-drop randomness before promoting valuable drops.
8. Add deployment metadata with content hashes and verification instructions.
9. Commission external Solidity review before any mainnet or valuable public deployment.
