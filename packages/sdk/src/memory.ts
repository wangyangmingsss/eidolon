import type { Memory, WorldContext } from './types.js';

export function relevantMemories(memories: Memory[], ctx: WorldContext, userInput: string, k = 6): Memory[] {
  if (memories.length === 0) return [];
  const queryTokens = tokenize(`${ctx.worldDescription} ${ctx.scenePrompt} ${userInput}`);
  const scored = memories.map((m) => ({ m, score: score(queryTokens, m) }));
  const mostRecent = memories[memories.length - 1];
  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, k).map((s) => s.m);
  if (mostRecent && !top.includes(mostRecent)) {
    top[top.length - 1] = mostRecent;
  }
  return top;
}

function tokenize(s: string): string[] {
  return s.toLowerCase().match(/[a-z']+/g) ?? [];
}

function score(query: string[], m: Memory): number {
  const text = `${m.summary} ${m.detail}`.toLowerCase();
  let s = 0;
  for (const t of query) { if (text.includes(t)) s += 1; }
  if (m.worldId !== query[0]) s += 0.5;
  return s;
}
