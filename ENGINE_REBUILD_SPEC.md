# ColorCloset — Engine Rebuild + Gender×Mode Spec (CONTRACT)

> This is the single coordination contract for the v2 rebuild. Every implementation
> agent MUST read this AND `Product Docs/Color Combination Research.md` (the data
> source of truth) AND the existing file they are replacing. All hex/shade/combo
> DATA comes from the research doc's machine-readable JSON block; this file pins the
> CODE shape, signatures, decisions, and copy rules. Keep the engine pure &
> dependency-free (no React-Native imports). TypeScript strict. Use the Write tool
> (never Set-Content) so JSON/TS stays BOM-free.

Node is off-PATH: prefix tool shells with `$env:Path = "$env:LOCALAPPDATA\nodejs;$env:Path"`.

---

## 0. Big-picture changes

1. Engine rebuilt from the research doc: **17 base colours** (drop Maroon; Brown base = `#6B4423`), a **named shade vocabulary** per base, a **curated combination dataset** (4 sets: gender×mode) as the high-confidence spine, plus a **generative scorer** built on the doc's shade-pairing principles, with the **avoid-list suppressed**.
2. **Gender** (`male`/`female`) chosen at onboarding (profile-level).
3. **Mode** (`formal`/`casual`) toggled in the sidebar — one at a time.
4. **Four wardrobes** keyed `${gender}-${mode}`. Every section (deck, rotation, saved, colours-to-buy) and ALL history (worn/saved/dismissed) is scoped to the active bucket.
5. **10-swatch MST skin picker**; engine reads the 3 tiers (Light/Medium/Deep).
6. Card copy: named shades ("Sky Blue + Navy"); varied authentic phrasing; remove the static "flatters your medium skin tone" pill.
7. Bug fix: tapping a combo in rotation/saved while on "Colors to buy" switches to "Style me".
8. "Colour science sources" sidebar panel (Top-5). Coachmark after first card entrance. Lazy casual onboarding.

Do NOT regress: Google Drive backup (`src/lib/drive.ts`, BackupPanel, DriveAutoBackup, `app.json` extra.googleWebClientId), persist (bump v5→v6 with migration). `exportData()/importData()` must round-trip the new multi-wardrobe structure.

---

## 1. Module layout (`src/engine/`)

- `types.ts` — all engine types (below).
- `data.ts` — **transcribed verbatim** from the research-doc JSON: `SHADE_VOCAB`, `MST_SWATCHES`, `SKIN_TIERS`, `MST_LABEL_MAP`, `COMBINATIONS`, `AVOID_LIST`. Pure data, no logic.
- `colors.ts` — derives `BASE_HEX`, `KEYS`, `COLORS`, colour sets, helpers.
- `skin.ts` — MST model + tier logic + `skinObj`/`skinNote`.
- `combos.ts` — curated-combo indexing & lookup by gender×mode + ownership.
- `scoring.ts` — `harmony`, `styleBias`, `score`, `isAvoided`, `catFor`.
- `deck.ts` — `comboUniverse`, `uniStats`, `buildDeck`, `deckKey`, `stepRec`.
- `gap.ts` — `gapSuggestions`.
- `naming.ts` — `comboName`, `comboWhy`, `RationaleSegment`, `whyText`.
- `leather.ts` — keep `leatherFor` + `LEATHER_HEX` (unchanged logic; works on base bottom).
- `heritage.ts` — DELETE (region/heritage now comes from curated dataset + `naming`). Remove its test.
- `constants.ts` — `STYLES`, `MODES`, `GENDERS`, thresholds.
- `index.ts` — re-export all (drop heritage).

---

## 2. types.ts

