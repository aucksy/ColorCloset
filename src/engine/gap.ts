/**
 * "What to buy" gap engine. For every colour the user does NOT own in a slot, count how
 * many pieces they already own in the opposite slot that it pairs strongly with (score
 * >= GAP_THRESHOLD), ranked by new-look count with a bonus when the candidate flatters
 * the user's skin tier. Avoided base pairs are never counted; bottoms must also clear a
 * minimum trouser-plausibility bar.
 *
 * Rebuilt for the gender×mode engine (ENGINE_REBUILD_SPEC §9): `score` now takes the
 * active `{gender,mode}` context (so the curated spine lifts real pairings), the skin
 * favour set is `SkinObj.flatterTops`, and suppressed pairs (`isAvoided`) are skipped.
 * Pure & dependency-free (no React-Native / store imports).
 */
import { KEYS, bottomScore } from './colors';
import { GAP_THRESHOLD } from './constants';
import { isAvoided, score } from './scoring';
import type { BuySuggestion, ColorKey, Gender, Mode, SkinObj } from './types';

/** A colour must be at least this plausible as trousers to be suggested as a bottom. */
const MIN_BOTTOM_SUITABILITY = 0.35;

export interface GapResult {
  /** Colours to add as tops (each pairs with existing bottoms). */
  asTops: BuySuggestion[];
  /** Colours to add as bottoms (each pairs with existing tops). */
  asBottoms: BuySuggestion[];
}

/**
 * Rank: more new looks first; a candidate that flatters the user's tier counts as worth
 * an extra 1.5 looks (a gentle nudge, not an override) so close ties favour the face.
 */
const sortF = (a: BuySuggestion, b: BuySuggestion) =>
  b.pairs.length + (b.fl ? 1.5 : 0) - (a.pairs.length + (a.fl ? 1.5 : 0));

/**
 * Suggest colours to buy for each slot, given the user's owned tops/bottoms, resolved
 * skin profile, and the active gender×mode bucket (threaded into `score` so curated
 * pairings rank correctly). A candidate is only considered against an existing piece
 * when the pair is not avoided; bottoms additionally need realistic trouser plausibility.
 */
export function gapSuggestions(
  tops: ColorKey[],
  bottoms: ColorKey[],
  skin: SkinObj | null,
  gender?: Gender,
  mode?: Mode
): GapResult {
  const ownT = new Set(tops);
  const ownB = new Set(bottoms);
  const ctx = { gender, mode };
  const asTops: BuySuggestion[] = [];
  const asBottoms: BuySuggestion[] = [];

  KEYS.forEach((c) => {
    const fl = skin ? skin.flatterTops.includes(c) : false;

    // Only suggest a colour as a BOTTOM if it's a realistic trouser colour.
    if (!ownB.has(c) && bottomScore(c) >= MIN_BOTTOM_SUITABILITY) {
      const pairs: ColorKey[] = [];
      tops.forEach((t) => {
        // Never count a suppressed pairing as a reason to buy.
        if (!isAvoided(t, c) && score(t, c, skin, undefined, ctx) >= GAP_THRESHOLD) {
          pairs.push(t);
        }
      });
      if (pairs.length) asBottoms.push({ c, pairs, fl });
    }

    if (!ownT.has(c)) {
      const pairs: ColorKey[] = [];
      bottoms.forEach((b) => {
        if (!isAvoided(c, b) && score(c, b, skin, undefined, ctx) >= GAP_THRESHOLD) {
          pairs.push(b);
        }
      });
      if (pairs.length) asTops.push({ c, pairs, fl });
    }
  });

  asTops.sort(sortF);
  asBottoms.sort(sortF);
  return { asTops, asBottoms };
}
