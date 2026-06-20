/**
 * Varied, authentic card copy (ENGINE_REBUILD_SPEC §10, item 6). Three jobs:
 *  - `comboName` — a short, evocative title for a pairing. Curated combos reuse the
 *    dataset's `mood`; generative pairings draw from a small, principle-keyed pool with
 *    a SEEDED (per-id, deterministic) pick, so the name is stable per combo and not
 *    re-randomised on every re-render.
 *  - `comboWhy` — the "why this works" rationale as ordered, named-shade-aware segments
 *    (the two shade names rendered bold). Curated combos lead with the doc `why`;
 *    generative combos use the principle phrasing in §10. This NEVER emits a skin-tone
 *    sentence — the skin nudge lives in `tierNote` and the skin panel only.
 *  - `tierNote` — a single short tier line, non-null ONLY when a curated combo's
 *    `flatters` is tier-SPECIFIC and explicitly names the user's tier. Replaces the old
 *    always-on "Flatters your X skin" pill.
 *
 * Pure & dependency-free (no React-Native / store imports). Does NOT import GOODSET —
 * the high-confidence spine is the curated dataset, surfaced via the `curated` arg.
 * Code-shape contract: ENGINE_REBUILD_SPEC.md §10.
 */
import { BOLD, COOL, NEUTRAL, WARM, lum, shadeName } from './colors';
import type { ColorKey, CuratedMeta, SkinObj, SkinTier } from './types';

/** A rationale segment; `bold` marks the champagne-gold emphasis (shade names). */
export interface RationaleSegment {
  text: string;
  bold?: boolean;
}

/** Flatten rationale segments into a plain string (accessibility labels / tests). */
export function whyText(segments: RationaleSegment[]): string {
  return segments.map((s) => s.text).join('');
}

/* ----------------------------- comboName ----------------------------- */

/**
 * Generative name pools, keyed by the dominant pairing principle (§10). The pick is
 * seeded from the combo id so a given pairing always shows the same name.
 */
const NAME_POOL = {
  tonal: ['Tonal Depth', 'Quiet Tone-on-Tone'],
  neutral: ['Quiet Neutral', 'Clean Slate'],
  bold: ['Confident Contrast', 'Rich Pairing'],
  everyday: ['Easy Everyday', 'Soft Contrast'],
} as const;

/** Which generative name pool a pairing falls into (dominant principle, §10). */
function namePrinciple(t: ColorKey, b: ColorKey): keyof typeof NAME_POOL {
  if (t === b) return 'tonal'; // tonal / tone-on-tone (same base)
  if (NEUTRAL.has(t) && NEUTRAL.has(b)) return 'neutral'; // both free-agent neutrals
  if (BOLD.has(t) || BOLD.has(b)) return 'bold'; // a saturated colour is present
  return 'everyday';
}

/**
 * A simple deterministic hash of an id → a 0..1 float, so callers that don't pass an
 * `rng` still get a stable per-combo pick (FNV-1a-ish, kept dependency-free).
 */
function seedFloat(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i += 1) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // >>> 0 forces unsigned; divide by 2^32 for a 0..1 fraction.
  return (h >>> 0) / 4294967296;
}

/**
 * A short, evocative name for a pairing (§10).
 *  - Curated → the dataset's `mood` (e.g. "Quiet Confidence").
 *  - Generative → a deterministic pick from the pool of the dominant principle
 *    (tonal / both-neutral / bold / everyday). `rng` is injected for determinism: the
 *    store passes a SEEDED rng (as today); if omitted we seed from `${t}|${b}` so the
 *    name is still stable per combo rather than re-randomised on every render.
 */
export function comboName(
  t: ColorKey,
  b: ColorKey,
  curated?: CuratedMeta | null,
  rng?: () => number
): string {
  if (curated) return curated.mood;
  const pool = NAME_POOL[namePrinciple(t, b)];
  const r = rng ? rng() : seedFloat(`${t}|${b}`);
  return pool[Math.floor(r * pool.length) % pool.length];
}

/* ----------------------------- comboWhy ------------------------------ */

/** Arguments for `comboWhy` — keeps the call site readable and the shade idx optional. */
export interface ComboWhyArgs {
  /** Top base colour. */
  t: ColorKey;
  /** Bottom base colour. */
  b: ColorKey;
  /** Curated metadata if this pairing is curated (leads with its doc `why`). */
  curated?: CuratedMeta | null;
  /** Owned top shade index (store-supplied); absent → the base's default shade name. */
  topShadeIdx?: number | null;
  /** Owned bottom shade index; absent → the base's default shade name. */
  bottomShadeIdx?: number | null;
}

