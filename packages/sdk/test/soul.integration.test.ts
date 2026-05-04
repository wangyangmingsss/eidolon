// Skipped unless RUN_INTEGRATION=1 is set, because it hits 0G testnet.
import { describe, it, expect } from 'vitest';
import { mintNewSoul, summon, act, pubKeyFromPrivKey } from '../src/index.js';
import { env } from '../src/env.js';

const SHOULD_RUN = process.env.RUN_INTEGRATION === '1';

describe.skipIf(!SHOULD_RUN)('soul integration (testnet)', () => {
  it('mint → summon → act roundtrip', async () => {
    const pub = pubKeyFromPrivKey(env.DEPLOYER_PRIVATE_KEY as `0x${string}`);
    const { tokenId } = await mintNewSoul({
      ownerAddress: env.DEPLOYER_ADDRESS as `0x${string}`,
      ownerPubKeyHex: pub,
      birthWorld: 'tavern',
    });
    expect(tokenId).toBeGreaterThan(0n);

    const soul = await summon({ tokenId, ownerPrivKey: env.DEPLOYER_PRIVATE_KEY as `0x${string}` });
    expect(soul.tokenId).toBe(tokenId);

    const { result, updatedSoul } = await act({
      soul,
      ctx: {
        worldId: 'tavern',
        worldName: 'The Tavern',
        worldDescription: 'Smoky and dim',
        scenePrompt: 'A stranger sits across from you.',
        npcsPresent: [{ id: 'stranger', name: 'a stranger', description: 'a hooded figure' }],
      },
      userInput: 'The stranger says: "Care for a wager?"',
      ownerPubKeyHex: pub,
      ownerPrivKey: env.DEPLOYER_PRIVATE_KEY as `0x${string}`,
    });

    expect(result.action.length).toBeGreaterThan(0);
    expect(updatedSoul.memories.length).toBe(1);
  }, 120_000);
});
