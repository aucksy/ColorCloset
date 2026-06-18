/**
 * Skin-tone model — DEPTH ONLY (undertone removed). The flatter sets fold in a
 * warm / olive / deep bias appropriate for South-Asian skin (Medium→Rich), based
 * on India-tuned colour-analysis research, mapped onto the existing 16 colours.
 * Used softly to rank combinations; never excludes a colour.
 */
import type { ColorKey, DepthId, SkinObj } from './types';

export const DEPTHS: { id: DepthId; name: string; dot: string }[] = [
  { id: 'fair', name: 'Fair', dot: '#F3DBC8' },
  { id: 'light', name: 'Light', dot: '#EAC3A1' },
  { id: 'medium', name: 'Medium', dot: '#D3A074' },
  { id: 'tan', name: 'Tan', dot: '#B27B4D' },
  { id: 'deep', name: 'Deep', dot: '#8A5A33' },
  { id: 'rich', name: 'Rich', dot: '#5C3B23' },
];

/**
 * Colours that tend to flatter each depth (warm/jewel/deep bias). Fair/Light get
 * jewel tones + deep anchors for contrast; Medium→Rich lean into warm earth +
 * saturated jewel tones and crisp whites; ashy/icy/muddy tones are kept out.
 */
const DEPTH_FLATTER: Record<DepthId, ColorKey[]> = {
  fair: ['Navy', 'Burgundy', 'Forest Green', 'Purple', 'Blue', 'Charcoal', 'Olive', 'White'],
  light: ['Mustard', 'Navy', 'Burgundy', 'Rust', 'Blue', 'Forest Green', 'Purple', 'Olive'],
  medium: ['Mustard', 'Rust', 'Forest Green', 'Burgundy', 'Olive', 'Purple', 'Cream', 'Khaki'],
  tan: ['Rust', 'Mustard', 'Burgundy', 'Forest Green', 'Olive', 'Khaki', 'Cream', 'Blue'],
  deep: ['Purple', 'Forest Green', 'Burgundy', 'Mustard', 'Blue', 'White', 'Rust', 'Navy'],
  rich: ['White', 'Purple', 'Forest Green', 'Mustard', 'Blue', 'Burgundy', 'Navy', 'Light Blue'],
};

const DEPTH_WORD: Record<DepthId, string> = {
  fair: 'Jewel tones and deep anchors',
  light: 'Warm brights and jewel tones',
  medium: 'Warm, earthy and jewel tones',
  tan: 'Rich earthy and saturated jewel tones',
  deep: 'Bold saturated tones and crisp whites',
  rich: 'High-saturation brights and crisp contrast',
};

/** Flatter set for a depth (max 9). */
export function flatterFor(depth: DepthId | null | undefined): ColorKey[] {
  const d = depth ?? 'medium';
  return (DEPTH_FLATTER[d] ?? DEPTH_FLATTER.medium).slice(0, 9);
}

/** One-line plain-language note describing what tends to flatter the selected depth. */
export function skinNote(depth: DepthId | null | undefined): string {
  const d = DEPTHS.find((x) => x.id === depth) || DEPTHS[2];
  return `${DEPTH_WORD[d.id]} tend to flatter ${d.name.toLowerCase()} skin — used softly to rank your combinations.`;
}

/** Resolve a full skin profile. depth null -> Medium. */
export function skinObj(depth: DepthId | null | undefined): SkinObj {
  const d = DEPTHS.find((x) => x.id === depth) || DEPTHS[2];
  return {
    id: d.id,
    depth: d.id,
    name: d.name,
    short: d.name,
    dot: d.dot,
    flatter: flatterFor(d.id),
    note: skinNote(d.id),
  };
}
