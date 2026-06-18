/**
 * The 16-colour model and shade generation.
 * Ported verbatim from the prototype (lines ~602-620, 9.1 / Appendix A in the PRD).
 * All transforms reproduce the prototype's exact hex output.
 */
import type { ColorEntry, ColorKey, ShadeIndex } from './types';

/** Base hex for each of the 16 named colours. */
const BASE_HEX: Record<ColorKey, string> = {
  White: '#F7F6F1',
  'Light Blue': '#AFC9E2',
  Navy: '#22335A',
  Blue: '#3A6EA5',
  Grey: '#8B8E95',
  Black: '#1B1B1F',
  Olive: '#6C7138',
  Burgundy: '#72202F',
  Beige: '#DAC8A9',
  Khaki: '#BEB079',
  Charcoal: '#34373D',
  Cream: '#EFE7D2',
  Mustard: '#C9A227',
  'Forest Green': '#2F4E3B',
  Rust: '#9E4A28',
  Purple: '#5B4B8A',
};

/** Ordered colour keys (drives grid order + iteration; matches prototype). */
export const KEYS: ColorKey[] = Object.keys(BASE_HEX);

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
 * Verbatim port of the prototype `_mix`.
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

/** Build the COLORS table: base hex, rgb, and the 5-step shade strip. */
export const COLORS: Record<ColorKey, ColorEntry> = KEYS.reduce(
  (acc, k) => {
    const base = BASE_HEX[k];
    acc[k] = {
      hex: base,
      rgb: rgb(base),
      // Shade 0..4 : lighten 34%, lighten 17%, base, darken 18%, darken 34%.
      shades: [mix(base, 0.34), mix(base, 0.17), base, mix(base, -0.18), mix(base, -0.34)],
    };
    return acc;
  },
  {} as Record<ColorKey, ColorEntry>
);

/** Base hex for a colour key, with a grey fallback for unknown keys. */
export const hx = (k: ColorKey): string => (COLORS[k] || { hex: '#888888' }).hex;

/** Hex for a colour at a given shade index (defaults to the mid/base shade, 2). */
export function shadeHex(key: ColorKey, idx: ShadeIndex | null | undefined): string {
  const entry = COLORS[key];
  if (!entry) return hx(key);
  const i = idx == null ? 2 : idx;
  return entry.shades[i] ?? entry.hex;
}

/** "rgb(r,g,b)" form — required by react-native-svg / Reanimated colour interpolation. */
export function rgbString(hex: string): string {
  const [r, g, b] = rgb(hex);
  return `rgb(${r}, ${g}, ${b})`;
}

/** Perceptual luminance 0..1 (0.299R + 0.587G + 0.114B). */
export function lum(k: ColorKey): number {
  const [r, g, b] = COLORS[k].rgb;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/** Nearest named colour to an RGB triple (kept for v1.1 photo extraction). */
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

export const NEUTRAL = new Set<ColorKey>([
  'White', 'Grey', 'Black', 'Beige', 'Cream', 'Charcoal', 'Khaki', 'Navy',
]);
export const WARM = new Set<ColorKey>(['Beige', 'Cream', 'Khaki', 'Olive', 'Mustard', 'Rust']);
export const COOL = new Set<ColorKey>([
  'Navy', 'Blue', 'Light Blue', 'Charcoal', 'Purple', 'Forest Green',
]);
/** Bold / expressive colours. */
export const BOLD = new Set<ColorKey>([
  'Burgundy', 'Rust', 'Mustard', 'Forest Green', 'Purple', 'Olive',
]);
/** Clean / professional ("Corporate") set used by Office occasion + Classic style. */
export const CORP = new Set<ColorKey>([
  'Navy', 'Charcoal', 'Grey', 'White', 'Light Blue', 'Blue', 'Beige',
]);
