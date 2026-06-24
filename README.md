# Idle Galactica

An on-chain-first space idle RPG prototype with ship progression, timed missions, ERC-1155 cargo, ship modules, and a Trade Relay market loop.

## Run

```bash
npm install
npm run dev
```

PowerShell may block `npm.ps1`; use `npm.cmd run dev` on Windows if needed.

## Verify

Run the full local gate before merging or deploying:

```bash
npm run verify
```

This runs linting, dependency audit, content ID validation, Solidity build, bytecode budget checks, contract tests, and the production frontend build.

## Chain Mode

Local simulation remains the default. To enable Chain mode for a deployed v2 contract set, copy `.env.example` to `.env`, then set:

```bash
VITE_IDLE_GALACTICA_ADDRESS=0x...
VITE_TRADE_RELAY_ADDRESS=0x...
```

Then connect a wallet, select Chain Mode, and create or sync the on-chain ship profile.

Chain mode supports:

- MOSS wallet with 24-hour gameplay sessions for seamless mission, module, repair, and claim actions.
- MetaMask or another injected wallet as a fallback.
- Explicit confirmations for higher-risk actions such as Trade Relay approvals/listing/buying and sector travel.

## Deploy Contracts

Set a funded MegaETH Testnet deployer key locally:

```bash
MEGAETH_RPC_URL=https://carrot.megaeth.com/rpc
MEGAETH_PRIVATE_KEY=0x...
IDLE_GALACTICA_METADATA_URI=ipfs://idle-galactica/{id}.json
```

Deploy the content/core/market contract set:

```bash
npm run deploy:megaeth
```

The deploy script writes `deployments/megaeth-testnet.json` and prints the `VITE_IDLE_GALACTICA_ADDRESS` and `VITE_TRADE_RELAY_ADDRESS` values for frontend Chain mode.

## Deploy Web App

The repository includes `railway.json` and a production `npm start` command. Railway builds the Vite app and serves the generated `dist/` folder on Railway's assigned `PORT`.

Set these Railway service variables before deploying:

```bash
VITE_IDLE_GALACTICA_ADDRESS=0x...
VITE_TRADE_RELAY_ADDRESS=0x...
```

Do not add `MEGAETH_PRIVATE_KEY` to the Railway frontend service. The deployer key is only needed locally when deploying fresh contracts.

Railway config-as-code uses:

```bash
npm ci && npm run build
npm start
```

## Current Slice

- Ten launch skills across gathering, production, and combat.
- Orbital Dock and Inner Belt sectors.
- Ship-centric progression through hull integrity, modules, cargo, repair supplies, and mission output.
- Gathering, production, and combat mission loops with local simulation and on-chain settlement.
- Trade Relay order panel using in-game Credits.
- MOSS gameplay sessions for low-friction repeated gameplay transactions.
- MetaMask fallback for standard injected wallet flows.
- Fresh v2 contracts: `IdleGalactica`, `IdleGalacticaContent`, and `TradeRelay`.

## MegaETH Testnet

- Chain ID: `6343`
- RPC: `https://carrot.megaeth.com/rpc`
- Explorer: `https://megaeth-testnet-v2.blockscout.com`

## Production Readiness

Idle Galactica is not mainnet-production ready yet. The current production hardening plan is tracked in [`docs/production-readiness.md`](docs/production-readiness.md).

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md). Gameplay rule changes should update contract notes when they affect contract behavior or future chain parity.

## License

MIT. See [`LICENSE`](LICENSE).
