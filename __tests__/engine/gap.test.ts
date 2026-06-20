import { gapSuggestions, isAvoided, skinObj } from '../../src/engine';

const skin = skinObj(5);
const G = 'male';
const M = 'formal';

describe('gapSuggestions ("what to buy")', () => {
  const { asTops, asBottoms } = gapSuggestions(['White'], ['Navy'], skin, G, M);

  it('never suggests a colour with zero new looks', () => {
    [...asTops, ...asBottoms].forEach((s) => expect(s.pairs.length).toBeGreaterThan(0));
  });

  it('never proposes an avoided pairing', () => {
    asBottoms.forEach((s) => s.pairs.forEach((top) => expect(isAvoided(top, s.c)).toBe(false)));
    asTops.forEach((s) => s.pairs.forEach((bottom) => expect(isAvoided(s.c, bottom)).toBe(false)));
  });

  it('does not suggest colours already owned in that slot', () => {
    expect(asBottoms.find((s) => s.c === 'Navy')).toBeUndefined();
    expect(asTops.find((s) => s.c === 'White')).toBeUndefined();
  });

  it('ranks by new-look count with a flatter bonus (1.5)', () => {
    const rank = (s: { pairs: unknown[]; fl: boolean }) => s.pairs.length + (s.fl ? 1.5 : 0);
    for (let i = 1; i < asBottoms.length; i++) {
      expect(rank(asBottoms[i - 1])).toBeGreaterThanOrEqual(rank(asBottoms[i]));
    }
  });

  it('only suggests realistic trouser colours as bottoms', () => {
    // Mustard/Purple are implausible trousers (below the suitability floor).
    expect(asBottoms.find((s) => s.c === 'Mustard')).toBeUndefined();
    expect(asBottoms.find((s) => s.c === 'Purple')).toBeUndefined();
  });
});
