# Eidolon Roadmap

Three-phase plan from hackathon prototype to production protocol.

---

## Phase 1 — Hackathon MVP ✅ (Complete)

> Prove the concept: AI Souls that drift between worlds on 0G.

| Deliverable | Status |
|---|---|
| ERC-7857 SoulNFT with oracle-mediated drift | ✅ Deployed on mainnet |
| Marketplace with escrow + royalty | ✅ Deployed on mainnet |
| OracleRegistry with trusted signer whitelist | ✅ Deployed on mainnet |
| Soul SDK — mint, summon, act, imprint, drift, awaken | ✅ Complete |
| 0G Storage Log integration (encrypted Soul blobs) | ✅ Live |
| 0G Storage KV integration (memory index) | ✅ Live |
| 0G Compute TEE integration (inference + signature verification) | ✅ Live |
| ECIES encryption/decryption (secp256k1) | ✅ Complete |
| World A: Tavern (medieval fantasy, 5 NPCs, 3 tasks) | ✅ Playable |
| World B: Market (cyberpunk neon, 3 NPCs, 2 tasks + awakening) | ✅ Playable |
| Cross-world memory persistence + awakening monologue | ✅ Working |
| Soul Royalty system (EIP-2981 style, 2.5% default, max 10%) | ✅ On-chain |
| Memory Provider Abstraction (IMemoryProvider, Storage + Persistent) | ✅ Complete |
| 16-dimensional personality vector with imprint evolution | ✅ Complete |
| Comprehensive Foundry test suite (12/12 passing) | ✅ Complete |
| Day-1 verification script (5-step 0G integration check) | ✅ Complete |

---

## Phase 2 — Hardening & Custody (Q3 2026)

> Remove hackathon shortcuts. Make it safe for real users with real assets.

| Deliverable | Description | Priority |
|---|---|---|
| Multi-sig oracle quorum | Replace single trusted oracle with M-of-N threshold signing. Prevents single point of failure for drift. | P0 |
| Account abstraction | Each player gets their own custody via ERC-4337 smart accounts. Remove the shared deployer key pattern. | P0 |
| Buyer refund timelock | If drift stalls for >N blocks, buyer can reclaim escrow. Requires oracle co-signature or timeout proof. | P0 |
| Persistent Memory module | Swap `StorageMemoryProvider` to `PersistentMemoryProvider` once 0G ships the module. Zero code change needed (factory pattern). | P1 |
| Enhanced personality model | Expand from 16 to 24+ trait dimensions. Add skill trees with branching specializations. | P1 |
| Mobile-responsive UI | Tavern and Market playable on mobile browsers. Touch-optimized controls. | P1 |
| Formal security audit | Third-party audit of SoulNFT, Marketplace, and OracleRegistry contracts. | P0 |
| Gas optimization | Reduce drift gas cost via batched operations and calldata compression. | P2 |

---

## Phase 3 — Open Protocol (Q4 2026+)

> Eidolon becomes a platform. Anyone can build worlds; Souls are a universal AI identity layer.

| Deliverable | Description | Priority |
|---|---|---|
| World Builder SDK | Open-source SDK + CLI for third parties to build new worlds. Soul integration in <100 lines. | P0 |
| Cross-chain drift | Bridge Souls to other EVM chains (Arbitrum, Base, etc.) via LayerZero or Hyperlane. | P1 |
| DAO governance | OracleRegistry managed by token-weighted DAO. Community votes on oracle additions/removals. | P1 |
| Soul breeding / fusion | Two Souls can merge personality vectors and memories into a new Soul. Novel IP generation. | P2 |
| Marketplace v2 | English auctions, Dutch auctions, bundle sales, trait-filtered search. | P1 |
| World builder incentives | Revenue share: world creators earn a fee when Souls act inside their world. | P2 |
| Reputation system | On-chain Soul reputation based on action history, world count, and age. | P2 |
| Decentralized oracle network | Replace centralized oracle with a permissionless network of TEE nodes. Staking + slashing. | P1 |

---

## Design Principles

1. **Souls are property rights.** The owner controls access to the Soul's intelligence. No backdoors.
2. **Worlds are sovereign.** Each world defines its own rules, NPCs, and aesthetics. The SDK handles the Soul layer.
3. **Privacy by default.** Soul metadata is always encrypted. Only the owner (or the oracle during drift) can read it.
4. **Composability over monolith.** Each 0G component (Chain, Storage, Compute, KV) is used for what it's best at. No component does double duty.
5. **Progressive decentralization.** Start with a trusted oracle → multi-sig → DAO → permissionless network.
