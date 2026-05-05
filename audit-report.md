# Eidolon Repository Audit Report

**Date:** 2026-05-04
**Spec:** Doc U1 -- Eidolon Upgrade Development Guide
**Submission Risk:** AMBER

## Risk Rationale

All core skeleton files present. Contracts compile cleanly and all 12 tests pass. SDK is fully implemented with zero TODOs and zero stubs across 1,209 lines. Mainnet contract addresses verified. The oracle package is missing 3 of 4 expected source files (watcher.ts, reencrypt.ts, settle.ts) -- logic may be consolidated into index.ts but does not match the spec layout. This single structural gap warrants **amber** rather than green.

---

## Category A -- Repo Skeleton

**Status: PASS (with warnings)**

### Top-level files

| File | Status |
|---|---|
| package.json | EXISTS |
| pnpm-workspace.yaml | EXISTS |
| .env.example | EXISTS |
| LICENSE | EXISTS |
| README.md | EXISTS |

### Docs (00-07)

All 8 documents present: 00_PROJECT_OVERVIEW through 07_SUBMISSION.

### packages/contracts

| File | Status |
|---|---|
| foundry.toml | EXISTS |
| src/Counter.sol | EXISTS |
| src/Marketplace.sol | EXISTS |
| src/OracleRegistry.sol | EXISTS |
| src/SoulNFT.sol | EXISTS |

### packages/sdk

| File | Status |
|---|---|
| package.json | EXISTS |
| src/index.ts | EXISTS |
| src/types.ts | EXISTS |
| src/soul.ts | EXISTS |
| src/crypto.ts | EXISTS |
| src/storage.ts | EXISTS |
| src/inference.ts | EXISTS |
| src/imprint.ts | EXISTS |
| src/prompts.ts | EXISTS |
| src/chain.ts | EXISTS |
| src/constants.ts | EXISTS |

### packages/oracle

| File | Status |
|---|---|
| src/index.ts | EXISTS |
| src/watcher.ts | **MISSING** |
| src/reencrypt.ts | **MISSING** |
| src/settle.ts | **MISSING** |

### Other packages

| Path | Status |
|---|---|
| packages/world-tavern | EXISTS |
| packages/world-market | EXISTS |
| scripts/verify.ts | EXISTS |

---

## Category B -- Contracts

**Status: PASS**

- `forge build`: Success (no compilation errors)
- `forge test`: **12 passed, 0 failed, 0 skipped**

| Test Suite | Passed |
|---|---|
| Counter.t.sol | 2 |
| DriftFlow.t.sol | 1 |
| Marketplace.t.sol | 2 |
| SoulNFT.t.sol | 7 |

---

## Category C -- SDK

**Status: PASS**

| File | Lines | TODOs | Stubs |
|---|---|---|---|
| addresses.ts | 47 | 0 | 0 |
| chain.ts | 137 | 0 | 0 |
| constants.ts | 27 | 0 | 0 |
| crypto.ts | 21 | 0 | 0 |
| env.ts | 38 | 0 | 0 |
| imprint.ts | 105 | 0 | 0 |
| index.ts | 11 | 0 | 0 |
| inference.ts | 86 | 0 | 0 |
| memory.ts | 26 | 0 | 0 |
| prompts.ts | 116 | 0 | 0 |
| soul.ts | 120 | 0 | 0 |
| storage.ts | 92 | 0 | 0 |
| types.ts | 75 | 0 | 0 |
| verify.ts | 308 | 0 | 0 |

**Totals:** 1,209 lines / 0 TODOs / 0 stubs

---

## Category D -- Worlds

**Status: PASS**

### world-tavern

- **Pages (3):** page.tsx, tavern/page.tsx, end/page.tsx
- **API routes (3):** act, mint, soul/[tokenId]
- **Components (6):** ChatLog, NPCPortrait, ParchmentCard, SoulPanel, TaskTracker, ThinkingDots

### world-market

- **Pages (2):** page.tsx, market/page.tsx
- **API routes (5):** act, awaken, buy, list, soul/[tokenId]
- **Components (6):** AwakeningTypewriter, DriftAnimation, ListingsGrid, NeonChatLog, SoulPanel, TerminalCard

---

## Category E -- Oracle

**Status: WARN**

Only `src/index.ts` exists. The spec expects four files: index.ts, watcher.ts, reencrypt.ts, settle.ts. The three missing files suggest oracle logic has been consolidated into a single entry point rather than separated per the spec.

---

## Category F -- On-chain

**Status: PASS**

### Address files

- `packages/contracts/addresses.mainnet.json` -- EXISTS
- `packages/contracts/addresses.testnet.json` -- EXISTS

### Verify output files

- `verify-output.json` (testnet) -- EXISTS
- `verify-output.mainnet.json` (mainnet) -- EXISTS

### Mainnet contract address verification

| Contract | Expected | Actual | Match |
|---|---|---|---|
| OracleRegistry | 0x37b8BCf9A8200AbE88A37222E451D3F835d49d12 | 0x37b8BCf9A8200AbE88A37222E451D3F835d49d12 | YES |
| SoulNFT | 0x8B2adf886aC76cf091E7Bb79f2a6E6BD66aC6D22 | 0x8B2adf886aC76cf091E7Bb79f2a6E6BD66aC6D22 | YES |
| Marketplace | 0x24cFaCaF9FA7557a9228678Ee3E3EE427f0A8E58 | 0x24cFaCaF9FA7557a9228678Ee3E3EE427f0A8E58 | YES |

Mainnet verify output confirms: `contractsDeployed: true`, all three contracts have on-chain code, wallet balance is 5.878 OG.

---

## Category H -- README

**Status: PASS**

- No TODO/TBD/PLACEHOLDER/COMING SOON markers found.
- No broken internal links detected.
- All external links are plausible (badge images, explorer URLs).
- References to "hackathon" are contextually appropriate (badge, roadmap, known limitations), not placeholders.

---

## Category J -- Tooling

**Status: PASS**

| Tool | Version |
|---|---|
| node | v20.20.2 |
| pnpm | 10.33.2 |
| forge | 1.6.0-v1.7.0 |
| cast | 1.6.0-v1.7.0 |
| jq | 1.7 |

---

## Summary

| Category | Status |
|---|---|
| A -- Repo Skeleton | PASS (3 oracle files missing) |
| B -- Contracts | PASS (12/12 tests) |
| C -- SDK | PASS (0 TODOs, 0 stubs) |
| D -- Worlds | PASS |
| E -- Oracle | WARN (3 of 4 files missing) |
| F -- On-chain | PASS (addresses verified) |
| H -- README | PASS |
| J -- Tooling | PASS |

**Overall: AMBER** -- The oracle package structure diverges from spec. All other categories pass cleanly.
