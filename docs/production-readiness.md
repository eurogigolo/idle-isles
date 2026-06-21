# Production Readiness

Idle Isles is currently an alpha prototype. Local mode is the broad gameplay surface; Chain mode is
a smaller deployed-contract slice. Production readiness requires closing that gap deliberately.

## Current Gate

Run before merging or deploying:

```bash
npm run verify
```

This checks linting, dependency audit, Solidity compilation, contract tests, and the production
frontend build.

## Ready Baseline

- Local Git repository initialized on `main`.
- Generated dependencies, builds, Hardhat artifacts, cache, and `.env` files are ignored.
- MIT license is declared at the repository and package level.
- CI workflow runs the same ordered verification gate.
- Contribution and security reporting docs exist.
- Production and development dependency audit currently reports zero vulnerabilities.

## Not Production Ready Yet

- Contracts are unaudited.
- Chain mode does not cover all local gameplay systems.
- Area unlocks and ship travel are local-only.
- Community content is not validated or generated from a shared source of truth.
- Contract randomness is alpha-grade and not suitable for valuable rare drops.
- Main economy content has no formal balance-report gate.
- Deployment records do not yet include content source hashes.
- There is no incident response, pause, migration, or deprecation process for live content.

## Priority Path

1. Keep `npm run verify` green on every change.
2. Add CI branch protection when hosted remotely.
3. Add contract tests for every supported Chain mode path.
4. Bring area unlocks and ship travel into contract parity.
5. Extract core content into structured data and generate TypeScript maps from it.
6. Add schema validation and balance-report tooling for content.
7. Generate frontend chain IDs, Solidity lookup data, and test fixtures from the same source.
8. Replace alpha rare-drop randomness before promoting valuable drops.
9. Add deployment metadata with content hashes and verification instructions.
10. Commission external Solidity review before any mainnet or valuable public deployment.
