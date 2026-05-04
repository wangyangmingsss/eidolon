import { ulid } from 'ulid';
import type { ActionResult, Soul, WorldContext, ImprintOutput, PersonalityDelta, Memory, Trait } from './types.js';

interface ImprintInput {
  soul: Soul;
  ctx: WorldContext;
  userInput: string;
  result: ActionResult;
}

const EMOTION_TO_DELTA: Record<string, Partial<Record<Trait, number>>> = {
  wary: { paranoia: 0.05, patience: 0.02 },
  amused: { humor: 0.05, empathy: 0.02 },
  furious: { cruelty: 0.04, mercy: -0.04 },
  curious: { curiosity: 0.05, wisdom: 0.02 },
  cunning: { cunning: 0.05, honesty: -0.03 },
  honest: { honesty: 0.05, cunning: -0.03 },
  defiant: { bravery: 0.04, pride: 0.03 },
  resigned: { patience: 0.04, ambition: -0.03 },
  tender: { empathy: 0.06, mercy: 0.03 },
};

export function imprint(inp: ImprintInput): ImprintOutput {
  const { soul, ctx, userInput, result } = inp;
  const delta: PersonalityDelta = { changes: {} };

  if (result.emotion) {
    const e = result.emotion.toLowerCase().split(/[\s,]/)[0] ?? '';
    const map = EMOTION_TO_DELTA[e];
    if (map) { for (const [k, v] of Object.entries(map)) { delta.changes[k as Trait] = v; } }
  }

  if (/i remember|last time|in my last life|once before/i.test(result.action)) {
    delta.changes.wisdom = (delta.changes.wisdom ?? 0) + 0.03;
  }

  if (looksDeceptive(result.thought, result.action)) {
    delta.changes.cunning = (delta.changes.cunning ?? 0) + 0.04;
    delta.changes.honesty = (delta.changes.honesty ?? 0) - 0.03;
  }

  const summary = buildSummary(result);
  const newMemory: Memory = {
    id: ulid(),
    worldId: ctx.worldId,
    timestamp: Math.floor(Date.now() / 1000),
    kind: classifyKind(result),
    summary,
    detail: `User: ${userInput}\nThought: ${result.thought}\nAction: ${result.action}`.slice(0, 2000),
    emotion: result.emotion,
    relations: extractRelations(ctx, result),
  };

  const newSkill = detectSkillUnlock(soul, result);
  return { newMemory, personalityDelta: delta, newSkill };
}

export function applyImprint(soul: Soul, out: ImprintOutput): Soul {
  const newPersonality = { ...soul.personality };
  for (const [k, v] of Object.entries(out.personalityDelta.changes)) {
    if (typeof v !== 'number') continue;
    const trait = k as Trait;
    const cur = newPersonality[trait];
    newPersonality[trait] = clamp(cur + v, -1, 1);
  }
  return {
    ...soul,
    personality: newPersonality,
    memories: out.newMemory ? [...soul.memories, out.newMemory] : soul.memories,
    skills: out.newSkill && !soul.skills.includes(out.newSkill) ? [...soul.skills, out.newSkill] : soul.skills,
    updatedAt: Math.floor(Date.now() / 1000),
  };
}

function clamp(x: number, lo: number, hi: number): number { return Math.max(lo, Math.min(hi, x)); }

function buildSummary(result: ActionResult): string {
  const base = result.action.split(/[.!?]/)[0]?.trim() ?? result.action;
  return base.slice(0, 280);
}

function classifyKind(_result: ActionResult): Memory['kind'] {
  if (/decide|choose|accept|refuse|sign|sell|buy/i.test(_result.action)) return 'decision';
  if (_result.action.includes('"') || /said|tell|ask|reply/i.test(_result.action)) return 'dialogue';
  return 'event';
}

function looksDeceptive(thought: string, action: string): boolean {
  const negative = /\b(lie|deceive|trick|fake|pretend|hide|conceal)\b/i;
  return negative.test(thought) && !negative.test(action);
}

function extractRelations(ctx: WorldContext, result: ActionResult) {
  return ctx.npcsPresent
    .filter((n) => result.action.toLowerCase().includes(n.name.toLowerCase()))
    .map((n) => ({ npc: n.id, trustDelta: result.emotion === 'furious' ? -0.1 : result.emotion === 'tender' ? 0.1 : 0 }));
}

function detectSkillUnlock(soul: Soul, result: ActionResult): string | null {
  const a = result.action.toLowerCase();
  if (!soul.skills.includes('haggle') && /haggle|barter|negotiate price/i.test(a)) return 'haggle';
  if (!soul.skills.includes('detect_lie') && /you('re| are) lying|i don'?t believe you/i.test(a)) return 'detect_lie';
  if (!soul.skills.includes('seduce') && /flirt|charm|seduce/i.test(a)) return 'seduce';
  return null;
}
