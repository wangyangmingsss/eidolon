import { config } from 'dotenv';
import { z } from 'zod';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Load .env.local first (real secrets), then .env (committed defaults)
const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '../../..');
config({ path: resolve(repoRoot, '.env.local') });
config({ path: resolve(repoRoot, '.env') });

const EnvSchema = z.object({
  OG_NETWORK: z.enum(['testnet', 'mainnet']).default('testnet'),
  OG_RPC_URL: z.string().optional(),
  OG_STORAGE_INDEXER: z.string().optional(),
  OG_COMPUTE_MARKETPLACE: z.string().optional(),
  DEPLOYER_PRIVATE_KEY: z.string().regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid private key'),
  DEPLOYER_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid address'),
  ORACLE_PRIVATE_KEY: z.string().regex(/^0x[a-fA-F0-9]{64}$/).optional(),
  ORACLE_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
  SOUL_NFT_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional().or(z.literal('')),
  MARKETPLACE_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional().or(z.literal('')),
  ORACLE_REGISTRY_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional().or(z.literal('')),
  LLM_MODEL_PROVIDER: z.string().optional(),
  LLM_MODEL_NAME: z.string().optional(),
});

export const env = EnvSchema.parse(process.env);
