import { gapSuggestions, skinObj } from '../../src/engine';

const skin = skinObj('medium');

describe('gapSuggestions ("what to buy", threshold 0.62)', () => {
  const { asTops, asBottoms } = gapSuggestions(['White'], ['Navy'], skin);

  it('never suggests a colour with zero new looks', () => {
    [...asTops, ...asBottoms].forEach((s) => expect(s.pairs.length).toBeGreaterThan(0));
  });

  it('each suggestion lists the exact existing pieces it unlocks', () => {
    const grey = asBottoms.find((s) => s.c === 'Grey');
    expect(grey).toBeDefined();
    expect(grey!.pairs).toContain('White'); // White+Grey clears 0.62
  });

  it('does not suggest colours already owned in that slot', () => {
    expect(asBottoms.find((s) => s.c === 'Navy')).toBeUndefined(); // Navy already a bottom
    expect(asTops.find((s) => s.c === 'White')).toBeUndefined(); // White already a top
  });

  it('ranks by new-look count with a flatter bonus (1.5)', () => {
    const rank = (s: { pairs: unknown[]; fl: boolean }) => s.pairs.length + (s.fl ? 1.5 : 0);
    for (let i = 1; i < asBottoms.length; i++) {
      expect(rank(asBottoms[i - 1])).toBeGreaterThanOrEqual(rank(asBottoms[i]));
    }
  });
});
