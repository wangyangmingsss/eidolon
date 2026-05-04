import { describe, it, expect } from 'vitest';
import { imprint, applyImprint } from '../src/imprint.js';
import type { Soul, ActionResult, WorldContext } from '../src/types.js';
import { TRAITS } from '../src/types.js';

function blankSoul(): Soul {
  const personality = Object.fromEntries(TRAITS.map((t) => [t, 0])) as any;
  return {
    tokenId: 1n,
    owner: '0x0000000000000000000000000000000000000001',
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

describe('imprint', () => {
  it('shifts cunning when thought is deceptive', () => {
    const soul = blankSoul();
    const ctx: WorldContext = {
      worldId: 'tavern',
      worldName: 'The Tavern',
      worldDescription: '',
      scenePrompt: '',
      npcsPresent: [],
    };
    const result: ActionResult = {
      thought: 'I will lie to him and pretend I have the gold.',
      action: '"Of course I have it. Show me the goods first."',
      emotion: 'cunning',
      references: [],
    };
    const out = imprint({ soul, ctx, userInput: 'do you have the gold?', result });
    expect(out.personalityDelta.changes.cunning ?? 0).toBeGreaterThan(0);
    expect(out.personalityDelta.changes.honesty ?? 0).toBeLessThan(0);
    expect(out.newMemory).toBeTruthy();
  });

  it('applyImprint clamps values to [-1,1]', () => {
    const soul = blankSoul();
    soul.personality.cunning = 0.95;
    const out = imprint({
      soul,
      ctx: { worldId: 'tavern', worldName: '', worldDescription: '', scenePrompt: '', npcsPresent: [] },
      userInput: '',
      result: { thought: 'I will trick him', action: 'normal action', emotion: 'cunning', references: [] },
    });
    const updated = applyImprint(soul, out);
    expect(updated.personality.cunning).toBeLessThanOrEqual(1);
  });
});