```ts
export type ColorKey = string;                 // a base colour name, e.g. "Navy"
export type Gender = 'male' | 'female';
export type Mode = 'formal' | 'casual';
export type BucketKey = `${Gender}-${Mode}`;
export type SkinTier = 'Light' | 'Medium' | 'Deep';
export type StyleName = 'Minimal' | 'Classic' | 'Bold' | 'Statement';
export type Leather = 'Black' | 'Brown';
export type ShadeIndex = number;               // 0-based index into a base's named shades.
                                               // (Most bases have 5 shades; Beige has 6 — so NOT a 0..4 union.)
export type ComboId = string;                  // `${top}|${bottom}` (base colours)

export interface ShadeEntry { name: string; hex: string; }
export interface ColorEntry {
  hex: string;                  // base hex (doc "base #..")
  rgb: [number, number, number];
  shades: string[];             // shade hexes, doc order (5 for most bases; Beige has 6)
  shadeNames: string[];         // shade names, doc order (parallel to shades)
  baseIdx: ShadeIndex;          // index of the shade nearest the base hex = display default
}

export interface SkinObj {
  mst: number;                  // 1..10
  tier: SkinTier;
  dot: string;                  // swatch hex for display
  flatterTops: ColorKey[];      // base colours flattering near the face for this tier
  avoidTops: ColorKey[];        // base colours that read off near the face (gentle demote)
  note: string;
}

/** Metadata for a curated combination (from the research dataset). */
export interface CuratedMeta {
  topShade: string;             // dataset shade name, e.g. "Sky Blue"
  bottomShade: string;
  accent: string | null;        // e.g. "Cognac", "Gold", "Silver", null
  mood: string;                 // e.g. "Quiet Confidence"
  styleTag: StyleName;          // mapped to one of the 4 styles
  region: string;               // e.g. "Universal", "Japanese/Tokyo"
  flatters: string[];           // ["all"] | ["Medium","Deep"] | ["all","Deep"] ...
  why: string;
  occasion: string;
  timeless: 'timeless' | 'trend';
}

export interface Combo {
  id: ComboId; t: ColorKey; b: ColorKey; sc: number;
  curated?: CuratedMeta;        // present iff this is a curated, ownable combo
}
export interface RankedCombo extends Combo { osc: number; }

export interface BuySuggestion { c: ColorKey; pairs: ColorKey[]; fl: boolean; }
```

---

## 3. data.ts (DATA SOURCE = research-doc JSON)

Transcribe the doc's `## JSON EXPORT` block **exactly**. A verification agent will diff this against the doc.

- `SHADE_VOCAB: { shade: string; hex: string; base: string }[]` — all **86** entries (17 bases; most have 5 shades, **Beige has 6**: Ecru, Sand, Tan, Camel, Taupe, Stone). NOTE the doc tags the Brown shades `base:"Brown (recommended addition)"` — normalise that base string to **`"Brown"`**. Result: 17 distinct bases, **no "Maroon"**.
- `MST_SWATCHES: { mst: string; hex: string; tier: SkinTier }[]` — 10 entries (`skin_tone_model.mst_swatches`). Keep hex lowercase as in doc.
- `SKIN_TIERS` — `{ Light:["MST1","MST2","MST3"], Medium:[...], Deep:[...] }`.
- `MST_LABEL_MAP` — the `app_label_mapping` array (for migration from the 6 old labels).
- `COMBINATIONS: RawCombo[]` — all **45** from `combinations`. Keep every field: `top, bottom, accent, mood, category, gender, style_tag, descriptor, region, flatters, why, occasion, timeless_or_trend`. (`top`/`bottom`/`accent` are usually shade names but some are BASE names — e.g. `bottom:"Black"` — and accents include finish words not in the vocab — e.g. `"Gold"`, `"Silver"`, `"Tan"`, `"Pearl"`, `"Nude/Tan"`.)
- `AVOID_LIST: { pair: string; reason: string }[]` — the 10 `combinations_to_avoid` entries (for the About/sources copy + reference).

`RawCombo` is the raw doc shape (snake_case, `gender:"Men"|"Women"`, `category:"Formal"|"Casual"`). `combos.ts` normalises it.

---

## 4. colors.ts

Build from `SHADE_VOCAB`.

