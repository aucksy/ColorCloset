/**
 * Theme access. The choice is persisted in the app store as 'system' | 'dark' | 'light'
 * and defaults to 'system' — so a fresh install follows the device appearance until the
 * user explicitly flips Dark/Light in the side menu. No context needed; Zustand already
 * provides app-wide reactivity, and useColorScheme re-renders on system theme changes.
 */
import { useColorScheme } from 'react-native';
import { useStore } from '@/store/useStore';
import { themes, type Theme } from './tokens';

export function useTheme(): Theme {
  const choice = useStore((s) => s.theme); // 'system' | 'dark' | 'light'
  const system = useColorScheme(); // 'dark' | 'light' | null
  const resolved = choice === 'system' ? (system === 'light' ? 'light' : 'dark') : choice;
  return themes[resolved];
}

export type { Theme };
