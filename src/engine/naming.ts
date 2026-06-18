/**
 * Outfit names and the "why this works" rationale.
 * Ported from the prototype (lines ~716-736). Two adaptations for React Native:
 *  - nameFor takes an injected `rng` (default Math.random) so it is testable and so
 *    the name is computed once per combo, not re-randomised on every re-render.
 *  - whyFor returns structured segments (not an HTML string) for <Text> rendering.
 */
import { BOLD, CORP, NEUTRAL } from './colors';
import { GOODSET, OCC_PHRASE } from './constants';
import { catFor } from './scoring';
import type { ColorKey, Occasion, StyleName } from './types';

const NAMES: Record<string, string[]> = {
  NEUTRAL: ['Quiet Neutral', 'Clean Slate', 'Easy Classic'],
  MINIMAL: ['Quiet Minimal', 'Clean Neutral', 'Pared Back'],
  CLASSIC: ['Timeless Classic', 'Navy Standard', 'Polished Classic'],
  BOLD: ['Bold Energy', 'Rich Contrast', 'Confident Earth'],
  STATEMENT: ['Statement Pair', 'Creative Contrast', 'Signature Look'],
  EVERYDAY: ['Easy Everyday', 'Soft Contrast', 'Off-Duty'],
};

/** A short, evocative name for a pairing. `rng` injected for determinism/testing. */
export function nameFor(
  t: ColorKey,
  b: ColorKey,
  style?: StyleName | null,
  rng: () => number = Math.random
): string {
  if ((t === 'Navy' || b === 'Navy' || t === 'Blue') && CORP.has(t) && CORP.has(b)) {
    return 'Corporate Blue';
  }
  const c = style ? style.toUpperCase() : catFor(t, b);
  const p = NAMES[c] || NAMES.EVERYDAY;
  return p[Math.floor(rng() * p.length)];
}

/** A rationale segment; `bold` marks the champagne-gold emphasis (colour names). */
export interface RationaleSegment {
  text: string;
  bold?: boolean;
}

/**
 * The "why this works" line, as ordered segments: [topName, connector, bottomName, tail].
 * Mirrors the prototype's whyFor branching exactly.
 */
export function whyFor(
  t: ColorKey,
  b: ColorKey,
  occ: Occasion,
  style?: StyleName | null
): RationaleSegment[] {
  const o = OCC_PHRASE[occ] || 'any setting';
  const seg = (sep: string, tail: string): RationaleSegment[] => [
    { text: t, bold: true },
    { text: sep },
    { text: b, bold: true },
    { text: tail },
  ];

  if (style) {
    switch (style) {
      case 'Minimal':
        return seg(' with ', ` is a quiet, pared-back pairing — clean and easy, and it works for ${o}.`);
      case 'Classic':
        return seg(' with ', ` is a timeless, put-together match — reliable and right for ${o}.`);
      case 'Bold':
        return seg(' against ', ` brings warmth and presence — a standout choice for ${o}.`);
      case 'Statement':
        return seg(' with ', ` is an unexpected but considered match — distinctive, and a good fit for ${o}.`);
    }
  }

  const tN = NEUTRAL.has(t);
  const bN = NEUTRAL.has(b);
  if (tN && bN) return seg(' with ', ` is a calm, fail-safe neutral pairing — balanced and right for ${o}.`);
  if (BOLD.has(t) || BOLD.has(b)) return seg(' against ', ` adds warmth and presence — a confident pick for ${o}.`);
  if (GOODSET.has(t + '|' + b) || GOODSET.has(b + '|' + t)) {
    return seg(' and ', ` is a clean, classic match that always reads well for ${o}.`);
  }
  return seg(' with ', ` balances nicely — an easy, wearable combination for ${o}.`);
}

/** Flatten rationale segments into a plain string (accessibility labels / tests). */
export function whyText(segments: RationaleSegment[]): string {
  return segments.map((s) => s.text).join('');
}
