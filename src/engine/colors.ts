/**
 * The 17-base colour model, derived from the research dataset's named SHADE_VOCAB.
 * Each base owns a strip of named shades (most 5, Beige 6); the display default is
 * the shade nearest the doc's "(base #..)" header hex. This module also defines the
 * colour SETS (neutral/warm/cool/bold/corp/family/bottom) that the harmony, occasion
 * and style logic stand on. Pure & dependency-free.
 *
 * Data source of truth: Product Docs/Color Combination Research.md ("## JSON EXPORT")
 * via `./data` (SHADE_VOCAB). Code-shape contract: ENGINE_REBUILD_SPEC.md §4.
 * (Rebuilt from the prototype's 18-colour model: Maroon dropped, Brown base now
 * `#6B4423`, shades now come from the named vocabulary instead of a ±mix transform.)
 */
import { SHADE_VOCAB } from './data';
import type { ColorEntry, ColorKey, ShadeIndex } from './types';

/**
 * Ordered colour keys — the fixed 17-base display order (neutral → cool → warm/bold),
 * matching the research doc's vocabulary order. Drives grid order + iteration.
 */
export const KEYS: ColorKey[] = [
  'White',
  'Cream',
  'Beige',
  'Khaki',
  'Light Blue',
  'Blue',
  'Navy',
  'Grey',
  'Charcoal',
  'Black',
  'Olive',
  'Forest Green',
  'Mustard',
  'Rust',
  'Burgundy',
  'Purple',
  'Brown',
];

/** Base hex per colour — the doc's "(base #..)" header hex for each of the 17 bases. */
export const BASE_HEX: Record<ColorKey, string> = {
  White: '#F7F6F1',
  Cream: '#EFE7D2',
  Beige: '#DAC8A9',
  Khaki: '#BEB079',
  'Light Blue': '#AFC9E2',
  Blue: '#3A6EA5',
  Navy: '#22335A',
  Grey: '#8B8E95',
  Charcoal: '#34373D',
  Black: '#1B1B1F',
  Olive: '#6C7138',
  'Forest Green': '#2F4E3B',
  Mustard: '#C9A227',
  Rust: '#9E4A28',
  Burgundy: '#72202F',
  Purple: '#5B4B8A',
  Brown: '#6B4423',
};

/** Parse "#rrggbb" -> [r,g,b] (0-255). */
export function rgb(h: string): [number, number, number] {
  return [
    parseInt(h.slice(1, 3), 16),
    parseInt(h.slice(3, 5), 16),
    parseInt(h.slice(5, 7), 16),
  ];
}

/**
 * Lighten (t>=0, mix channel toward 255 by t) or darken (t<0, multiply by 1+t).
 * Verbatim port of the prototype `_mix` — kept for theming/animation callers that
 * still derive tints/shades from a single base hex.
 */
export function mix(hex: string, t: number): string {
  let [r, g, b] = rgb(hex);
  if (t >= 0) {
    r += (255 - r) * t;
    g += (255 - g) * t;
    b += (255 - b) * t;
  } else {
    const k = 1 + t;
    r *= k;
    g *= k;
    b *= k;
  }
  const h = (n: number) =>
    ('0' + Math.max(0, Math.min(255, Math.round(n))).toString(16)).slice(-2);
  return '#' + h(r) + h(g) + h(b);
}

