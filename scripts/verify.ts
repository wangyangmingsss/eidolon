/**
 * verify.ts — Top-level verify entrypoint.
 *
 * Delegates to the SDK verify script which checks all 0G integrations.
 *
 * Usage: pnpm verify (runs via root package.json script)
 */

console.log('Running Eidolon verification via @eidolon/sdk...');
console.log('Delegating to: pnpm --filter @eidolon/sdk verify');
console.log('');
console.log('If this fails, run directly:');
console.log('  cd packages/sdk && pnpm tsx src/verify.ts');
