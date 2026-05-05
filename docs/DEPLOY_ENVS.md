# Eidolon -- Environment Variables Reference

This document describes every environment variable used across the Eidolon project, covering smart-contract deployment, the Next.js frontend, and the Oracle service.

---

## 1. Overview Table

| Variable | Required | Default | Description |
|---|---|---|---|
| `OG_NETWORK` | Yes | `mainnet` | Target 0G network (`mainnet` or `testnet`). |
| `OG_RPC_URL` | No | Per-network default (see below) | JSON-RPC endpoint for the 0G chain. |
| `OG_STORAGE_INDEXER` | No | Per-network default (see below) | 0G Storage indexer URL. |
| `OG_COMPUTE_MARKETPLACE` | No | Per-network default (see below) | 0G Compute Marketplace inference URL. |
| `DEPLOYER_PRIVATE_KEY` | Yes | -- | Private key of the deployer wallet (64 hex chars, `0x`-prefixed). |
| `DEPLOYER_ADDRESS` | Yes | -- | Public address of the deployer wallet (`0x`-prefixed). |
| `ORACLE_PRIVATE_KEY` | Yes (oracle) | -- | Private key for the oracle service wallet. |
| `ORACLE_ADDRESS` | Yes (oracle) | -- | Public address of the oracle wallet. |
| `SOUL_NFT_ADDRESS` | No | `0xa300aF5F0E20d974F20E55E71BB4229aE0A404be` | Deployed SoulNFT contract address. |
| `MARKETPLACE_ADDRESS` | No | `0xC084835B0e3cd8B344Fa5Feb6429960EBbC830Ac` | Deployed Marketplace contract address. |
| `ORACLE_REGISTRY_ADDRESS` | No | `0x3cf95f18E9D49Dd88E69872D5C24e75a982e93FC` | Deployed OracleRegistry contract address. |
| `LLM_MODEL_PROVIDER` | No | Auto-filled by `verify` script | LLM provider identifier (e.g. `openai`). |
| `LLM_MODEL_NAME` | No | Auto-filled by `verify` script | LLM model name (e.g. `gpt-4o`). |
| `NEXT_PUBLIC_OG_NETWORK` | Yes (frontend) | `mainnet` | Network identifier exposed to the browser. |
| `NEXT_PUBLIC_SOUL_NFT_ADDRESS` | Yes (frontend) | -- | SoulNFT address exposed to the browser. |
| `NEXT_PUBLIC_MARKETPLACE_ADDRESS` | Yes (frontend) | -- | Marketplace address exposed to the browser. |
| `NEXT_PUBLIC_WC_PROJECT_ID` | Yes (frontend) | `6b610e7357b5cc0e328da21a18840b78` | WalletConnect project ID for wallet integration. |

## 2. Network Selection

`OG_NETWORK` controls which 0G chain the project targets. When the optional URL variables are omitted, defaults are resolved from `constants.ts`:

| Network | Chain ID | RPC URL | Storage Indexer | Compute Marketplace |
|---|---|---|---|---|
| **mainnet** | 16661 | `https://evmrpc.0g.ai` | `https://indexer-storage-mainnet-turbo.0g.ai` | `https://compute-marketplace.0g.ai/inference` |
| **testnet** | 16602 | `https://evmrpc-testnet.0g.ai` | `https://indexer-storage-testnet-turbo.0g.ai` | -- |

To override any endpoint, set the corresponding variable explicitly:

```bash
OG_NETWORK=testnet
OG_RPC_URL=https://my-custom-rpc.example.com
```

If you only set `OG_NETWORK`, the remaining URLs will be filled in automatically.

## 3. Wallet Configuration

Two wallet keypairs are used:

1. **Deployer** -- deploys and upgrades contracts, funds initial operations.
2. **Oracle** -- signs oracle responses and interacts with the OracleRegistry.

```bash
DEPLOYER_PRIVATE_KEY=0xabc123...   # 64 hex characters after 0x
DEPLOYER_ADDRESS=0x742d35Cc6634C0532925a3b844Bc9e7595f...
ORACLE_PRIVATE_KEY=0xdef456...
ORACLE_ADDRESS=0x8Ba1f109551bD432803012645Ac136ddd64DBA72
```

### Security Warnings

> **NEVER commit private keys to version control.**
>
> - Add `.env` and `.env.local` to `.gitignore` (already configured in this repo).
> - Use a secrets manager (Vercel Environment Variables, Docker secrets, AWS Secrets Manager) in production.
> - Rotate keys immediately if they are ever exposed in a commit, log, or CI artifact.
> - Use dedicated deployment wallets with limited funds -- do not reuse personal wallets.

## 4. Contract Addresses

After deploying the Eidolon contracts, record their addresses in `.env`. The defaults below are the current canonical deployments:

```bash
SOUL_NFT_ADDRESS=0xa300aF5F0E20d974F20E55E71BB4229aE0A404be
MARKETPLACE_ADDRESS=0xC084835B0e3cd8B344Fa5Feb6429960EBbC830Ac
ORACLE_REGISTRY_ADDRESS=0x3cf95f18E9D49Dd88E69872D5C24e75a982e93FC
```

