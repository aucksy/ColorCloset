/**
 * Skin-tone model — the 10-swatch Monk Skin Tone (MST) picker mapped onto 3 depth
 * tiers (Light / Medium / Deep). The engine reads only the tier: each tier carries a
 * gentle TOP (near-the-face) favour/avoid base-colour set, grounded in the research
 * doc's colour-analysis principle (deep skin carries saturated colour + crisp white;
 * very light skin is washed out by the palest pastels worn near the face; medium is
 * the most flexible). This is a soft ranking nudge applied mainly to the top garment —
 * it never excludes a colour. Pure & dependency-free.
 *
 * Data source of truth: Product Docs/Color Combination Research.md ("## JSON EXPORT",
 * skin_tone_model) via `./data` (MST_SWATCHES, SKIN_TIERS, MST_LABEL_MAP).
 * Code-shape contract: ENGINE_REBUILD_SPEC.md §5.
 * (Rebuilt from the prototype's 6-label "depth" model: undertone removed; the 6 old
 * labels migrate to MST numbers via `mstFromLegacyLabel`.)
 */
import { MST_SWATCHES, SKIN_TIERS } from './data';
import type { ColorKey, SkinObj, SkinTier } from './types';

// Re-export the official swatch table so UI/onboarding can render the picker from here.
export { MST_SWATCHES };

/** Default MST when none is selected (mid-Medium); mirrors the prototype's "Medium". */
const DEFAULT_MST = 5;

/**
 * Depth tier for an MST number (1-10) via SKIN_TIERS: 1-3 Light, 4-6 Medium,
 * 7-10 Deep. Out-of-range / non-membership falls back to Medium (the flexible tier).
 */
export function tierOf(mst: number): SkinTier {
  const key = `MST${mst}`;
  if (SKIN_TIERS.Light.includes(key)) return 'Light';
  if (SKIN_TIERS.Deep.includes(key)) return 'Deep';
  // Medium is the broad default for anything in-band-but-unmatched.
  return 'Medium';
}

/**
 * Tier → base colours that flatter worn near the face (gentle favour). Per spec §5,
 * grounded in doc principle #5: deep tiers carry saturated brights + crisp Optic White;
 * light tiers need mid-to-deep / jewel contrast (the palest tints wash them out);
 * medium tiers are broad and flexible.
 */
const TIER_FLATTER: Record<SkinTier, ColorKey[]> = {
  // Saturated brights + crisp Optic White flatter a deeper face.
  Deep: ['White', 'Cream', 'Burgundy', 'Forest Green', 'Purple', 'Mustard', 'Rust', 'Blue', 'Navy'],
  // Mid-to-deep + jewel tones give a very light face the contrast it needs.
  Light: ['Navy', 'Blue', 'Burgundy', 'Forest Green', 'Purple', 'Charcoal', 'Grey', 'Olive'],
  // Broad / flexible — a wide warm-and-cool spread.
  Medium: ['Navy', 'Blue', 'Burgundy', 'Forest Green', 'Olive', 'Rust', 'Mustard', 'Brown', 'Khaki'],
};

/**
 * Tier → base colours that tend to read off near the face (gentle demote, never
 * excludes). Deep: muddy/ashy earthy neutrals; Light: the palest tints that wash out;
 * Medium: none (flexible).
 */
const TIER_AVOID: Record<SkinTier, ColorKey[]> = {
  // Can read muddy / ashy against a deep face.
  Deep: ['Khaki', 'Olive', 'Beige', 'Grey'],
  // Palest tints near a very light face wash out.
  Light: ['Cream', 'Beige', 'Khaki', 'Light Blue'],
  Medium: [],
};

/** Tier-based, plain-language note for the skin panel (one line per tier). */
const TIER_NOTE: Record<SkinTier, string> = {
  Deep:
    'Crisp whites and saturated, high-chroma colour flatter deeper skin — used softly to rank your tops.',
  Light:
    'Mid-to-deep and jewel tones give lighter skin clean contrast; the palest tints can wash it out — used softly to rank your tops.',
  Medium:
    'A broad, flexible palette suits medium skin — warm earths and cool jewel tones both work, used softly to rank your tops.',
};

/** Base colours flattering near the face for a tier (favour). */
export function flatterTopsFor(tier: SkinTier): ColorKey[] {
  return TIER_FLATTER[tier];
}

/** Base colours that read off near the face for a tier (gentle demote). */
export function avoidTopsFor(tier: SkinTier): ColorKey[] {
  return TIER_AVOID[tier];
}

/**
 * One-line plain-language note describing what tends to flatter the user's tier.
 * `mst` null → the Medium default. For the skin panel ONLY — never per-combo.
 */
export function skinNote(mst: number | null): string {
  return TIER_NOTE[tierOf(mst ?? DEFAULT_MST)];
}

/**
 * Resolve a full skin profile from an MST number. `mst` null → default MST 5 (Medium).
 * Fills the tier, the display swatch hex, the tier's flatter/avoid TOP sets, and the
 * tier note. Consumed by scoring as a gentle, top-weighted nudge.
 */
export function skinObj(mst: number | null): SkinObj {
  const n = mst ?? DEFAULT_MST;
  const tier = tierOf(n);
  const swatch = MST_SWATCHES.find((s) => s.mst === `MST${n}`) ?? MST_SWATCHES[DEFAULT_MST - 1];
  return {
    mst: n,
    tier,
    dot: swatch.hex,
    flatterTops: flatterTopsFor(tier),
    avoidTops: avoidTopsFor(tier),
    note: TIER_NOTE[tier],
  };
}

/**
 * Map an old 6-label DepthId ('fair'..'rich') to a representative MST number, for
 * migrating legacy saved profiles. Per spec §5: Fair→1, Light→3, Medium→4, Tan→6,
 * Deep→7, Rich→9. Unknown label → the Medium default.
 */
export function mstFromLegacyLabel(label: string): number {
  switch ((label || '').toLowerCase()) {
    case 'fair':
      return 1;
    case 'light':
      return 3;
    case 'medium':
      return 4;
    case 'tan':
      return 6;
    case 'deep':
      return 7;
    case 'rich':
      return 9;
    default:
      return DEFAULT_MST;
  }
}
