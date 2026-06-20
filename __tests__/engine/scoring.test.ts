import { harmony, isAvoided, score, catFor, skinObj } from '../../src/engine';

const skin = skinObj(5); // Medium

describe('isAvoided (research avoid-list → 4 base pairs, suppressed)', () => {
  it('flags the four suppressed pairs in either order', () => {
    expect(isAvoided('Navy', 'Black')).toBe(true);
    expect(isAvoided('Black', 'Navy')).toBe(true);
    expect(isAvoided('Brown', 'Burgundy')).toBe(true);
    expect(isAvoided('Purple', 'Mustard')).toBe(true);
    expect(isAvoided('Rust', 'Forest Green')).toBe(true);
  });

  it('does NOT over-suppress dark-on-dark near-misses (left to the harmony penalty)', () => {
    expect(isAvoided('Navy', 'Charcoal')).toBe(false);
    expect(isAvoided('White', 'Navy')).toBe(false);
  });
});

describe('harmony (doc shade-pairing principles)', () => {
  it('rewards tonal / tone-on-tone (same base) above the base', () => {
    expect(harmony('Navy', 'Navy')).toBeGreaterThan(0.45);
  });

  it('rewards a neutral pairing and clear light↔dark contrast', () => {
    expect(harmony('White', 'Navy')).toBeGreaterThan(0.6);
    expect(harmony('White', 'Grey')).toBeGreaterThan(0.45);
  });

  it('penalises a warm/cool clash vs a same-temperature pairing', () => {
    expect(harmony('Olive', 'Rust')).toBeGreaterThan(harmony('Olive', 'Blue'));
  });

  it('penalises a muddy dark-on-dark near-match (Navy + Charcoal)', () => {
    // Two near-black, different-family shades read like a mistake (doc #1 / "two blacks").
    expect(harmony('Navy', 'Charcoal')).toBeLessThan(harmony('White', 'Charcoal'));
  });

  it('clamps to [0,1]', () => {
    expect(harmony('White', 'Navy')).toBeLessThanOrEqual(1);
    expect(harmony('Rust', 'Blue')).toBeGreaterThanOrEqual(0);
  });
});

describe('score', () => {
  it('the curated spine bonus lifts a curated pair', () => {
    // Sky Blue (Light Blue) + Navy is curated for male/formal ("Quiet Confidence").
    const withCtx = score('Light Blue', 'Navy', skin, undefined, { gender: 'male', mode: 'formal' });
    const noCtx = score('Light Blue', 'Navy', skin, undefined);
    expect(withCtx).toBeGreaterThan(noCtx); // +0.40 curated bonus only with gender×mode
  });

  it('a curated pair outranks an arbitrary plausible pair', () => {
    const curated = score('Light Blue', 'Navy', skin, undefined, { gender: 'male', mode: 'formal' });
    const random = score('Purple', 'Khaki', skin, undefined, { gender: 'male', mode: 'formal' });
    expect(curated).toBeGreaterThan(random);
  });

  it('demotes an implausible trouser colour', () => {
    expect(score('White', 'Navy', skin)).toBeGreaterThan(score('White', 'Mustard', skin));
  });

  it('skin tier nudges the TOP: a deep face favours crisp White over ashy Khaki', () => {
    const deep = skinObj(8);
    expect(score('White', 'Navy', deep)).toBeGreaterThan(score('Khaki', 'Navy', deep));
  });
});

describe('catFor', () => {
  it('returns the curated style tag for a curated pair, else a generic class', () => {
    expect(typeof catFor('Light Blue', 'Navy', 'male', 'formal')).toBe('string');
    expect(catFor('White', 'Navy')).toBe('NEUTRAL'); // both neutral, no ctx
  });
});
