import { heritageFor } from '../../src/engine';

describe('heritageFor (genuine archetypes only)', () => {
  it('labels documented combos in either slot order', () => {
    expect(heritageFor('Navy', 'White')).toBe('Nautical heritage');
    expect(heritageFor('White', 'Navy')).toBe('Nautical heritage');
    expect(heritageFor('Grey', 'Navy')).toBe('Business classic');
    expect(heritageFor('Brown', 'Navy')).toBe('Italian spezzato');
    expect(heritageFor('Beige', 'Cream')).toBe('Quiet-luxury tonal');
  });

  it('returns null when nothing genuine matches (never fabricates)', () => {
    expect(heritageFor('Purple', 'Rust')).toBeNull();
  });
});
