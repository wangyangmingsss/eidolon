import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { env } from './env.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '../../..');

const file = env.OG_NETWORK === 'mainnet'
  ? resolve(repoRoot, 'packages/contracts/addresses.mainnet.json')
  : resolve(repoRoot, 'packages/contracts/addresses.testnet.json');

let raw: Record<string, string> = {};
if (existsSync(file)) {
  raw = JSON.parse(readFileSync(file, 'utf-8'));
} else {
  console.warn(`Addresses file missing: ${file} — using placeholders`);
}

export const addresses = {
  SoulNFT: (raw.SoulNFT ?? '0x0000000000000000000000000000000000000000') as `0x${string}`,
  Marketplace: (raw.Marketplace ?? '0x0000000000000000000000000000000000000000') as `0x${string}`,
  OracleRegistry: (raw.OracleRegistry ?? '0x0000000000000000000000000000000000000000') as `0x${string}`,
  Oracle: (raw.Oracle ?? '0x0000000000000000000000000000000000000000') as `0x${string}`,
};
