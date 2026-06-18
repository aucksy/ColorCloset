/**
 * Theme access. The theme choice is persisted in the app store (dark default);
 * this hook resolves it to the token object. No context needed — Zustand already
 * provides app-wide reactivity.
 */
import { useStore } from '@/store/useStore';
import { themes, type Theme } from './tokens';

export function useTheme(): Theme {
  const name = useStore((s) => s.theme);
  return themes[name];
}

export type { Theme };
