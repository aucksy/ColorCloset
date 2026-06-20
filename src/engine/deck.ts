/**
 * Combination universe, stats, and the ordered "Another" deck walk — the layer that
 * turns the owned wardrobe into a ranked deck of looks (ENGINE_REBUILD_SPEC §8).
 *
 * The curated dataset is the high-confidence spine: when the gender×mode bucket is
 * known, every curated, ownable pairing is force-included and carries its named-shade
 * `meta`; generative pairings join only if they clear `UNIVERSE_THRESHOLD`. Avoided
 * base pairs are EXCLUDED structurally (never scored), with a single-best fallback so
 * the user is never left with an empty deck.
 *
 * Pure & dependency-free (no React-Native / Expo / store imports). The store/hook owns
 * memo-caching (via `deckKey`) and the walk position; this module is deterministic.
 *
 * Data/shape contract: ENGINE_REBUILD_SPEC §8. Scoring lives in `./scoring`, curated
 * lookup in `./combos`.
 */
import { score, isAvoided, styleOf } from './scoring';
import { findCurated } from './combos';
import { STYLES, UNIVERSE_THRESHOLD } from './constants';
import type { ColorKey, Combo, Gender, Mode, RankedCombo, SkinObj, StyleName } from './types';

/**
 * Every viable (top × bottom) pairing for the owned wardrobe, best-first.
 *
 * For each `t∈tops, b∈bottoms`:
 *  - skip if `isAvoided(t,b)` (the four suppressed base pairs are never scored);
 *  - score with no style but with the gender×mode `ctx` so the curated spine bonus applies;
 *  - attach `curated` via `findCurated` when both `gender` and `mode` are known;
 *  - include the pairing iff it is curated OR `sc >= UNIVERSE_THRESHOLD` (0.55).
 *
 * If nothing clears the bar, fall back to the single best NON-avoided pairing so the
 * deck is never empty; only if literally every pairing is avoided do we surface the
 * best avoided one (so the user isn't stuck). Results are sorted by `sc` desc (stable)
 * and de-duplicated by `id` (`${t}|${b}`).
 */
export function comboUniverse(
  tops: ColorKey[],
  bottoms: ColorKey[],
  skin: SkinObj | null,
  gender?: Gender | null,
  mode?: Mode | null
): Combo[] {
  const ctx = { gender: gender ?? undefined, mode: mode ?? undefined };
  const out: Combo[] = [];
  // Track the best non-avoided and best overall (incl. avoided) for the fallback path.
  let bestOpen: Combo | null = null;
  let bestAny: Combo | null = null;

  tops.forEach((t) =>
    bottoms.forEach((b) => {
      const avoided = isAvoided(t, b);
      const sc = score(t, b, skin, undefined, ctx);
      const curated = (gender && mode ? findCurated(t, b, gender, mode) : undefined) ?? undefined;
      const cand: Combo = { id: t + '|' + b, t, b, sc, style: styleOf(t, b, curated), curated };
      if (!bestAny || sc > bestAny.sc) bestAny = cand;
      if (avoided) return; // suppressed base pair — never in the universe (except fallback)
      if (!bestOpen || sc > bestOpen.sc) bestOpen = cand;
      if (curated || sc >= UNIVERSE_THRESHOLD) out.push(cand);
    })
  );

  // Never leave the user with an empty deck: prefer the best non-avoided pairing; only
  // if every single pairing is avoided do we surface the best avoided one.
  if (!out.length) {
    const fb: Combo | null = bestOpen ?? bestAny;
    if (fb) out.push(fb);
  }

  // De-dup by id (curated + threshold paths can never both push the same pair, but the
  // fallback could echo one already present), then sort best-first (stable).
  const seen = new Set<string>();
  const uniq = out.filter((c) => (seen.has(c.id) ? false : (seen.add(c.id), true)));
  return uniq.sort((a, b) => b.sc - a.sc);
}

export interface UniStats {
  uni: Combo[];
  total: number;
  worn: number;
}

/** Universe plus a count of how many of its pairings have been worn. */
export function uniStats(
  tops: ColorKey[],
  bottoms: ColorKey[],
  skin: SkinObj | null,
  worn: Record<string, string>,
  gender?: Gender | null,
  mode?: Mode | null
): UniStats {
  const uni = comboUniverse(tops, bottoms, skin, gender, mode);
  const w = Object.keys(worn).filter((id) => uni.some((c) => c.id === id)).length;
  return { uni, total: uni.length, worn: w };
}

