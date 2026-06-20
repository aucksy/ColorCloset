import {
  buildDeck,
  comboUniverse,
  isAvoided,
  skinObj,
  stepRec,
  styleCounts,
  styleOf,
  uniStats,
  type RankedCombo,
} from '../../src/engine';

const skin = skinObj(5);
const G = 'male';
const M = 'formal';

describe('comboUniverse', () => {
  it('excludes the suppressed avoid pairs entirely', () => {
    const uni = comboUniverse(['White', 'Navy', 'Black'], ['Navy', 'Black', 'Charcoal'], skin, G, M);
    expect(uni.length).toBeGreaterThan(0);
    uni.forEach((c) => expect(isAvoided(c.t, c.b)).toBe(false));
    expect(uni.find((c) => c.id === 'Navy|Black')).toBeUndefined();
  });

  it('force-includes a curated, ownable pairing and carries its meta', () => {
    const uni = comboUniverse(['Light Blue'], ['Navy'], skin, G, M);
    const sky = uni.find((c) => c.id === 'Light Blue|Navy');
    expect(sky).toBeTruthy();
    expect(sky!.curated?.mood).toBeTruthy();
  });

  it('is sorted best-first and de-duplicated', () => {
    const tops = ['White', 'Navy', 'Olive'];
    const bottoms = ['Grey', 'Khaki', 'Charcoal'];
    const a = comboUniverse(tops, bottoms, skin, G, M);
    const b = comboUniverse(tops, bottoms, skin, G, M);
    expect(a).toEqual(b); // deterministic
    for (let i = 1; i < a.length; i++) expect(a[i - 1].sc).toBeGreaterThanOrEqual(a[i].sc);
    expect(new Set(a.map((c) => c.id)).size).toBe(a.length); // unique ids
  });

  it('never leaves an empty deck: falls back even when the only pair is avoided', () => {
    // Purple top + Mustard bottom is an avoided pair, and the only one available.
    const uni = comboUniverse(['Purple'], ['Mustard'], skin, G, M);
    expect(uni).toHaveLength(1);
    expect(uni[0].id).toBe('Purple|Mustard');
  });
});

describe('uniStats', () => {
  it('counts worn pairings within the universe only', () => {
    const tops = ['White', 'Navy'];
    const bottoms = ['Grey', 'Khaki'];
    const uni = comboUniverse(tops, bottoms, skin, G, M);
    const wornId = uni[0].id;
    const stats = uniStats(tops, bottoms, skin, { [wornId]: '1 Jan', 'Bogus|Combo': '2 Jan' }, G, M);
    expect(stats.total).toBe(uni.length);
    expect(stats.worn).toBe(1);
  });
});

describe('buildDeck (style filter + diversity)', () => {
  const tops = ['White', 'Navy', 'Olive', 'Burgundy', 'Light Blue'];
  const bottoms = ['Navy', 'Grey', 'Charcoal', 'Khaki'];

  it('returns ONLY combos of the selected style; the best card is first', () => {
    const deck = buildDeck({ tops, bottoms, skin, style: 'Minimal', gender: G, mode: M });
    expect(deck.length).toBeGreaterThan(0);
    deck.forEach((c) => expect(c.style).toBe('Minimal'));
    // best-osc card leads (diversify keeps the top pick first, then anti-clusters)
    const maxOsc = Math.max(...deck.map((c) => c.osc));
    expect(deck[0].osc).toBe(maxOsc);
  });

  it('diversifies so consecutive cards avoid the same bottom where possible', () => {
    const deck = buildDeck({ tops, bottoms, skin, style: 'Classic', gender: G, mode: M });
    if (deck.length > 2) {
      // with several bottoms available, no two adjacent cards should share a bottom unless forced
      let repeats = 0;
      for (let i = 1; i < deck.length; i++) if (deck[i].b === deck[i - 1].b) repeats++;
      expect(repeats).toBeLessThan(deck.length - 1);
    }
  });

  it('partitions the universe across styles (styleCounts)', () => {
    const counts = styleCounts(tops, bottoms, skin, G, M);
    const uni = comboUniverse(tops, bottoms, skin, G, M);
    const total = counts.Minimal + counts.Classic + counts.Bold + counts.Statement;
    expect(total).toBe(uni.length);
    uni.forEach((c) => expect(['Minimal', 'Classic', 'Bold', 'Statement']).toContain(c.style));
  });
});

describe('styleOf', () => {
  it('classifies generative pairs into one of the four (never Neutral/Everyday)', () => {
    expect(styleOf('White', 'Grey')).toBe('Minimal'); // both neutral
    expect(styleOf('Olive', 'Grey')).toBe('Bold'); // one bold present
    expect(styleOf('Olive', 'Burgundy')).toBe('Statement'); // both bold
    expect(styleOf('Light Blue', 'Navy')).toBe('Classic'); // cool + neutral
  });
});

describe('stepRec (the deck walk — unchanged semantics)', () => {
  const deck = [{ id: 'a' }, { id: 'b' }, { id: 'c' }] as unknown as RankedCombo[];

  it('walks forward and wraps from pos -1', () => {
    let pos = -1;
    const seen: string[] = [];
    for (let i = 0; i < 4; i++) {
      const r = stepRec(deck, pos, {})!;
      seen.push(r.pick.id);
      pos = r.pos;
    }
    expect(seen).toEqual(['a', 'b', 'c', 'a']);
  });

  it('skips worn pairings, and flags roundDone when all are worn', () => {
    expect(stepRec(deck, -1, { a: 'worn' })!.pick.id).toBe('b');
    expect(stepRec(deck, -1, { a: 'x', b: 'x', c: 'x' })!.roundDone).toBe(true);
    expect(stepRec([], -1, {})).toBeNull();
  });
});
