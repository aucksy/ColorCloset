import {
  buildDeck,
  comboUniverse,
  skinObj,
  stepRec,
  uniStats,
  type RankedCombo,
} from '../../src/engine';

const skin = skinObj('medium');

describe('comboUniverse (threshold 0.55 + fallback)', () => {
  it('includes pairings at/above the threshold', () => {
    const uni = comboUniverse(['White'], ['Grey'], skin);
    expect(uni.map((c) => c.id)).toEqual(['White|Grey']);
    expect(uni[0].sc).toBeGreaterThanOrEqual(0.55);
  });

  it('falls back to the single best pairing when none clear the threshold', () => {
    // Olive+Blue scores ~0.41 (< 0.55) but must still surface so the user is never stuck.
    const uni = comboUniverse(['Olive'], ['Blue'], skin);
    expect(uni).toHaveLength(1);
    expect(uni[0].id).toBe('Olive|Blue');
    expect(uni[0].sc).toBeLessThan(0.55);
  });

  it('is sorted best-first and deterministic', () => {
    const tops = ['White', 'Navy', 'Olive'];
    const bottoms = ['Grey', 'Beige', 'Charcoal'];
    const a = comboUniverse(tops, bottoms, skin);
    const b = comboUniverse(tops, bottoms, skin);
    expect(a).toEqual(b); // determinism
    for (let i = 1; i < a.length; i++) expect(a[i - 1].sc).toBeGreaterThanOrEqual(a[i].sc);
  });
});

describe('uniStats', () => {
  it('counts worn pairings within the universe only', () => {
    const tops = ['White', 'Navy'];
    const bottoms = ['Grey', 'Beige'];
    const uni = comboUniverse(tops, bottoms, skin);
    const wornId = uni[0].id;
    const stats = uniStats(tops, bottoms, skin, { [wornId]: '1 Jan', 'Bogus|Combo': '2 Jan' });
    expect(stats.total).toBe(uni.length);
    expect(stats.worn).toBe(1); // the bogus id is ignored
  });
});

describe('stepRec (the "Another" walk)', () => {
  const deck = [
    { id: 'a' },
    { id: 'b' },
    { id: 'c' },
  ] as unknown as RankedCombo[];

  it('walks forward and wraps, starting at pos -1', () => {
    let pos = -1;
    const seen: string[] = [];
    for (let i = 0; i < 4; i++) {
      const r = stepRec(deck, pos, {})!;
      seen.push(r.pick.id);
      pos = r.pos;
      expect(r.roundDone).toBe(false);
    }
    expect(seen).toEqual(['a', 'b', 'c', 'a']); // wraps back to the top
  });

  it('skips worn pairings until the un-worn set is exhausted', () => {
    const r = stepRec(deck, -1, { a: 'worn' });
    expect(r!.pick.id).toBe('b'); // skips the worn 'a'
    expect(r!.roundDone).toBe(false);
  });

  it('loops with roundDone when every pairing is worn', () => {
    const r = stepRec(deck, -1, { a: 'x', b: 'x', c: 'x' });
    expect(r!.roundDone).toBe(true);
    expect(r!.pick.id).toBe('a');
  });

  it('returns null for an empty deck', () => {
    expect(stepRec([], -1, {})).toBeNull();
  });
});

describe('buildDeck', () => {
  it('re-ranks the universe by the style score (osc)', () => {
    const deck = buildDeck({
      tops: ['White', 'Burgundy'],
      bottoms: ['Grey', 'Navy'],
      skin,
      style: 'Bold',
    });
    expect(deck.length).toBeGreaterThan(0);
    for (let i = 1; i < deck.length; i++) expect(deck[i - 1].osc).toBeGreaterThanOrEqual(deck[i].osc);
  });
});
