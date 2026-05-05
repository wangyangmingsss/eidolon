# 0G Integration Deep Dive

> Proof that Eidolon integrates six distinct 0G ecosystem components
> into a single cohesive protocol for ownable, transferable AI agents.

---

## Summary Table

| # | Component | Role in Eidolon | Primary Source File(s) | On-Chain Evidence |
|---|-----------|----------------|------------------------|-------------------|
| 1 | **0G Chain (EVM, Chain ID 16661)** | Settlement layer for all Soul state transitions | `packages/contracts/src/SoulNFT.sol`, `Marketplace.sol`, `OracleRegistry.sol` | [SoulNFT](https://chainscan.0g.ai/address/0xa300aF5F0E20d974F20E55E71BB4229aE0A404be), [Marketplace](https://chainscan.0g.ai/address/0xC084835B0e3cd8B344Fa5Feb6429960EBbC830Ac), [OracleRegistry](https://chainscan.0g.ai/address/0x3cf95f18E9D49Dd88E69872D5C24e75a982e93FC) |
| 2 | **0G Storage Log** | Permanent encrypted Soul metadata blobs (personality + memories) | `packages/sdk/src/storage.ts` (lines 12-61) | Root hashes stored on-chain in `_metadataRoot` mapping |
| 3 | **0G Storage KV** | Memory index for sub-second retrieval during gameplay | `packages/sdk/src/storage.ts` (lines 63-92) | Best-effort layer; data mirrors Storage Log |
| 4 | **0G Compute Marketplace (TEE)** | TEE-verified inference for every Soul thought and action | `packages/sdk/src/inference.ts` (lines 1-86) | Signature verification via `@0glabs/0g-serving-broker` |
| 5 | **ERC-7857 / Intelligent NFT** | Oracle-mediated transfer with re-encryption (the Drift protocol) | `packages/contracts/src/SoulNFT.sol`, `interfaces/IERC7857.sol` | Contract implements IERC7857 interface on mainnet |
| 6 | **Persistent Memory (IMemoryProvider)** | Abstraction layer for pluggable memory backends | `packages/sdk/src/memory/` (4 files) | StorageMemoryProvider live; PersistentMemoryProvider ready for module GA |

---

## Data Flow Diagram -- Full Soul Lifecycle

The following ASCII diagram shows how all six components interact when a Soul
is minted, used in gameplay, sold (drifted), and awakened in a new world.

```
  PLAYER A (owner)                                         PLAYER B (buyer)
       |                                                        |
  [1] MINT                                                      |
       |                                                        |
       v                                                        |
  +-----------+   encrypt(personality+memories)                  |
  |  ECIES    |──────────────────────────┐                      |
  |  encrypt  |                          |                      |
  +-----------+                          v                      |
                               +------------------+             |
                               | (2) 0G STORAGE   |             |
                               |     LOG           |             |
                               | uploadBlob()     |             |
                               | -> rootHash      |             |
                               +--------+---------+             |
                                        |                       |
                                        v                       |
                               +------------------+             |
                               | (1) 0G CHAIN     |             |
                               | SoulNFT.mint()   |             |
                               | stores rootHash  |             |
                               +--------+---------+             |
                                        |                       |
  [2] ACT (gameplay)                    |                       |
       |                                |                       |
       v                                |                       |
  +-----------+   prompt (system+user)  |                       |
  | (4) 0G    |<────────────────────────+                       |
  | COMPUTE   |                                                 |
  | TEE infer |──> ActionResult + TEE signature                 |
  +-----------+         |                                       |
                        v                                       |
               +------------------+                             |
               | (6) MEMORY       |  appendMemory()             |
               | PROVIDER         |────────────┐                |
               | (StorageMemory   |            |                |
               |  Provider)       |            v                |
               +------------------+   +------------------+     |
                        |             | (3) 0G STORAGE   |     |
                        |             |     KV            |     |
                        |             | kvSet(index)     |     |
                        |             +------------------+     |
                        v                                       |
               +------------------+                             |
               | (2) 0G STORAGE   |  re-upload updated blob    |
               |     LOG           |                             |
               +--------+---------+                             |
                        |                                       |
                        v                                       |
               +------------------+                             |
               | (1) 0G CHAIN     |                             |
               | updateMetadata() |                             |
               +--------+---------+                             |
                        |                                       |
  [3] DRIFT (sell)      |                                       |
       |                |                                       |
       v                v                                       |
  +------------------+      +------------------+               |
  | (1) 0G CHAIN     |      |   ORACLE (TEE)   |               |
  | Marketplace      |      | decrypt old key  |               |
  | .buy()           |----->| re-encrypt for B  |               |
  | requestDrift()   |      | sign new root    |               |
  +------------------+      +--------+---------+               |
                                     |                          |
                                     v                          |
                            +------------------+               |
                            | (2) 0G STORAGE   |               |
                            |     LOG           |               |
                            | upload re-        |               |
                            | encrypted blob   |               |
                            +--------+---------+               |
                                     |                          |
                                     v                          |
                            +------------------+               |
                            | (1) 0G CHAIN     |               |
                            | completeDrift()  |────────────>  |
                            | verify sig       |          owns Soul
                            | transfer token   |               |
                            +------------------+               |
                                                                |
  [4] AWAKEN (new world)                                        |
       |                                                        v
       |                                               +-----------+
       |                                               | (5) ERC-  |
       |                                               | 7857 iNFT |
       |                                               | standard  |
       |                                               | enforces  |
       |                                               | lock      |
       |                                               +-----------+
       |                                                        |
       |                        +------------------+            |
       |                        | (3) 0G STORAGE   |<-----------+
       |                        |     KV            | queryByWorld()
       |                        | detect "first     | returns empty
       |                        | time in world"   | -> awakening
       |                        +--------+---------+
       |                                 |
       |                                 v
       |                        +------------------+
       |                        | (4) 0G COMPUTE   |
       |                        |     TEE           |
       |                        | buildAwakening   |
       |                        | Prompt -> infer  |
       |                        +------------------+
       |                                 |
       |                                 v
       |                          past-life monologue
       |                          referencing memories
       |                          from previous world
```

Legend: Numbers in parentheses correspond to the component numbers in this document.

---

## Component 1: 0G Chain (EVM, Chain ID 16661)

### What it does in the 0G ecosystem

0G Chain is the EVM-compatible settlement layer of the 0G network. It provides
standard Ethereum tooling (Solidity, Foundry, viem/wagmi) on a chain optimized
for AI workloads, with native integration points to 0G Storage and 0G Compute.

### How Eidolon uses it

Every Soul state transition is an on-chain transaction on 0G Chain. Three
contracts are deployed:

| Contract | Address | Deploy Tx |
|----------|---------|-----------|
| OracleRegistry | `0x3cf95f18E9D49Dd88E69872D5C24e75a982e93FC` | [`0x96791698...`](https://chainscan.0g.ai/tx/0x96791698007af7e8b2f3fdad63afed00685182be84fcbe091e48dc56697f5cdd) |
| SoulNFT | `0xa300aF5F0E20d974F20E55E71BB4229aE0A404be` | [`0x7b9f8486...`](https://chainscan.0g.ai/tx/0x7b9f848620f471423282c6048c97936a51e9f0e707572af554ea9bf6c0b19949) |
| Marketplace | `0xC084835B0e3cd8B344Fa5Feb6429960EBbC830Ac` | [`0xd69ec968...`](https://chainscan.0g.ai/tx/0xd69ec9689c3bef493affe62355e14d655ea95ec5a234c28d10f54c8c8d5da9df) |

Key on-chain operations:

- **`SoulNFT.mint()`** (line 86-108) -- Creates a new Soul, storing the
  encrypted metadata root hash and URI on-chain.
- **`SoulNFT.updateMetadata()`** (line 128-139) -- After gameplay, the owner
  writes the new root hash reflecting updated personality and memories.
- **`SoulNFT.requestDrift()`** (line 145-149) -- Locks the token and records
  the intended recipient, beginning the oracle-mediated transfer.
- **`SoulNFT.completeDrift()`** (line 152-186) -- Verifies the oracle signature,
  updates the metadata root, transfers ownership.
- **`Marketplace.buy()`** (line 73-85) -- Escrows payment and calls
  `requestDrift` on the SoulNFT contract.
- **`Marketplace.settle()`** (line 90-117) -- After drift completes, releases
  escrowed funds to the seller minus royalty.

### Key source files

- `packages/contracts/src/SoulNFT.sol` -- 221 lines, full ERC-7857 implementation
- `packages/contracts/src/Marketplace.sol` -- 128 lines, escrow + drift orchestration
- `packages/contracts/src/OracleRegistry.sol` -- 42 lines, trusted oracle registry
- `packages/contracts/src/interfaces/IERC7857.sol` -- 56 lines, iNFT interface
- `packages/contracts/src/interfaces/IOracle.sol` -- 6 lines, registry interface

### On-chain evidence

- Explorer links: [SoulNFT](https://chainscan.0g.ai/address/0xa300aF5F0E20d974F20E55E71BB4229aE0A404be) | [Marketplace](https://chainscan.0g.ai/address/0xC084835B0e3cd8B344Fa5Feb6429960EBbC830Ac) | [OracleRegistry](https://chainscan.0g.ai/address/0x3cf95f18E9D49Dd88E69872D5C24e75a982e93FC)
- Deployer: `0x762bC96708935dDbFc2d2fF0B32FCe98E23ec684`
- Oracle: `0x93f6720187F15E8BFf6068B5E2060198411cAf92` ([register tx](https://chainscan.0g.ai/tx/0x92bbfa9d9b76cadbc0076c617e1d4df8ddb46b466a3f5b26c101cfc6793671ab))

### Why it is essential

Without 0G Chain, there is no ownership record, no escrow, no oracle
verification, and no transfer mechanism. The Soul would have no provable owner
and no way to enforce the drift protocol. Every other component feeds into or
reads from state on this chain.

---

## Component 2: 0G Storage Log

### What it does in the 0G ecosystem

0G Storage Log is a decentralized blob storage system. Data is split into
segments, organized into a Merkle tree, and uploaded via indexer nodes. The
Merkle root hash acts as a content-addressable identifier that can be verified
on-chain.

### How Eidolon uses it

Every Soul's encrypted metadata -- its personality vector and full memory log --
is stored as a blob in 0G Storage Log. The SDK exposes two functions in
`packages/sdk/src/storage.ts`:

**`uploadBlob()` (lines 12-37):**

1. Writes the encrypted payload to a temp file (line 13-14).
2. Creates a `ZgFile` from the file path via `@0glabs/0g-ts-sdk` (line 18).
3. Computes the Merkle tree and extracts `rootHash` (lines 19-22).
4. Uploads via `Indexer.upload()` using the deployer's private key (lines 24-28).
5. Returns `{ rootHash, tx }` -- the root hash is then written on-chain via
   `SoulNFT.mint()` or `SoulNFT.updateMetadata()`.

**`downloadBlob()` (lines 40-61):**

1. Creates an `Indexer` instance pointing at the configured storage indexer
   (lines 42-44).
2. Downloads the blob by root hash to a temp file (line 48).
3. Implements a 3-retry loop with exponential backoff (`3000 * (i + 1)` ms)
   to handle transient indexer failures (lines 46-59).
4. Returns the raw `Uint8Array` which is then ECIES-decrypted by the owner.

### Data flow

```
encrypt(personality + memories)
       |
       v
  uploadBlob(encrypted bytes)
       |
       v
  ZgFile.fromFilePath() -> merkleTree() -> rootHash
       |
       v
  Indexer.upload() -> tx hash
       |
       v
  SoulNFT.mint(rootHash) or SoulNFT.updateMetadata(rootHash)
```

### Key source file

`packages/sdk/src/storage.ts`, lines 12-61.

### On-chain evidence

The `_metadataRoot` mapping in SoulNFT (line 31) stores the root hash returned
by `uploadBlob()`. Every `SoulMinted` and `MetadataUpdated` event on the
[SoulNFT contract](https://chainscan.0g.ai/address/0xa300aF5F0E20d974F20E55E71BB4229aE0A404be)
contains the root hash linking back to a blob in 0G Storage Log.

### Why it is essential

Without 0G Storage Log, there is nowhere to store the Soul's intelligence. The
on-chain contract holds only a 32-byte hash; the actual personality, memories,
and encrypted state live in Storage Log. Remove it and the NFT becomes an empty
shell -- a token with no AI behind it.

---

## Component 3: 0G Storage KV

### What it does in the 0G ecosystem

0G Storage KV is a key-value store built on top of the 0G storage layer,
providing fast lookups without full blob downloads. It is designed for
lightweight indexing and metadata that needs sub-second access times.

### How Eidolon uses it

Storage KV serves as the memory index layer, enabling fast retrieval of
individual memories during gameplay without downloading and decrypting the
entire metadata blob.

The SDK exposes two functions in `packages/sdk/src/storage.ts`:

**`kvSet()` (lines 76-86):**
- Wraps `KvClient.set()` from `@0glabs/0g-ts-sdk`.
- Returns `boolean` -- `true` on success, `false` on failure (best-effort).
- Used by `StorageMemoryProvider.appendMemory()` to index memories by three
  keys:
  - `soul:{soulId}:world:{worldName}` -- list of memory IDs per world (line 22-26 of StorageMemoryProvider.ts)
  - `soul:{soulId}:memories` -- full list of all memory IDs (lines 29-33)
  - `mem:{memoryId}` -- the serialized memory object itself (line 36)

**`kvGet()` (lines 88-92):**
- Wraps `KvClient.get()` with null fallback.
- Used by `StorageMemoryProvider.queryRelevant()` and `queryByWorld()` to load
  memory indices and individual memory records.

**Best-effort, non-blocking pattern (lines 64-73):**
- The `getKv()` helper lazily initializes the KV client.
- If `KvClient` is not available in the SDK build, `_kvClient` is set to `false`
  and all KV operations silently return `false`/`null`.
- This means the system degrades gracefully: if KV is down, memory lookups fall
  back to loading from Storage Log blobs.

### Key source files

- `packages/sdk/src/storage.ts`, lines 63-92 (KV wrapper)
- `packages/sdk/src/memory/StorageMemoryProvider.ts`, lines 17-93 (KV usage)

### On-chain evidence

KV data is off-chain by design. Its correctness is verifiable indirectly:
the memory IDs stored in KV correspond to memories whose content is also
persisted in Storage Log blobs whose root hashes appear on-chain in
`MetadataUpdated` events.

### Why it is essential

Without Storage KV, every memory query during gameplay would require
downloading the full encrypted blob from Storage Log, decrypting it, and
scanning all memories linearly. For a Soul with dozens of memories across
multiple worlds, this would make real-time gameplay interactions unacceptably
slow. KV provides the sub-second lookup that makes the "act" flow feel instant.

---

## Component 4: 0G Compute Marketplace (TEE)

### What it does in the 0G ecosystem

The 0G Compute Marketplace connects inference consumers to providers running
models inside Trusted Execution Environments (TEEs). Every response is
cryptographically signed by the TEE, proving it was generated by the declared
model without tampering. The marketplace handles discovery, billing, and
signature verification.

### How Eidolon uses it

Every Soul thought, action, and awakening monologue is generated via TEE
inference through the 0G Compute Marketplace. The full flow lives in
`packages/sdk/src/inference.ts`:

**Broker initialization (lines 9-22):**
1. Creates a `JsonRpcProvider` and `Wallet` connected to 0G Chain (line 13-14).
2. Imports `@0glabs/0g-serving-broker` and calls `createZGServingNetworkBroker(wallet)`
   (lines 15-17).
3. Acknowledges the configured provider signer on first use (line 19).

**`infer()` function (lines 41-86):**
1. Generates a unique request ID (line 48).
2. Calls `broker.inference.getRequestHeaders()` to obtain TEE-authenticated
   headers for the request (line 49).
3. Discovers the provider endpoint via `broker.inference.getServiceMetadata()`
   or falls back to the configured compute marketplace URL (lines 51-52).
4. Sends a standard OpenAI-format chat completion request with system and user
   messages (lines 54-69).
5. **TEE signature verification** (line 74): Calls
   `broker.inference.processResponse()` which verifies the TEE attestation
   signature on the response. Returns `signatureValid: boolean`.
6. Parses the response into a typed `ActionResult` via Zod schema validation
   (lines 76-83).
7. Returns `{ result, raw, signatureValid, providerId, modelName }`.

### Key source file

`packages/sdk/src/inference.ts` -- 86 lines, complete TEE inference pipeline.

### On-chain evidence

The broker contract interactions (provider acknowledgement, billing settlement)
occur on 0G Chain. The `signatureValid` flag in the `InferResponse` struct
(line 36) provides per-request proof that the inference was executed inside a
TEE and not tampered with.

### Why it is essential

Without 0G Compute, Souls cannot think. Every `act` call in the gameplay loop
requires an LLM inference to generate the Soul's response, personality drift,
and memory updates. Without TEE verification, there would be no guarantee that
the AI output was generated by the declared model -- an operator could inject
arbitrary responses, breaking the trust model that makes Soul ownership
meaningful.

---

## Component 5: ERC-7857 / Intelligent NFT

### What it does in the 0G ecosystem

ERC-7857 is a token standard proposed by 0G Labs for "Intelligent NFTs" (iNFTs).
It extends ERC-721 with encrypted metadata and oracle-mediated transfers.
Standard `transferFrom` is blocked; tokens can only change hands through a
two-phase drift protocol where a trusted oracle re-encrypts the token's
intelligence for the new owner.

### How Eidolon uses it

Eidolon's `SoulNFT.sol` is a native ERC-7857 implementation (not a wrapper).
The contract inherits from `IERC7857` (line 22 of SoulNFT.sol) and implements
every function defined in the interface.

**Interface definition (`interfaces/IERC7857.sol`, lines 10-56):**
- `mint()` -- create a new iNFT with encrypted metadata root
- `updateMetadata()` -- owner updates metadata after gameplay
- `requestDrift()` -- begin oracle-mediated transfer (locks token)
- `completeDrift()` -- oracle finalizes with signature + new encrypted root
- View functions: `metadataRootOf()`, `encryptedURIOf()`, `pendingDrift()`

**Transfer lock (`SoulNFT.sol`, lines 210-220):**

The `_update()` override is the enforcement mechanism:

```solidity
function _update(address to, uint256 tokenId, address auth)
    internal override returns (address)
{
    address from = _ownerOf(tokenId);
    if (from != address(0) && to != address(0) && auth != address(0)) {
        revert TokenLocked();
    }
    return super._update(to, tokenId, auth);
}
```

This blocks all standard ERC-721 transfers (`transferFrom`, `safeTransferFrom`).
The only way to move a Soul is through `completeDrift()`, which calls
`_update(newOwner, tokenId, address(0))` -- passing `auth = address(0)` to
bypass the lock (line 182).

**Oracle-mediated drift flow:**
1. `requestDrift(tokenId, to)` (line 145) -- sets `_pending[tokenId]` and
   emits `DriftRequested`.
2. Off-chain oracle detects the event, downloads the encrypted blob, decrypts
   with the old owner's key (inside its TEE), re-encrypts with ECIES for the
   new owner's public key, re-uploads to Storage Log, and signs the new root.
3. `completeDrift()` (line 152) -- verifies the oracle signature against the
   `OracleRegistry`, checks the nonce for replay protection, updates metadata,
   transfers ownership, and emits `DriftCompleted`.

**ECIES re-encryption during drift:**
The oracle uses `eciesjs` (secp256k1 curve) to decrypt the Soul blob with the
seller's private key and re-encrypt it with the buyer's public key. This
ensures that after drift, only the new owner can decrypt the Soul's
intelligence.

### Key source files

- `packages/contracts/src/SoulNFT.sol` -- lines 22 (implements IERC7857),
  86-108 (mint), 128-139 (updateMetadata), 145-149 (requestDrift),
  152-186 (completeDrift), 210-220 (_update lock)
- `packages/contracts/src/interfaces/IERC7857.sol` -- 56 lines, full interface

### On-chain evidence

- SoulNFT contract: [0xa300aF5F...](https://chainscan.0g.ai/address/0xa300aF5F0E20d974F20E55E71BB4229aE0A404be)
- `DriftRequested` and `DriftCompleted` events are visible in the contract's
  event log on the explorer.
- Attempting a standard `transferFrom` on this contract reverts with
  `TokenLocked()`.

### Why it is essential

Without ERC-7857, Souls would be standard ERC-721 tokens. A buyer would receive
the token but not the encrypted intelligence (they could not decrypt it).
Standard transfers would let anyone move a Soul without re-encrypting its data,
breaking the ownership-privacy model. The entire Drift protocol -- the core
innovation of Eidolon -- depends on this standard.

---

## Component 6: Persistent Memory (via IMemoryProvider Abstraction)

### What it does in the 0G ecosystem

0G's Persistent Memory module (upcoming) will provide a native, chain-integrated
memory layer for AI agents -- purpose-built for storing, indexing, and querying
agent memories with built-in vector search and lifecycle management.

### How Eidolon uses it

Eidolon implements a forward-looking abstraction layer that is production-ready
today on Storage Log + KV and designed to swap to the native Persistent Memory
module the moment it reaches GA.

**`IMemoryProvider` interface (`memory/IMemoryProvider.ts`, lines 1-7):**

```typescript
export interface IMemoryProvider {
  appendMemory(soulId: bigint, memory: Memory): Promise<MemoryRef>;
  queryRelevant(soulId: bigint, query: string, k: number): Promise<Memory[]>;
  queryByWorld(soulId: bigint, world: string): Promise<Memory[]>;
  flush(): Promise<void>;
  readonly providerName: string;
}
```

**Memory data model (lines 9-24):**
- `Memory` -- id, soulId, world, npc, eventType (`imprint`/`awakening`/`drift`),
  text, optional embedding, timestamp
- `MemoryRef` -- id, rootHash (0x-prefixed), storageURI (`og://storage/{hash}`)

**`StorageMemoryProvider` (`memory/StorageMemoryProvider.ts`, 117 lines):**
- `providerName = 'og-storage-v1'` (line 12)
- `appendMemory()` (lines 17-43): uploads memory blob via `uploadBlob()`,
  indexes by world and soul in KV via `kvSet()`, stores the full memory
  object in KV keyed by `mem:{id}`.
- `queryRelevant()` (lines 45-65): loads all memory IDs from KV, fetches
  each memory, delegates relevance scoring to the legacy `relevantMemories()`
  helper.
- `queryByWorld()` (lines 67-73): loads the world-specific index from KV and
  fetches matching memories. This is the function that detects "first time in
  this world" (empty result triggers awakening).
- `flush()` (lines 75-80): drains the in-memory pending buffer.

**`PersistentMemoryProvider` (`memory/PersistentMemoryProvider.ts`, 24 lines):**
- `providerName = 'og-persistent-memory-v1'` (line 7)
- All methods throw with the message: `'PersistentMemoryProvider is roadmap-only
  -- 0G Persistent Memory module GA pending'` (line 4)
- The class exists, compiles, and is exported -- ready for implementation
  the moment the 0G module ships.

**Factory pattern (`memory/index.ts`, lines 13-22):**

```typescript
export function createMemoryProvider(config: MemoryProviderConfig): IMemoryProvider {
  switch (config.backend) {
    case 'storage':    return new StorageMemoryProvider();
    case 'persistent': return new PersistentMemoryProvider();
    default: throw new Error(`Unknown memory backend: ${config.backend}`);
  }
}
```

Switching from `storage` to `persistent` is a one-line config change.

### Key source files

- `packages/sdk/src/memory/IMemoryProvider.ts` -- 24 lines, interface + types
- `packages/sdk/src/memory/StorageMemoryProvider.ts` -- 117 lines, live impl
- `packages/sdk/src/memory/PersistentMemoryProvider.ts` -- 24 lines, stub
- `packages/sdk/src/memory/index.ts` -- 22 lines, factory + exports

### On-chain evidence

Memory persistence is verifiable through the same `MetadataUpdated` events on
the SoulNFT contract. Each `appendMemory()` call triggers an `uploadBlob()`
whose root hash is eventually committed on-chain. The KV index entries
(`soul:{id}:world:{name}`, `soul:{id}:memories`, `mem:{id}`) provide the
indexing layer.

### Why it is essential

Without the memory provider abstraction, the system would be hardcoded to a
single storage backend with no upgrade path. The `IMemoryProvider` interface
ensures that:
- Gameplay code never depends on storage implementation details.
- The transition to 0G Persistent Memory requires zero changes to game logic.
- Memory operations (`appendMemory`, `queryRelevant`, `queryByWorld`) have
  well-defined semantics that any backend must satisfy.

Without memory persistence itself, Souls lose their defining characteristic:
the ability to remember past experiences across worlds. A Soul without memories
is just a stateless chatbot.

---

## Conclusion

Eidolon is not a superficial integration of 0G APIs. Each of the six components
fills a role that no other component can substitute:

1. **0G Chain** -- ownership, escrow, oracle verification, state finality
2. **0G Storage Log** -- permanent encrypted blob storage for Soul intelligence
3. **0G Storage KV** -- sub-second memory indexing for real-time gameplay
4. **0G Compute (TEE)** -- verifiable AI inference for every Soul action
5. **ERC-7857** -- the transfer-lock + oracle-mediated drift that makes AI
   ownership meaningful
6. **Persistent Memory** -- abstraction layer ensuring future-proof memory
   architecture

Remove any single component and a critical capability breaks:

| Removed | What breaks |
|---------|-------------|
| 0G Chain | No ownership, no escrow, no drift verification |
| Storage Log | Souls have no intelligence (empty NFTs) |
| Storage KV | Memory lookups take seconds instead of milliseconds |
| Compute TEE | Souls cannot think; no inference, no action |
| ERC-7857 | Standard transfers leak encrypted data; drift impossible |
| Memory Provider | No upgrade path; memories hardcoded to one backend |

The six components form a closed loop: Chain records ownership, Storage Log
holds the intelligence, Storage KV indexes it for fast access, Compute TEE
generates new thoughts, ERC-7857 governs how ownership transfers, and the
Memory Provider ensures the architecture scales to future 0G modules. Together
they enable the first protocol where AI agents are genuinely ownable,
transferable, and persistent across applications.
