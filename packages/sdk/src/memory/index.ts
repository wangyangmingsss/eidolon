export type { IMemoryProvider, Memory, MemoryRef } from './IMemoryProvider.js';
export { StorageMemoryProvider } from './StorageMemoryProvider.js';
export { PersistentMemoryProvider } from './PersistentMemoryProvider.js';

export interface MemoryProviderConfig {
  backend: 'storage' | 'persistent';
}

import type { IMemoryProvider } from './IMemoryProvider.js';
import { StorageMemoryProvider } from './StorageMemoryProvider.js';
import { PersistentMemoryProvider } from './PersistentMemoryProvider.js';

export function createMemoryProvider(config: MemoryProviderConfig): IMemoryProvider {
  switch (config.backend) {
    case 'storage':
      return new StorageMemoryProvider();
    case 'persistent':
      return new PersistentMemoryProvider();
    default:
      throw new Error(`Unknown memory backend: ${(config as any).backend}`);
  }
}
