import { flatterFor, skinObj, skinNote } from '../../src/engine';

describe('flatterFor (§9.4)', () => {
  it('returns the undertone base set when depth adds nothing', () => {
    expect(flatterFor('medium', 'neutral')).toEqual([
      'Navy', 'White', 'Grey', 'Burgundy', 'Blue', 'Olive', 'Beige', 'Charcoal',
    ]);
  });

  it('deep/rich add high-contrast pops, capped at 9', () => {
    const list = flatterFor('deep', 'cool');
    expect(list).toHaveLength(9);
    expect(list).toContain('Light Blue'); // added (White already present)
    expect(list).not.toContain('Mustard'); // pushed past the 9-cap
  });

  it('fair/light add deeper anchors, capped at 9', () => {
    const list = flatterFor('fair', 'warm');
    expect(list).toHaveLength(9);
    expect(list).toContain('Navy'); // added
    expect(list).not.toContain('Burgundy'); // past the cap
  });

  it('unknown undertone falls back to neutral', () => {
    expect(flatterFor('medium', 'neutral')).toEqual(flatterFor(undefined as any, 'neutral'));
  });
});

describe('skinObj', () => {
  it('defaults null depth to Medium and resolves the flatter set', () => {
    const s = skinObj(null, 'neutral');
    expect(s.depth).toBe('medium');
    expect(s.tone).toBe('neutral');
    expect(s.short).toBe('Medium');
    expect(s.flatter).toEqual(flatterFor('medium', 'neutral'));
  });
});

describe('skinNote', () => {
  it('produces a plain-language note', () => {
    expect(skinNote('fair', 'cool')).toContain('fair, cool skin');
  });
});
