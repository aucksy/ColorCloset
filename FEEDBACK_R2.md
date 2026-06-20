# ColorCloset — Round-2 device-feedback changes (CONTRACT)

User-confirmed: (Shades) **simple light→dark range**; (Styles) **filter + auto-advance**.
Implement all 17 items below. Engine/store done by the lead; UI by agents (read this + the file).
Keep the engine pure; Expo SDK 56; Write tool (no BOM); preserve visual design. Node off-PATH:
`$env:Path="$env:LOCALAPPDATA\nodejs;$env:Path"`.

## A. Shade model → simple light→dark ramp  (#1,#3,#9,#12,#13)
- `colors.ts`: `COLORS[k].shades` = algorithmic ramp from the base hex via `mix`:
  `[mix(base,0.34), mix(base,0.17), base, mix(base,-0.18), mix(base,-0.34)]` (5 for EVERY base; Beige no
  longer special). `baseIdx = 2`. Export `SHADE_TIERS = ['Lightest','Light','Mid','Deep','Deepest']`.
  `shadeName(k,idx)` = idx===2 ? `k` : `${SHADE_TIERS[idx]} ${k}` (e.g. "Deep Navy", "Light Navy", "Navy").
  `lum(k)=lumHex(shadeHex(k,null))` (= base hex). SHADE_VOCAB stays only for combo base-mapping
  (`SHADE_TO_BASE`) — it no longer drives user-facing shades. `shadeHexByName` may stay (unused by cards).
- **Cards render the OWNED shade**, never the curated dataset shade: top hex/name =
  `shadeHex(topK, w.shadeTops[topK]?.[0])` / `shadeName(topK, w.shadeTops[topK]?.[0])` (so "Navy" shows the
  user's navy, not #000080; "Ink Black" no longer collapses to base "Black"). Curated meta still drives
  mood/why/region/tierNote only.
- **Shade picker UX (#1):** in `SwatchGrid`, when a colour is selected show a **"Shades ⌄"** affordance
  (with the count picked) instead of the inline strip; tapping opens a **floating popover/modal**
  (`ShadePicker`) listing the 5 ramp shades as multi-select rows (swatch + tier name "Lightest…Deepest" +
  check). Multi-select, min 1. Reuse `toggleShade`. Close on backdrop tap.

## B. Style = filter + auto-advance  (#5,#14,#15,#16)
- `scoring.ts`: add `styleOf(t,b,curated?):StyleName` — curated→`curated.styleTag`; else both BOLD→
  'Statement', one BOLD→'Bold', both NEUTRAL→'Minimal', else 'Classic'. Combo carries `style:StyleName`
  (set in `comboUniverse`). `catFor` kept but cards use `styleOf`.
- `deck.ts`: `buildDeck(ctx)` **filters** to `style === ctx.style` (hard filter, not just re-rank), then
  diversifies (see C). Add `styleCounts(tops,bottoms,skin,gender,mode):Record<StyleName,number>` (deck size
  per style, for the UI's non-empty-style list). Universe (`comboUniverse`) stays style-independent.
- `main.tsx`: Style chips filter the deck in realtime. **Auto-advance:** when the user swipes `next` from
  the LAST card of the current style, instead of wrapping, advance to the next non-empty style (cyclic via
  `STYLES` order using `styleCounts`) and show a small toast e.g. "That's all your Classic looks — showing
  Bold". If no other style has combos, wrap as before. Card eyebrow shows the combo's style (one of 4) —
  never "Neutral/Everyday".
- `gap.ts`: `gapSuggestions(tops,bottoms,skin,gender,mode,style?)` — when `style` set, a candidate's
  `pairs` only counts pairings whose `styleOf===style`. `WhatToBuyPane` shows the SAME 4 style chips
  (bound to the store `style`) and filters suggestions by it.

## C. Deck diversity / randomizer  (#8,#13)
- `deck.ts`: after sorting by `osc`, `diversify(deck)` greedily reorders so consecutive cards don't share
  the same BOTTOM base (and, secondarily, the same TOP base) where possible — DETERMINISTIC (no Math.random;
  pick the highest-osc candidate whose bottom≠prev.bottom, else top≠prev.top, else next-best). Keeps the
  best card first.

## D. Other items
- **#2 Swipe hint:** `SwipeDeck` — the first-card left/right nudge must reliably show. Set
  `swipeHintSeen` only after the user's FIRST real swipe (in pan `onEnd`), not on a timer, so the nudge
  keeps playing until they swipe once. Keep it gentle.
- **#6 Onboarding mode toggle:** in onboarding's Tops/Bottoms steps add a Formal/Casual toggle (reads/sets
  store `mode`) so the user can stock either bucket during setup. SwatchGrid already reads the active bucket.
- **#7 Drive folder:** `drive.ts` — keep one backup file inside a dedicated **"ColorCloset"** Drive folder
  (find-or-create the folder via `mimeType='application/vnd.google-apps.folder'`, then create/patch the
  backup file with `parents:[folderId]`; search within it). `drive.file` scope already allows this.
- **#10 Buy patches:** `BuyCard` shows ALL pairing patches (remove the `slice(0,6)`/`+extra`).
- **#11 Restore on reset/reinstall + notify backup:** `notify` is ALREADY in export/import — keep it.
  Add a "Restore from a backup" entry point for returning/reset users: a subtle link on onboarding step 0
  (gender) AND in the reset-wardrobe confirmation, opening the Backup panel (Drive/text restore).
- **#17 White-in-light-mode:** `GarmentSilhouette` — the outline must contrast in BOTH themes. Compute a
  luminance-aware outline: if the garment fill is light (lumHex>~0.6) use a dark stroke (e.g.
  rgba(0,0,0,0.35)), else a light stroke (rgba(255,255,255,0.18)). So a white shirt is always visible on a
  white card. Pass theme if needed.
- **#4 (NOT code):** Google consent shows "GmailPDF Downloader" because `app.json` googleWebClientId belongs
  to that GCP project. Owner must rename the OAuth consent-screen app name (or make a dedicated ColorCloset
  client). Documented for the user; no code change.

## Verify
`npx tsc --noEmit` clean; `npx jest -u` green (golden snapshots re-bless after the shade/style/diversity
change); `npx expo export --platform android` bundles clean. No APK build until the user says.
