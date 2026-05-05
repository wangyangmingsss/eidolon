# Mainnet Smoke Test Screenshots

This directory contains Explorer screenshots from the mainnet smoke test run.

## Screenshots

The following screenshots document on-chain transactions from the full lifecycle test:

1. **01-deploy-contracts.png** — Contract deployment transactions on [chainscan.0g.ai](https://chainscan.0g.ai)
2. **02-mint-soul.png** — SoulMinted event for token #1
3. **03-act-tavern.png** — MetadataUpdated events after 3 tavern actions
4. **04-list-marketplace.png** — Listed event on Marketplace contract
5. **05-buy-escrow.png** — Bought event + DriftRequested event
6. **06-drift-complete.png** — DriftCompleted event (oracle signature verified)
7. **07-awaken-market.png** — MetadataUpdated with awakening memory added
8. **08-storage-explorer.png** — Encrypted Soul blob on [storagescan.0g.ai](https://storagescan.0g.ai)

## Explorer Links

- SoulNFT: [chainscan.0g.ai/address/0xa300aF5F0E20d974F20E55E71BB4229aE0A404be](https://chainscan.0g.ai/address/0xa300aF5F0E20d974F20E55E71BB4229aE0A404be)
- Marketplace: [chainscan.0g.ai/address/0xC084835B0e3cd8B344Fa5Feb6429960EBbC830Ac](https://chainscan.0g.ai/address/0xC084835B0e3cd8B344Fa5Feb6429960EBbC830Ac)
- OracleRegistry: [chainscan.0g.ai/address/0x3cf95f18E9D49Dd88E69872D5C24e75a982e93FC](https://chainscan.0g.ai/address/0x3cf95f18E9D49Dd88E69872D5C24e75a982e93FC)

## How to Reproduce

```bash
# Run the full smoke test (requires funded deployer wallet)
pnpm smoke:mainnet
```

See `smoke-output.mainnet.json` in the repo root for all transaction hashes.
