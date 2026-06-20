import {
  MST_SWATCHES,
  tierOf,
  skinObj,
  skinNote,
  flatterTopsFor,
  avoidTopsFor,
  mstFromLegacyLabel,
} from '../../src/engine';

describe('MST → 3 tiers', () => {
  it('maps the 10 swatches to Light/Medium/Deep', () => {
    expect(MST_SWATCHES).toHaveLength(10);
    expect(tierOf(1)).toBe('Light');
    expect(tierOf(3)).toBe('Light');
    expect(tierOf(4)).toBe('Medium');
    expect(tierOf(6)).toBe('Medium');
    expect(tierOf(7)).toBe('Deep');
    expect(tierOf(10)).toBe('Deep');
  });

  it('skinObj(null) defaults to Medium and fills tier sets', () => {
    const s = skinObj(null);
    expect(s.tier).toBe('Medium');
    expect(s.mst).toBe(5);
    expect(s.dot).toMatch(/^#/);
    expect(s.flatterTops).toEqual(flatterTopsFor('Medium'));
    expect(s.avoidTops).toEqual(avoidTopsFor('Medium'));
  });

  it('tier TOP favour/avoid follow the doc principle', () => {
    expect(flatterTopsFor('Deep')).toContain('White'); // crisp white near a deep face
    expect(flatterTopsFor('Deep')).toContain('Mustard');
    expect(avoidTopsFor('Light')).toContain('Cream'); // palest tints wash out light skin
    expect(avoidTopsFor('Medium')).toEqual([]); // medium is flexible
  });

  it('skinNote is tier-based plain language', () => {
    expect(skinNote(8).toLowerCase()).toContain('deeper skin');
    expect(skinNote(2).toLowerCase()).toContain('lighter skin');
    expect(skinNote(null).toLowerCase()).toContain('medium skin');
  });

  it('mstFromLegacyLabel maps the 6 old labels into the right tier', () => {
    expect(tierOf(mstFromLegacyLabel('fair'))).toBe('Light');
    expect(tierOf(mstFromLegacyLabel('light'))).toBe('Light');
    expect(tierOf(mstFromLegacyLabel('medium'))).toBe('Medium');
    expect(tierOf(mstFromLegacyLabel('tan'))).toBe('Medium');
    expect(tierOf(mstFromLegacyLabel('deep'))).toBe('Deep');
    expect(tierOf(mstFromLegacyLabel('rich'))).toBe('Deep');
    expect(mstFromLegacyLabel('garbage')).toBe(5); // unknown → Medium default
  });
});
