import { describe, it, expect } from 'vitest';
import { buildActPrompt, buildAwakeningPrompt } from '../src/prompts.js';
import type { Soul, WorldContext } from '../src/types.js';
import { TRAITS } from '../src/types.js';

function soul(): Soul {
  const personality = Object.fromEntries(TRAITS.map((t) => [t, 0])) as any;
  personality.cunning = 0.8;
  personality.honesty = -0.4;
  return {
    tokenId: 1n,
    owner: '0x0',
    birthWorld: 'tavern',
    worldHistory: ['tavern'],
    personality,
    memories: [],
    skills: [],
    createdAt: 0,
    updatedAt: 0,
    version: 1,
  };
}
const ctx: WorldContext = {
  worldId: 'tavern',
  worldName: 'The Tavern',
  worldDescription: 'Smoky and dim',
  scenePrompt: 'You sit at a table.',
  npcsPresent: [{ id: 'bart', name: 'Bart', description: 'a wine merchant' }],
};

describe('prompts', () => {
  it('act prompt mentions strong traits', () => {
    const { system } = buildActPrompt(soul(), ctx, [], 'Bart approaches.');
    expect(system).toContain('cunning');
  });
  it('awakening prompt always asks for past-life reference', () => {
    const { system } = buildAwakeningPrompt(soul(), ctx, []);
    expect(system).toContain('Reference at least ONE specific memory');
  });
});
