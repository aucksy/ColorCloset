/**
 * Core engine types. The engine is a pure, deterministic, dependency-free module
 * (no React Native imports) ported verbatim from the validated web prototype.
 * Source of truth: Product Docs/colorcloset-v3 Prototype.html
 */

/** One of the 16 named colours (e.g. "Navy", "Burgundy"). */
export type ColorKey = string;

/** Skin depth ladder, lightest -> deepest. Drives the (depth-only) flatter sets. */
export type DepthId = 'fair' | 'light' | 'medium' | 'tan' | 'deep' | 'rich';

/** Visual-risk axis, independent of occasion. */
export type StyleName = 'Minimal' | 'Classic' | 'Bold' | 'Statement';

/** How dressed-up the look should read (the "Dress code" axis). Kept to three
 *  simple buckets; the engine maps each to a different ranking bias. */
export type Occasion = 'Casual' | 'Formal' | 'Relaxed';

/** Optional clothing-context tags. */
export type ClothType = 'casual' | 'formal' | 'gym' | 'ethnic';

/** "All" plus the three cloth types, used by the Style-me "For" filter. */
export type TypeFilter = 'all' | ClothType;

/** Shade index into a colour's 5-step light->dark strip. 2 = base/default. */
export type ShadeIndex = 0 | 1 | 2 | 3 | 4;

/** A combination id, formatted `${top}|${bottom}`. */
export type ComboId = string;

/** A single colour entry in the palette. */
export interface ColorEntry {
  hex: string;
  rgb: [number, number, number];
  /** 5 shades, lightest (0) -> darkest (4); index 2 is the base hex. */
  shades: string[];
}

/** Resolved skin profile used by scoring (depth-only; undertone removed). */
export interface SkinObj {
  id: string;
  depth: DepthId;
  name: string;
  short: string;
  dot: string;
  /** Colours that tend to flatter this skin depth (max 9). */
  flatter: ColorKey[];
  note: string;
}

/** A viable combination with its base (occasion/style-independent) score. */
export interface Combo {
  id: ComboId;
  t: ColorKey;
  b: ColorKey;
  sc: number;
}

/** A combination ranked for the current occasion/style context. */
export interface RankedCombo extends Combo {
  osc: number;
}

/** A gap-engine ("what to buy") suggestion. */
export interface BuySuggestion {
  c: ColorKey;
  /** Existing pieces in the opposite slot that the new colour pairs with. */
  pairs: ColorKey[];
  /** Whether the candidate colour flatters the user. */
  fl: boolean;
}
