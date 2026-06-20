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

  it('every base is a simple 5-step light→dark ramp; baseIdx is the middle (base)', () => {
    KEYS.forEach((k) => {
      expect(COLORS[k].shades).toHaveLength(5);
      expect(COLORS[k].shadeNames).toHaveLength(5);
      expect(COLORS[k].baseIdx).toBe(2);
      expect(COLORS[k].shades[2]).toBe(COLORS[k].hex); // mid = base hex
      // ramp goes light → dark by luminance
      expect(lumHex(COLORS[k].shades[0])).toBeGreaterThan(lumHex(COLORS[k].shades[4]));
    });
  });

  it('shade names are tier-prefixed (Light/Deep …), base = the colour name', () => {
    expect(shadeName('Navy', 2)).toBe('Navy');
    expect(shadeName('Navy', 0)).toBe('Lightest Navy');
    expect(shadeName('Navy', 3)).toBe('Deep Navy');
    expect(shadeName('Navy', undefined)).toBe('Navy'); // null → baseIdx (2)
    expect(shadeHex('Navy', null)).toBe(COLORS.Navy.hex);
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
