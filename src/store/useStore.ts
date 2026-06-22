/**
 * The single app store (Zustand + persist). v2 multi-wardrobe model: a user has a
 * fixed GENDER (chosen at onboarding) and toggles MODE (formal/casual) in the sidebar.
 * Wardrobe DATA + history (tops/bottoms/shades/worn/dismissed/saved/lastPickDay) is
 * scoped per `${gender}-${mode}` bucket; every section reads the ACTIVE bucket. The
 * session slice (deck position / current pairing) is transient and partialized out.
 * Skin tone is a single Monk-Skin-Tone swatch (1..10) collapsed to a tier by the engine.
 */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  COLORS,
  KEYS,
  STYLES,
  buildDeck,
  comboName,
  findCurated,
  mstFromLegacyLabel,
  shadeHex,
  skinObj,
  stepRec,
  type BucketKey,
  type ColorKey,
  type Gender,
  type Mode,
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

/** Google Drive backup state. `email` is null when signed out. */
export interface DriveState {
  email: string | null;
  lastBackup: string | null; // ISO timestamp of the last successful upload
  auto: boolean; // auto-back up after wardrobe changes
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

/** One gender×mode wardrobe: owned colours + their shades, plus this bucket's history. */
export interface Wardrobe {
  tops: ColorKey[];
  bottoms: ColorKey[];
  shadeTops: Record<ColorKey, ShadeIndex[]>;
  shadeBottoms: Record<ColorKey, ShadeIndex[]>;
  worn: Record<string, string>;
  dismissed: Record<string, boolean>; // combos the user marked "not for me"
  saved: SavedLook[];
  lastPickDay: string; // yyyy-mm-dd the "today's pick" was last seeded (per bucket)
}

type Slot = 'tops' | 'bottoms';

interface PersistedState {
  gender: Gender | null; // profile-level, chosen once at onboarding
  mode: Mode; // active mode (sidebar toggle)
  mst: number | null; // skin swatch 1..10 (engine derives the tier)
  wardrobes: Record<BucketKey, Wardrobe>; // all 4 keys always present
  pendingWardrobe: Wardrobe | null; // migration holding pen until gender is chosen
  theme: 'system' | 'dark' | 'light';
  style: StyleName;
  swipeHintSeen: boolean;
  coachSeen: boolean; // the double-tap-to-save coachmark
  welcomeSeen: boolean; // the first-launch feature-intro carousel
  notify: NotifySettings;
  setupComplete: boolean;
  drive: DriveState;
}

interface SessionState {
  current: { t: ColorKey; b: ColorKey } | null;
  currentName: string;
  deckPos: number;
  _hasHydrated: boolean;
}

interface Actions {
  setGender: (g: Gender) => void;
  setMode: (m: Mode) => void;
  setMst: (n: number) => void;
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
  markCoachSeen: () => void;
  markWelcomeSeen: () => void;
  setNotify: (patch: Partial<NotifySettings>) => void;
  // saved / worn
  saveCurrent: () => void;
  deleteSaved: (id: number) => void;
  clearWorn: () => void;
  // settings / data
  setTheme: (t: 'system' | 'dark' | 'light') => void;
  toggleTheme: () => void;
  completeSetup: () => void;
  resetWardrobe: () => void;
  setHasHydrated: (v: boolean) => void;
  exportData: () => string;
  importData: (json: string) => boolean;
  // google drive
  setDriveEmail: (email: string | null) => void;
  setDriveLastBackup: (iso: string) => void;
  setDriveAuto: (auto: boolean) => void;
}

export type Store = PersistedState & SessionState & Actions;

export const BUCKETS: BucketKey[] = ['male-formal', 'male-casual', 'female-formal', 'female-casual'];

const emptyWardrobe = (): Wardrobe => ({
  tops: [],
  bottoms: [],
  shadeTops: {},
  shadeBottoms: {},
  worn: {},
  dismissed: {},
  saved: [],
  lastPickDay: '',
});

const emptyWardrobes = (): Record<BucketKey, Wardrobe> =>
  BUCKETS.reduce((acc, k) => {
    acc[k] = emptyWardrobe();
    return acc;
  }, {} as Record<BucketKey, Wardrobe>);

/** A stable empty wardrobe for selectors when no gender is chosen yet (pre-onboarding). */
const EMPTY_WARDROBE: Wardrobe = emptyWardrobe();

const SESSION_DEFAULTS: SessionState = { current: null, currentName: '', deckPos: -1, _hasHydrated: false };

const PERSISTED_DEFAULTS: PersistedState = {
  gender: null,
  mode: 'formal',
  mst: null,
  wardrobes: emptyWardrobes(),
  pendingWardrobe: null,
  theme: 'system', // follow the device appearance until the user picks Dark/Light
  style: 'Minimal',
  swipeHintSeen: false,
  coachSeen: false,
  welcomeSeen: false,
  notify: { enabled: true, hour: 9, minute: 0, days: [1, 2, 3, 4, 5, 6, 7] }, // daily reminder on by default

  setupComplete: false,
  drive: { email: null, lastBackup: null, auto: false },
};

/** The active bucket key, or null before a gender is chosen. */
const activeKey = (s: { gender: Gender | null; mode: Mode }): BucketKey | null =>
  s.gender ? (`${s.gender}-${s.mode}` as BucketKey) : null;

/** The active wardrobe (or a stable empty one when no gender is set yet). */
const aw = (s: { gender: Gender | null; mode: Mode; wardrobes: Record<BucketKey, Wardrobe> }): Wardrobe => {
  const key = activeKey(s);
  return key ? s.wardrobes[key] ?? EMPTY_WARDROBE : EMPTY_WARDROBE;
};

/** Immutable patch of the ACTIVE wardrobe; no-op (empty patch) when no gender is set. */
const setAW = (s: Store, patch: Partial<Wardrobe>): Partial<Store> => {
  const key = activeKey(s);
  if (!key) return {};
  const cur = s.wardrobes[key] ?? emptyWardrobe();
  return { wardrobes: { ...s.wardrobes, [key]: { ...cur, ...patch } } };
};

/**
 * A stable name for a pairing in the active gender×mode (curated → its mood). We pass
 * NO rng: comboName seeds its own generative pick deterministically from `${t}|${b}`, so
 * every call site that uses `comboName(t, b, curated)` — the card, saved looks, AND the
 * rotation list — lands on the identical name (no two competing RNG streams).
 */
const nameFor = (s: Store, t: ColorKey, b: ColorKey): string => {
  const cur = s.gender ? findCurated(t, b, s.gender, s.mode) : null;
  return comboName(t, b, cur);
};

/** The browsable deck for the active bucket — excludes "not for me" combos. */
const deckFor = (s: Store) => {
  const w = aw(s);
  return buildDeck({
    tops: w.tops,
    bottoms: w.bottoms,
    skin: skinObj(s.mst),
    style: s.style,
    gender: s.gender,
    mode: s.mode,
  }).filter((c) => !w.dismissed[c.id]);
};

const isStyle = (v: unknown): v is StyleName => STYLES.includes(v as StyleName);
const isMode = (v: unknown): v is Mode => v === 'formal' || v === 'casual';

/** Sanitise an arbitrary object into a valid Wardrobe (validates colour keys, Maroon→Burgundy). */
const sanitizeWardrobe = (raw: any): Wardrobe => {
  const mapKey = (k: string): string => (k === 'Maroon' ? 'Burgundy' : k);
  const validList = (a: unknown): ColorKey[] => {
    if (!Array.isArray(a)) return [];
    const seen = new Set<ColorKey>();
    a.forEach((k) => {
      const m = mapKey(k as string);
      if (KEYS.includes(m)) seen.add(m);
    });
    return KEYS.filter((k) => seen.has(k));
  };
  const tops = validList(raw?.tops);
  const bottoms = validList(raw?.bottoms);
  const validShades = (m: any, owned: ColorKey[]): Record<ColorKey, ShadeIndex[]> => {
    const out: Record<ColorKey, ShadeIndex[]> = {};
    owned.forEach((k) => {
      const v = m?.[k] ?? m?.[k === 'Burgundy' ? 'Maroon' : k];
      const arr = Array.isArray(v) ? (v as number[]).filter((i) => Number.isInteger(i) && i >= 0 && i < COLORS[k].shades.length) : [];
      out[k] = (arr.length ? arr : [COLORS[k].baseIdx]) as ShadeIndex[];
    });
    return out;
  };
  const remapId = (id: string) => id.split('|').map(mapKey).join('|');
  const remapMap = <V,>(m: any): Record<string, V> => {
    const out: Record<string, V> = {};
    if (m && typeof m === 'object') Object.entries(m).forEach(([id, v]) => (out[remapId(id)] = v as V));
    return out;
  };
  const saved: SavedLook[] = Array.isArray(raw?.saved)
    ? raw.saved
        .filter((x: any) => x && KEYS.includes(mapKey(x.t)) && KEYS.includes(mapKey(x.b)))
        .map((x: any) => ({ ...x, t: mapKey(x.t), b: mapKey(x.b) }))
    : [];
  return {
    tops,
    bottoms,
    shadeTops: validShades(raw?.shadeTops, tops),
    shadeBottoms: validShades(raw?.shadeBottoms, bottoms),
    worn: remapMap<string>(raw?.worn),
    dismissed: remapMap<boolean>(raw?.dismissed),
    saved,
    lastPickDay: typeof raw?.lastPickDay === 'string' ? raw.lastPickDay : '',
  };
};

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      ...PERSISTED_DEFAULTS,
      ...SESSION_DEFAULTS,

