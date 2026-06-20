/**
 * Engine regression guard. Snapshots the universe + ranked decks for a realistic
 * owned wardrobe across all four gender×mode buckets, plus structural invariants.
 * Re-bless after an intentional engine change with:  npx jest -u
 */
import { buildDeck, comboUniverse, gapSuggestions, skinObj, type Gender, type Mode } from '../src/engine';

// A realistic office+casual wardrobe (base colours the user owns).
const TOPS = ['White', 'Light Blue', 'Navy', 'Olive', 'Burgundy', 'Mustard', 'Cream'];
const BOTTOMS = ['Navy', 'Grey', 'Charcoal', 'Khaki', 'Black', 'Beige'];
const skin = skinObj(5); // Medium

const round = (n: number) => Math.round(n * 1e4) / 1e4;
const BUCKETS: { gender: Gender; mode: Mode }[] = [
  { gender: 'male', mode: 'formal' },
  { gender: 'male', mode: 'casual' },
  { gender: 'female', mode: 'formal' },
  { gender: 'female', mode: 'casual' },
];

describe.each(BUCKETS)('golden: $gender $mode', ({ gender, mode }) => {
  const uni = comboUniverse(TOPS, BOTTOMS, skin, gender, mode);

  it('universe (ids + scores) matches the snapshot', () => {
    expect(uni.map((c) => ({ id: c.id, sc: round(c.sc), curated: !!c.curated }))).toMatchSnapshot();
  });

  it('every pairing is non-avoided and sorted best-first', () => {
    for (let i = 1; i < uni.length; i++) expect(uni[i - 1].sc).toBeGreaterThanOrEqual(uni[i].sc);
  });

  it('the per-style decks partition the universe (style filter)', () => {
    const sizes = (['Minimal', 'Classic', 'Bold', 'Statement'] as const).map(
      (style) => buildDeck({ tops: TOPS, bottoms: BOTTOMS, skin, style, gender, mode }).length
    );
    expect(sizes.reduce((a, b) => a + b, 0)).toBe(uni.length);
  });

  it.each(['Minimal', 'Classic', 'Bold', 'Statement'] as const)(
    'ranked deck for %s matches the snapshot',
    (style) => {
      const deck = buildDeck({ tops: TOPS, bottoms: BOTTOMS, skin, style, gender, mode });
      deck.forEach((c) => expect(c.style).toBe(style)); // deck is filtered to this style
      expect(deck.map((c) => `${c.id}@${round(c.osc)}`)).toMatchSnapshot();
    }
  );

  it('gap suggestions are stable', () => {
    const { asTops, asBottoms } = gapSuggestions(TOPS, BOTTOMS, skin, gender, mode);
    const shape = (arr: { c: string; pairs: string[]; fl: boolean }[]) =>
      arr.map((s) => ({ c: s.c, n: s.pairs.length, fl: s.fl }));
    expect({ asTops: shape(asTops), asBottoms: shape(asBottoms) }).toMatchSnapshot();
  });
});
