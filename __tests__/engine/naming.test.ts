import {
  comboName,
  comboWhy,
  whyText,
  tierNote,
  findCurated,
  skinObj,
  type CuratedMeta,
} from '../../src/engine';

describe('comboName', () => {
  it('uses the curated mood for a curated pair', () => {
    const cur = findCurated('Light Blue', 'Navy', 'male', 'formal')!;
    expect(comboName('Light Blue', 'Navy', cur)).toBe(cur.mood);
  });

  it('is deterministic for a generative pair (stable per id)', () => {
    const a = comboName('Olive', 'Beige');
    const b = comboName('Olive', 'Beige');
    expect(a).toBe(b);
    expect(typeof a).toBe('string');
  });
});

describe('comboWhy (named-shade aware, never a skin sentence)', () => {
  it('curated: leads with the doc why and names both shades', () => {
    const cur = findCurated('Light Blue', 'Navy', 'male', 'formal')!;
    const segs = comboWhy({ t: 'Light Blue', b: 'Navy', curated: cur });
    const text = whyText(segs);
    expect(text).toContain('Sky Blue');
    expect(text).toContain('Navy');
    expect(text).toContain(cur.why);
    expect(segs.some((s) => s.bold)).toBe(true); // shade names are bold
  });

  it('generative: no skin-tone sentence leaks into the rationale', () => {
    const segs = comboWhy({ t: 'Olive', b: 'Beige' });
    const text = whyText(segs).toLowerCase();
    expect(text).not.toContain('skin');
    expect(text).not.toContain('flatters your');
  });
});

describe('tierNote (replaces the static skin pill)', () => {
  const deep = skinObj(8); // Deep
  const medium = skinObj(5); // Medium

  it('is null when the curated combo flatters everyone ("all")', () => {
    const allCombo: CuratedMeta = { flatters: ['all'] } as CuratedMeta;
    expect(tierNote(allCombo, deep)).toBeNull();
  });

  it('speaks up only when the combo names the user’s own tier', () => {
    const deepCombo: CuratedMeta = { flatters: ['all', 'Deep'] } as CuratedMeta;
    expect(tierNote(deepCombo, deep)).toBeTruthy();
    expect(tierNote(deepCombo, medium)).toBeNull(); // medium user → no note
  });

  it('returns null with no curated meta or no skin', () => {
    expect(tierNote(null, deep)).toBeNull();
    expect(tierNote({ flatters: ['Deep'] } as CuratedMeta, null)).toBeNull();
  });
});
