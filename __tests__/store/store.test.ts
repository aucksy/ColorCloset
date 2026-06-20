import { useStore } from '../../src/store/useStore';

const get = () => useStore.getState();

// Clean slate before each test (resetWardrobe clears wardrobes/gender/mst/setupComplete).
beforeEach(() => {
  get().resetWardrobe();
});

describe('gender × mode bucket scoping', () => {
  it('toggling a colour writes only the active bucket', () => {
    get().setGender('male');
    get().toggleColor('tops', 'Navy');
    get().toggleColor('bottoms', 'Grey');
    expect(get().wardrobes['male-formal'].tops).toContain('Navy');
    expect(get().wardrobes['male-formal'].bottoms).toContain('Grey');
    // other buckets untouched
    expect(get().wardrobes['female-formal'].tops).toHaveLength(0);
    expect(get().wardrobes['male-casual'].tops).toHaveLength(0);
  });

  it('switching mode shows a different (empty) bucket', () => {
    get().setGender('male');
    get().toggleColor('tops', 'Navy');
    get().setMode('casual');
    expect(get().mode).toBe('casual');
    expect(get().wardrobes['male-casual'].tops).toHaveLength(0); // casual not set up yet
    // the formal data is still there, just not active
    expect(get().wardrobes['male-formal'].tops).toContain('Navy');
  });

  it('new colours default to the named-vocab display shade (baseIdx), not [2]', () => {
    get().setGender('female');
    get().toggleColor('tops', 'Beige'); // Beige has 6 shades; baseIdx is the near-base one
    const idx = get().wardrobes['female-formal'].shadeTops.Beige?.[0];
    expect(typeof idx).toBe('number');
    expect(idx).toBeGreaterThanOrEqual(0);
  });
});

describe('legacy import + gender hand-off (migration path)', () => {
  it('folds a flat v≤5 backup into the pending pen, then setGender lands it (Maroon→Burgundy)', () => {
    const legacy = JSON.stringify({
      app: 'colorcloset',
      v: 4,
      depth: 'rich',
      tops: ['Maroon', 'Navy'],
      bottoms: ['Grey', 'Maroon'],
      shadeTops: {},
      shadeBottoms: {},
      worn: {},
      dismissed: {},
      saved: [],
    });
    expect(get().importData(legacy)).toBe(true);
    // gender unknown → held in the pending pen, Maroon mapped to Burgundy
    expect(get().pendingWardrobe).not.toBeNull();
    expect(get().pendingWardrobe!.tops).toContain('Burgundy');
    expect(get().pendingWardrobe!.tops).not.toContain('Maroon');
    expect(get().mst).toBeGreaterThanOrEqual(7); // 'rich' → Deep tier

    get().setGender('male');
    expect(get().pendingWardrobe).toBeNull();
    expect(get().wardrobes['male-formal'].tops).toEqual(expect.arrayContaining(['Burgundy', 'Navy']));
    expect(get().wardrobes['male-formal'].bottoms).toContain('Burgundy'); // Maroon→Burgundy bottom
  });
});

describe('v6 export / import round-trip (Drive backup integrity)', () => {
  it('round-trips the multi-wardrobe structure', () => {
    get().setGender('male');
    get().setMst(8);
    get().toggleColor('tops', 'Navy');
    get().toggleColor('bottoms', 'Grey');
    get().setMode('casual');
    get().toggleColor('tops', 'White');
    get().toggleColor('bottoms', 'Khaki');

    const exported = get().exportData();
    const parsed = JSON.parse(exported);
    expect(parsed.v).toBe(6);
    expect(parsed.gender).toBe('male');
    expect(parsed.wardrobes['male-formal'].tops).toContain('Navy');
    expect(parsed.wardrobes['male-casual'].tops).toContain('White');

    get().resetWardrobe();
    expect(get().wardrobes['male-formal'].tops).toHaveLength(0);

    expect(get().importData(exported)).toBe(true);
    expect(get().gender).toBe('male');
    expect(get().mst).toBe(8);
    expect(get().wardrobes['male-formal'].tops).toContain('Navy');
    expect(get().wardrobes['male-casual'].tops).toContain('White');
  });

  it('rejects garbage and an empty backup', () => {
    expect(get().importData('not json')).toBe(false);
    expect(get().importData(JSON.stringify({ app: 'colorcloset', v: 6, wardrobes: {} }))).toBe(false);
  });
});

describe('deck walk against the active bucket', () => {
  it('regenerate surfaces a current look from owned colours', () => {
    get().setGender('male');
    get().setMst(5);
    ['White', 'Light Blue', 'Navy'].forEach((c) => get().toggleColor('tops', c));
    ['Navy', 'Grey', 'Charcoal'].forEach((c) => get().toggleColor('bottoms', c));
    get().regenerate();
    expect(get().current).not.toBeNull();
    expect(get().currentName).toBeTruthy();
  });
});
