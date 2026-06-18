/**
 * Single source of truth for animation durations, honouring reduce-motion.
 * Mirrors the prototype's `@media (prefers-reduced-motion: reduce)` block, which
 * collapses all transitions to ~0 and hides the scan beam.
 */
import { useReducedMotion } from 'react-native-reanimated';

export interface Motion {
  reduced: boolean;
  /** Quick UI transitions (chips, pane swaps). */
  fast: number;
  /** Standard transitions (outfit fill, panel slide). */
  base: number;
  /** Deliberate moments (building count-up). */
  slow: number;
  /** Building screen total dwell before entering the app. */
  buildingTotal: number;
}

export function useMotion(): Motion {
  const reduced = useReducedMotion();
  return {
    reduced,
    fast: reduced ? 0 : 180,
    base: reduced ? 0 : 420,
    // Count-up still resolves (the number is information), just instantly.
    slow: reduced ? 0 : 650,
    buildingTotal: reduced ? 400 : 2750,
  };
}
