/**
 * Curated-combination spine. Normalises the raw research-doc combinations
 * (`COMBINATIONS: RawCombo[]`) once into `CURATED: NormCombo[]` — the high-confidence
 * dataset the recommender leans on — and exposes lookups by gender×mode + base-level
 * ownership. Each curated combo carries its named-shade metadata (mood, accent, why,
 * region, …) so cards can read "Sky Blue + Navy" rather than just the base colours.
 *
 * Data source of truth: Product Docs/Color Combination Research.md ("## JSON EXPORT")
 * via `./data` (COMBINATIONS / SHADE_VOCAB). Code-shape contract: ENGINE_REBUILD_SPEC §6.
 * Pure & dependency-free (no React-Native / store imports).
 */
import { COMBINATIONS, SHADE_VOCAB } from './data';
import { KEYS } from './colors';
import type {
  ColorKey,
  CuratedMeta,
  Gender,
  Mode,
  StyleName,
} from './types';

/**
 * A normalised curated combination: raw doc fields resolved to engine shapes —
 * `gender`/`mode` enums, `topBase`/`bottomBase` base colours (via `baseOf`), and the
 * named-shade `meta` used for card copy. Built once at module load into `CURATED`.
 */
export interface NormCombo {
  /** 'Men' -> male, 'Women' -> female. */
  gender: Gender;
  /** 'Formal' -> formal, 'Casual' -> casual. */
  mode: Mode;
  /** Base colour of the top, via `baseOf(rawTop)`. */
  topBase: ColorKey;
  /** Base colour of the bottom, via `baseOf(rawBottom)`. */
  bottomBase: ColorKey;
  /** Named-shade metadata (topShade/bottomShade are the raw doc names). */
  meta: CuratedMeta;
}

/**
 * Shade-name → base colour. Built from SHADE_VOCAB (every named shade points at its
 * base) PLUS a self-map for every base in `KEYS`, so doc fields that are already BASE
 * names — e.g. `bottom:"Navy"`, `bottom:"Black"` — resolve too.
 */
export const SHADE_TO_BASE: Record<string, ColorKey> = (() => {
  const map: Record<string, ColorKey> = {};
  for (const k of KEYS) map[k] = k; // self-map every base ("Black"/"Navy" resolve)
  for (const s of SHADE_VOCAB) map[s.shade] = s.base; // shade -> its base
  return map;
})();

/**
 * Resolve a shade/base name to its base colour. Unknown names (e.g. finish-word
 * accents like "Gold"/"Silver"/"Pearl" that have no base) fall through to the name
 * itself — callers only invoke this for top/bottom, never for free-string accents.
 */
export const baseOf = (name: string): ColorKey => SHADE_TO_BASE[name] ?? name;

/**
 * Map a raw `style_tag` to a `StyleName`. The doc already uses exactly the four style
 * names (Minimal/Classic/Bold/Statement); anything unexpected defaults to 'Classic'.
 */
export function mapStyle(tag: string): StyleName {
  return tag === 'Minimal' || tag === 'Classic' || tag === 'Bold' || tag === 'Statement'
    ? tag
    : 'Classic';
}

/**
 * Base-level avoid pairs (unordered) — the research avoid-list reduced to base colours
 * (ENGINE_REBUILD_SPEC §7). A curated combo whose base pair is one of these is dropped
 * as a safety guard; in practice none of the 45 curated pairs hit this set.
 */
const AVOID_BASE_PAIRS: ReadonlySet<string> = new Set([
  'Black|Navy', // "Navy + Black" — too close to read as intentional
  'Brown|Burgundy', // "Brown + Burgundy" — muddy, low-contrast clash
  'Mustard|Purple', // "Purple + Yellow (saturated)" -> Purple|Mustard
  'Forest Green|Rust', // "Red + Green (saturated)" -> Rust|Forest Green
]);

/** Unordered base-pair key (sorted) for avoid-set membership. */
const pairKey = (a: ColorKey, b: ColorKey): string =>
  a <= b ? `${a}|${b}` : `${b}|${a}`;

