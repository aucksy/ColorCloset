import { flatterFor, skinObj, skinNote } from '../../src/engine';

describe('flatterFor (depth-only, India-tuned, §9.4)', () => {
  it('returns the Medium depth set', () => {
    expect(flatterFor('medium')).toEqual([
      'Navy', 'Blue', 'Burgundy', 'Maroon', 'Forest Green', 'Olive', 'Rust', 'Mustard', 'Brown',
    ]);
  });

  it('Fair leans on jewel tones + deep anchors', () => {
    const list = flatterFor('fair');
    expect(list).toContain('Navy');
    expect(list).toContain('Purple');
    expect(list.length).toBeLessThanOrEqual(9);
  });

  it('Deep/Rich include crisp white and saturated brights', () => {
    expect(flatterFor('deep')).toContain('White');
    expect(flatterFor('rich')).toContain('White');
    expect(flatterFor('rich')).toContain('Mustard');
  });

  it('defaults to Medium when depth is missing', () => {
    expect(flatterFor(undefined)).toEqual(flatterFor('medium'));
  });
});

describe('skinObj', () => {
  it('defaults null depth to Medium and resolves the flatter set', () => {
    const s = skinObj(null);
    expect(s.depth).toBe('medium');
    expect(s.short).toBe('Medium');
    expect(s.flatter).toEqual(flatterFor('medium'));
  });
});

describe('skinNote', () => {
  it('produces a plain-language, depth-based note', () => {
    expect(skinNote('fair')).toContain('fair skin');
  });
});
