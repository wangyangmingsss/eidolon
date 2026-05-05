export interface IMemoryProvider {
  appendMemory(soulId: bigint, memory: Memory): Promise<MemoryRef>;
  queryRelevant(soulId: bigint, query: string, k: number): Promise<Memory[]>;
  queryByWorld(soulId: bigint, world: string): Promise<Memory[]>;
  flush(): Promise<void>;
  readonly providerName: string;
}

export interface Memory {
  id: string;
  soulId: bigint;
  world: string;
  npc?: string;
  eventType: 'imprint' | 'awakening' | 'drift';
  text: string;
  embedding?: Float32Array;
  timestamp: number;
}

export interface MemoryRef {
  id: string;
  rootHash: `0x${string}`;
  storageURI: string;
}
