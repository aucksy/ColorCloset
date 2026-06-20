/**
 * Core engine types. The engine is a pure, deterministic, dependency-free module
 * (no React Native / Expo / store imports) rebuilt from the research dataset.
 * Data source of truth: Product Docs/Color Combination Research.md ("## JSON EXPORT").
 * Code-shape contract: ENGINE_REBUILD_SPEC.md §2.
 */

/** A base colour name, e.g. "Navy". One of the 17 bases (no "Maroon"). */
export type ColorKey = string;

/** Profile-level gender, chosen at onboarding. */
export type Gender = 'male' | 'female';

/** Sidebar-toggled occasion mode (one active at a time). */
export type Mode = 'formal' | 'casual';

/** Wardrobe bucket key — one of the four `gender-mode` wardrobes. */
export type BucketKey = `${Gender}-${Mode}`;

/** Skin-depth tier derived from the 10-swatch Monk Skin Tone (MST) scale. */
export type SkinTier = 'Light' | 'Medium' | 'Deep';

/** Visual-risk axis — the single selection on the Style-me screen. */
export type StyleName = 'Minimal' | 'Classic' | 'Bold' | 'Statement';

/** Belt + shoe leather colour for a look (office attire). */
export type Leather = 'Black' | 'Brown';

/**
 * 0-based index into a base's named shades.
 * (Most bases have 5 shades; Beige has 6 — so NOT a fixed 0..4 union.)
 */
export type ShadeIndex = number;

/** A combination id, formatted `${top}|${bottom}` (base colours). */
export type ComboId = string;

/** A single named shade within a base's strip. */
export interface ShadeEntry {
  name: string;
  hex: string;
}

/** A base colour and its named-shade strip. */
export interface ColorEntry {
  /** Base hex (doc "base #.." header). */
  hex: string;
  rgb: [number, number, number];
  /** Shade hexes, doc order (5 for most bases; Beige has 6). */
  shades: string[];
  /** Shade names, doc order (parallel to `shades`). */
  shadeNames: string[];
  /** Index of the shade nearest the base hex = display default. */
  baseIdx: ShadeIndex;
}

/** Resolved skin profile used by scoring (MST → tier; gentle, never excludes). */
export interface SkinObj {
  /** MST swatch number, 1..10. */
  mst: number;
  tier: SkinTier;
  /** Swatch hex for display. */
  dot: string;
  /** Base colours flattering near the face for this tier. */
  flatterTops: ColorKey[];
  /** Base colours that read off near the face (gentle demote). */
  avoidTops: ColorKey[];
  note: string;
}

/** Metadata for a curated combination (from the research dataset). */
export interface CuratedMeta {
  /** Dataset shade name, e.g. "Sky Blue". */
  topShade: string;
  bottomShade: string;
  /** e.g. "Cognac", "Gold", "Silver", or null. */
  accent: string | null;
  /** e.g. "Quiet Confidence". */
  mood: string;
  /** Mapped to one of the 4 styles. */
  styleTag: StyleName;
  /** e.g. "Universal", "Japanese/Tokyo". */
  region: string;
  /** ["all"] | ["Medium","Deep"] | ["all","Deep"] ... */
  flatters: string[];
  why: string;
  occasion: string;
  timeless: 'timeless' | 'trend';
}

/** A viable combination with its base (occasion/style-independent) score. */
export interface Combo {
  id: ComboId;
  t: ColorKey;
  b: ColorKey;
  sc: number;
  /** The single style bucket this pairing belongs to (drives the Style filter + eyebrow). */
  style: StyleName;
  /** Present iff this is a curated, ownable combo. */
  curated?: CuratedMeta;
}

/** A combination ranked for the current occasion/style context. */
export interface RankedCombo extends Combo {
  osc: number;
}

/** A gap-engine ("colours to buy") suggestion. */
export interface BuySuggestion {
  c: ColorKey;
  /** Existing pieces in the opposite slot that the new colour pairs with. */
  pairs: ColorKey[];
  /** Whether the candidate colour flatters the user. */
  fl: boolean;
}
