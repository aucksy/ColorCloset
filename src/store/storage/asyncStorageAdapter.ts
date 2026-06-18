/**
 * AsyncStorage implementation of KVStorage — works in Expo Go, no native build.
 * To upgrade to MMKV later: add mmkvAdapter.ts (sync, dev client) and point
 * `activeStorage` (in ./index) at it. No store/engine changes required.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { KVStorage } from './StorageAdapter';

export const asyncStorageAdapter: KVStorage = {
  getItem: (name) => AsyncStorage.getItem(name),
  setItem: (name, value) => AsyncStorage.setItem(name, value),
  removeItem: (name) => AsyncStorage.removeItem(name),
};
