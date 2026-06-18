/**
 * Skin-tone model: depth ladder, undertone, and the "flatter set" derivation.
 * Used softly to rank combinations; never excludes a colour.
 * Ported verbatim from the prototype (lines ~622-653, 891-895, §9.4).
 */
import type { ColorKey, DepthId, SkinObj, ToneId } from './types';

export const DEPTHS: { id: DepthId; name: string; dot: string }[] = [
  { id: 'fair', name: 'Fair', dot: '#F3DBC8' },
  { id: 'light', name: 'Light', dot: '#EAC3A1' },
  { id: 'medium', name: 'Medium', dot: '#D3A074' },
  { id: 'tan', name: 'Tan', dot: '#B27B4D' },
  { id: 'deep', name: 'Deep', dot: '#8A5A33' },
  { id: 'rich', name: 'Rich', dot: '#5C3B23' },
];

export const TONES: { id: ToneId; name: string }[] = [
  { id: 'cool', name: 'Cool' },
  { id: 'neutral', name: 'Neutral' },
  { id: 'warm', name: 'Warm' },
  { id: 'olive', name: 'Olive' },
];

/** Base flattering colours by undertone (the stronger signal). */
export const TONE_FLATTER: Record<ToneId, ColorKey[]> = {
  cool: ['Navy', 'Charcoal', 'Burgundy', 'Blue', 'Grey', 'Purple', 'Forest Green', 'White'],
  neutral: ['Navy', 'White', 'Grey', 'Burgundy', 'Blue', 'Olive', 'Beige', 'Charcoal'],
  warm: ['Cream', 'Beige', 'Olive', 'Rust', 'Mustard', 'Khaki', 'Forest Green', 'White'],
  olive: ['White', 'Cream', 'Burgundy', 'Rust', 'Forest Green', 'Charcoal', 'Navy', 'Mustard'],
};

const TONE_WORD: Record<ToneId, string> = {
  cool: 'Cool, jewel and deep tones',
  neutral: 'Clean contrasts and balanced tones',
  warm: 'Warm, earthy shades',
  olive: 'Rich earthy and jewel tones',
};

/**
 * Flatter set from undertone (primary) adjusted by depth (contrast), capped at 9.
 * Deep/Rich add high-contrast pops; Fair/Light add deeper anchors.
 */
export function flatterFor(depth: DepthId | null | undefined, tone: ToneId): ColorKey[] {
  const list = (TONE_FLATTER[tone] || TONE_FLATTER.neutral).slice();
  if (depth === 'deep' || depth === 'rich') {
    ['White', 'Light Blue', 'Mustard', 'Rust'].forEach((c) => {
      if (!list.includes(c)) list.push(c);
    });
  }
  if (depth === 'fair' || depth === 'light') {
    ['Navy', 'Burgundy', 'Charcoal', 'Forest Green'].forEach((c) => {
      if (!list.includes(c)) list.push(c);
    });
  }
  return list.slice(0, 9);
}

/** One-line plain-language note describing what tends to flatter the selection. */
export function skinNote(depth: DepthId | null | undefined, tone: ToneId): string {
  const d = (DEPTHS.find((x) => x.id === depth) || { name: 'your' }).name.toLowerCase();
  return `${TONE_WORD[tone] || 'Balanced tones'} tend to flatter ${d}, ${tone} skin — used softly to rank your combinations.`;
}

/** Resolve a full skin profile. depth null -> Medium; tone defaults to neutral. */
export function skinObj(depth: DepthId | null | undefined, tone: ToneId | null | undefined): SkinObj {
  const d = DEPTHS.find((x) => x.id === depth) || DEPTHS[2];
  const t = TONES.find((x) => x.id === tone) || TONES[1];
  return {
    id: d.id + '-' + t.id,
    depth: d.id,
    tone: t.id,
    name: d.name + ' · ' + t.name,
    short: d.name,
    dot: d.dot,
    flatter: flatterFor(d.id, t.id),
    note: skinNote(d.id, t.id),
  };
}
