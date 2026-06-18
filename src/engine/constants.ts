/**
 * Engine constants: occasions, styles, curated exemplar pairings, thresholds.
 * Ported verbatim from the prototype (lines ~655-682, 9.6 / 9.9 / Appendix B).
 */
import type { ClothType, Occasion, StyleName } from './types';

export const OCC: Occasion[] = ['Everyday', 'Office', 'Date night', 'Party', 'Travel'];

export const OCC_PHRASE: Record<Occasion, string> = {
  Everyday: 'everyday wear',
  Office: 'the office',
  'Date night': 'date night',
  Party: 'a night out',
  Travel: 'travel',
};

export const STYLES: StyleName[] = ['Minimal', 'Classic', 'Bold', 'Statement'];

/** Curated exemplar pairings per style (top/bottom interchangeable). Appendix B. */
export const GOOD: Record<StyleName, [string, string][]> = {
  Minimal: [
    ['White', 'Grey'],
    ['Beige', 'Cream'],
    ['Black', 'Grey'],
    ['White', 'Beige'],
    ['Grey', 'Charcoal'],
  ],
  Classic: [
    ['White', 'Navy'],
    ['Light Blue', 'Charcoal'],
    ['White', 'Grey'],
    ['Navy', 'Beige'],
    ['Blue', 'Grey'],
  ],
  Bold: [
    ['Burgundy', 'Grey'],
    ['Olive', 'Beige'],
    ['Mustard', 'Navy'],
    ['Forest Green', 'Cream'],
    ['Rust', 'Charcoal'],
  ],
  Statement: [
    ['Purple', 'Grey'],
    ['Olive', 'Cream'],
    ['Rust', 'Navy'],
    ['Burgundy', 'Beige'],
    ['Forest Green', 'Khaki'],
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

/** Optional clothing-type tags. */
export const CLOTH: { id: ClothType; name: string }[] = [
  { id: 'casual', name: 'Casual' },
  { id: 'formal', name: 'Formal' },
  { id: 'gym', name: 'Gym' },
];

/** Tunable thresholds (§9.9). Exact prototype values — the starting tuning. */
export const UNIVERSE_THRESHOLD = 0.55;
export const GAP_THRESHOLD = 0.62;
