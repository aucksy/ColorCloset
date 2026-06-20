import {
  CURATED,
  curatedFor,
  findCurated,
  curatedOwnable,
  SHADE_TO_BASE,
  baseOf,
  mapStyle,
} from '../../src/engine';

describe('curated dataset (the high-confidence spine)', () => {
  it('has the exact per gender×mode counts from the research doc (45 total)', () => {
    expect(CURATED).toHaveLength(45);
    expect(curatedFor('male', 'formal')).toHaveLength(11);
    expect(curatedFor('female', 'formal')).toHaveLength(10);
    expect(curatedFor('male', 'casual')).toHaveLength(12);
    expect(curatedFor('female', 'casual')).toHaveLength(12);
  });

  it('resolves shade names AND base names to base colours', () => {
    expect(SHADE_TO_BASE['Sky Blue']).toBe('Light Blue');
    expect(SHADE_TO_BASE['French Navy']).toBe('Navy');
    expect(baseOf('Black')).toBe('Black'); // a base name used directly as a bottom
    expect(baseOf('Cognac')).toBe('Brown');
    expect(mapStyle('Bold')).toBe('Bold');
    expect(mapStyle('???')).toBe('Classic');
  });

  it('findCurated matches a base pair in either order and keeps display top-on-top', () => {
    const fwd = findCurated('Light Blue', 'Navy', 'male', 'formal');
    expect(fwd).toBeTruthy();
    expect(fwd!.topShade).toBe('Sky Blue');
    expect(fwd!.bottomShade).toBe('Navy');
    // reversed lookup swaps the shade names so the card still reads top-on-top
    const rev = findCurated('Navy', 'Light Blue', 'male', 'formal');
    expect(rev).toBeTruthy();
    expect(rev!.topShade).toBe('Navy');
    expect(rev!.bottomShade).toBe('Sky Blue');
  });

  it('findCurated is scoped to gender×mode', () => {
    // Sky Blue + Navy is a male/formal combo; it is NOT a male/casual combo.
    expect(findCurated('Light Blue', 'Navy', 'male', 'formal')).toBeTruthy();
    expect(findCurated('Light Blue', 'Navy', 'male', 'casual')).toBeNull();
  });

  it('curatedOwnable filters by base-level ownership', () => {
    const own = curatedOwnable(['Light Blue', 'White'], ['Navy'], 'male', 'formal');
    expect(own.length).toBeGreaterThan(0);
    own.forEach((c) => {
      expect(['Light Blue', 'White']).toContain(c.t);
      expect(c.b).toBe('Navy');
    });
    // owning the top but not the bottom yields nothing
    expect(curatedOwnable(['Light Blue'], ['Khaki'], 'male', 'formal')).toHaveLength(0);
  });

  it('every curated combo carries complete named-shade metadata', () => {
    CURATED.forEach((c) => {
      expect(c.meta.topShade).toBeTruthy();
      expect(c.meta.bottomShade).toBeTruthy();
      expect(c.meta.mood).toBeTruthy();
      expect(c.meta.why).toBeTruthy();
      expect(['timeless', 'trend']).toContain(c.meta.timeless);
      expect(['Minimal', 'Classic', 'Bold', 'Statement']).toContain(c.meta.styleTag);
    });
  });
});
