/**
 * The scoring core: harmony (person-independent), style bias, and the combined
 * score = harmony + flatter bonuses + gentle office lean + style bias.
 * Weights are the prototype's tuning, adapted for the office-attire positioning.
 */
import { BOLD, COOL, CORP, FAMILY, NEUTRAL, WARM, bottomScore, lum } from './colors';
import { GOOD, GOODSET } from './constants';
import type { ColorKey, SkinObj, StyleName } from './types';

/** How well two colours go together, independent of person/occasion. Clamped 0..1. */
export function harmony(t: ColorKey, b: ColorKey): number {
  let s = 0.45;
  const knownGood = GOODSET.has(t + '|' + b) || GOODSET.has(b + '|' + t);
  if (knownGood) s += 0.4;
  const tN = NEUTRAL.has(t);
  const bN = NEUTRAL.has(b);
  if (tN || bN) s += 0.18;
  if (tN && bN) s += 0.08;
  const dl = Math.abs(lum(t) - lum(b));
  if (dl > 0.32) s += 0.12;
  else if (dl < 0.1 && !(tN && bN)) s -= 0.04;
  // Temperature clash only when both are saturated (non-neutral) colours.
  if (!tN && !bN) {
    if ((WARM.has(t) && COOL.has(b)) || (COOL.has(t) && WARM.has(b))) s -= 0.14;
  }
  // Flatness penalties: the same colour top+bottom (Beige+Beige) reads dead; two
  // colours of the same family at near-equal value (Burgundy+Maroon, Beige+Khaki) too.
  if (t === b) s -= 0.22;
  else if (FAMILY[t] === FAMILY[b] && dl < 0.14) s -= 0.12;
  return Math.max(0, Math.min(1, s));
}

/** Push ranking toward a chosen aesthetic. Exemplar match gives a strong bonus. */
export function styleBias(t: ColorKey, b: ColorKey, style: StyleName | null | undefined): number {
  if (!style) return 0;
  const g = GOOD[style] && GOOD[style].some(([x, y]) => (x === t && y === b) || (x === b && y === t));
  let d = g ? 0.18 : 0;
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
    const U = ['Purple', 'Rust', 'Olive', 'Forest Green', 'Mustard', 'Burgundy'];
    if ((tB || bB) && (tN || bN)) d += 0.1;
    if (tB && bB) d += 0.07;
    if (tN && bN) d -= 0.1;
    if (U.includes(t) || U.includes(b)) d += 0.05;
  }
  return d;
}

/**
 * Combined score for a (top, bottom) pairing. The app is positioned for office
 * attire, so the base carries a gentle corporate lean and a grounded-neutral-bottom
 * nudge; the Style axis then shapes the ranking. (No occasion axis.)
 */
export function score(
  t: ColorKey,
  b: ColorKey,
  skin: SkinObj | null,
  style?: StyleName | null
): number {
  let s = harmony(t, b);
  // Skin depth (a moderate re-rank signal): favoured colours lift, "avoid" colours
  // drop — strong enough to visibly reorder for deep vs fair skin, not to bury a pick.
  const fl = skin ? skin.flatter : [];
  const av = skin ? skin.avoid : [];
  if (fl.includes(t)) s += 0.09;
  if (fl.includes(b)) s += 0.06;
  if (av.includes(t)) s -= 0.08;
  if (av.includes(b)) s -= 0.06;
  // Office lean on the top, and bottom-slot suitability: real office trousers (navy,
  // grey, charcoal, khaki...) lift; implausible trousers (mustard, maroon, rust) drop.
  if (CORP.has(t)) s += 0.03;
  s += 0.06 * bottomScore(b);
  if (bottomScore(b) < 0.25) s -= 0.1;
  s += styleBias(t, b, style);
  return s;
}

/** Category label for naming/eyebrow text. */
export function catFor(t: ColorKey, b: ColorKey): string {
  if (GOODSET.has(t + '|' + b) || GOODSET.has(b + '|' + t)) {
    for (const c of ['Classic', 'Bold', 'Statement', 'Minimal'] as StyleName[]) {
      if (GOOD[c].some(([x, y]) => x === t && y === b)) return c.toUpperCase();
    }
  }
  if (NEUTRAL.has(t) && NEUTRAL.has(b)) return 'NEUTRAL';
  if (BOLD.has(t) || BOLD.has(b)) return 'BOLD';
  return 'EVERYDAY';
}
