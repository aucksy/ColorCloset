/**
 * Genuine style-archetype / heritage labels for a colour pairing.
 *
 * Per research: documented heritage associations (nautical, business classic,
 * Italian spezzato, Scandinavian minimalist, quiet-luxury tonal, military) ARE
 * defensible; single-country prevalence claims ("more common in France/Greece")
 * are NOT, so we never ship those. Returns null when nothing genuine matches — the
 * UI then shows no info line rather than inventing one.
 */
import type { ColorKey } from './types';

export function heritageFor(top: ColorKey, bottom: ColorKey): string | null {
  const has = (c: ColorKey) => top === c || bottom === c;
  const both = (set: ColorKey[]) => set.includes(top) && set.includes(bottom);

  // Navy/Blue + White — nautical heritage.
  if ((has('Navy') || has('Blue')) && has('White')) return 'Nautical heritage';
  // Charcoal/Grey + Navy — the business-classic pairing.
  if ((has('Charcoal') || has('Grey')) && has('Navy')) return 'Business classic';
  // Brown + a blue, worn as an odd top/bottom — Italian spezzato (mix-and-match).
  if (has('Brown') && (has('Navy') || has('Blue') || has('Light Blue'))) return 'Italian spezzato';
  // All-neutral black / grey / white — Scandinavian minimalist.
  if (both(['White', 'Grey', 'Black', 'Charcoal'])) return 'Scandinavian minimalist';
  // Tonal warm neutrals together — quiet-luxury tonal.
  if (both(['Beige', 'Cream', 'Khaki', 'Brown'])) return 'Quiet-luxury tonal';
  // Olive / khaki earth as a main colour — military / utilitarian roots.
  if (has('Olive') || has('Khaki')) return 'Military heritage';
  return null;
}
