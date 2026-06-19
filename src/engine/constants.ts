/**
 * Engine constants: occasions, styles, curated exemplar pairings, thresholds.
 * Ported verbatim from the prototype (lines ~655-682, 9.6 / 9.9 / Appendix B).
 */
import type { StyleName } from './types';

export const STYLES: StyleName[] = ['Minimal', 'Classic', 'Bold', 'Statement'];

/**
 * Curated exemplar pairings per style (top/bottom interchangeable), retuned with an
 * India sensibility (jewel + warm-earth combinations, gold/neutral-bridged), kept
 * within the existing 16 colours. New-colour research suggestions are mapped to the
 * closest existing colour (Teal/Emerald→Forest Green, Maroon→Burgundy,
 * Marigold→Mustard, Rani Pink→Purple).
 */
export const GOOD: Record<StyleName, [string, string][]> = {
  Minimal: [
    ['White', 'Navy'],
    ['Cream', 'Olive'],
    ['Beige', 'Khaki'],
    ['Grey', 'Charcoal'],
    ['Light Blue', 'Navy'],
    ['White', 'Charcoal'],
    ['Brown', 'Beige'],
  ],
  Classic: [
    ['White', 'Navy'],
    ['Light Blue', 'Charcoal'],
    ['Cream', 'Forest Green'],
    ['White', 'Burgundy'],
    ['Beige', 'Navy'],
    ['Grey', 'Navy'],
    ['Brown', 'Cream'],
    ['Maroon', 'Grey'],
  ],
  Bold: [
    ['Mustard', 'Navy'],
    ['Rust', 'Forest Green'],
    ['Burgundy', 'Grey'],
    ['Blue', 'Mustard'],
    ['Olive', 'Beige'],
    ['Purple', 'Mustard'],
    ['Maroon', 'Grey'],
    ['Brown', 'Olive'],
  ],
  Statement: [
    ['Purple', 'Mustard'],
    ['Mustard', 'Burgundy'],
    ['Forest Green', 'Rust'],
    ['Blue', 'Rust'],
    ['Purple', 'Grey'],
    ['Burgundy', 'Beige'],
    ['Maroon', 'Mustard'],
    ['Brown', 'Mustard'],
  ],
};

/**
 * Union of all curated style pairings, keyed "top|bottom" (single order, as in the
 * prototype). harmony()/catFor() check both orders explicitly.
 */
export const GOODSET: Set<string> = (() => {
  const s = new Set<string>();
  (Object.values(GOOD) as [string, string][][]).forEach((pairs) =>
    pairs.forEach(([a, b]) => s.add(a + '|' + b))
  );
  return s;
})();

/** Tunable thresholds (§9.9). Exact prototype values — the starting tuning. */
export const UNIVERSE_THRESHOLD = 0.55;
export const GAP_THRESHOLD = 0.62;
