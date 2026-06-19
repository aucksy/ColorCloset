/**
 * Combination universe, stats, and the ordered "Another" deck walk.
 * Pure ports of the prototype (lines ~919-956). The engine builds and walks the
 * deck deterministically; the store/hook owns memo-caching and the walk position.
 */
import { score } from './scoring';
import { UNIVERSE_THRESHOLD } from './constants';
import type { ColorKey, Combo, RankedCombo, SkinObj, StyleName } from './types';

/**
 * Every (top × bottom) whose base score (no style) meets the universe threshold
 * (0.55), best-first. Stable across style. If nothing clears the threshold, returns
 * the single best pairing so the user is never stuck.
 */
export function comboUniverse(
  tops: ColorKey[],
  bottoms: ColorKey[],
  skin: SkinObj | null
): Combo[] {
  const out: Combo[] = [];
  tops.forEach((t) =>
    bottoms.forEach((b) => {
      const sc = score(t, b, skin);
      if (sc >= UNIVERSE_THRESHOLD) out.push({ id: t + '|' + b, t, b, sc });
    })
  );
  if (!out.length) {
    let best: Combo | null = null;
    tops.forEach((t) =>
      bottoms.forEach((b) => {
        const sc = score(t, b, skin);
        if (!best || sc > best.sc) best = { id: t + '|' + b, t, b, sc };
      })
    );
    if (best) out.push(best);
  }
  return out.sort((a, b) => b.sc - a.sc);
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
  worn: Record<string, string>
): UniStats {
  const uni = comboUniverse(tops, bottoms, skin);
  const w = Object.keys(worn).filter((id) => uni.some((c) => c.id === id)).length;
  return { uni, total: uni.length, worn: w };
}

export interface DeckContext {
  tops: ColorKey[];
  bottoms: ColorKey[];
  skin: SkinObj | null;
  style: StyleName;
}

/** Memo key — when this string is unchanged, the deck need not be rebuilt. */
export function deckKey(ctx: DeckContext): string {
  return [ctx.style, ctx.skin?.depth ?? '', ctx.tops.join(','), ctx.bottoms.join(',')].join('|');
}

/** The universe re-scored for the current style and sorted best-first. */
export function buildDeck(ctx: DeckContext): RankedCombo[] {
  return comboUniverse(ctx.tops, ctx.bottoms, ctx.skin)
    .map((c) => ({ ...c, osc: score(c.t, c.b, ctx.skin, ctx.style) }))
    .sort((a, b) => b.osc - a.osc);
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
