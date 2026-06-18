# ColorCloset

> Get dressed in seconds, from the clothes you already own.

A calm, single-purpose mobile app (React Native + Expo, TypeScript) that suggests
outfit **colour combinations** from the colours you own — ranked by colour harmony,
what flatters your skin tone, occasion, and a style lean. Ported from the validated
web prototype in `../Product Docs/`.

## Status — Pass 1: Foundation + Core Loop

**Built & verified**

- **Colour-intelligence engine** (`src/engine/`) — pure, deterministic, dependency-free
  TypeScript port of the prototype: 16-colour model + shades, harmony, skin-tone
  flatter sets, occasion/style scoring, the combination universe (threshold 0.55),
  the "Another" deck walk, and the gap engine (threshold 0.62). All weights are the
  prototype's exact values. **45 unit + parity tests pass** (`npm test`).
- **Onboarding** (manual colour palette) — skin tone (depth + undertone) → tops →
  bottoms, with per-colour shade selection. *(Photo extraction is deferred to v1.1;
  the manual path is always available per the PRD.)*
- **Building screen** — animated count-up to the true number of combinations.
- **Style Me core loop** — outfit card (animated garment silhouettes, name, "why this
  works", flatter + last-worn pills), Occasion & Style chip rows, **Another** /
  **Save** / **Mark it worn**, and a "Worn X of Y" progress indicator.
- **Side menu + panels** — skin-tone picker, combinations list, saved looks,
  how-it-works, dark/light theme toggle (dark default), set-up-again, reset wardrobe.
- **Local persistence** (AsyncStorage via a swappable storage adapter — MMKV-ready).

**Deferred to follow-up passes** — the "What to buy" gap UI (engine is built/tested),
clothing-type tagging + the "For" filter, on-device photo extraction (v1.1),
worn-photo history, outerwear slot, analytics.

## Running it

Requires **Node 18+**. From this folder:

```bash
npm install        # if node_modules is missing
npm test           # run the engine test suite (45 tests)
npx expo start     # start Metro; open in Expo Go (iOS/Android) or a simulator
```

The app runs in **Expo Go** for this pass (no native build needed). Press `i` / `a`
in the Expo CLI for a simulator, or scan the QR code with Expo Go on a device.

> A headless full-app bundle is validated with `npx expo export --platform ios`.

## Layout

```
src/
  engine/      pure colour-intelligence engine (the IP) — colors, skin, scoring, deck, gap, naming
  store/       Zustand store (+ persist) and the KV storage adapter
  theme/       design tokens (PRD §12.1), fonts, reduce-motion hook
  components/  Button, ChipRow, SwatchGrid, SkinGrid, OutfitCard, GarmentSilhouette, panels, …
  app/         expo-router routes: index (gate) -> onboarding -> main
__tests__/     engine unit tests + prototype-parity golden snapshots
```

Source of truth for behaviour, weights, and visual design: `../Product Docs/colorcloset-v3 Prototype.html`.
