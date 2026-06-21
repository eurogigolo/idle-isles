# Idle Isles

An onchain-first idle RPG prototype: Melvor-style passive progression, transferable ERC-1155 items, and a Hoard Hall market loop.

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

This runs linting, dependency audit, Solidity build, contract tests, and the production frontend
build in order.

## Contract Mode

Local simulation remains the default play mode. To enable the Chain toggle for a deployed
`IdleIsles` contract, copy `.env.example` to `.env`, then set the deployed core address:

```bash
VITE_IDLE_ISLES_ADDRESS=0x...
```

Then connect a wallet, switch to MegaETH Testnet, select `Chain`, and create or refresh the
onchain profile.

## Deploy

Set a funded MegaETH Testnet deployer key in `.env`:

```bash
MEGAETH_RPC_URL=https://carrot.megaeth.com/rpc
MEGAETH_PRIVATE_KEY=0x...
```

Deploy the content/core contract pair:

```bash
npm run deploy:megaeth
```

The deploy script writes `deployments/megaeth-testnet.json` and prints the
`VITE_IDLE_ISLES_ADDRESS` value for frontend Chain mode.

## Current Slice

- Browser-playable AFK activities with persisted local progress.
- Idle Isles area layer: all profiles begin in the Starter Area, while later zones are grouped behind an unlockable Outer Isles ship route.
- Harbor Merchant route panel for local ship travel; the first Outer Isles passage costs 50,000 Crowns.
- Combat, gathering, smithing, crafting, cooking, inventory, equipment, and claim loops.
- Hoard Hall order panel using in-game crowns, player listings, and 5% Realm Scavenger buy floors.
- Wallet connect and MegaETH Testnet network helper.
- Optional contract mode for profile reads, balances, `createProfile`, core activity starts, `claim`,
  `equip`, `unequip`, `eatFood`, marketplace order reads, listing, buying, cancellation, and ship
  travel between supported areas.
- Area unlocks and ship travel are onchain for Starter Area and Outer Isles; higher-tier activity
  parity is still being ported.
- MegaETH deploy script for `IdleIslesContent` + `IdleIsles`.
- Starter Solidity contract in `contracts/IdleIsles.sol`, plus immutable content for the expanded combat/light-armor item definitions.

## MegaETH Testnet

- Chain ID: `6343`
- RPC: `https://carrot.megaeth.com/rpc`
- Explorer: `https://megaeth-testnet-v2.blockscout.com`

## Contract Direction

`IdleIsles.sol` uses ERC-1155 items for transferable resources, gear, drops, and crowns. It includes:

- `createProfile`
- `startActivity`
- `claim`
- `equip`
- `createOrder`
- `buy`

The frontend defaults to local simulation mode so the game loop can be tuned while Chain mode exercises the deployed contract slice.

## Production Readiness

Idle Isles is not mainnet-production ready yet. The current production hardening plan is tracked in
[`docs/production-readiness.md`](docs/production-readiness.md).

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md). Gameplay rule changes should update
[`solidity-notes.md`](solidity-notes.md) when they affect contract behavior or future contract parity.

## License

MIT. See [`LICENSE`](LICENSE).
