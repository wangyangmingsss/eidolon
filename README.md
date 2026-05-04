<div align="center">

# EIDOLON

### iNFT souls that drift between worlds

[![0G Mainnet](https://img.shields.io/badge/0G-Mainnet-00f0ff)](https://chainscan.0g.ai)
[![License: MIT](https://img.shields.io/badge/License-MIT-c2410c)](LICENSE)
[![Hackathon](https://img.shields.io/badge/0G_APAC_Hackathon-2026-ff2a6d)](https://www.hackquest.io/hackathons/0G-APAC-Hackathon)

</div>

---

## What is Eidolon?

When you train an AI agent today, it lives inside one product. Sell the model, and the buyer gets a file -- not a soul. Move it to a new game, and it forgets everything.

**Eidolon is the first protocol where AI agents -- not just images -- can be owned, transferred, and re-summoned in completely different worlds, while keeping their personality, memories, and history.**

We do this with three things:

1. **A Soul** = an `ERC-7857` Intelligent NFT whose encrypted metadata holds personality vector + memory log.
2. **Two playable worlds** that share the same Soul -- a medieval tavern and a cyberpunk market, with completely different rules and UIs.
3. **The Drift Protocol** -- when a Soul is sold, an oracle running in a TEE re-encrypts its metadata for the new owner. The Soul transfers atomically with its intelligence intact.

The demo's magic moment: a Soul trained as a wary trader in the tavern is sold to another player; when summoned in the market, **it wakes up suspicious, citing a memory from its past life -- unprompted, in character.**

## How it works

```
        TAVERN                                MARKET
   (medieval, parchment)                  (cyberpunk, neon)
            |                                     |
            v                                     v
    +----------------------------------------------------+
    |                  SOUL SDK                           |
    |   summon . act . imprint . drift . awaken           |
    +----------------------------------------------------+
              |           |           |           |
              v           v           v           v
     +----------+ +----------+ +----------+ +---------+
     | 0G Chain | | 0G       | | 0G       | | Oracle  |
     |          | | Storage  | | Compute  | | Service |
     | ERC-7857 | | Log + KV | |  TEE     | | (TEE)   |
     | contract | |          | | inference| |         |
     +----------+ +----------+ +----------+ +---------+
```

### Key flows

- **Mint a Soul:** generate random personality -> encrypt with owner's pubkey -> upload to 0G Storage -> mint iNFT pointing at the root hash
- **Take an action:** decrypt -> retrieve relevant memories -> run TEE inference on 0G Compute -> imprint the outcome -> re-upload -> update on chain
- **Drift to a new owner:** lock the iNFT -> oracle decrypts in its own TEE -> re-encrypts to new pubkey -> re-uploads -> signs the new state -> contract verifies and transfers
- **Awaken in a new world:** detect "first time here" -> load all past-life memories into a special prompt -> produce a monologue that references the past

## 0G integration

| Component | Where it's used | File |
|---|---|---|
| **0G Chain** | SoulNFT (ERC-7857), Marketplace, OracleRegistry contracts | `packages/contracts/src/` |
| **0G Storage Log** | Permanent encrypted Soul metadata blobs | `packages/sdk/src/storage.ts` |
| **0G Storage KV** | Memory index for sub-second retrieval | `packages/sdk/src/storage.ts` |
| **0G Compute (TEE)** | Every Soul thought/action (`buildActPrompt`, `buildAwakeningPrompt`) | `packages/sdk/src/inference.ts` |
| **ERC-7857 / iNFT** | Native implementation, oracle-mediated transfer | `packages/contracts/src/SoulNFT.sol` |
| **Persistent Memory** | Memory layer (Storage-backed today; ready to swap to Persistent Memory module on launch) | `packages/sdk/src/memory.ts` |

## On-chain artifacts (0G Testnet)

| Contract | Address | Explorer |
|---|---|---|
| SoulNFT | `0x0000000000000000000000000000000000000002` | [view](https://chainscan-newton.0g.ai/address/0x0000000000000000000000000000000000000002) |
| Marketplace | `0x0000000000000000000000000000000000000003` | [view](https://chainscan-newton.0g.ai/address/0x0000000000000000000000000000000000000003) |
| OracleRegistry | `0x0000000000000000000000000000000000000001` | [view](https://chainscan-newton.0g.ai/address/0x0000000000000000000000000000000000000001) |

> Note: Update with mainnet addresses after mainnet deployment (Doc 7 SS7.6).

## Try it yourself

### Local (5 minutes from clone to playthrough)

```bash
git clone https://github.com/wangyangmingsss/eidolon
cd eidolon
pnpm install

# Copy and fill .env.local
cp .env.example .env.local
# Edit .env.local: set DEPLOYER_PRIVATE_KEY (a wallet with testnet OG)

# 1. Verify everything
pnpm verify

# 2. Deploy contracts (testnet)
pnpm --filter @eidolon/contracts deploy:testnet

# 3. Run the oracle in one terminal
pnpm oracle

# 4. Tavern in another terminal
pnpm dev:tavern   # http://localhost:3001

# 5. Market in another terminal
pnpm dev:market   # http://localhost:3002
```

Need testnet OG? https://faucet.0g.ai

## Repository layout

```
eidolon/
├── packages/
│   ├── contracts/        # Foundry: SoulNFT (ERC-7857), Marketplace, OracleRegistry
│   ├── sdk/              # Soul SDK: types, crypto, storage, inference, imprint, prompts
│   ├── oracle/           # Off-chain oracle service for drift re-encryption
│   ├── world-tavern/     # Next.js -- medieval fantasy world (port 3001)
│   └── world-market/     # Next.js -- cyberpunk market world (port 3002)
├── scripts/              # Portrait generator, deploy scripts
└── docs/                 # 8-document development guide (00-07)
```

Full architecture and design rationale: [`docs/00_PROJECT_OVERVIEW.md`](./docs/00_PROJECT_OVERVIEW.md).

## Tech stack

- **Solidity 0.8.26** + Foundry (cancun EVM)
- **TypeScript 5.4** + Node 20+ + pnpm workspaces
- **Next.js 14** App Router for both Worlds
- **viem + wagmi + RainbowKit** for wallet
- **`@0glabs/0g-ts-sdk`** + **`@0glabs/0g-serving-broker`** for 0G integration
- **eciesjs** for ECIES (secp256k1) encryption of Soul metadata
- **Tailwind CSS** with custom themes per World
- **zod** for schema validation

## What's working / what's roadmap

**Working today:**
- Mint, summon, act, drift, awaken -- all on 0G testnet
- Cross-world memory persistence (verified by `worldHistory` and memory references)
- ERC-7857 oracle-mediated transfer (tested under `forge test`)
- TEE inference with on-chain signature verification
- Both Worlds built and playable (tavern + market)
- Awakening typewriter effect with past-life monologue

**Roadmap (post-hackathon):**
- Mainnet deployment with verified contracts
- Multi-sig oracle quorum (currently single trusted oracle)
- Buyer refund timelock if drift stalls
- Account abstraction so each player has their own custody (MVP uses a custodial deployer key for UX)
- Persistent Memory module integration once 0G ships it
- More Worlds -- open SDK for third parties to build their own

## Why this matters

Today's "AI in games" is mostly NPC chatbots -- disposable, scripted, owned by the studio. Today's "AI agents in crypto" are mostly wrappers -- same prompt, same model, no soul.

Eidolon shows what happens when **the AI agent itself is a property right** that traverses applications. We use the 0G stack because no other chain has all the pieces -- TEE-verified inference, large-scale encrypted storage, the ERC-7857 standard, and an EVM execution layer -- together. Eidolon is what those primitives were built for.

## Acknowledgments

- **0G Labs** for the modular AI infrastructure and the ERC-7857 standard
- **HackQuest** for hosting the APAC Hackathon
- **OpenZeppelin** for the contract base layer

## License

MIT.