/** True if the base pair (either order) is in the avoid set — such combos are skipped. */
const isAvoidedBasePair = (a: ColorKey, b: ColorKey): boolean =>
  AVOID_BASE_PAIRS.has(pairKey(a, b));

/**
 * The curated spine — every doc combination normalised once. Avoid-listed base pairs
 * are guarded out (none expected, but kept defensive so the spine can never recommend
 * a suppressed pairing).
 */
export const CURATED: NormCombo[] = COMBINATIONS.reduce<NormCombo[]>((acc, c) => {
  const topBase = baseOf(c.top);
  const bottomBase = baseOf(c.bottom);
  if (isAvoidedBasePair(topBase, bottomBase)) return acc; // safety guard
  const meta: CuratedMeta = {
    topShade: c.top,
    bottomShade: c.bottom,
    accent: c.accent,
    mood: c.mood,
    styleTag: mapStyle(c.style_tag),
    region: c.region,
    flatters: c.flatters,
    why: c.why,
    occasion: c.occasion,
    timeless: c.timeless_or_trend === 'trend' ? 'trend' : 'timeless',
  };
  acc.push({
    gender: c.gender === 'Women' ? 'female' : 'male',
    mode: c.category === 'Casual' ? 'casual' : 'formal',
    topBase,
    bottomBase,
    meta,
  });
  return acc;
}, []);

/** Curated combos for a gender×mode wardrobe bucket. */
export function curatedFor(gender: Gender, mode: Mode): NormCombo[] {
  return CURATED.filter((c) => c.gender === gender && c.mode === mode);
}

/**
 * Curated metadata for a base pair within a gender×mode bucket, or null. Matches the
 * base pair in EITHER order; when matched reversed (`t`==bottomBase & `b`==topBase) the
 * returned meta swaps `topShade`/`bottomShade` so the card still reads top-on-top.
 *
 * NOTE: the deck is keyed by BASE pair (the user owns base colours, not shades), so when
 * two curated combos in a bucket reduce to the same base pair, only the FIRST in array
 * order surfaces. Today that hides exactly 2 of 45 combos — both White|Navy: "Power
 * Meeting" (behind "Corporate Blue", male-formal) and "Weekend Sharp" (behind "Clean
 * Denim", male-casual). All four are White-on-Navy looks, so the user still gets a valid,
 * representative card; only the second mood/accent is not separately shown.
 */
export function findCurated(
  t: ColorKey,
  b: ColorKey,
  gender: Gender,
  mode: Mode
): CuratedMeta | null {
  for (const c of CURATED) {
    if (c.gender !== gender || c.mode !== mode) continue;
    if (c.topBase === t && c.bottomBase === b) return c.meta;
    if (c.topBase === b && c.bottomBase === t) {
      // reversed match — swap the two shade names so display stays top-on-top
      return { ...c.meta, topShade: c.meta.bottomShade, bottomShade: c.meta.topShade };
    }
  }
  return null;
}

/**
 * Curated combos the user can actually wear given their owned base colours: those whose
 * `topBase` is in `tops` AND `bottomBase` is in `bottoms` (base-level ownership). Drives
 * the universe builder's curated spine.
 */
export function curatedOwnable(
  tops: ColorKey[],
  bottoms: ColorKey[],
  gender: Gender,
  mode: Mode
): { t: ColorKey; b: ColorKey; meta: CuratedMeta }[] {
  const topSet = new Set(tops);
  const botSet = new Set(bottoms);
  const out: { t: ColorKey; b: ColorKey; meta: CuratedMeta }[] = [];
  for (const c of CURATED) {
    if (c.gender !== gender || c.mode !== mode) continue;
    if (topSet.has(c.topBase) && botSet.has(c.bottomBase)) {
      out.push({ t: c.topBase, b: c.bottomBase, meta: c.meta });
    }
  }
  return out;
}
