/**
 * Belt + shoe leather colour for an office look.
 *
 * Rule (authentic menswear, verified): belt = shoe, and the choice is made off the
 * TROUSER (bottom) colour only — the top is irrelevant. Black leather goes with the
 * cool / dark formal trousers (black, charcoal, grey, navy, burgundy, maroon, deep
 * purple); brown leather goes with blue and earth tones (blue, olive, khaki, beige,
 * cream, mustard, rust, forest green, white, brown). Never black with khaki/beige;
 * never brown with black trousers.
 */
import type { ColorKey, Leather } from './types';

/** Trouser colours that take BLACK leather (everything else takes brown). */
const BLACK_TROUSERS = new Set<ColorKey>([
  'Black', 'Charcoal', 'Grey', 'Navy', 'Burgundy', 'Maroon', 'Purple',
]);

/** The recommended belt = shoe leather colour for a look, from its trouser colour. */
export function leatherFor(bottom: ColorKey): Leather {
  return BLACK_TROUSERS.has(bottom) ? 'Black' : 'Brown';
}

/** Display hex for each leather colour (belt/shoe swatch). */
export const LEATHER_HEX: Record<Leather, string> = {
  Black: '#211C18',
  Brown: '#5A3B26',
};
