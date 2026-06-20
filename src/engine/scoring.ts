/**
 * The generative scoring core — the doc's SHADE-PAIRING PRINCIPLES encoded as a
 * person-independent `harmony`, a `styleBias` nudge, and the combined `score`
 * (harmony + skin-tier nudge + office lean + realistic-bottom nudge + curated-spine
 * bonus + style bias). Plus the avoid-pair guard (`isAvoided`) the universe builder
 * uses to EXCLUDE suppressed pairings, and `catFor` for eyebrow/category copy.
 *
 * This replaces the prototype's GOOD/GOODSET exemplar logic: the high-confidence
 * "known good" spine is now the curated dataset, looked up via `findCurated` and
 * rewarded inside `score`. The avoid-list is suppressed structurally (the four base
 * pairs below) rather than scored.
 *
 * Data source of truth: Product Docs/Color Combination Research.md
 * ("## SHADE-PAIRING PRINCIPLES" + "combinations_to_avoid"). Code-shape contract:
 * ENGINE_REBUILD_SPEC.md §7. Pure & dependency-free (no React-Native / store imports).
 */
import { BOLD, COOL, CORP, FAMILY, NEUTRAL, WARM, bottomScore, lum } from './colors';
import { findCurated } from './combos';
import type { ColorKey, CuratedMeta, Gender, Mode, SkinObj, StyleName } from './types';

/**
 * Base-level avoid pairs (unordered) — the research doc's `combinations_to_avoid`
 * reduced to the four BASE-colour suppressions (ENGINE_REBUILD_SPEC §7). Keyed by the
 * sorted unordered pair so membership is order-independent.
 *
 * Doc avoid-list → base-pair mapping rationale:
 *  - "Navy + Black"                  → Navy|Black    (direct: too close to read intentional).
 *  - "Brown + Burgundy"              → Brown|Burgundy (direct: muddy, low-contrast clash).
 *  - "Purple + Yellow (saturated)"   → Purple|Mustard (Mustard is our saturated-yellow base).
 *  - "Red + Green (saturated)"       → Rust|Forest Green (Rust = saturated red, Forest = green).
 *
 * Deliberately NOT base suppressions (handled elsewhere so valid looks survive):
 *  - "Midnight Navy + Charcoal" / "Two non-matching blacks" are SHADE-proximity cases,
 *    caught by harmony's dark-on-dark near-match penalty — so Navy+Charcoal (a business
 *    classic) stays a valid, well-ranked pairing rather than being banned.
 *  - "Head-to-toe pale pastels on very light skin" is the skin top-avoid nudge in `score`.
 *  - "Brown shoes + Black suit", "Rust + bright Red", "Neon + earth tones" have no
 *    distinct base in our 17-colour model, so there is nothing to suppress.
 */
const AVOID_BASE_PAIRS: ReadonlySet<string> = new Set([
  'Black|Navy',
  'Brown|Burgundy',
  'Mustard|Purple',
  'Forest Green|Rust',
]);

/** Unordered base-pair key (sorted) for avoid-set membership. */
const pairKey = (a: ColorKey, b: ColorKey): string =>
  a <= b ? `${a}|${b}` : `${b}|${a}`;

/**
 * True if `{t,b}` (unordered) is one of the four suppressed base pairs. The universe
 * builder EXCLUDES avoided pairs rather than scoring them; harmony/score never see them.
 */
export function isAvoided(t: ColorKey, b: ColorKey): boolean {
  return AVOID_BASE_PAIRS.has(pairKey(t, b));
}

