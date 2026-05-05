# Eidolon -- Hackathon Judge Quick-Start

> **Time budget:** 5 minutes to run it yourself, or 2 minutes to watch the demo.

---

## 1. What You're Looking At (30 seconds)

Eidolon is a protocol for **AI souls** (ERC-7857 iNFTs) that live, remember, and
drift between worlds on the **0G network**. A soul is minted in a medieval Tavern,
builds memories through conversation, gets listed on a marketplace, is purchased
by a new owner, and then **drifts** -- the oracle re-encrypts its memory via TEE
and the soul **awakens in a cyberpunk Market**, referencing its past life
unprompted. Every step is on-chain; every memory is decentralized.

**One sentence:** Persistent AI identity that survives ownership transfer across
entirely different worlds, powered by six 0G infrastructure components.

---

## 2. If You Only Have 2 Minutes

Watch the demo video and skip the rest:

> **[Demo Video (placeholder)](https://example.com/eidolon-demo)**

---

## 3. Burner Wallet Setup

You need a fresh wallet with testnet/mainnet 0G tokens.

```bash
# Generate a new key (never reuse a real wallet)
cast wallet new
# Note the private key and address

# Get OG from the faucet (testnet) or use existing mainnet OG:
# https://faucet.0g.ai
```

Save the private key -- you will paste it into `.env.local` below.

---

## 4. Step-by-Step: Clone to Awakening

### 4.1 Clone and install

```bash
git clone <REPO_URL> eidolon && cd eidolon
pnpm install          # requires Node >= 20, pnpm >= 9
```

### 4.2 Configure

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in:

| Variable              | Value                              |
|-----------------------|------------------------------------|
| `DEPLOYER_PRIVATE_KEY`| Your burner wallet private key     |
| `DEPLOYER_ADDRESS`   | Your burner wallet address          |
| `OG_NETWORK`         | `mainnet` (contracts are deployed)  |

The contract addresses are pre-filled (already deployed on 0G mainnet).

### 4.3 Verify environment

```bash
pnpm verify
```

This checks RPC connectivity, contract deployment, and LLM availability.
Expect green checkmarks for all items.

### 4.4 Run the Tavern (World A -- medieval, port 3001)

```bash
pnpm dev:tavern
# Open http://localhost:3001
```

**What to do in the Tavern:**
1. Click **Mint Soul** -- this creates an ERC-7857 iNFT on-chain.
2. Talk to your soul (you get **3 actions**). The soul builds memories from each conversation.
3. After 3 actions, the soul's chapter ends. Click **List on Marketplace**.

### 4.5 Run the Market (World B -- cyberpunk, port 3002)

```bash
# In a second terminal:
pnpm dev:market
# Open http://localhost:3002
```

**What to do in the Market:**
1. Browse the marketplace -- your listed soul appears.
2. **Buy** the soul (on-chain transaction, 2.5% creator royalty applied).
3. The oracle re-encrypts the soul's memory via Compute TEE.
4. Click **Awaken** and watch the soul wake up in the cyberpunk world.

### 4.6 The Magic Moment

After awakening, talk to the soul. **It references its past life in the Tavern
without being prompted.** Memories persist across worlds and ownership transfers,
encrypted and decentralized on 0G Storage.

---

## 5. Architecture at a Glance

```
  WORLD A (Tavern :3001)              WORLD B (Market :3002)
  +-------------------+               +-------------------+
  |  Next.js frontend |               |  Next.js frontend |
  |  mint / act (x3)  |               |  buy / awaken     |
  +--------+----------+               +--------+----------+
           |                                    |
           v                                    v
  +--------------------------------------------------+
  |               Soul SDK  (@eidolon/sdk)            |
  +--------+---------+---------+---------+------------+
           |         |         |         |
  +--------+-+ +-----+---+ +--+------+ ++----------+
  | 1. Chain | | 2. Stor. | | 3. Stor.| | 4. Comp. |
  |  (0G L1) | |   Log    | |   KV    | |   TEE    |
  |  ERC-7857| | memories | | soul    | | oracle   |
  |  iNFTs   | | + acts   | | state   | | re-encr. |
  +----------+ +----------+ +---------+ +----------+
                                 |
                          +------+-------+
                          | 5. ERC-7857  |   6. Persistent Memory
                          | token std    |   (ready, via Storage KV)
                          +--------------+
```

**Six 0G components used:**

| # | Component          | Role in Eidolon                          |
|---|--------------------|------------------------------------------|
| 1 | Chain (L1)         | NFT ownership, marketplace, royalties    |
| 2 | Storage Log        | Immutable memory/action history          |
| 3 | Storage KV         | Mutable soul state and world metadata    |
| 4 | Compute TEE        | Oracle re-encrypts memories during drift |
| 5 | ERC-7857           | iNFT token standard for souls            |
| 6 | Persistent Memory  | Cross-world memory continuity (ready)    |

---

## 6. Key Source Files for Code Review

| Area            | Path                                              |
|-----------------|---------------------------------------------------|
| Soul NFT        | `packages/contracts/src/SoulNFT.sol`              |
| Marketplace     | `packages/contracts/src/Marketplace.sol`           |
| Oracle Registry | `packages/contracts/src/OracleRegistry.sol`        |
| ERC-7857 iface  | `packages/contracts/src/interfaces/IERC7857.sol`  |
| Drift flow test | `packages/contracts/test/DriftFlow.t.sol`          |
| Royalty test    | `packages/contracts/test/RoyaltyFlow.t.sol`        |
| Soul SDK core   | `packages/sdk/src/soul.ts`                         |
| Memory system   | `packages/sdk/src/memory.ts`                       |
| Persistent mem. | `packages/sdk/src/memory/PersistentMemoryProvider.ts` |
| On-chain crypto | `packages/sdk/src/crypto.ts`                       |
| Imprint logic   | `packages/sdk/src/imprint.ts`                      |
| Oracle service  | `packages/oracle/src/index.ts`                     |
| Tavern frontend | `packages/world-tavern/app/tavern/page.tsx`        |
| Market frontend | `packages/world-market/app/market/page.tsx`        |
| Deploy script   | `packages/contracts/script/Deploy.s.sol`           |

**Contracts on 0G mainnet (chain ID 16661):**

| Contract        | Address                                      |
|-----------------|----------------------------------------------|
| SoulNFT         | `0xa300aF5F0E20d974F20E55E71BB4229aE0A404be` |
| Marketplace     | `0xC084835B0e3cd8B344Fa5Feb6429960EBbC830Ac` |
| OracleRegistry  | `0x3cf95f18E9D49Dd88E69872D5C24e75a982e93FC` |

Explorer: [chainscan.0g.ai](https://chainscan.0g.ai)

---

## 7. Quick Reference

- **Forge tests:** `cd packages/contracts && forge test` -- 12/12 passing
- **Soul royalty:** 2.5% default on every marketplace sale
- **Full lifecycle:** mint -> act (x3) -> list -> buy -> drift (oracle TEE) -> awaken
- **Monorepo:** pnpm workspaces -- `packages/{contracts, sdk, oracle, world-tavern, world-market}`
