import { COLORS, KEYS, hx, lum, mix, nearest, rgb, rgbString, shadeHex } from '../../src/engine';

describe('colours: palette + shade generation', () => {
  it('has exactly the 16 named colours', () => {
    expect(KEYS).toHaveLength(16);
    expect(KEYS).toContain('Navy');
    expect(KEYS).toContain('Forest Green');
  });

  it('parses hex to rgb', () => {
    expect(rgb('#22335A')).toEqual([34, 51, 90]);
  });

  it('generates 5 shades with the base at index 2 (exact prototype output)', () => {
    const navy = COLORS.Navy.shades;
    expect(navy).toHaveLength(5);
    expect(navy[2]).toBe('#22335A'); // base, untouched
    expect(navy[0]).toBe('#6d7892'); // lighten 34%
    expect(navy[4]).toBe('#16223b'); // darken 34%
  });

  it('mix lightens toward 255 and darkens by multiply', () => {
    expect(mix('#000000', 0.5)).toBe('#808080'); // 255*0.5 = 127.5 -> 128
    expect(mix('#FFFFFF', -0.5)).toBe('#808080'); // 255*0.5 = 127.5 -> 128
  });

  it('shadeHex defaults to the mid shade (index 2)', () => {
    expect(shadeHex('Navy', null)).toBe('#22335A');
    expect(shadeHex('Navy', 2)).toBe('#22335A');
    expect(shadeHex('Navy', 0)).toBe('#6d7892');
  });

  it('hx falls back to grey for unknown keys', () => {
    expect(hx('Navy')).toBe('#22335A');
    expect(hx('Nonsense')).toBe('#888888');
  });

  it('rgbString emits rgb() form for SVG/Reanimated', () => {
    expect(rgbString('#22335A')).toBe('rgb(34, 51, 90)');
  });

  it('luminance uses perceptual weighting', () => {
    expect(lum('White')).toBeCloseTo(0.9636, 3);
    expect(lum('Black')).toBeCloseTo(0.1077, 3);
  });

  it('nearest maps an rgb triple to the closest named colour', () => {
    expect(nearest(34, 51, 90)).toBe('Navy'); // exact match
    expect(nearest(255, 255, 255)).toBe('White');
  });
});