If you redeploy contracts to new addresses, update these values **and** the corresponding `NEXT_PUBLIC_*` variables (Section 5) so the frontend points to the correct on-chain state.

## 5. Frontend (NEXT_PUBLIC_*) Variables

Variables prefixed with `NEXT_PUBLIC_` are inlined into the client-side JavaScript bundle at build time. They are **visible to end-users** in the browser -- never put secrets here.

```bash
NEXT_PUBLIC_OG_NETWORK=mainnet
NEXT_PUBLIC_SOUL_NFT_ADDRESS=0xa300aF5F0E20d974F20E55E71BB4229aE0A404be
NEXT_PUBLIC_MARKETPLACE_ADDRESS=0xC084835B0e3cd8B344Fa5Feb6429960EBbC830Ac
NEXT_PUBLIC_WC_PROJECT_ID=6b610e7357b5cc0e328da21a18840b78
```

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_OG_NETWORK` | Tells the frontend which chain to connect wallets to. |
| `NEXT_PUBLIC_SOUL_NFT_ADDRESS` | Used by the SDK/UI to read and mint Soul NFTs. |
| `NEXT_PUBLIC_MARKETPLACE_ADDRESS` | Used by the SDK/UI to interact with the marketplace. |
| `NEXT_PUBLIC_WC_PROJECT_ID` | WalletConnect Cloud project ID for wallet-connection modals. Obtain one at <https://cloud.walletconnect.com>. |

## 6. Oracle-Specific Variables

The oracle service is a long-running process that listens for on-chain requests and fulfills them with off-chain data.

**Required variables:**

| Variable | Description |
|---|---|
| `ORACLE_PRIVATE_KEY` | Signs oracle transactions. Must hold enough native gas tokens to submit responses. |
| `ORACLE_ADDRESS` | Corresponding public address; must be registered in the `OracleRegistry` contract. |
| `ORACLE_REGISTRY_ADDRESS` | Address of the deployed OracleRegistry contract the service reads from. |
| `OG_NETWORK` | Determines which RPC and chain ID the oracle connects to. |
| `OG_RPC_URL` | (Optional) Override the default RPC endpoint. |
| `LLM_MODEL_PROVIDER` | Provider for LLM inference (populated by `verify`). |
| `LLM_MODEL_NAME` | Model name for LLM inference (populated by `verify`). |

## 7. Vercel Deployment

When deploying the Next.js frontend to [Vercel](https://vercel.com), add the following environment variables in **Settings > Environment Variables** for the relevant environment (Production / Preview / Development):

**Required (all environments):**

```
NEXT_PUBLIC_OG_NETWORK        = mainnet
NEXT_PUBLIC_SOUL_NFT_ADDRESS   = 0xa300aF5F0E20d974F20E55E71BB4229aE0A404be
NEXT_PUBLIC_MARKETPLACE_ADDRESS = 0xC084835B0e3cd8B344Fa5Feb6429960EBbC830Ac
NEXT_PUBLIC_WC_PROJECT_ID      = 6b610e7357b5cc0e328da21a18840b78
```

**Optional (server-side API routes only, if used):**

```
OG_NETWORK
OG_RPC_URL
DEPLOYER_PRIVATE_KEY     # Only if the frontend triggers deploys -- generally NOT recommended
```

> **Tip:** For preview deployments against testnet, create a second set of values scoped to the *Preview* environment with `NEXT_PUBLIC_OG_NETWORK=testnet` and the corresponding testnet contract addresses.

Do **not** add `DEPLOYER_PRIVATE_KEY` or `ORACLE_PRIVATE_KEY` to Vercel unless the frontend absolutely needs server-side signing -- prefer running those operations from a secure backend or CLI.

## 8. Docker / Oracle Deployment

The Oracle service is typically deployed as a Docker container. Pass variables via `--env-file` or individual `-e` flags.

### Minimum `.env` for the Oracle container

```bash
OG_NETWORK=mainnet
ORACLE_PRIVATE_KEY=0x<64-hex-chars>
ORACLE_ADDRESS=0x<oracle-wallet>
ORACLE_REGISTRY_ADDRESS=0x3cf95f18E9D49Dd88E69872D5C24e75a982e93FC
LLM_MODEL_PROVIDER=openai
LLM_MODEL_NAME=gpt-4o
```

### Running with Docker

```bash
docker build -t eidolon-oracle -f Dockerfile.oracle .
docker run --env-file .env.oracle eidolon-oracle
```

### Using Docker secrets (Swarm / Compose)

For production, prefer Docker secrets over plain environment variables:

```yaml
# docker-compose.yml
services:
  oracle:
    image: eidolon-oracle
    environment:
      - OG_NETWORK=mainnet
      - ORACLE_REGISTRY_ADDRESS=0x3cf95f18E9D49Dd88E69872D5C24e75a982e93FC
    secrets:
      - oracle_private_key
secrets:
  oracle_private_key:
    external: true
```

> **Never bake private keys into a Docker image.** Always inject them at runtime through environment variables, secrets, or a vault.
