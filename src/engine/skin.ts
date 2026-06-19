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
// Colours that flatter each depth (favour). Aligned with colour-analysis research:
// fair/light target medium contrast (jewel tones, Charcoal over stark Black/White);
// deep/rich carry crisp White + saturated brights; pale near-skin tones wash out.
const DEPTH_FLATTER: Record<DepthId, ColorKey[]> = {
  fair: ['Navy', 'Burgundy', 'Forest Green', 'Purple', 'Maroon', 'Charcoal', 'Light Blue', 'Blue', 'Grey'],
  light: ['Navy', 'Blue', 'Light Blue', 'Burgundy', 'Maroon', 'Purple', 'Forest Green', 'Charcoal', 'Grey'],
  medium: ['Navy', 'Blue', 'Burgundy', 'Maroon', 'Forest Green', 'Olive', 'Rust', 'Mustard', 'Brown'],
  tan: ['Olive', 'Rust', 'Mustard', 'Brown', 'Khaki', 'Forest Green', 'Burgundy', 'Maroon', 'Navy'],
  deep: ['White', 'Cream', 'Light Blue', 'Burgundy', 'Maroon', 'Forest Green', 'Purple', 'Navy', 'Blue'],
  rich: ['White', 'Cream', 'Light Blue', 'Forest Green', 'Purple', 'Burgundy', 'Maroon', 'Blue', 'Mustard'],
};

// Colours that tend to read off for each depth (washed-out / ashy). Demoted, never excluded.
const DEPTH_AVOID: Record<DepthId, ColorKey[]> = {
  fair: ['White', 'Black', 'Cream', 'Beige', 'Mustard', 'Khaki', 'Rust'],
  light: ['Black', 'White', 'Khaki', 'Olive'],
  medium: ['Beige', 'Cream'],
  tan: ['Beige'],
  deep: ['Beige', 'Khaki', 'Olive', 'Grey'],
  rich: ['Beige', 'Khaki', 'Olive', 'Grey', 'Black'],
};

const DEPTH_WORD: Record<DepthId, string> = {
  fair: 'Jewel tones and softer darks at medium contrast',
  light: 'Cool jewel tones and medium contrast',
  medium: 'Warm, earthy and jewel tones',
  tan: 'Rich warm earths and saturated jewel tones',
  deep: 'Crisp whites and saturated jewel tones at high contrast',
  rich: 'Bright, high-contrast colour and crisp white',
};

/** Flatter set for a depth (max 9). */
export function flatterFor(depth: DepthId | null | undefined): ColorKey[] {
  const d = depth ?? 'medium';
  return (DEPTH_FLATTER[d] ?? DEPTH_FLATTER.medium).slice(0, 9);
}

/** Colours to de-emphasise for a depth. */
export function avoidFor(depth: DepthId | null | undefined): ColorKey[] {
  const d = depth ?? 'medium';
  return DEPTH_AVOID[d] ?? DEPTH_AVOID.medium;
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
    avoid: avoidFor(d.id),
    note: skinNote(d.id),
  };
}
