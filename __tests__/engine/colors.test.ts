import {
  COLORS,
  KEYS,
  hx,
  lum,
  lumHex,
  mix,
  nearest,
  rgb,
  rgbString,
  shadeHex,
  shadeName,
  shadeHexByName,
  NEUTRAL,
  WARM,
  COOL,
  BOLD,
  CORP,
  bottomScore,
} from '../../src/engine';

describe('palette: 17 bases + named shade vocabulary', () => {
  it('has exactly the 17 research-doc bases (Maroon dropped, Brown kept)', () => {
    expect(KEYS).toHaveLength(17);
    expect(KEYS).toContain('Navy');
    expect(KEYS).toContain('Forest Green');
    expect(KEYS).toContain('Brown');
    expect(KEYS).not.toContain('Maroon');
  });

  it('Brown base hex is the doc value #6B4423', () => {
    expect(COLORS.Brown.hex).toBe('#6B4423');
  });

  it('most bases have 5 named shades; Beige has 6', () => {
    expect(COLORS.Beige.shades).toHaveLength(6);
    expect(COLORS.Beige.shadeNames).toHaveLength(6);
    expect(COLORS.Navy.shades).toHaveLength(5);
    expect(COLORS.Navy.shadeNames).toContain('French Navy');
    KEYS.forEach((k) => expect(COLORS[k].shades.length).toBe(COLORS[k].shadeNames.length));
  });

  it('shadeHex / shadeName default to the base-near display shade (baseIdx)', () => {
    KEYS.forEach((k) => {
      expect(shadeHex(k, null)).toBe(COLORS[k].shades[COLORS[k].baseIdx]);
      expect(shadeName(k, undefined)).toBe(COLORS[k].shadeNames[COLORS[k].baseIdx]);
    });
  });

  it('shadeHexByName resolves a named shade to its exact hex', () => {
    expect(shadeHexByName('Sky Blue')).toBe('#87CEEB');
    expect(shadeHexByName('Optic White')).toBe('#FFFFFF');
    expect(shadeHexByName('Navy')).toBe('#000080'); // "Navy" IS a named shade (≠ base default)
    // a base name with no same-named shade falls back to its display default
    expect(shadeHexByName('Black')).toBe(shadeHex('Black', null));
  });

  it('rgb / lumHex / rgbString basics', () => {
    expect(rgb('#22335A')).toEqual([34, 51, 90]);
    expect(lumHex('#FFFFFF')).toBeCloseTo(1, 5);
    expect(lumHex('#000000')).toBeCloseTo(0, 5);
    expect(rgbString('#22335A')).toBe('rgb(34, 51, 90)');
    expect(lum('White')).toBeGreaterThan(lum('Navy'));
  });

  it('mix keeps the prototype tint/shade math', () => {
    expect(mix('#000000', 0.5)).toBe('#808080');
    expect(mix('#FFFFFF', -0.5)).toBe('#808080');
  });

  it('hx falls back to grey for unknown keys; nearest maps an rgb triple', () => {
    expect(hx('Navy')).toBe('#22335A');
    expect(hx('Nonsense')).toBe('#888888');
    expect(nearest(255, 255, 255)).toBe('White');
  });

  it('colour sets have the expected memberships (no Maroon)', () => {
    expect(NEUTRAL.has('Navy')).toBe(true);
    expect(NEUTRAL.has('Brown')).toBe(true);
    expect(WARM.has('Olive')).toBe(true);
    expect(COOL.has('Navy')).toBe(true);
    expect(BOLD.has('Burgundy')).toBe(true);
    expect(CORP.has('Navy')).toBe(true);
    [NEUTRAL, WARM, COOL, BOLD, CORP].forEach((s) => expect(s.has('Maroon')).toBe(false));
    expect(bottomScore('Navy')).toBeGreaterThan(bottomScore('Mustard'));
  });
});
