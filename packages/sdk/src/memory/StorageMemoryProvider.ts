import type { IMemoryProvider, Memory, MemoryRef } from './IMemoryProvider.js';
import { uploadBlob, kvSet, kvGet } from '../storage.js';
import { relevantMemories } from '../memory.js';
import type { Memory as LegacyMemory, WorldContext } from '../types.js';
import { randomBytes } from 'crypto';

/**
 * StorageMemoryProvider wraps the existing 0G Storage Log (uploadBlob) and KV
 * (kvSet/kvGet) helpers to expose them behind IMemoryProvider.
 */
export class StorageMemoryProvider implements IMemoryProvider {
  readonly providerName = 'og-storage-v1';

  /** In-memory buffer flushed on flush() */
  private pending: Array<{ soulId: bigint; memory: Memory }> = [];

  async appendMemory(soulId: bigint, memory: Memory): Promise<MemoryRef> {
    const payload = new TextEncoder().encode(JSON.stringify(memory, bigintReplacer));
    const { rootHash } = await uploadBlob(payload);

    // Index by soul + world in KV for later queryByWorld
    const indexKey = `soul:${soulId}:world:${memory.world}`;
    const existing = await kvGet(indexKey);
    const ids: string[] = existing ? JSON.parse(existing) : [];
    ids.push(memory.id);
    await kvSet(indexKey, JSON.stringify(ids));

    // Also maintain a full id list per soul for queryRelevant
    const allKey = `soul:${soulId}:memories`;
    const allExisting = await kvGet(allKey);
    const allIds: string[] = allExisting ? JSON.parse(allExisting) : [];
    allIds.push(memory.id);
    await kvSet(allKey, JSON.stringify(allIds));

    // Store the memory blob keyed by id
    await kvSet(`mem:${memory.id}`, JSON.stringify(memory, bigintReplacer));

    return {
      id: memory.id,
      rootHash: (rootHash.startsWith('0x') ? rootHash : `0x${rootHash}`) as `0x${string}`,
      storageURI: `og://storage/${rootHash}`,
    };
  }

  async queryRelevant(soulId: bigint, query: string, k: number): Promise<Memory[]> {
    const allKey = `soul:${soulId}:memories`;
    const raw = await kvGet(allKey);
    if (!raw) return [];
    const ids: string[] = JSON.parse(raw);
    const memories = await this.loadMemories(ids);

    // Delegate scoring to the existing relevantMemories helper by converting
    // to legacy Memory format and building a minimal WorldContext.
    const legacyMems: LegacyMemory[] = memories.map(toLegacy);
    const ctx: WorldContext = {
      worldId: '',
      worldName: '',
      worldDescription: query,
      scenePrompt: '',
      npcsPresent: [],
    };
    const relevant = relevantMemories(legacyMems, ctx, query, k);
    const relevantIds = new Set(relevant.map((m) => m.id));
    return memories.filter((m) => relevantIds.has(m.id));
  }

  async queryByWorld(soulId: bigint, world: string): Promise<Memory[]> {
    const indexKey = `soul:${soulId}:world:${world}`;
    const raw = await kvGet(indexKey);
    if (!raw) return [];
    const ids: string[] = JSON.parse(raw);
    return this.loadMemories(ids);
  }

  async flush(): Promise<void> {
    const batch = this.pending.splice(0);
    for (const { soulId, memory } of batch) {
      await this.appendMemory(soulId, memory);
    }
  }

  // ── helpers ──────────────────────────────────────────────

  private async loadMemories(ids: string[]): Promise<Memory[]> {
    const results: Memory[] = [];
    for (const id of ids) {
      const raw = await kvGet(`mem:${id}`);
      if (raw) {
        results.push(JSON.parse(raw, bigintReviver));
      }
    }
    return results;
  }
}

/** Convert provider Memory to legacy SDK Memory for scoring */
function toLegacy(m: Memory): LegacyMemory {
  return {
    id: m.id,
    worldId: m.world,
    timestamp: m.timestamp,
    kind: m.eventType === 'imprint' ? 'event' : m.eventType === 'awakening' ? 'awakening' : 'event',
    summary: m.text.slice(0, 280),
    detail: m.text,
    relations: [],
  };
}

function bigintReplacer(_key: string, value: unknown): unknown {
  return typeof value === 'bigint' ? value.toString() : value;
}

function bigintReviver(key: string, value: unknown): unknown {
  if (key === 'soulId' && typeof value === 'string') return BigInt(value);
  return value;
}
