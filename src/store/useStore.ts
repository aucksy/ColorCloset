/**
 * The single app store (Zustand + persist). The session slice (deck position /
 * current pairing) is transient and partialized out of persistence. Browsing is
 * swipe-only; the deck excludes any combos the user marked "not for me".
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
  type ColorKey,
  type DepthId,
  type ShadeIndex,
  type StyleName,
} from '@/engine';
import { todayStr } from '@/lib/date';
import { activeStorage } from './storage';

/** Daily outfit-reminder settings. days = weekday numbers 1=Sun .. 7=Sat (expo). */
export interface NotifySettings {
  enabled: boolean;
  hour: number;
  minute: number;
  days: number[];
}

export interface SavedLook {
  id: number;
  t: ColorKey;
  b: ColorKey;
  th: string; // top shade hex (frozen at save time)
  bh: string; // bottom shade hex
  name: string;
  style: StyleName;
  date: string;
}

type Slot = 'tops' | 'bottoms';

interface PersistedState {
  depth: DepthId | null;
  tops: ColorKey[];
  bottoms: ColorKey[];
  shadeTops: Record<ColorKey, ShadeIndex[]>;
  shadeBottoms: Record<ColorKey, ShadeIndex[]>;
  worn: Record<string, string>;
  dismissed: Record<string, boolean>; // combos the user marked "not for me"
  saved: SavedLook[];
  theme: 'dark' | 'light';
  style: StyleName;
  swipeHintSeen: boolean;
  notify: NotifySettings;
  lastPickDay: string; // yyyy-mm-dd the "today's pick" was last seeded
  setupComplete: boolean;
}

interface SessionState {
  current: { t: ColorKey; b: ColorKey } | null;
  currentName: string;
  deckPos: number;
  _hasHydrated: boolean;
}

interface Actions {
  setDepth: (d: DepthId) => void;
  toggleColor: (slot: Slot, key: ColorKey) => void;
  setColors: (slot: Slot, colors: ColorKey[]) => void;
  toggleShade: (slot: Slot, key: ColorKey, idx: ShadeIndex) => void;
  // deck walk
  regenerate: () => boolean;
  another: () => boolean;
  next: () => void;
  prev: () => void;
  goToIndex: (i: number) => void;
  markWorn: () => void;
  dismiss: () => void;
  restoreDismissed: (id: string) => void;
  loadCombo: (t: ColorKey, b: ColorKey) => void;
  setLastPickDay: (d: string) => void;
  // controls
  setStyle: (s: StyleName) => void;
  markSwipeHintSeen: () => void;
  setNotify: (patch: Partial<NotifySettings>) => void;
  // saved / worn
  saveCurrent: () => void;
  deleteSaved: (id: number) => void;
  clearWorn: () => void;
  // settings / data
  setTheme: (t: 'dark' | 'light') => void;
  toggleTheme: () => void;
  completeSetup: () => void;
  resetWardrobe: () => void;
  setHasHydrated: (v: boolean) => void;
  exportData: () => string;
  importData: (json: string) => boolean;
}

export type Store = PersistedState & SessionState & Actions;

const SESSION_DEFAULTS: SessionState = { current: null, currentName: '', deckPos: -1, _hasHydrated: false };

const PERSISTED_DEFAULTS: PersistedState = {
  depth: null,
  tops: [],
  bottoms: [],
  shadeTops: {},
  shadeBottoms: {},
  worn: {},
  dismissed: {},
  saved: [],
  theme: 'dark',
  style: 'Minimal',
  swipeHintSeen: false,
  notify: { enabled: false, hour: 9, minute: 0, days: [1, 2, 3, 4, 5, 6, 7] },
  lastPickDay: '',
  setupComplete: false,
};

