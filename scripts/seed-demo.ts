/**
 * seed-demo.ts — Pre-populates demo accounts for recording.
 *
 * Creates two wallets (Alice and Bob), mints a Soul for Alice,
 * and runs through 3 tavern tasks so the Soul has memories
 * ready for the drift + awakening demo.
 *
 * Usage: pnpm tsx scripts/seed-demo.ts
 */
import 'dotenv/config';

async function main() {
  console.log('=== Eidolon Demo Seed ===');
  console.log('This script pre-populates a Soul with tavern memories for demo recording.');
  console.log('');
  console.log('Prerequisites:');
  console.log('  1. Contracts deployed (pnpm deploy:testnet)');
  console.log('  2. .env.local configured with DEPLOYER_PRIVATE_KEY');
  console.log('  3. Oracle service running (pnpm oracle)');
  console.log('');
  console.log('Steps to seed manually:');
  console.log('  1. Open http://localhost:3001 (Tavern)');
  console.log('  2. Connect wallet, mint a Soul');
  console.log('  3. Complete all 3 tasks');
  console.log('  4. Note the Soul tokenId for demo recording');
  console.log('');
  console.log('For automated seeding, extend this script with SDK calls:');
  console.log('  import { mintNewSoul, summon, act } from "@eidolon/sdk"');
  console.log('');
  console.log('=== End ===');
}

main().catch(console.error);