/**
 * Generative tail phrasing by dominant principle (§10) — chosen so each reads naturally
 * after "<TopShade> + <BottomShade>". Shade names stay bold; no skin-tone sentence here.
 */
function generativeTail(t: ColorKey, b: ColorKey): string {
  // Each tail is a complete sentence joined with an em-dash, mirroring the curated
  // pattern (`<TopShade> + <BottomShade> — <why>`) so the two paths read identically.

  // Tonal (same base, layered shades) — doc #2.
  if (t === b) return ' — layered shades of one colour for quiet depth.';

  const tN = NEUTRAL.has(t);
  const bN = NEUTRAL.has(b);
  const dl = Math.abs(lum(t) - lum(b));

  // Clean light-on-dark contrast (doc #1) — reads sharp and intentional.
  if (dl > 0.4) return ' — clean light-on-dark contrast that always reads sharp.';

  // Both warm earth tones (doc #4) — they sit together naturally.
  if (!tN && !bN && WARM.has(t) && WARM.has(b)) {
    return ' — warm earth tones that sit naturally together.';
  }
  // Both cool tones (doc #4) — calm, considered.
  if (!tN && !bN && COOL.has(t) && COOL.has(b)) {
    return ' — two cool tones, calm and considered.';
  }
  // A neutral on either side grounds the look (doc #3).
  if (tN || bN) return ' — a neutral keeps it grounded and easy to wear.';

  // Fallback: balanced everyday pairing.
  return ' — balanced and easy to wear, an everyday pairing.';
}

/**
 * The "why this works" rationale as ordered, named-shade-aware segments (§10). The two
 * shade names render bold; the pattern is `[topName, " + ", botName, tail]`.
 *  - Curated → lead with the doc `why`: `[topShade, " + ", bottomShade, " — " + why]`.
 *  - Generative → the principle phrasing (tonal / warm-earth / cool / neutral-anchor /
 *    clean-contrast), with shade names from `shadeName(base, ownedShadeIdx?)`.
 *
 * NEVER emits a skin-tone sentence — that is `tierNote`'s job (and the skin panel's).
 * Region tagging (Universal vs Japanese/Tokyo …) is the OutfitCard's eyebrow, not here.
 */
export function comboWhy(args: ComboWhyArgs): RationaleSegment[] {
  const { t, b, curated, topShadeIdx, bottomShadeIdx } = args;

  // Shade names: curated dataset names when curated, else the owned (or default) shade.
  const topName = curated ? curated.topShade : shadeName(t, topShadeIdx);
  const botName = curated ? curated.bottomShade : shadeName(b, bottomShadeIdx);

  const tail = curated ? ` — ${curated.why}` : generativeTail(t, b);

  return [
    { text: topName, bold: true },
    { text: ' + ' },
    { text: botName, bold: true },
    { text: tail },
  ];
}

/* ----------------------------- tierNote ------------------------------ */

/** The three skin tiers, used to test tier-specificity of a curated `flatters` array. */
const TIER_WORDS: ReadonlySet<string> = new Set<SkinTier>(['Light', 'Medium', 'Deep']);

/** Short, tier-specific call-out phrasing keyed by the user's tier. */
const TIER_LINE: Record<SkinTier, string> = {
  Light: 'Especially fresh on lighter skin.',
  Medium: 'A natural fit for medium skin.',
  Deep: 'Especially striking on deeper skin.',
};

/**
 * A single short tier line for a curated combo, or null (§10, item 6). Non-null ONLY
 * when the curated `flatters` is tier-SPECIFIC (contains a tier word — Light/Medium/Deep
 * — and is NOT just `["all"]`) AND explicitly names the user's own tier. So a combo
 * tagged `["Medium","Deep"]` shows a line for Medium and Deep users but null for Light;
 * an `["all","Deep"]` combo (flatters everyone, especially deep skin) shows the line only
 * to Deep users — everyone else just sees it as universally flattering (no note).
 *
 * This replaces the static "Flatters your X skin" pill, which is removed entirely.
 */
export function tierNote(curated: CuratedMeta | null | undefined, skin: SkinObj | null): string | null {
  if (!curated || !skin) return null;
  const { flatters } = curated;
  // Tier-specific = at least one explicit tier word (so plain ["all"] is excluded).
  const isTierSpecific = flatters.some((f) => TIER_WORDS.has(f));
  if (!isTierSpecific) return null;
  // Only speak up when the user's own tier is named explicitly (not merely via "all").
  if (!flatters.includes(skin.tier)) return null;
  return TIER_LINE[skin.tier];
}
