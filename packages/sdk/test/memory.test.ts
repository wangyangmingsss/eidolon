import { describe, it, expect } from 'vitest';
import { relevantMemories } from '../src/memory.js';
import type { Memory, WorldContext } from '../src/types.js';

describe('memory retrieval', () => {
  it('returns top-K by lexical overlap', () => {
    const memories: Memory[] = [
      { id: 'm1', worldId: 'tavern', timestamp: 1, kind: 'event', summary: 'Bart cheated me on the wine', detail: '', relations: [] },
      { id: 'm2', worldId: 'tavern', timestamp: 2, kind: 'event', summary: 'I won a coin toss', detail: '', relations: [] },
      { id: 'm3', worldId: 'tavern', timestamp: 3, kind: 'event', summary: 'Sold a horse to the smith', detail: '', relations: [] },
    ];
    const ctx: WorldContext = {
      worldId: 'market',
      worldName: 'Market',
      worldDescription: 'A merchant offers wine',
      scenePrompt: '',
      npcsPresent: [],
    };
    const top = relevantMemories(memories, ctx, 'will he cheat me on the wine again?', 2);
    expect(top.map((m) => m.id)).toContain('m1');
  });
});
