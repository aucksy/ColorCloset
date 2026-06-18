/**
 * Prototype-parity / regression guard. Snapshots the engine's universe and ranked
 * decks for the prototype's sample wardrobe, plus structural invariants. Run with
 * `npm test -- -u` to (re)bless snapshots after an intentional engine change.
 */
import { buildDeck, comboUniverse, gapSuggestions, skinObj } from '../../src/engine';

// The prototype's SAMPLE_TOPS / SAMPLE_BOTTOMS fallback wardrobes (prototype lines 744-745).
const SAMPLE_TOPS = ['White', 'Light Blue', 'Navy', 'Black', 'Grey', 'Olive', 'Burgundy', 'Beige'];
const SAMPLE_BOTTOMS = ['Beige', 'Navy', 'Grey', 'Black', 'Blue', 'Cream', 'Charcoal', 'Khaki'];
const skin = skinObj('medium'); // prototype defaults

const round = (n: number) => Math.round(n * 1e4) / 1e4;

describe('golden: sample wardrobe', () => {
  const uni = comboUniverse(SAMPLE_TOPS, SAMPLE_BOTTOMS, skin);

  it('universe (ids + scores) matches the snapshot', () => {
    expect(uni.map((c) => ({ id: c.id, sc: round(c.sc) }))).toMatchSnapshot();
  });

  it('every viable pairing clears the universe threshold and is best-first', () => {
    uni.forEach((c) => expect(c.sc).toBeGreaterThanOrEqual(0.55));
    for (let i = 1; i < uni.length; i++) expect(uni[i - 1].sc).toBeGreaterThanOrEqual(uni[i].sc);
  });

  it.each([
    ['Everyday', 'Minimal'],
    ['Office', 'Classic'],
    ['Party', 'Bold'],
  ] as const)('ranked deck for %s + %s matches the snapshot', (occ, style) => {
    const deck = buildDeck({
      tops: SAMPLE_TOPS,
      bottoms: SAMPLE_BOTTOMS,
      skin,
      occ,
      style,
      types: {},
      typeFilter: 'all',
    });
    // Same membership as the universe, only re-ordered.
    expect(deck.length).toBe(uni.length);
    expect(deck.map((c) => `${c.id}@${round(c.osc)}`)).toMatchSnapshot();
  });

  it('gap suggestions are stable', () => {
    const { asTops, asBottoms } = gapSuggestions(SAMPLE_TOPS, SAMPLE_BOTTOMS, skin);
    const shape = (arr: { c: string; pairs: string[]; fl: boolean }[]) =>
      arr.map((s) => ({ c: s.c, n: s.pairs.length, fl: s.fl }));
    expect({ asTops: shape(asTops), asBottoms: shape(asBottoms) }).toMatchSnapshot();
  });
});
