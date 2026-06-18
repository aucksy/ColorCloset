/**
 * The single app store (Zustand + persist). The prototype's global `state` object
 * maps directly here. Persisted slice mirrors PRD §10; the session slice
 * (occasion / typeFilter / deck position / current pairing) is transient and
 * partialized out of persistence.
 *
 * The "Another" deck walk lives here as actions so every surface (card, save,
 * mark-worn, skin pill, chips) drives one consistent walk.
 */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  KEYS,
  buildDeck,
  nameFor,
  shadeHex,
  skinObj,
  stepRec,
  type ClothType,
  type ColorKey,
  type DepthId,
  type Occasion,
  type ShadeIndex,
  type StyleName,
  type TypeFilter,
} from '@/engine';
import { todayStr } from '@/lib/date';
import { activeStorage } from './storage';

export interface SavedLook {
  id: number;
  t: ColorKey;
  b: ColorKey;
  th: string; // top shade hex (frozen at save time)
  bh: string; // bottom shade hex
  name: string;
  occ: Occasion;
  style: StyleName;
  date: string;
}

type Slot = 'tops' | 'bottoms';

interface PersistedState {
  depth: DepthId | null;
  tops: ColorKey[];
  bottoms: ColorKey[];
  // Each owned colour can hold several shades (light->dark) the user actually owns.
  shadeTops: Record<ColorKey, ShadeIndex[]>;
  shadeBottoms: Record<ColorKey, ShadeIndex[]>;
  types: Record<ColorKey, ClothType[]>;
  worn: Record<string, string>;
  saved: SavedLook[];
  theme: 'dark' | 'light';
  style: StyleName;
  setupComplete: boolean;
}

interface SessionState {
  occasion: Occasion;
  typeFilter: TypeFilter;
  current: { t: ColorKey; b: ColorKey } | null;
  currentName: string;
  deckPos: number;
  _hasHydrated: boolean;
}

interface Actions {
  // profile
  setDepth: (d: DepthId) => void;
  // wardrobe
  toggleColor: (slot: Slot, key: ColorKey) => void;
  setColors: (slot: Slot, colors: ColorKey[]) => void;
  toggleShade: (slot: Slot, key: ColorKey, idx: ShadeIndex) => void;
  addTypeToColors: (colors: ColorKey[], type: ClothType) => void;
  // deck walk
  regenerate: () => boolean;
  another: () => boolean;
  markWorn: () => void;
  loadCombo: (t: ColorKey, b: ColorKey) => void;
  // controls
  setOccasion: (o: Occasion) => void;
  setStyle: (s: StyleName) => void;
  setTypeFilter: (f: TypeFilter) => void;
  // saved / worn
  saveCurrent: () => void;
  deleteSaved: (id: number) => void;
  clearWorn: () => void;
  // types
  toggleType: (color: ColorKey, type: ClothType) => void;
  // settings
  setTheme: (t: 'dark' | 'light') => void;
  toggleTheme: () => void;
  completeSetup: () => void;
  resetWardrobe: () => void;
  setHasHydrated: (v: boolean) => void;
}

export type Store = PersistedState & SessionState & Actions;

const SESSION_DEFAULTS: SessionState = {
  occasion: 'Casual',
  typeFilter: 'all',
  current: null,
  currentName: '',
  deckPos: -1,
  _hasHydrated: false,
};

