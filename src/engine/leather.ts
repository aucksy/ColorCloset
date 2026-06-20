/**
 * Belt + shoe leather colour for an office look.
 *
 * Rule (authentic menswear, verified): belt = shoe, and the choice is made off the
 * TROUSER (bottom) colour only — the top is irrelevant. Black leather goes with the
 * cool / dark formal trousers (black, charcoal, grey, navy, burgundy, deep purple);
 * brown leather goes with blue and earth tones (blue, light blue, olive, khaki,
 * beige, cream, mustard, rust, forest green, white, brown). Never black with
 * khaki/beige; never brown with black trousers.
 *
 * (17-colour world: "Maroon" is no longer a base — it is a shade of Burgundy — so
 * Burgundy carries the dark-red trousers into the black-leather set.)
 */
import type { ColorKey, Leather } from './types';

/** Trouser colours that take BLACK leather (everything else takes brown). */
const BLACK_TROUSERS = new Set<ColorKey>([
  'Black', 'Charcoal', 'Grey', 'Navy', 'Burgundy', 'Purple',
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