/** The browsable deck for the current state — excludes "not for me" combos. */
const deckFor = (s: Store) =>
  buildDeck({ tops: s.tops, bottoms: s.bottoms, skin: skinObj(s.depth), style: s.style }).filter(
    (c) => !s.dismissed[c.id]
  );

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
        const next = KEYS.filter((k) => setK.has(k));
        const shadeField = slot === 'tops' ? 'shadeTops' : 'shadeBottoms';
        const shades = { ...s[shadeField] };
        if (adding && shades[key] == null) shades[key] = [2];
        set({ [slot]: next, [shadeField]: shades } as Partial<Store>);
      },

      setColors: (slot, colors) => {
        const s = get();
        const setK = new Set(colors);
        const next = KEYS.filter((k) => setK.has(k));
        const shadeField = slot === 'tops' ? 'shadeTops' : 'shadeBottoms';
        const shades = { ...s[shadeField] };
        next.forEach((k) => {
          if (shades[k] == null) shades[k] = [2];
        });
        set({ [slot]: next, [shadeField]: shades } as Partial<Store>);
      },

      toggleShade: (slot, key, idx) => {
        const s = get();
        const shadeField = slot === 'tops' ? 'shadeTops' : 'shadeBottoms';
        const arr = slot === 'tops' ? s.tops : s.bottoms;
        const owned = arr.includes(key);
        const cur = s[shadeField][key] ?? [];
        let nextShades: ShadeIndex[];
        if (!owned) nextShades = [idx];
        else if (cur.includes(idx)) {
          nextShades = cur.filter((i) => i !== idx);
          if (nextShades.length === 0) nextShades = [idx];
        } else nextShades = [...cur, idx].sort((a, b) => a - b) as ShadeIndex[];
        const shades = { ...s[shadeField], [key]: nextShades };
        const next = owned ? arr : KEYS.filter((k) => arr.includes(k) || k === key);
        set({ [shadeField]: shades, [slot]: next } as Partial<Store>);
      },

      regenerate: () => {
        set({ deckPos: -1 });
        return get().another();
      },

      another: () => {
        const s = get();
        const deck = deckFor(s);
        const r = stepRec(deck, s.deckPos, s.worn);
        if (!r) {
          set({ current: null, currentName: '', deckPos: -1 });
          return false;
        }
        set({ current: { t: r.pick.t, b: r.pick.b }, currentName: nameFor(r.pick.t, r.pick.b, s.style), deckPos: r.pos });
        return r.roundDone;
      },

      // Linear swipe steps — walk every look in order (continuous "x of N" counter).
      next: () => {
        const s = get();
        const deck = deckFor(s);
        if (!deck.length) return;
        const pos = (s.deckPos + 1) % deck.length;
        const pick = deck[pos];
        set({ current: { t: pick.t, b: pick.b }, currentName: nameFor(pick.t, pick.b, s.style), deckPos: pos });
      },
      prev: () => {
        const s = get();
        const deck = deckFor(s);
        if (!deck.length) return;
        const n = deck.length;
        const pos = (((s.deckPos === -1 ? 0 : s.deckPos) - 1) % n + n) % n;
        const pick = deck[pos];
        set({ current: { t: pick.t, b: pick.b }, currentName: nameFor(pick.t, pick.b, s.style), deckPos: pos });
      },
      goToIndex: (i) => {
        const s = get();
        const deck = deckFor(s);
        if (!deck.length) return;
        const pos = ((i % deck.length) + deck.length) % deck.length;
        const pick = deck[pos];
        set({ current: { t: pick.t, b: pick.b }, currentName: nameFor(pick.t, pick.b, s.style), deckPos: pos });
      },

      markWorn: () => {
        const s = get();
        if (!s.current) return;
        const id = s.current.t + '|' + s.current.b;
        set({ worn: { ...s.worn, [id]: todayStr() } });
        get().next();
      },

      dismiss: () => {
        const s = get();
        if (!s.current) return;
        const id = s.current.t + '|' + s.current.b;
        const dismissed = { ...s.dismissed, [id]: true };
        // Rebuild the deck without this combo; the same index now points to the next one.
        const deck = buildDeck({ tops: s.tops, bottoms: s.bottoms, skin: skinObj(s.depth), style: s.style }).filter(
          (c) => !dismissed[c.id]
        );
        if (!deck.length) {
          set({ dismissed, current: null, currentName: '', deckPos: -1 });
          return;
        }
        const pos = Math.min(s.deckPos < 0 ? 0 : s.deckPos, deck.length - 1);
        const pick = deck[pos];
        set({ dismissed, current: { t: pick.t, b: pick.b }, currentName: nameFor(pick.t, pick.b, s.style), deckPos: pos });
      },
      restoreDismissed: (id) => {
        const d = { ...get().dismissed };
        delete d[id];
        set({ dismissed: d });
      },

      loadCombo: (t, b) => {
        const s = get();
        const pos = deckFor(s).findIndex((c) => c.t === t && c.b === b);
        set({ current: { t, b }, currentName: nameFor(t, b, s.style), deckPos: pos });
      },
      setLastPickDay: (d) => set({ lastPickDay: d }),

      setStyle: (st) => {
        set({ style: st });
        get().regenerate();
      },
      markSwipeHintSeen: () => set({ swipeHintSeen: true }),
      setNotify: (patch) => set({ notify: { ...get().notify, ...patch } }),

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
          style: s.style,
          date: todayStr(),
        };
        set({ saved: [item, ...s.saved] });
      },
      deleteSaved: (id) => set({ saved: get().saved.filter((x) => x.id !== id) }),
      clearWorn: () => set({ worn: {} }),

      setTheme: (t) => set({ theme: t }),
      toggleTheme: () => set({ theme: get().theme === 'dark' ? 'light' : 'dark' }),
      completeSetup: () => set({ setupComplete: true }),
      setHasHydrated: (v) => set({ _hasHydrated: v }),

      resetWardrobe: () => {
        const s = get();
        set({
          ...PERSISTED_DEFAULTS,
          ...SESSION_DEFAULTS,
          _hasHydrated: true,
          theme: s.theme, // keep preferences through a wardrobe reset
          swipeHintSeen: s.swipeHintSeen,
          notify: s.notify,
        });
      },

      exportData: () => {
        const s = get();
        return JSON.stringify({
          app: 'colorcloset',
          v: 4,
          depth: s.depth,
          tops: s.tops,
          bottoms: s.bottoms,
          shadeTops: s.shadeTops,
          shadeBottoms: s.shadeBottoms,
          worn: s.worn,
          dismissed: s.dismissed,
          saved: s.saved,
          theme: s.theme,
          style: s.style,
          notify: s.notify,
          setupComplete: s.setupComplete,
        });
      },
      importData: (json) => {
        try {
          const p = JSON.parse(json);
          if (!p || typeof p !== 'object' || !Array.isArray(p.tops) || !Array.isArray(p.bottoms)) return false;
          set({
            depth: p.depth ?? null,
            tops: p.tops,
            bottoms: p.bottoms,
            shadeTops: p.shadeTops ?? {},
            shadeBottoms: p.shadeBottoms ?? {},
            worn: p.worn ?? {},
            dismissed: p.dismissed ?? {},
            saved: Array.isArray(p.saved) ? p.saved : [],
            theme: p.theme === 'light' ? 'light' : 'dark',
            style: p.style ?? 'Minimal',
            notify: p.notify ?? PERSISTED_DEFAULTS.notify,
            setupComplete: !!p.setupComplete,
            ...SESSION_DEFAULTS,
            _hasHydrated: true,
          });
          get().regenerate();
          return true;
        } catch {
          return false;
        }
      },
    }),
    {
      name: 'colorcloset',
      version: 4,
      storage: createJSONStorage(() => activeStorage),
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
        worn: s.worn,
        dismissed: s.dismissed,
        saved: s.saved,
        theme: s.theme,
        style: s.style,
        swipeHintSeen: s.swipeHintSeen,
        notify: s.notify,
        lastPickDay: s.lastPickDay,
        setupComplete: s.setupComplete,
      }),
      onRehydrateStorage: () => () => {
        useStore.setState({ _hasHydrated: true });
      },
    }
  )
);

/** True once persisted state has loaded — gate the UI on this to avoid flicker. */
export const useHydrated = () => useStore((s) => s._hasHydrated);