const PERSISTED_DEFAULTS: PersistedState = {
  depth: null,
  tops: [],
  bottoms: [],
  shadeTops: {},
  shadeBottoms: {},
  types: {},
  worn: {},
  saved: [],
  theme: 'dark',
  style: 'Minimal',
  setupComplete: false,
};

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      ...PERSISTED_DEFAULTS,
      ...SESSION_DEFAULTS,

      setDepth: (d) => {
        set({ depth: d });
        if (get().setupComplete) get().regenerate();
      },

      toggleColor: (slot, key) => {
        const s = get();
        const arr = slot === 'tops' ? s.tops : s.bottoms;
        const setK = new Set(arr);
        const adding = !setK.has(key);
        if (adding) setK.add(key);
        else setK.delete(key);
        const next = KEYS.filter((k) => setK.has(k)); // keep canonical order
        const shadeField = slot === 'tops' ? 'shadeTops' : 'shadeBottoms';
        const shades = { ...s[shadeField] };
        if (adding && shades[key] == null) shades[key] = [2];
        set({ [slot]: next, [shadeField]: shades } as Partial<Store>);
      },

      setColors: (slot, colors) => {
        const s = get();
        const setK = new Set(colors);
        const next = KEYS.filter((k) => setK.has(k)); // canonical order
        const shadeField = slot === 'tops' ? 'shadeTops' : 'shadeBottoms';
        const shades = { ...s[shadeField] };
        next.forEach((k) => {
          if (shades[k] == null) shades[k] = [2];
        });
        set({ [slot]: next, [shadeField]: shades } as Partial<Store>);
      },

      addTypeToColors: (colors, type) => {
        const s = get();
        const types = { ...s.types };
        colors.forEach((c) => {
          const tagged = new Set(types[c] ?? []);
          tagged.add(type);
          types[c] = [...tagged];
        });
        set({ types });
      },

      toggleShade: (slot, key, idx) => {
        const s = get();
        const shadeField = slot === 'tops' ? 'shadeTops' : 'shadeBottoms';
        const arr = slot === 'tops' ? s.tops : s.bottoms;
        const owned = arr.includes(key);
        const cur = s[shadeField][key] ?? [];
        let nextShades: ShadeIndex[];
        if (!owned) {
          // First touch: select the colour with just this shade.
          nextShades = [idx];
        } else if (cur.includes(idx)) {
          // Toggling off — but never leave a selected colour with zero shades.
          nextShades = cur.filter((i) => i !== idx);
          if (nextShades.length === 0) nextShades = [idx];
        } else {
          nextShades = [...cur, idx].sort((a, b) => a - b) as ShadeIndex[];
        }
        const shades = { ...s[shadeField], [key]: nextShades };
        // Tapping a shade also selects the colour (prototype behaviour).
        const next = owned ? arr : KEYS.filter((k) => arr.includes(k) || k === key);
        set({ [shadeField]: shades, [slot]: next } as Partial<Store>);
      },

      regenerate: () => {
        set({ deckPos: -1 });
        return get().another();
      },

      another: () => {
        const s = get();
        const skin = skinObj(s.depth);
        const deck = buildDeck({
          tops: s.tops,
          bottoms: s.bottoms,
          skin,
          occ: s.occasion,
          style: s.style,
          types: s.types,
          typeFilter: s.typeFilter,
        });
        const r = stepRec(deck, s.deckPos, s.worn);
        if (!r) {
          set({ current: null, currentName: '', deckPos: -1 });
          return false;
        }
        set({
          current: { t: r.pick.t, b: r.pick.b },
          currentName: nameFor(r.pick.t, r.pick.b, s.style),
          deckPos: r.pos,
        });
        return r.roundDone;
      },

      markWorn: () => {
        const s = get();
        if (!s.current) return;
        const id = s.current.t + '|' + s.current.b;
        set({ worn: { ...s.worn, [id]: todayStr() } });
        get().another();
      },

      loadCombo: (t, b) => {
        set({ current: { t, b }, currentName: nameFor(t, b, get().style) });
      },

      setOccasion: (o) => {
        set({ occasion: o });
        get().regenerate();
      },
      setStyle: (st) => {
        set({ style: st });
        get().regenerate();
      },
      setTypeFilter: (f) => {
        set({ typeFilter: f });
        get().regenerate();
      },

      saveCurrent: () => {
        const s = get();
        if (!s.current) return;
        const { t, b } = s.current;
        const item: SavedLook = {
          id: Date.now(),
          t,
          b,
          th: shadeHex(t, s.shadeTops[t]?.[0]),
          bh: shadeHex(b, s.shadeBottoms[b]?.[0]),
          name: s.currentName || nameFor(t, b, s.style),
          occ: s.occasion,
          style: s.style,
          date: todayStr(),
        };
        set({ saved: [item, ...s.saved] });
      },
      deleteSaved: (id) => set({ saved: get().saved.filter((x) => x.id !== id) }),
      clearWorn: () => set({ worn: {} }),

      toggleType: (color, type) => {
        const s = get();
        const arr = s.types[color] ? [...s.types[color]] : [];
        const i = arr.indexOf(type);
        if (i >= 0) arr.splice(i, 1);
        else arr.push(type);
        const types = { ...s.types };
        if (arr.length) types[color] = arr;
        else delete types[color];
        set({ types });
      },

      setTheme: (t) => set({ theme: t }),
      toggleTheme: () => set({ theme: get().theme === 'dark' ? 'light' : 'dark' }),

      completeSetup: () => set({ setupComplete: true }),

      setHasHydrated: (v) => set({ _hasHydrated: v }),

      resetWardrobe: () =>
        set({
          ...PERSISTED_DEFAULTS,
          ...SESSION_DEFAULTS,
          _hasHydrated: true,
          theme: get().theme, // keep the user's theme choice through a reset
        }),
    }),
    {
      name: 'colorcloset',
      version: 2,
      storage: createJSONStorage(() => activeStorage),
      // v1 stored one shade per colour (a number); v2 stores an array of shades.
      migrate: (persisted: any, version) => {
        if (persisted && version < 2) {
          const toArr = (m: Record<string, unknown> | undefined) => {
            const out: Record<string, ShadeIndex[]> = {};
            Object.entries(m ?? {}).forEach(([k, v]) => {
              out[k] = Array.isArray(v) ? (v as ShadeIndex[]) : [v as ShadeIndex];
            });
            return out;
          };
          persisted.shadeTops = toArr(persisted.shadeTops);
          persisted.shadeBottoms = toArr(persisted.shadeBottoms);
        }
        return persisted;
      },
      partialize: (s): PersistedState => ({
        depth: s.depth,
        tops: s.tops,
        bottoms: s.bottoms,
        shadeTops: s.shadeTops,
        shadeBottoms: s.shadeBottoms,
        types: s.types,
        worn: s.worn,
        saved: s.saved,
        theme: s.theme,
        style: s.style,
        setupComplete: s.setupComplete,
      }),
      // Always flip the flag once persistence settles — even if reading storage
      // failed — so the app never hangs on the splash screen.
      onRehydrateStorage: () => () => {
        useStore.setState({ _hasHydrated: true });
      },
    }
  )
);

/** True once persisted state has loaded — gate the UI on this to avoid flicker. */
export const useHydrated = () => useStore((s) => s._hasHydrated);
