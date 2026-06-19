/**
 * "What to buy" gap engine. For every colour the user does not own in a slot,
 * count how many existing pieces it pairs strongly with (threshold 0.62), ranked
 * by new-look count with a bonus if it flatters the user. Pure port of renderShop
 * (prototype lines ~1022-1033).
 */
import { KEYS, bottomScore } from './colors';
import { GAP_THRESHOLD } from './constants';
import { score } from './scoring';
import type { BuySuggestion, ColorKey, SkinObj } from './types';

/** A colour must be at least this plausible as trousers to be suggested as a bottom. */
const MIN_BOTTOM_SUITABILITY = 0.35;

export interface GapResult {
  /** Colours to add as tops (each pairs with existing bottoms). */
  asTops: BuySuggestion[];
  /** Colours to add as bottoms (each pairs with existing tops). */
  asBottoms: BuySuggestion[];
}

const sortF = (a: BuySuggestion, b: BuySuggestion) =>
  b.pairs.length + (b.fl ? 1.5 : 0) - (a.pairs.length + (a.fl ? 1.5 : 0));

export function gapSuggestions(
  tops: ColorKey[],
  bottoms: ColorKey[],
  skin: SkinObj | null
): GapResult {
  const ownT = new Set(tops);
  const ownB = new Set(bottoms);
  const flatter = skin ? skin.flatter : [];
  const asTops: BuySuggestion[] = [];
  const asBottoms: BuySuggestion[] = [];

  KEYS.forEach((c) => {
    // Only suggest a colour as a BOTTOM if it's a realistic trouser colour.
    if (!ownB.has(c) && bottomScore(c) >= MIN_BOTTOM_SUITABILITY) {
      const pairs: ColorKey[] = [];
      tops.forEach((t) => {
        if (score(t, c, skin) >= GAP_THRESHOLD) pairs.push(t);
      });
      if (pairs.length) asBottoms.push({ c, pairs, fl: flatter.includes(c) });
    }
    if (!ownT.has(c)) {
      const pairs: ColorKey[] = [];
      bottoms.forEach((b) => {
        if (score(c, b, skin) >= GAP_THRESHOLD) pairs.push(b);
      });
      if (pairs.length) asTops.push({ c, pairs, fl: flatter.includes(c) });
    }
  });

  asTops.sort(sortF);
  asBottoms.sort(sortF);
  return { asTops, asBottoms };
}