      setGender: (g) => {
        const s = get();
        let wardrobes = s.wardrobes;
        // First time we learn the gender, drop any migration holding-pen into formal.
        if (s.pendingWardrobe) {
          wardrobes = { ...wardrobes, [`${g}-formal` as BucketKey]: s.pendingWardrobe };
        }
        set({ gender: g, wardrobes, pendingWardrobe: null });
        if (s.setupComplete) get().regenerate();
      },

      setMode: (m) => {
        if (get().mode === m) return;
        set({ mode: m });
        get().regenerate();
      },

      setMst: (n) => {
        set({ mst: n });
        if (get().setupComplete) get().regenerate();
      },

      toggleColor: (slot, key) => {
        const s = get();
        const w = aw(s);
        const arr = slot === 'tops' ? w.tops : w.bottoms;
        const setK = new Set(arr);
        const adding = !setK.has(key);
        if (adding) setK.add(key);
        else setK.delete(key);
        const next = KEYS.filter((k) => setK.has(k));
        const shadeField = slot === 'tops' ? 'shadeTops' : 'shadeBottoms';
        const shades = { ...w[shadeField] };
        if (adding && shades[key] == null) shades[key] = [COLORS[key].baseIdx as ShadeIndex];
        set(setAW(s, { [slot]: next, [shadeField]: shades } as Partial<Wardrobe>));
      },