- `KEYS: ColorKey[]` — the 17 bases in THIS fixed display order (neutral→cool→warm/bold, matches the doc's vocabulary order):
  `['White','Cream','Beige','Khaki','Light Blue','Blue','Navy','Grey','Charcoal','Black','Olive','Forest Green','Mustard','Rust','Burgundy','Purple','Brown']`
- `BASE_HEX: Record<ColorKey,string>` — the doc "(base #..)" header hex per base:
  White `#F7F6F1`, Cream `#EFE7D2`, Beige `#DAC8A9`, Khaki `#BEB079`, Light Blue `#AFC9E2`, Blue `#3A6EA5`, Navy `#22335A`, Grey `#8B8E95`, Charcoal `#34373D`, Black `#1B1B1F`, Olive `#6C7138`, Forest Green `#2F4E3B`, Mustard `#C9A227`, Rust `#9E4A28`, Burgundy `#72202F`, Purple `#5B4B8A`, Brown `#6B4423`.
- `COLORS: Record<ColorKey,ColorEntry>` — for each base: `hex`=BASE_HEX; `shades`/`shadeNames` = that base's 5 SHADE_VOCAB entries in doc order; `rgb`=rgb(hex); `baseIdx`=index of the shade whose hex is nearest (Euclidean RGB) to BASE_HEX (the display default).
- Helpers (keep existing signatures/behaviour where noted):
  - `rgb(hex)`, `rgbString(hex)`, `mix(hex,t)` (keep — used by theming/anims if needed), `lum(key)` (perceptual luminance of the base's DEFAULT shade hex = `shadeHex(k,null)`, so the scorer matches the displayed colour), `lumHex(hex)` (luminance of an arbitrary hex — ADD, scorer needs per-shade luminance).
  - `hx(key)` → base hex (grey `#888888` fallback).
  - `shadeHex(key, idx)` → `COLORS[key].shades[idx]`; when idx null/undefined use `COLORS[key].baseIdx`. Unknown key → `hx(key)`.
  - `shadeName(key, idx)` → ADD: the named shade; idx null → baseIdx's name. Unknown → key.
  - `nearest(r,g,b)` — keep (nearest base by base hex).
- Colour sets (base-level), reconciled to 17 colours (NO Maroon):
  - `NEUTRAL = {White, Cream, Beige, Khaki, Grey, Charcoal, Black, Navy, Brown}` (doc principle #3: white/cream/beige/grey/charcoal/navy/black are free agents; Khaki & Brown are warm neutrals).
  - `WARM = {Cream, Beige, Khaki, Olive, Mustard, Rust, Brown}` (doc #4 earth tones).
  - `COOL = {Navy, Blue, Light Blue, Charcoal, Grey, Forest Green, Purple}` (doc #4 cool tones).
  - `BOLD = {Olive, Forest Green, Mustard, Rust, Burgundy, Purple}` (saturated/expressive).
  - `CORP = {Navy, Charcoal, Grey, White, Light Blue, Blue, Beige, Brown, Cream}` (clean/professional — Classic lean).
  - `FAMILY: Record<ColorKey,string>` — White:white, Cream/Beige/Khaki/Brown:warmneutral, Grey/Charcoal:grey, Black:black, Light Blue/Blue/Navy:blue, Olive/Forest Green:green, Burgundy:darkred, Mustard:mustard, Rust:rust, Purple:purple. (Used for "same family, near-equal value reads flat".)
  - `BOTTOM: Record<ColorKey,number>` — realistic-trouser plausibility 0..1. Use the existing values, dropping Maroon: Navy 1.0, Grey .97, Charcoal .97, Khaki .95, Black .92, Beige .9, Brown .88, Olive .85, Cream .72, White .6, Blue .45, Light Blue .2, Forest Green .2, Burgundy .18, Rust .12, Mustard .08, Purple .08. `bottomScore(k)= BOTTOM[k] ?? 0.5`.

---

## 5. skin.ts (10-swatch MST → 3 tiers)

- Re-export `MST_SWATCHES`. `tierOf(mst:number):SkinTier` via `SKIN_TIERS` (mst 1-3 Light, 4-6 Medium, 7-10 Deep).
- Tier→TOP favour/avoid (doc principle #5; gentle nudge, never excludes). Base-colour sets:
  - `Deep` flatterTops: `White, Cream, Burgundy, Forest Green, Purple, Mustard, Rust, Blue, Navy` (saturated brights + crisp Optic White). avoidTops: `Khaki, Olive, Beige, Grey` (can read muddy/ashy near a deep face).
  - `Light` flatterTops: `Navy, Blue, Burgundy, Forest Green, Purple, Charcoal, Grey, Olive` (mid-to-deep + jewel give needed contrast). avoidTops: `Cream, Beige, Khaki, Light Blue` (palest tints near a very light face wash out).
  - `Medium` flatterTops: broad/flexible — `Navy, Blue, Burgundy, Forest Green, Olive, Rust, Mustard, Brown, Khaki` . avoidTops: `[]`.
- `skinObj(mst:number|null):SkinObj` — null → default mst=5 (Medium). Fills tier, dot (swatch hex), flatterTops/avoidTops, note.
- `skinNote(mst|null):string` — tier-based plain language, e.g. Deep: "Crisp whites and saturated, high-chroma colour flatter deeper skin — used softly to rank your tops." Light/Medium analogues. NEVER per-combo; this is for the skin panel only.
- `mstFromLegacyLabel(label):number` — map old DepthId ('fair'..'rich') → a representative MST via `MST_LABEL_MAP` (Fair→1, Light→3, Medium→4, Tan→6, Deep→7, Rich→9). For migration.

---

## 6. combos.ts (curated spine)

Normalise `COMBINATIONS` (RawCombo) once into `CURATED: NormCombo[]`:
```ts
interface NormCombo {
  gender: Gender; mode: Mode;          // 'Men'->male, 'Women'->female, 'Formal'->formal, 'Casual'->casual
  topBase: ColorKey; bottomBase: ColorKey;   // via SHADE_TO_BASE(top), SHADE_TO_BASE(bottom)
  meta: CuratedMeta;                   // topShade=top, bottomShade=bottom, accent, mood,
                                       // styleTag=mapStyle(style_tag), region, flatters,
                                       // why, occasion, timeless=timeless_or_trend
}
```
- `SHADE_TO_BASE: Record<string,ColorKey>` built from SHADE_VOCAB (shade name → base), PLUS a self-map for every base name (so `"Black"`/`"Navy"` resolve). `baseOf(name): ColorKey = SHADE_TO_BASE[name] ?? (KEYS.includes(name) ? name : <throw/skip>)`. Accents that are finish words ("Gold","Silver","Pearl","Tan","Nude/Tan") have no base — keep accent as a free string, base lookup not required.
- `mapStyle(tag)` → StyleName: tag already one of Classic/Minimal/Bold/Statement (doc uses exactly these in `style_tag`); pass through, default 'Classic'.
- Exports:
  - `curatedFor(gender, mode): NormCombo[]`.
  - `findCurated(t, b, gender, mode): CuratedMeta | null` — match by base pair in EITHER order (if reversed, swap topShade/bottomShade so display still reads top-on-top). 
  - `curatedOwnable(tops, bottoms, gender, mode): {t,b,meta}[]` — curated combos where `tops` includes topBase AND `bottoms` includes bottomBase (base-level ownership). Used by the universe builder.
- A curated combo is **suppressed** if its base pair is in the avoid set (none should be, but guard anyway).

---

## 7. scoring.ts (generative engine = doc principles)

All operate on BASE colours; luminance uses each base's DEFAULT shade hex (`shadeHex(k,null)`).

`isAvoided(t,b): boolean` — true if `{t,b}` (unordered) ∈ AVOID_BASE_PAIRS:
`Navy|Black`, `Brown|Burgundy`, `Purple|Mustard`, `Rust|Forest Green`.
(Rationale, documented in-file: doc avoid-list → base pairs. "Navy+Black" direct; "Brown+Burgundy" direct; "Purple+Yellow saturated"→Purple|Mustard; "Red+Green saturated"→Rust|Forest Green. "Midnight Navy+Charcoal" and "two non-matching blacks" are shade-proximity cases handled by the dark-on-dark penalty below, NOT a base suppression, so Navy+Charcoal/business-classic stays valid. Pale-pastel-on-light-skin handled by the skin top-avoid nudge. Neon/orange-red have no base.)

`harmony(t,b): number` (0..1) — encode the doc's SHADE-PAIRING PRINCIPLES:
- base `0.45`.
- tonal/monochrome: `t===b` (same base, different shades implied) → **reward** `+0.16` (doc #2 — tonal is elegant). (This REVERSES the old flatness penalty; tonal dressing is now desirable.)
- neutrals are free agents (doc #3): one neutral `+0.18`; both neutral `+0.10`.
- light↔deep contrast (doc #1): `dl=|lum(t)-lum(b)|`; `dl>0.32` → `+0.14`; `dl>0.5` → additional `+0.04`.
- dark-on-dark / muddy near-match (doc #1 + "two non-matching blacks"): if `t!==b`, `FAMILY[t]!==FAMILY[b]`, both `lum<0.32`, and `dl<0.12` → `-0.20` (this is the Midnight-Navy+Charcoal / two-blacks case).
- same family, different base, near-equal value → `-0.12` (e.g. Light Blue+Blue at close value with no contrast).
- warm/cool harmony (doc #4): if BOTH non-neutral and (WARM vs COOL) → `-0.14`; if both WARM or both COOL (and non-neutral) → `+0.06`.
- clamp 0..1.

`styleBias(t,b,style)` — keep the prior intent, but exemplar bonus now comes from curated-ness (handled in `score`). Style nudges:
- Minimal: both-neutral `+0.13`; bold present `-0.12`; low contrast `+0.04`.
- Classic: CORP membership `+0.05` each; Navy/White present `+0.05`; bold present `-0.08`.
- Bold: bold present `+0.14`; both-neutral `-0.12`; high contrast `+0.05`.
- Statement: (bold & neutral) `+0.10`; both bold `+0.07`; both neutral `-0.10`.

`score(t,b,skin,style?,ctx?:{gender?:Gender;mode?:Mode}): number`:
```
s = harmony(t,b)
// skin tier nudge — applied to the TOP (face) primarily, doc #5
if skin: if flatterTops.includes(t) s+=0.09; if avoidTops.includes(t) s-=0.07;
         if flatterTops.includes(b) s+=0.04;            // bottom matters less
// office/clean lean + realistic bottoms
if CORP.has(t) s+=0.03
s += 0.06 * bottomScore(b); if bottomScore(b)<0.25 s-=0.10
// curated spine bonus (strong) — only when ctx gender+mode given AND this pair is curated
if ctx?.gender && ctx?.mode && findCurated(t,b,gender,mode) s += 0.40
s += styleBias(t,b,style)
return s   // (not clamped; ranking only)
```
`isAvoided` pairs are EXCLUDED by the universe builder, not scored.

`catFor(t,b,gender?,mode?): string` — if curated → its `styleTag.toUpperCase()`; else NEUTRAL (both neutral) / BOLD (bold present) / EVERYDAY.

---

## 8. deck.ts

`UNIVERSE_THRESHOLD = 0.55` (constants). `DeckContext = { tops, bottoms, skin:SkinObj|null, style:StyleName, gender:Gender|null, mode:Mode }`.

`comboUniverse(tops, bottoms, skin, gender?, mode?): Combo[]`:
- For every `t∈tops, b∈bottoms`: skip if `isAvoided(t,b)`. Compute `sc=score(t,b,skin,undefined,{gender,mode})`. Attach `curated = (gender&&mode)? findCurated(...) : undefined`.
- Include if `curated` present OR `sc>=UNIVERSE_THRESHOLD`.
- If none included, fall back to the single best (still excluding avoided; if all avoided, the best avoided so user isn't stuck).
- Sort by sc desc, stable. Dedup by id.
- `id = `${t}|${b}``.

`uniStats(tops,bottoms,skin,worn,gender?,mode?)` — unchanged shape `{uni,total,worn}`.
`deckKey(ctx)` — include gender+mode+style+mst+tops+bottoms.
`buildDeck(ctx): RankedCombo[]` — `comboUniverse(...)` then `osc = score(t,b,skin,style,{gender,mode})`; sort by osc desc; carry `curated`.
`stepRec(deck,pos,worn)` — UNCHANGED.

---

## 9. gap.ts

`gapSuggestions(tops, bottoms, skin, gender?, mode?): {asTops,asBottoms}` — same as today but:
- Use `score(c,b,skin,undefined,{gender,mode})` / `score(t,c,...)`.
- Skip any candidate pair where `isAvoided`.
- `GAP_THRESHOLD = 0.62`. `MIN_BOTTOM_SUITABILITY = 0.35` (bottoms only). `fl = skin? skin.flatterTops.includes(c) : false`. Sort by `pairs.length + (fl?1.5:0)` desc.

---

## 10. naming.ts (varied, authentic copy — item 6)

`RationaleSegment { text:string; bold?:boolean }`. `whyText(segs)` join.

`comboName(combo:Combo): string`:
- curated → `combo.curated.mood`.
- else principle-derived, deterministic per id (seeded), choosing from small pools by the dominant principle: tonal (t===b) → ["Tonal Depth","Quiet Tone-on-Tone"]; both neutral → ["Quiet Neutral","Clean Slate"]; bold present → ["Confident Contrast","Rich Pairing"]; else ["Easy Everyday","Soft Contrast"]. (Use a seeded RNG from id — the STORE passes a seeded name like today; expose `comboName(t,b,curated?,rng?)`.)

`comboWhy(combo, skin, style?): RationaleSegment[]` — named-shade aware. Build `topName`/`botName` from curated shade names if curated, else `shadeName(base, ownedShadeIdx?)` (store passes owned shade idx; if absent use base default name).
- curated: lead with the doc `why` but render the two shade names bold inline. Pattern: `[{topShade,bold}, {" + "}, {bottomShade,bold}, {" — " + why}]`. If `region` is specific (NOT "Universal"/"Universal (Italian)") append ` · <region>`-style tag in the eyebrow (handled by OutfitCard, not here).
- generative: pick the phrasing matching the dominant principle (tonal / neutral-anchor / warm-earth / cool-tones / clean-contrast). e.g. tonal → "layered shades for depth"; warm+warm → "warm earth tones sit naturally together"; neutral present → "a neutral keeps it grounded"; high contrast → "clean light-on-dark contrast". Always shade-name-bolded. NEVER emit a skin-tone sentence here.

**Skin-tier note (item 6):** show a short tier line ONLY when the curated combo's `flatters` is tier-SPECIFIC (i.e. contains "Medium"/"Deep"/"Light" and NOT just "all") AND it matches the user's tier. Helper `tierNote(curated, skin): string | null` → e.g. "Especially striking on deeper skin." else null. The static "Flatters your X skin" pill is REMOVED entirely.

---

## 11. constants.ts

`STYLES: StyleName[] = ['Minimal','Classic','Bold','Statement']`. `MODES: Mode[]=['formal','casual']`. `GENDERS: Gender[]=['male','female']`. `UNIVERSE_THRESHOLD=0.55`, `GAP_THRESHOLD=0.62`. `MODE_LABEL={formal:'Formal',casual:'Casual'}`, `GENDER_LABEL={male:'Men',female:'Women'}`. Top-5 sources list `SOURCES: {name:string; note:string}[]` (from the doc "TOP 5 MOST AUTHENTIC" section) for the sources panel.

---

## 12. store/useStore.ts (persist v6)

```ts
interface Wardrobe {
  tops: ColorKey[]; bottoms: ColorKey[];
  shadeTops: Record<ColorKey,ShadeIndex[]>; shadeBottoms: Record<ColorKey,ShadeIndex[]>;
  worn: Record<string,string>; dismissed: Record<string,boolean>;
  saved: SavedLook[]; lastPickDay: string;
}
interface PersistedState {
  gender: Gender | null; mode: Mode; mst: number | null;
  wardrobes: Record<BucketKey, Wardrobe>;     // all 4 keys always present (empty default)
  pendingWardrobe: Wardrobe | null;           // migration holding pen until gender chosen
  theme:'dark'|'light'; style: StyleName;
  swipeHintSeen: boolean; coachSeen: boolean;  // coachSeen = double-tap coachmark
  notify: NotifySettings; setupComplete: boolean; drive: DriveState;
}
```
`SavedLook` adds `th/bh` shade hexes (keep) — and KEEP `style`. `current/currentName/deckPos/_hasHydrated` session-only (unchanged).

Helpers: `emptyWardrobe()`; `activeKey(s):BucketKey|null = s.gender? `${s.gender}-${s.mode}`:null`; `aw(s):Wardrobe` = active wardrobe or an empty default (so selectors never crash pre-gender). All wardrobe mutations write back into `wardrobes[activeKey]` immutably.

Actions (same names where they exist; now operate on the active bucket):
- `setGender(g)` — if `pendingWardrobe` set, move it to `wardrobes[`${g}-formal`]` and null it; set gender.
- `setMode(m)` — set mode; `regenerate()`. (UI handles the empty-casual prompt.)
- `setMst(n)` — set mst; if setupComplete `regenerate()`.
- `toggleColor/setColors/toggleShade` — on active bucket; new colour default owned shade = `[COLORS[key].baseIdx]` (NOT `[2]`).
- deck walk `regenerate/another/next/prev/goToIndex/markWorn/dismiss/restoreDismissed/loadCombo/setLastPickDay` — read `aw(s)` for tops/bottoms/worn/dismissed; pass `{gender,mode}` into `buildDeck`. `loadCombo` finds pos in the active deck. (Pane switch is done by the UI, see §13.7.)
- `setStyle`, `markSwipeHintSeen`, `markCoachSeen`, `setNotify`.
- `saveCurrent/deleteSaved/clearWorn` — active bucket. SavedLook stores th/bh from owned shade or curated shade hex.
- `setTheme/toggleTheme/completeSetup/resetWardrobe/setHasHydrated`.
- `exportData()` → JSON `{app:'colorcloset', v:6, gender, mode, mst, style, theme, notify, setupComplete, wardrobes}`.
- `importData(json)` — accept **v6** (restore wardrobes, validating each bucket's colour keys against KEYS, Maroon→Burgundy) AND **legacy v≤5** (flat `tops/bottoms/...`): fold into `pendingWardrobe` (or `wardrobes[`${gender}-formal`]` if gender already set), map old `depth`→mst. Return false on garbage. After import, `regenerate()`.
- Drive actions unchanged.

`deckFor(s)` = `buildDeck({tops:aw.tops, bottoms:aw.bottoms, skin:skinObj(s.mst), style:s.style, gender:s.gender, mode:s.mode}).filter(c=>!aw.dismissed[c.id])`.

`persist`: `version:6`. `migrate(persisted, version)`:
- keep the existing `<2` shade-array fix first.
- if `version < 6` (i.e. coming from v5 flat shape): produce v6 — all-empty `wardrobes`, `pendingWardrobe` = `{tops,bottoms,shadeTops→reset each owned to [baseIdx],shadeBottoms→same,worn,dismissed,saved,lastPickDay}` with Maroon folded to Burgundy and invalid keys dropped; `gender:null`, `mode:'formal'`, `mst: mstFromLegacyLabel(persisted.depth) (null→null)`, carry `style/theme/notify/setupComplete/drive/swipeHintSeen`, `coachSeen:false`. (Returning users will be routed through a gender micro-step, §13.1.)
- `partialize` persists the PersistedState fields above.

DriveAutoBackup: update watched slices to `[gender, mode, mst, wardrobes, style]` (wardrobes ref changes on any edit).

---

## 13. UI changes

### 13.1 Routing / onboarding (`index.tsx`, `onboarding.tsx`)
- `index.tsx` gate: `setupComplete && gender!=null` → `/main` (do NOT also require the active bucket stocked — completing setup always stocks `${gender}-formal`, and an empty Casual bucket must reach main's lazy CTA, not bounce through onboarding). If `setupComplete && gender==null` (migrated) → route `/onboarding?genderOnly=1`. Else → full onboarding.
- Onboarding steps: **Gender → Skin(MST) → Tops → Bottoms** (fresh). `addMode` (`mode==='add'`) skips Gender+Skin (tops→bottoms only, into the ACTIVE bucket). `genderOnly` shows only the Gender step; on Continue → `setGender`, then `router.replace('/main')`.
- Gender step: two large cards (Men / Women); selecting sets a local choice; Continue calls `setGender`. (Don't call setGender until continue, to keep pendingWardrobe assignment once.)
- Skin step uses the new MST picker (§13.3). Tops/Bottoms use `SwatchGrid` (now 17 colours, named shades).
- Casual lazy onboarding: handled in main (§13.6), not here.

### 13.2 Colour sets / SwatchGrid
`SwatchGrid` already maps `KEYS`; now 17 colours, 5 named shades. Optionally show the shade name under the strip chips (small) — nice-to-have, keep tappable area. Default owned shade = `COLORS[k].baseIdx`.

### 13.3 MST picker (replace `SkinGrid.tsx`)
New 10-swatch grid from `MST_SWATCHES` (2 rows × 5, or wrap). `value:number|null`, `onSelect:(mst:number)=>void`. Selected ring + check. Tier label under the row ("Light tones" etc. derived from `tierOf`). Update `SkinPanel`/onboarding to use `mst`/`setMst` and `skinNote(mst)`.

### 13.4 Sidebar (`SideMenu.tsx`)
- Add a **Formal/Casual segmented toggle** near the top (one active). Calls `setMode`. Reads `mode`.
- Show active gender somewhere subtle (e.g. under brand: "Men · Formal"). 
- Add **"Colour science sources"** item near the bottom opening the new `SourcesPanel`.
- Rotation/Saved counts now reflect the active bucket.

### 13.5 Sources panel (NEW `src/components/panels/SourcesPanel.tsx`)
List `SOURCES` (Top-5) with name + one-line note + a short framing sentence ("The colour logic here is grounded in these sources."). Register panel id `'sources'` in `uiStore` PanelId and render in `main.tsx`.

### 13.6 main.tsx
- Replace `style/depth` reads with `style` + `mst` + `gender` + `mode`; deck memo uses `buildDeck({...,gender,mode})` filtered by active dismissed.
- "Today's pick" uses active bucket `lastPickDay`.
- **Casual lazy prompt:** when `mode==='casual'` and active bucket has no tops/bottoms, show an empty-state CTA "Add your casual colours" → `router.push('/onboarding?mode=add')`. (Same empty UI as today but mode-aware copy.)
- **Coachmark (item 5):** remove the always-on "Swipe · double-tap to save" hint as the primary instruction. Add a dismissible coachmark overlay that appears AFTER the first card entrance animation completes (~ when SwipeDeck finishes its intro nudge) and only if `!coachSeen`; tap/auto-dismiss → `markCoachSeen`. Keep a subtle persistent hint optional. Implement coachmark as a small absolutely-positioned card near the deck ("Double-tap to save a look") with a fade/scale in, delayed ~`motion.base + 700ms` after mount; dismiss on tap anywhere or after ~4s.

### 13.7 Pane switch bug (item 7)
Move pane ownership so panels can switch it. Add to `uiStore`: `pane:'rec'|'shop'` + `setPane`. `main.tsx` uses `useUiStore` pane/setPane instead of local state. `CombinationsPanel` & `SavedPanel` open handlers: `loadCombo(...); setPane('rec'); closePanel();`. (Segmented and back-handler updated to use the uiStore pane.)

### 13.8 OutfitCard.tsx (copy)
- Compute curated meta: `const cur = findCurated(topK,botK,gender,mode)`. Display names: `cur? cur.topShade : shadeName(topK, owned)`, similarly bottom.
- Eyebrow: `catFor(...)` + (curated.region if specific). 
- REMOVE the "Flatters your X skin" pill. Optionally render `tierNote(cur, skin)` as a single small line when non-null. Keep the "Worn <date>" pill.
- "Why" box uses `comboWhy(...)` (named-shade bold). Leather finish unchanged.
- Garment labels show shade names (e.g. "Sky Blue") with base as sublabel, or base name with shade sublabel — keep "SHIRT"/"TROUSERS" sublabels; show the shade name as the main label and base as a faint sub if they differ.

---

## 14. Tests (`__tests__/`)
Replace obsolete tests; keep the engine pure-TS testable.
- `colors.test.ts` — 17 keys, no Maroon, Brown `#6B4423`; SHADE_VOCAB wiring (e.g. `COLORS.Navy.shadeNames` includes "French Navy"); `shadeHex/shadeName` defaults to `baseIdx`; `lumHex`.
- `skin.test.ts` — `tierOf(2)==='Light'`, `tierOf(5)==='Medium'`, `tierOf(9)==='Deep'`; `skinObj(null).tier==='Medium'`; flatter/avoid tops per tier; `mstFromLegacyLabel('rich')` in Deep range.
- `scoring.test.ts` — `harmony` rewards tonal (`harmony('Navy','Navy')>0.45`), neutral pairings, contrast; penalises warm/cool clash & dark-on-dark near-match; `isAvoided('Navy','Black')` etc true and `isAvoided('Navy','Charcoal')` false; curated bonus makes a curated pair outrank a random one; `catFor`.
- `combos.test.ts` (NEW) — `curatedFor('male','formal')` non-empty; `findCurated` base mapping; ownership filter; `SHADE_TO_BASE['Sky Blue']==='Light Blue'`, `baseOf('Black')==='Black'`; gender/mode counts EXACTLY: **Men/Formal=11, Women/Formal=10, Men/Casual=12, Women/Casual=12 (45 total)**.
- `deck.test.ts` — universe excludes avoided pairs; curated-ownable always present; threshold + fallback; buildDeck sorts by osc; stepRec unchanged.
- `gap.test.ts` — still threshold 0.62; never suggests avoided pairs; flatter bonus.
- `naming.test.ts` (NEW) — curated → mood as name & why contains shade names; generative → no skin sentence; `tierNote` null when flatters=["all"].
- `store.test.ts` (NEW) — migration v5→v6 folds flat wardrobe to pendingWardrobe & `setGender('male')` lands it in `male-formal`; Maroon→Burgundy; export/import v6 round-trips wardrobes; toggling colour writes only the active bucket; switching mode shows the other bucket.
- DELETE `heritage.test.ts`. DELETE the old `__tests__/parity/golden.test.ts` + `__snapshots__` (prototype parity is obsolete); add a fresh `__tests__/golden.test.ts` that snapshots the new universe/deck for a sample owned wardrobe per gender×mode (bless with `-u`).

Update `jest.config.js` only if paths change (they don't).

---

## 15. Verify (definition of done)
`$env:Path="$env:LOCALAPPDATA\nodejs;$env:Path"` then, in `ColorCloset CodeBase`:
1. `npx tsc --noEmit` → clean.
2. `npx jest` → green (bless new snapshots with `npx jest -u` once, intentionally).
3. `npx expo export --platform android` → bundles with no errors.

Do NOT run an EAS/APK build.