/**
 * How well two BASE colours go together, independent of person/occasion/style. Encodes
 * the doc's five shade-pairing principles as additive weights (luminance read from each
 * base's default shade hex via `lum`). Clamped 0..1.
 *
 * Weights (ENGINE_REBUILD_SPEC §7):
 *  - base 0.45.
 *  - tonal/monochrome (`t===b`, same base / different shades): REWARD +0.16 — doc #2,
 *    tonal dressing is elegant (this REVERSES the prototype's flatness penalty).
 *  - neutrals are free agents (doc #3): one neutral +0.18; both neutral a further +0.10.
 *  - light↔deep contrast (doc #1): `dl=|lum(t)-lum(b)|`; dl>0.32 → +0.14; dl>0.5 → +0.04 more.
 *  - dark-on-dark muddy near-match (doc #1 + "two non-matching blacks"): different bases,
 *    different family, both dark (lum<0.32) and almost the same value (dl<0.12) → −0.20.
 *    (This is the Midnight-Navy+Charcoal / two-blacks case.)
 *  - same family, different base, near-equal value → −0.12 (e.g. Light Blue+Blue with no contrast).
 *  - warm/cool harmony (doc #4): both non-neutral and opposite temperature → −0.14;
 *    both non-neutral and same temperature (both warm or both cool) → +0.06.
 */
export function harmony(t: ColorKey, b: ColorKey): number {
  let s = 0.45;

  const tN = NEUTRAL.has(t);
  const bN = NEUTRAL.has(b);

  // Tonal / monochrome (doc #2): same base, different shades implied — elegant, reward it.
  if (t === b) s += 0.16;

  // Neutrals are free agents (doc #3): one grounds anything; two read clean and quiet.
  if (tN || bN) s += 0.18;
  if (tN && bN) s += 0.1;

  // Light vs deep contrast (doc #1): the cleaner the contrast, the more intentional.
  const dl = Math.abs(lum(t) - lum(b));
  if (dl > 0.32) s += 0.14;
  if (dl > 0.5) s += 0.04;

  // Dark-on-dark muddy near-match (doc #1 + "two non-matching blacks"): two different
  // dark bases at near-equal value look like a failed full-suit (Midnight Navy+Charcoal).
  if (t !== b && FAMILY[t] !== FAMILY[b] && lum(t) < 0.32 && lum(b) < 0.32 && dl < 0.12) {
    s -= 0.2;
  }

  // Same family, different base, near-equal value reads flat (e.g. Light Blue+Blue).
  if (t !== b && FAMILY[t] === FAMILY[b] && dl < 0.12) s -= 0.12;

  // Warm-with-warm / cool-with-cool harmony (doc #4) — only for two saturated colours;
  // a neutral on either side is a free agent and bridges temperatures.
  if (!tN && !bN) {
    const warmClash = (WARM.has(t) && COOL.has(b)) || (COOL.has(t) && WARM.has(b));
    const sameTemp = (WARM.has(t) && WARM.has(b)) || (COOL.has(t) && COOL.has(b));
    if (warmClash) s -= 0.14;
    else if (sameTemp) s += 0.06;
  }

  return Math.max(0, Math.min(1, s));
}

/**
 * Push ranking toward a chosen aesthetic (ENGINE_REBUILD_SPEC §7). The exemplar bonus
 * now lives in `score` (curated-ness), so this is purely the set-membership nudges:
 *  - Minimal:   both-neutral +0.13; bold present −0.12; low contrast (dl<0.18) +0.04.
 *  - Classic:   CORP membership +0.05 each; Navy/White present +0.05; bold present −0.08.
 *  - Bold:      bold present +0.14; both-neutral −0.12; high contrast (dl>0.3) +0.05.
 *  - Statement: (bold & neutral) +0.10; both bold +0.07; both neutral −0.10.
 */
export function styleBias(t: ColorKey, b: ColorKey, style: StyleName | null | undefined): number {
  if (!style) return 0;
  let d = 0;
  const tB = BOLD.has(t);
  const bB = BOLD.has(b);
  const tN = NEUTRAL.has(t);
  const bN = NEUTRAL.has(b);
  const tC = CORP.has(t);
  const bC = CORP.has(b);
  const dl = Math.abs(lum(t) - lum(b));
  if (style === 'Minimal') {
    if (tN && bN) d += 0.13;
    if (tB || bB) d -= 0.12;
    if (dl < 0.18) d += 0.04;
  } else if (style === 'Classic') {
    if (tC) d += 0.05;
    if (bC) d += 0.05;
    if (t === 'Navy' || b === 'Navy' || t === 'White' || b === 'White') d += 0.05;
    if (tB || bB) d -= 0.08;
  } else if (style === 'Bold') {
    if (tB || bB) d += 0.14;
    if (tN && bN) d -= 0.12;
    if (dl > 0.3) d += 0.05;
  } else if (style === 'Statement') {
    if ((tB || bB) && (tN || bN)) d += 0.1;
    if (tB && bB) d += 0.07;
    if (tN && bN) d -= 0.1;
  }
  return d;
}

