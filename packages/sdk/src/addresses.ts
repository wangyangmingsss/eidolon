import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { env } from './env.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '../../..');

let _addresses: {
  SoulNFT: `0x${string}`;
  Marketplace: `0x${string}`;
  OracleRegistry: `0x${string}`;
  Oracle: `0x${string}`;
} | null = null;

function load() {
  if (_addresses) return _addresses;
  const file = env.OG_NETWORK === 'mainnet'
    ? resolve(repoRoot, 'packages/contracts/addresses.mainnet.json')
    : resolve(repoRoot, 'packages/contracts/addresses.testnet.json');

  let raw: Record<string, string> = {};
  if (existsSync(file)) {
    raw = JSON.parse(readFileSync(file, 'utf-8'));
  } else {
    console.warn(`Addresses file missing: ${file} — using placeholders`);
  }

  _addresses = {
    SoulNFT: (raw.SoulNFT ?? '0x0000000000000000000000000000000000000000') as `0x${string}`,
    Marketplace: (raw.Marketplace ?? '0x0000000000000000000000000000000000000000') as `0x${string}`,
    OracleRegistry: (raw.OracleRegistry ?? '0x0000000000000000000000000000000000000000') as `0x${string}`,
    Oracle: (raw.Oracle ?? '0x0000000000000000000000000000000000000000') as `0x${string}`,
  };
  return _addresses;
}

export const addresses = new Proxy({} as {
  SoulNFT: `0x${string}`;
  Marketplace: `0x${string}`;
  OracleRegistry: `0x${string}`;
  Oracle: `0x${string}`;
}, {
  get(_target, prop: string) {
    return (load() as any)[prop];
  },
});