      setColors: (slot, colors) => {
        const s = get();
        const w = aw(s);
        const setK = new Set(colors);
        const next = KEYS.filter((k) => setK.has(k));
        const shadeField = slot === 'tops' ? 'shadeTops' : 'shadeBottoms';
        const shades = { ...w[shadeField] };
        next.forEach((k) => {
          if (shades[k] == null) shades[k] = [COLORS[k].baseIdx as ShadeIndex];
        });
        set(setAW(s, { [slot]: next, [shadeField]: shades } as Partial<Wardrobe>));
      },

      toggleShade: (slot, key, idx) => {
        const s = get();
        const w = aw(s);
        const shadeField = slot === 'tops' ? 'shadeTops' : 'shadeBottoms';
        const arr = slot === 'tops' ? w.tops : w.bottoms;
        const owned = arr.includes(key);
        const cur = w[shadeField][key] ?? [];
        let nextShades: ShadeIndex[];
        if (!owned) nextShades = [idx];
        else if (cur.includes(idx)) {
          nextShades = cur.filter((i) => i !== idx);
          if (nextShades.length === 0) nextShades = [idx];
        } else nextShades = [...cur, idx].sort((a, b) => a - b) as ShadeIndex[];
        const shades = { ...w[shadeField], [key]: nextShades };
        const next = owned ? arr : KEYS.filter((k) => arr.includes(k) || k === key);
        set(setAW(s, { [shadeField]: shades, [slot]: next } as Partial<Wardrobe>));
      },