/**
 * Combined score for a (top, bottom) pairing (ENGINE_REBUILD_SPEC §7). NOT clamped —
 * this is a ranking signal only, and the curated spine bonus (+0.40) is meant to push
 * curated pairings clearly above generative ones.
 *
 * ```
 * s = harmony(t,b)
 * // skin-tier nudge — applied mainly to the TOP (face), doc #5
 * if skin: if flatterTops.includes(t) s+=0.09; if avoidTops.includes(t) s-=0.07;
 *          if flatterTops.includes(b) s+=0.04;        // the bottom matters less
 * // office / clean lean + realistic bottoms
 * if CORP.has(t) s+=0.03
 * s += 0.06 * bottomScore(b); if bottomScore(b)<0.25 s-=0.10
 * // curated spine bonus (strong) — only when ctx gives gender+mode AND the pair is curated
 * if ctx?.gender && ctx?.mode && findCurated(t,b,gender,mode) s += 0.40
 * s += styleBias(t,b,style)
 * ```
 *
 * Avoided pairs are EXCLUDED by the universe builder, not scored here.
 */
export function score(
  t: ColorKey,
  b: ColorKey,
  skin: SkinObj | null,
  style?: StyleName | null,
  ctx?: { gender?: Gender; mode?: Mode }
): number {
  let s = harmony(t, b);

  // Skin-tier nudge (doc #5): the face colour matters most, so favoured/avoided tops
  // move the score most; the bottom gets a smaller favour-only lift. Never excludes.
  if (skin) {
    if (skin.flatterTops.includes(t)) s += 0.09;
    if (skin.avoidTops.includes(t)) s -= 0.07;
    if (skin.flatterTops.includes(b)) s += 0.04;
  }

  // Office / clean lean on the top, plus realistic-trouser plausibility on the bottom:
  // real office trousers (navy/grey/charcoal/khaki...) lift; implausible ones drop hard.
  if (CORP.has(t)) s += 0.03;
  s += 0.06 * bottomScore(b);
  if (bottomScore(b) < 0.25) s -= 0.1;

  // Curated spine bonus (strong): when we know the gender×mode bucket and this base pair
  // is a curated, high-confidence combo, lift it well clear of generative pairings.
  if (ctx?.gender && ctx?.mode && findCurated(t, b, ctx.gender, ctx.mode)) s += 0.4;

  s += styleBias(t, b, style);
  return s;
}

/**
 * Category label for naming / eyebrow text (ENGINE_REBUILD_SPEC §7). A curated pair
 * shows its mapped style tag (e.g. "CLASSIC"); otherwise NEUTRAL (both neutral),
 * BOLD (a bold colour present), or EVERYDAY.
 */
export function catFor(t: ColorKey, b: ColorKey, gender?: Gender, mode?: Mode): string {
  if (gender && mode) {
    const cur = findCurated(t, b, gender, mode);
    if (cur) return cur.styleTag.toUpperCase();
  }
  if (NEUTRAL.has(t) && NEUTRAL.has(b)) return 'NEUTRAL';
  if (BOLD.has(t) || BOLD.has(b)) return 'BOLD';
  return 'EVERYDAY';
}

/**
 * The single STYLE bucket a pairing belongs to (one of the four — never Neutral/Everyday),
 * so the Style chips can act as a real filter and every card carries a style label.
 *  - curated → its mapped `styleTag`.
 *  - both bold → Statement; one bold → Bold; both neutral → Minimal; else → Classic.
 */
export function styleOf(t: ColorKey, b: ColorKey, curated?: CuratedMeta | null): StyleName {
  if (curated) return curated.styleTag;
  const tB = BOLD.has(t);
  const bB = BOLD.has(b);
  if (tB && bB) return 'Statement';
  if (tB || bB) return 'Bold';
  if (NEUTRAL.has(t) && NEUTRAL.has(b)) return 'Minimal';
  return 'Classic';
}
