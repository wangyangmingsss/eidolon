import { describe, it, expect } from 'vitest';
import {
  createMemoryProvider,
  StorageMemoryProvider,
  PersistentMemoryProvider,
} from '../src/memory/index.js';

describe('Memory Provider Abstraction', () => {
  describe('createMemoryProvider', () => {
    it('returns StorageMemoryProvider for "storage" backend', () => {
      const provider = createMemoryProvider({ backend: 'storage' });
      expect(provider).toBeInstanceOf(StorageMemoryProvider);
    });

    it('returns PersistentMemoryProvider for "persistent" backend', () => {
      const provider = createMemoryProvider({ backend: 'persistent' });
      expect(provider).toBeInstanceOf(PersistentMemoryProvider);
    });

    it('throws for unknown backend', () => {
      expect(() => createMemoryProvider({ backend: 'nope' as any })).toThrow(/unknown/i);
    });
  });

  describe('StorageMemoryProvider', () => {
    it('has correct providerName', () => {
      const provider = new StorageMemoryProvider();
      expect(provider.providerName).toBe('og-storage-v1');
    });
  });

  describe('PersistentMemoryProvider', () => {
    it('has correct providerName', () => {
      const provider = new PersistentMemoryProvider();
      expect(provider.providerName).toBe('og-persistent-memory-v1');
    });

    it('appendMemory throws with roadmap-only message', async () => {
      const provider = new PersistentMemoryProvider();
      await expect(
        provider.appendMemory(1n, {
          id: 'test',
          soulId: 1n,
          world: 'w',
          eventType: 'imprint',
          text: 'hello',
          timestamp: Date.now(),
        }),
      ).rejects.toThrow(/roadmap-only/);
    });

    it('queryRelevant throws with roadmap-only message', async () => {
      const provider = new PersistentMemoryProvider();
      await expect(provider.queryRelevant(1n, 'test', 5)).rejects.toThrow(/roadmap-only/);
    });

    it('queryByWorld throws with roadmap-only message', async () => {
      const provider = new PersistentMemoryProvider();
      await expect(provider.queryByWorld(1n, 'world')).rejects.toThrow(/roadmap-only/);
    });

    it('flush throws with roadmap-only message', async () => {
      const provider = new PersistentMemoryProvider();
      await expect(provider.flush()).rejects.toThrow(/roadmap-only/);
    });
  });
});
