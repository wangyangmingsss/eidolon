import type { IMemoryProvider, Memory, MemoryRef } from './IMemoryProvider.js';

const ROADMAP_MSG =
  'PersistentMemoryProvider is roadmap-only — 0G Persistent Memory module GA pending';

export class PersistentMemoryProvider implements IMemoryProvider {
  readonly providerName = 'og-persistent-memory-v1';

  async appendMemory(_soulId: bigint, _memory: Memory): Promise<MemoryRef> {
    throw new Error(ROADMAP_MSG);
  }

  async queryRelevant(_soulId: bigint, _query: string, _k: number): Promise<Memory[]> {
    throw new Error(ROADMAP_MSG);
  }

  async queryByWorld(_soulId: bigint, _world: string): Promise<Memory[]> {
    throw new Error(ROADMAP_MSG);
  }

  async flush(): Promise<void> {
    throw new Error(ROADMAP_MSG);
  }
}