      regenerate: () => {
        set({ deckPos: -1 });
        return get().another();
      },

      another: () => {
        const s = get();
        const deck = deckFor(s);
        const r = stepRec(deck, s.deckPos, aw(s).worn);
        if (!r) {
          set({ current: null, currentName: '', deckPos: -1 });
          return false;
        }
        set({ current: { t: r.pick.t, b: r.pick.b }, currentName: nameFor(s, r.pick.t, r.pick.b), deckPos: r.pos });
        return r.roundDone;
      },

      // Linear swipe steps — walk every look in order (continuous "x of N" counter).
      next: () => {
        const s = get();
        const deck = deckFor(s);
        if (!deck.length) return;
        const pos = (s.deckPos + 1) % deck.length;
        const pick = deck[pos];
        set({ current: { t: pick.t, b: pick.b }, currentName: nameFor(s, pick.t, pick.b), deckPos: pos });
      },
      prev: () => {
        const s = get();
        const deck = deckFor(s);
        if (!deck.length) return;
        const n = deck.length;
        const pos = (((s.deckPos === -1 ? 0 : s.deckPos) - 1) % n + n) % n;
        const pick = deck[pos];
        set({ current: { t: pick.t, b: pick.b }, currentName: nameFor(s, pick.t, pick.b), deckPos: pos });
      },
      goToIndex: (i) => {
        const s = get();
        const deck = deckFor(s);
        if (!deck.length) return;
        const pos = ((i % deck.length) + deck.length) % deck.length;
        const pick = deck[pos];
        set({ current: { t: pick.t, b: pick.b }, currentName: nameFor(s, pick.t, pick.b), deckPos: pos });
      },

      markWorn: () => {
        const s = get();
        if (!s.current) return;
        const id = s.current.t + '|' + s.current.b;
        const w = aw(s);
        set(setAW(s, { worn: { ...w.worn, [id]: todayStr() } }));
        get().next();
      },

      dismiss: () => {
        const s = get();
        if (!s.current) return;
        const id = s.current.t + '|' + s.current.b;
        const w = aw(s);
        const dismissed = { ...w.dismissed, [id]: true };
        const patch = setAW(s, { dismissed });
        // Rebuild the deck without this combo; the same index now points to the next one.
        const deck = buildDeck({
          tops: w.tops,
          bottoms: w.bottoms,
          skin: skinObj(s.mst),
          style: s.style,
          gender: s.gender,
          mode: s.mode,
        }).filter((c) => !dismissed[c.id]);
        if (!deck.length) {
          set({ ...patch, current: null, currentName: '', deckPos: -1 });
          return;
        }
        const pos = Math.min(s.deckPos < 0 ? 0 : s.deckPos, deck.length - 1);
        const pick = deck[pos];
        set({ ...patch, current: { t: pick.t, b: pick.b }, currentName: nameFor(s, pick.t, pick.b), deckPos: pos });
      },
      restoreDismissed: (id) => {
        const s = get();
        const w = aw(s);
        const d = { ...w.dismissed };
        delete d[id];
        set(setAW(s, { dismissed: d }));
      },