/**
 * Deck-build context — the active wardrobe bucket plus its style/skin. `gender` may be
 * null before onboarding picks one; `mode` always has a value (defaults to 'formal').
 */
export interface DeckContext {
  tops: ColorKey[];
  bottoms: ColorKey[];
  skin: SkinObj | null;
  style: StyleName;
  gender: Gender | null;
  mode: Mode;
}

/**
 * Memo key — when this string is unchanged, the deck need not be rebuilt. Includes
 * everything that changes the deck: gender, mode, style, skin (mst), and the owned
 * tops/bottoms.
 */
export function deckKey(ctx: DeckContext): string {
  return [
    ctx.gender ?? '',
    ctx.mode,
    ctx.style,
    ctx.skin?.mst ?? '',
    ctx.tops.join(','),
    ctx.bottoms.join(','),
  ].join('|');
}

/**
 * The deck for the current style: the universe FILTERED to `ctx.style` (the Style chips
 * are a hard filter, not just a re-rank), re-scored by `osc`, sorted best-first, then
 * diversified so consecutive cards don't repeat the same trouser/top.
 */
export function buildDeck(ctx: DeckContext): RankedCombo[] {
  const ranked = comboUniverse(ctx.tops, ctx.bottoms, ctx.skin, ctx.gender, ctx.mode)
    .filter((c) => c.style === ctx.style)
    .map((c) => ({
      ...c,
      osc: score(c.t, c.b, ctx.skin, ctx.style, {
        gender: ctx.gender ?? undefined,
        mode: ctx.mode,
      }),
    }))
    .sort((a, b) => b.osc - a.osc);
  return diversify(ranked);
}

/**
 * Deterministic anti-clustering pass (#8/#13): keep the best card first, then always
 * take the next-highest-`osc` card whose BOTTOM differs from the previous card (and, when
 * possible, whose TOP also differs), so the user doesn't see the same trouser colour — or
 * the same shade of one colour — back-to-back. Falls back to next-best when nothing else
 * is available. No randomness, so the order stays stable/testable.
 */
function diversify(deck: RankedCombo[]): RankedCombo[] {
  if (deck.length <= 2) return deck;
  const remaining = deck.slice();
  const out: RankedCombo[] = [remaining.shift()!];
  while (remaining.length) {
    const prev = out[out.length - 1];
    let i = remaining.findIndex((c) => c.b !== prev.b && c.t !== prev.t);
    if (i === -1) i = remaining.findIndex((c) => c.b !== prev.b);
    if (i === -1) i = 0;
    out.push(remaining.splice(i, 1)[0]);
  }
  return out;
}

/**
 * Number of deck combos per style for the owned wardrobe (universe-level, before
 * "not for me"), so the UI knows which styles are non-empty for the exhaust→advance flow.
 */
export function styleCounts(
  tops: ColorKey[],
  bottoms: ColorKey[],
  skin: SkinObj | null,
  gender: Gender | null,
  mode: Mode
): Record<StyleName, number> {
  const counts = STYLES.reduce((acc, s) => ((acc[s] = 0), acc), {} as Record<StyleName, number>);
  comboUniverse(tops, bottoms, skin, gender, mode).forEach((c) => {
    counts[c.style] += 1;
  });
  return counts;
}

export interface StepResult {
  pick: RankedCombo;
  pos: number;
  /** True when the walk looped past an all-worn round back to a (worn) pairing. */
  roundDone: boolean;
}

/**
 * Advance one step through the deck from `pos`, skipping worn pairings. Wraps at the
 * end. If every pairing is worn, advances by one and flags roundDone. Initial pos -1.
 */
export function stepRec(
  deck: RankedCombo[],
  pos: number,
  worn: Record<string, string>
): StepResult | null {
  if (!deck.length) return null;
  const n = deck.length;
  for (let k = 1; k <= n; k++) {
    const i = (pos + k) % n;
    if (!worn[deck[i].id]) return { pick: deck[i], pos: i, roundDone: false };
  }
  const i = (pos + 1) % n;
  return { pick: deck[i], pos: i, roundDone: true };
}
