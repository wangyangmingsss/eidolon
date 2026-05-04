// SINGLE SOURCE OF TRUTH for 0G endpoints.
// Doc 0 §0.7 — never hardcode endpoints elsewhere.

export const OG_ENDPOINTS = {
  mainnet: {
    chainId: 16661,
    rpcUrl: 'https://evmrpc.0g.ai',
    chainExplorer: 'https://chainscan.0g.ai',
    storageIndexer: 'https://indexer-storage-mainnet-turbo.0g.ai',
    storageExplorer: 'https://storagescan.0g.ai',
    computeMarketplace: 'https://compute-marketplace.0g.ai/inference',
  },
  testnet: {
    chainId: 16602,
    rpcUrl: 'https://evmrpc-testnet.0g.ai',
    chainExplorer: 'https://chainscan-newton.0g.ai',
    storageIndexer: 'https://indexer-storage-testnet-turbo.0g.ai',
    storageExplorer: 'https://storagescan-newton.0g.ai',
    computeMarketplace: 'https://compute-marketplace.0g.ai/inference',
  },
} as const;

export type OGNetwork = keyof typeof OG_ENDPOINTS;

export function getEndpoints(network: OGNetwork) {
  return OG_ENDPOINTS[network];
}