      loadCombo: (t, b) => {
        const s = get();
        const pos = deckFor(s).findIndex((c) => c.t === t && c.b === b);
        set({ current: { t, b }, currentName: nameFor(s, t, b), deckPos: pos });
      },
      setLastPickDay: (d) => set(setAW(get(), { lastPickDay: d })),

      setStyle: (st) => {
        set({ style: st });
        get().regenerate();
      },
      markSwipeHintSeen: () => set({ swipeHintSeen: true }),
      markCoachSeen: () => set({ coachSeen: true }),
      markWelcomeSeen: () => set({ welcomeSeen: true }),
      setNotify: (patch) => set({ notify: { ...get().notify, ...patch } }),

      saveCurrent: () => {
        const s = get();
        if (!s.current) return;
        const { t, b } = s.current;
        const w = aw(s);
        const item: SavedLook = {
          id: Date.now(),
          t,
          b,
          th: shadeHex(t, w.shadeTops[t]?.[0]),
          bh: shadeHex(b, w.shadeBottoms[b]?.[0]),
          name: s.currentName || nameFor(s, t, b),
          style: s.style,
          date: todayStr(),
        };
        set(setAW(s, { saved: [item, ...w.saved] }));
      },
      deleteSaved: (id) => set(setAW(get(), { saved: aw(get()).saved.filter((x) => x.id !== id) })),
      clearWorn: () => set(setAW(get(), { worn: {} })),

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
          coachSeen: s.coachSeen,
          welcomeSeen: s.welcomeSeen, // don't replay the intro after a reset
          notify: s.notify,
          drive: s.drive, // keep the Drive session/settings; only wardrobe data is cleared
        });
      },

      exportData: () => {
        const s = get();
        return JSON.stringify({
          app: 'colorcloset',
          v: 6,
          gender: s.gender,
          mode: s.mode,
          mst: s.mst,
          style: s.style,
          theme: s.theme,
          notify: s.notify,
          setupComplete: s.setupComplete,
          wardrobes: s.wardrobes,
        });
      },
      setDriveEmail: (email) => set({ drive: { ...get().drive, email } }),
      setDriveLastBackup: (iso) => set({ drive: { ...get().drive, lastBackup: iso } }),
      setDriveAuto: (auto) => set({ drive: { ...get().drive, auto } }),

      importData: (json) => {
        try {
          const p = JSON.parse(json);
          if (!p || typeof p !== 'object') return false;

          // ---- v6 multi-wardrobe backup ----
          if ((p.v ?? 0) >= 6 && p.wardrobes && typeof p.wardrobes === 'object') {
            const wardrobes = emptyWardrobes();
            BUCKETS.forEach((k) => {
              if (p.wardrobes[k]) wardrobes[k] = sanitizeWardrobe(p.wardrobes[k]);
            });
            const hasAny = BUCKETS.some((k) => wardrobes[k].tops.length || wardrobes[k].bottoms.length);
            if (!hasAny) return false;
            set({
              gender: p.gender === 'male' || p.gender === 'female' ? p.gender : null,
              mode: isMode(p.mode) ? p.mode : 'formal',
              mst: typeof p.mst === 'number' ? p.mst : null,
              wardrobes,
              pendingWardrobe: null,
              style: isStyle(p.style) ? p.style : 'Minimal',
              theme: p.theme === 'light' || p.theme === 'system' ? p.theme : 'dark',
              notify: p.notify ?? PERSISTED_DEFAULTS.notify,
              setupComplete: !!p.setupComplete,
              ...SESSION_DEFAULTS,
              _hasHydrated: true,
            });
            get().regenerate();
            return true;
          }

          // ---- legacy v≤5 flat backup → fold into pending / active gender's formal bucket ----
          if (Array.isArray(p.tops) || Array.isArray(p.bottoms)) {
            const folded = sanitizeWardrobe(p);
            if (!folded.tops.length && !folded.bottoms.length) return false;
            const s = get();
            const wardrobes = { ...s.wardrobes };
            let pending = s.pendingWardrobe;
            if (s.gender) wardrobes[`${s.gender}-formal` as BucketKey] = folded;
            else pending = folded;
            set({
              wardrobes,
              pendingWardrobe: pending,
              mode: 'formal',
              mst: p.depth ? mstFromLegacyLabel(p.depth) : s.mst,
              style: isStyle(p.style) ? p.style : s.style,
              theme: p.theme === 'light' || p.theme === 'system' ? p.theme : 'dark',
              notify: p.notify ?? s.notify,
              setupComplete: s.gender ? true : s.setupComplete,
              ...SESSION_DEFAULTS,
              _hasHydrated: true,
            });
            get().regenerate();
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },
    }),
    {
      name: 'colorcloset',
      version: 6,
      storage: createJSONStorage(() => activeStorage),
      migrate: (persisted: any, version) => {
        if (!persisted) return persisted;
        if (version < 2) {
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
        // v5 (flat wardrobe) → v6 (gender×mode buckets). Gender is unknown at migration:
        // fold the old wardrobe into the holding pen; the gender micro-step lands it in
        // `${gender}-formal`. Old shade indices referenced an algorithmic strip, not the
        // named vocab, so they're reset to each colour's display-default shade.
        if (version < 6) {
          const folded = sanitizeWardrobe(persisted);
          // Old shade indices referenced an algorithmic light→dark strip, NOT the named
          // vocab (different order; Beige now has 6 shades), so a preserved index would
          // point at the wrong named shade. Reset each owned colour to its display default.
          folded.shadeTops = Object.fromEntries(
            folded.tops.map((k) => [k, [COLORS[k].baseIdx as ShadeIndex]])
          );
          folded.shadeBottoms = Object.fromEntries(
            folded.bottoms.map((k) => [k, [COLORS[k].baseIdx as ShadeIndex]])
          );
          return {
            gender: null,
            mode: 'formal',
            mst: persisted.depth ? mstFromLegacyLabel(persisted.depth) : null,
            wardrobes: emptyWardrobes(),
            pendingWardrobe: folded.tops.length || folded.bottoms.length ? folded : null,
            theme: persisted.theme === 'light' ? 'light' : 'dark',
            style: isStyle(persisted.style) ? persisted.style : 'Minimal',
            swipeHintSeen: !!persisted.swipeHintSeen,
            coachSeen: false,
            welcomeSeen: true, // existing v5 users have already set up — skip the intro
            notify: persisted.notify ?? PERSISTED_DEFAULTS.notify,
            setupComplete: !!persisted.setupComplete,
            drive: persisted.drive ?? PERSISTED_DEFAULTS.drive,
          } as PersistedState;
        }
        return persisted;
      },
      partialize: (s): PersistedState => ({
        gender: s.gender,
        mode: s.mode,
        mst: s.mst,
        wardrobes: s.wardrobes,
        pendingWardrobe: s.pendingWardrobe,
        theme: s.theme,
        style: s.style,
        swipeHintSeen: s.swipeHintSeen,
        coachSeen: s.coachSeen,
        welcomeSeen: s.welcomeSeen,
        notify: s.notify,
        setupComplete: s.setupComplete,
        drive: s.drive,
      }),
      onRehydrateStorage: () => () => {
        useStore.setState({ _hasHydrated: true });
      },
    }
  )
);

/** True once persisted state has loaded — gate the UI on this to avoid flicker. */
export const useHydrated = () => useStore((s) => s._hasHydrated);

/** The active wardrobe selector for components (recomputed on gender/mode/wardrobes change). */
export const useActiveWardrobe = (): Wardrobe =>
  useStore((s) => (s.gender ? s.wardrobes[`${s.gender}-${s.mode}` as BucketKey] ?? EMPTY_WARDROBE : EMPTY_WARDROBE));
