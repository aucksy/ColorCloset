import { catFor, harmony, score, skinObj, styleBias } from '../../src/engine';

describe('harmony (exact additive weights, §9.3)', () => {
  it('curated + double-neutral + contrast clamps to 1', () => {
    // White+Navy is curated (Minimal/Classic): 0.45 + 0.40 + 0.18 + 0.12 = 1.15 -> clamp 1
    expect(harmony('White', 'Navy')).toBe(1);
  });

  it('a non-curated double-neutral with contrast (no clamp)', () => {
    // White+Grey (no longer curated): 0.45 + 0.18 + 0.08 + 0.12 = 0.83
    expect(harmony('White', 'Grey')).toBeCloseTo(0.83, 10);
  });

  it('two saturated non-curated colours stay at the base', () => {
    expect(harmony('Olive', 'Burgundy')).toBeCloseTo(0.45, 10);
  });

  it('applies the warm/cool temperature clash and muddy-contrast penalties', () => {
    // Olive (warm) + Blue (cool): 0.45 - 0.04 (low contrast) - 0.14 (temp clash) = 0.27
    expect(harmony('Olive', 'Blue')).toBeCloseTo(0.27, 10);
  });

  it('rewards both-neutral without the muddy penalty', () => {
    // Black + Navy: 0.45 + 0.18 + 0.08 = 0.71
    expect(harmony('Black', 'Navy')).toBeCloseTo(0.71, 10);
  });
});

describe('styleBias (§9.6)', () => {
  it('Minimal: exemplar + both-neutral', () => {
    // Grey+Charcoal is a Minimal exemplar: 0.18 + 0.13 (both neutral) = 0.31
    expect(styleBias('Grey', 'Charcoal', 'Minimal')).toBeCloseTo(0.31, 10);
  });

  it('Bold: exemplar + bold colour + high contrast', () => {
    // Burgundy+Grey is a Bold exemplar: 0.18 + 0.14 (bold) + 0.05 (contrast) = 0.37
    expect(styleBias('Burgundy', 'Grey', 'Bold')).toBeCloseTo(0.37, 10);
  });

  it('returns 0 when no style is given', () => {
    expect(styleBias('White', 'Grey', undefined)).toBe(0);
  });
});

describe('score (combined) is NOT clamped', () => {
  it('sums harmony + flatter + occasion + style', () => {
    const skin = skinObj('medium');
    // Mustard+Navy @ Party/Bold, Medium skin:
    // harmony 1.0 (clamped) + flatter (Mustard .08) + Party-bold-top .10 + Bold style .37 = 1.55
    expect(score('Mustard', 'Navy', skin, 'Party', 'Bold')).toBeCloseTo(1.55, 10);
  });
});

describe('catFor', () => {
  it('classifies curated, neutral and bold pairings', () => {
    expect(catFor('White', 'Navy')).toBe('CLASSIC');
    expect(catFor('Black', 'Navy')).toBe('NEUTRAL');
    expect(catFor('Olive', 'Burgundy')).toBe('BOLD');
  });
});
