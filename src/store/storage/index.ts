import { asyncStorageAdapter } from './asyncStorageAdapter';
import type { KVStorage } from './StorageAdapter';

/** The active KV backend. Swap to mmkvAdapter (dev client) here when desired. */
export const activeStorage: KVStorage = asyncStorageAdapter;

export type { KVStorage };
