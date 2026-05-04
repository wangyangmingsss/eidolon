import { z } from 'zod';

// ─── Trait dimensions
export const TRAITS = [
  'honesty', 'cunning', 'bravery', 'curiosity', 'cruelty', 'loyalty',
  'greed', 'patience', 'eloquence', 'wisdom', 'humor', 'ambition',
  'empathy', 'paranoia', 'pride', 'mercy',
] as const;

export type Trait = typeof TRAITS[number];

// ─── PersonalityVector
export const PersonalitySchema = z.object(
  Object.fromEntries(TRAITS.map((t) => [t, z.number().min(-1).max(1)])) as Record<Trait, z.ZodNumber>,
);
export type PersonalityVector = z.infer<typeof PersonalitySchema>;

// ─── Memory
export const MemorySchema = z.object({
  id: z.string(),
  worldId: z.string(),
  timestamp: z.number(),
  kind: z.enum(['event', 'dialogue', 'decision', 'awakening']),
  summary: z.string().max(280),
  detail: z.string().max(2000),
  emotion: z.string().optional(),
  relations: z.array(z.object({ npc: z.string(), trustDelta: z.number().min(-1).max(1) })).default([]),
  embeddingHash: z.string().optional(),
});
export type Memory = z.infer<typeof MemorySchema>;

// ─── Soul
export const SoulSchema = z.object({
  tokenId: z.bigint(),
  owner: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  birthWorld: z.string(),
  worldHistory: z.array(z.string()),
  personality: PersonalitySchema,
  memories: z.array(MemorySchema),
  skills: z.array(z.string()).default([]),
  createdAt: z.number(),
  updatedAt: z.number(),
  version: z.number().default(1),
});
export type Soul = z.infer<typeof SoulSchema>;

// ─── Inference outputs
export const ActionResultSchema = z.object({
  thought: z.string(),
  action: z.string(),
  emotion: z.string().optional(),
  references: z.array(z.string()).default([]),
});
export type ActionResult = z.infer<typeof ActionResultSchema>;

// ─── World context
export interface WorldContext {
  worldId: string;
  worldName: string;
  worldDescription: string;
  scenePrompt: string;
  npcsPresent: Array<{ id: string; name: string; description: string }>;
  taskHint?: string;
}

// ─── Imprint deltas
export interface PersonalityDelta {
  changes: Partial<Record<Trait, number>>;
}

export interface ImprintOutput {
  newMemory: Memory | null;
  personalityDelta: PersonalityDelta;
  newSkill: string | null;
}
