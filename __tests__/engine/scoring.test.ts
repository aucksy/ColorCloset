import { catFor, harmony, score, skinObj, styleBias } from '../../src/engine';

describe('harmony (exact additive weights, §9.3)', () => {
  it('curated + double-neutral + contrast clamps to 1', () => {
    // 0.45 + 0.40 (known-good) + 0.18 + 0.08 (both neutral) + 0.12 (contrast) = 1.23 -> clamp 1
    expect(harmony('White', 'Grey')).toBe(1);
  });

  it('two saturated non-curated colours stay at the base', () => {
    // Olive (warm) + Burgundy: no curated, no neutral, mid contrast, no temp clash -> 0.45
    expect(harmony('Olive', 'Burgundy')).toBeCloseTo(0.45, 10);
  });

  it('applies the warm/cool temperature clash and muddy-contrast penalties', () => {
    // Olive (warm) + Blue (cool): 0.45 - 0.04 (low contrast) - 0.14 (temp clash) = 0.27
    expect(harmony('Olive', 'Blue')).toBeCloseTo(0.27, 10);
  });

  it('rewards both-neutral without the muddy penalty', () => {
    // Black + Navy: 0.45 + 0.18 + 0.08 = 0.71 (low-contrast penalty skipped because both neutral)
    expect(harmony('Black', 'Navy')).toBeCloseTo(0.71, 10);
  });
});

describe('styleBias (§9.6)', () => {
  it('Minimal: exemplar + both-neutral', () => {
    // 0.18 (exemplar) + 0.13 (both neutral) = 0.31
    expect(styleBias('White', 'Grey', 'Minimal')).toBeCloseTo(0.31, 10);
  });

  it('Bold: exemplar + bold colour + high contrast', () => {
    // 0.18 + 0.14 (bold) + 0.05 (contrast) = 0.37
    expect(styleBias('Burgundy', 'Grey', 'Bold')).toBeCloseTo(0.37, 10);
  });

  it('returns 0 when no style is given', () => {
    expect(styleBias('White', 'Grey', undefined)).toBe(0);
  });
});

describe('score (combined) is NOT clamped', () => {
  it('sums harmony + flatter + occasion + style', () => {
    const skin = skinObj('medium', 'neutral');
    // harmony 1.0 + flatter (White .08 + Grey .06) + Everyday-neutral-bottom .04 + Minimal .31 = 1.49
    expect(score('White', 'Grey', skin, 'Everyday', 'Minimal')).toBeCloseTo(1.49, 10);
  });
});

describe('catFor', () => {
  it('classifies curated, neutral and bold pairings', () => {
    expect(catFor('White', 'Grey')).toBe('CLASSIC');
    expect(catFor('Black', 'Navy')).toBe('NEUTRAL');
    expect(catFor('Olive', 'Burgundy')).toBe('BOLD');
  });
});