/** Squared Euclidean RGB distance between two hexes (used to pick the base shade). */
function rgbDist2(a: string, b: string): number {
  const [r1, g1, b1] = rgb(a);
  const [r2, g2, b2] = rgb(b);
  return (r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2;
}

/**
 * Build the COLORS table from SHADE_VOCAB: per base, gather its named shades in doc
 * order (5 for most bases, 6 for Beige), then pick `baseIdx` as the shade nearest the
 * "(base #..)" header hex by Euclidean RGB — that shade is the display default.
 */
export const COLORS: Record<ColorKey, ColorEntry> = KEYS.reduce(
  (acc, k) => {
    const base = BASE_HEX[k];
    const entries = SHADE_VOCAB.filter((s) => s.base === k);
    const shades = entries.map((s) => s.hex);
    const shadeNames = entries.map((s) => s.shade);
    // Display default = shade whose hex is nearest the base hex (Euclidean RGB).
    let baseIdx = 0;
    let best = Infinity;
    shades.forEach((hex, i) => {
      const d = rgbDist2(hex, base);
      if (d < best) {
        best = d;
        baseIdx = i;
      }
    });
    acc[k] = { hex: base, rgb: rgb(base), shades, shadeNames, baseIdx };
    return acc;
  },
  {} as Record<ColorKey, ColorEntry>
);

/** Base hex for a colour key, with a grey fallback for unknown keys. */
export const hx = (k: ColorKey): string => (COLORS[k] || { hex: '#888888' }).hex;

/**
 * Hex for a colour at a given shade index; `idx` null/undefined → the base's display
 * default (`baseIdx`). Unknown key → the grey fallback via `hx`.
 */
export function shadeHex(key: ColorKey, idx: ShadeIndex | null | undefined): string {
  const entry = COLORS[key];
  if (!entry) return hx(key);
  const i = idx == null ? entry.baseIdx : idx;
  return entry.shades[i] ?? entry.hex;
}

/**
 * Named shade for a colour at a given index; `idx` null/undefined → the base's
 * display-default name. Unknown key (or out-of-range idx) → the key itself.
 */
export function shadeName(key: ColorKey, idx: ShadeIndex | null | undefined): string {
  const entry = COLORS[key];
  if (!entry) return key;
  const i = idx == null ? entry.baseIdx : idx;
  return entry.shadeNames[i] ?? key;
}

/** Lookup of every named shade → its hex (e.g. "Sky Blue" → "#87CEEB"). */
export const SHADE_HEX_BY_NAME: Record<string, string> = SHADE_VOCAB.reduce(
  (acc, s) => {
    acc[s.shade] = s.hex;
    return acc;
  },
  {} as Record<string, string>
);

/**
 * Hex for a named shade ("Sky Blue"), falling back to a base name's display default,
 * then the grey fallback. Used to render a curated combo's exact dataset shade.
 */
export function shadeHexByName(name: string): string {
  return SHADE_HEX_BY_NAME[name] ?? (COLORS[name] ? shadeHex(name, null) : '#888888');
}

/** "rgb(r,g,b)" form — required by react-native-svg / Reanimated colour interpolation. */
export function rgbString(hex: string): string {
  const [r, g, b] = rgb(hex);
  return `rgb(${r}, ${g}, ${b})`;
}

/** Perceptual luminance 0..1 (0.299R + 0.587G + 0.114B) of an arbitrary hex. */
export function lumHex(hex: string): number {
  const [r, g, b] = rgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/**
 * Perceptual luminance 0..1 of a base colour, measured on its DEFAULT shade hex
 * (`shadeHex(k, null)` = the shade nearest the base header hex) so the scorer reasons
 * about the colour the card actually shows (ENGINE_REBUILD_SPEC §7). For most bases the
 * default shade equals the base hex; a few (Burgundy/Beige/Olive/Cream) differ slightly.
 */
export function lum(k: ColorKey): number {
  return lumHex(COLORS[k] ? shadeHex(k, null) : '#888888');
}

/** Nearest named base colour to an RGB triple (by base hex; kept for photo extraction). */
export function nearest(r: number, g: number, b: number): ColorKey {
  let best: ColorKey = KEYS[0];
  let bd = 1e9;
  for (const k of KEYS) {
    const [R, G, B] = COLORS[k].rgb;
    const d = (R - r) ** 2 + (G - g) ** 2 + (B - b) ** 2;
    if (d < bd) {
      bd = d;
      best = k;
    }
  }
  return best;
}

/* ---------- Colour sets (the backbone of harmony / occasion / style logic) ---------- */

/**
 * Free-agent neutrals (doc principle #3): white/cream/beige/grey/charcoal/navy/black
 * pair with anything; Khaki & Brown are warm neutrals that join them here.
 */
export const NEUTRAL = new Set<ColorKey>([
  'White', 'Cream', 'Beige', 'Khaki', 'Grey', 'Charcoal', 'Black', 'Navy', 'Brown',
]);
/** Warm / earth tones (doc #4). */
export const WARM = new Set<ColorKey>([
  'Cream', 'Beige', 'Khaki', 'Olive', 'Mustard', 'Rust', 'Brown',
]);
/** Cool tones (doc #4). */
export const COOL = new Set<ColorKey>([
  'Navy', 'Blue', 'Light Blue', 'Charcoal', 'Grey', 'Forest Green', 'Purple',
]);
/** Bold / saturated / expressive colours. */
export const BOLD = new Set<ColorKey>([
  'Olive', 'Forest Green', 'Mustard', 'Rust', 'Burgundy', 'Purple',
]);
/** Clean / professional ("Corporate") set — the office lean + Classic style. */
export const CORP = new Set<ColorKey>([
  'Navy', 'Charcoal', 'Grey', 'White', 'Light Blue', 'Blue', 'Beige', 'Brown', 'Cream',
]);

/**
 * Colour families — two colours in the same family at near-equal value read flat.
 * (Burgundy keeps its own `darkred` family; there is no "Maroon" base any more.)
 */
export const FAMILY: Record<ColorKey, string> = {
  White: 'white',
  Cream: 'warmneutral',
  Beige: 'warmneutral',
  Khaki: 'warmneutral',
  Brown: 'warmneutral',
  Grey: 'grey',
  Charcoal: 'grey',
  Black: 'black',
  'Light Blue': 'blue',
  Blue: 'blue',
  Navy: 'blue',
  Olive: 'green',
  'Forest Green': 'green',
  Burgundy: 'darkred',
  Mustard: 'mustard',
  Rust: 'rust',
  Purple: 'purple',
};

/**
 * How realistic each colour is as TROUSERS/BOTTOMS (0..1), from menswear research.
 * Used to demote implausible trousers (nobody wears mustard/rust trousers in an
 * office) — both in ranking and in the "colours to buy" gap engine. Never deletes.
 */
export const BOTTOM: Record<ColorKey, number> = {
  Navy: 1.0,
  Grey: 0.97,
  Charcoal: 0.97,
  Khaki: 0.95,
  Black: 0.92,
  Beige: 0.9,
  Brown: 0.88,
  Olive: 0.85,
  Cream: 0.72,
  White: 0.6,
  Blue: 0.45,
  'Light Blue': 0.2,
  'Forest Green': 0.2,
  Burgundy: 0.18,
  Rust: 0.12,
  Mustard: 0.08,
  Purple: 0.08,
};

/** Bottom-suitability with a safe default for unknown keys. */
export const bottomScore = (k: ColorKey): number => BOTTOM[k] ?? 0.5;
