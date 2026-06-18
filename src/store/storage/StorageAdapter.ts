/**
 * KV storage abstraction. Decouples the store from the backing engine so we can
 * ship AsyncStorage now (Expo Go compatible) and swap to MMKV (dev client, faster)
 * later by changing one file. Async-tolerant so consumers never branch.
 *
 * Shape is compatible with zustand's `StateStorage`.
 */
export interface KVStorage {
  getItem(name: string): string | null | Promise<string | null>;
  setItem(name: string, value: string): void | Promise<void>;
  removeItem(name: string): void | Promise<void>;
}
