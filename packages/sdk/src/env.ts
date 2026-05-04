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
  DEPLOYER_PRIVATE_KEY: z.string().regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid private key').default('0x0000000000000000000000000000000000000000000000000000000000000001'),
  DEPLOYER_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid address').default('0x0000000000000000000000000000000000000001'),
  ORACLE_PRIVATE_KEY: z.string().regex(/^0x[a-fA-F0-9]{64}$/).optional(),
  ORACLE_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
  SOUL_NFT_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional().or(z.literal('')),
  MARKETPLACE_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional().or(z.literal('')),
  ORACLE_REGISTRY_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional().or(z.literal('')),
  LLM_MODEL_PROVIDER: z.string().optional(),
  LLM_MODEL_NAME: z.string().optional(),
});

// Lazy parse: only validate when first accessed (avoids build-time failures in Next.js)
let _env: z.infer<typeof EnvSchema> | null = null;

export const env: z.infer<typeof EnvSchema> = new Proxy({} as z.infer<typeof EnvSchema>, {
  get(_target, prop: string) {
    if (!_env) {
      _env = EnvSchema.parse(process.env);
    }
    return (_env as any)[prop];
  },
});
