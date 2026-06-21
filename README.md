<div align="center">

# ColorCloset

**What to wear to the office — built from the colours you already own.**

[![Build & Release APK](https://github.com/aucksy/ColorCloset/actions/workflows/release-apk.yml/badge.svg)](https://github.com/aucksy/ColorCloset/actions/workflows/release-apk.yml)
[![Latest release](https://img.shields.io/github/v/release/aucksy/ColorCloset?label=latest%20apk&sort=semver)](https://github.com/aucksy/ColorCloset/releases/latest)
[![Expo SDK 56](https://img.shields.io/badge/Expo-SDK%2056-000?logo=expo)](https://docs.expo.dev/versions/v56.0.0/)
[![Platform](https://img.shields.io/badge/platform-Android-3DDC84?logo=android&logoColor=white)](#)

A calm, editorial Android app that turns the colours in your wardrobe into a swipeable
deck of office (and casual) outfit pairings — tuned to your skin tone and grounded in real
colour science, not guesswork.

</div>

---

## ✨ Features

- **Style me** — a Tinder‑style deck of colour pairings built *only* from the colours you own.
  Swipe to browse, double‑tap to save, mark looks worn, hide the ones that aren't for you.
- **Four wardrobes** — Men & Women × Formal & Casual, each with its own colours, history and
  recommendations. Switch Formal/Casual right from the top bar.
- **Skin‑tone aware** — pick your shade on the 10‑point **Monk Skin Tone** scale; the engine
  leans into the colours that flatter you most near the face, and never rules any out.
- **Colours to buy** — the gap engine tells you the one colour that unlocks the most new looks
  (mode‑aware — no blue "formal trousers").
- **Named shades & honest copy** — every card explains *why* a pairing works, with a real
  mood/region note instead of a repetitive line.
- **Colour science** — recommendations are grounded in a curated, cross‑referenced dataset
  (Pantone, the Monk Skin Tone research, Who What Wear, Gentleman's Gazette, The Concept Wardrobe).
- **Backup & restore** — plain‑text and **Google Drive** backup of your whole multi‑wardrobe setup.
- **Daily reminder**, dark/light themes, and fluid (reduce‑motion‑aware) animations throughout.

## 📦 Download

Grab the latest signed APK from the [**Releases**](https://github.com/aucksy/ColorCloset/releases/latest)
page (also visible under *Releases* in the GitHub mobile app). Sideload it on any Android phone.

> Builds are **arm64‑v8a**, R8‑minified (~33 MB). All GitHub builds share one signing key, so
> they update over each other cleanly.

## 🧠 The engine

The recommendation engine in [`src/engine/`](src/engine/) is **pure, deterministic and
dependency‑free** (no React‑Native imports) and fully unit‑tested. It combines:

- a **curated spine** — 45 hand‑checked combinations across the four gender×mode buckets, used
  as high‑confidence recommendations with named shades and "why it works" copy; and
- a **generative scorer** built on the research doc's shade‑pairing principles (light↔deep
  contrast, tonal/monochrome, neutrals as free agents, warm/cool harmony, skin‑tier→top), which
  generalises to any colours you own — with the "combinations to avoid" list suppressed.

The source of truth is [`Product Docs/Color Combination Research.md`](Product%20Docs/).

## 🛠 Tech stack

React Native **0.85** · Expo **SDK 56** (expo‑router) · TypeScript (strict) · Zustand + persist
(AsyncStorage) · Reanimated 4 · react‑native‑svg · Jest. Native release builds via Gradle on
GitHub Actions.

## 📁 Project structure

```
src/
  app/         expo-router screens (welcome, onboarding, main) + layout
  engine/      pure colour engine: colours, shades, skin, curated dataset, scoring, deck, gap
  store/       Zustand store (gender×mode wardrobes, persist v6) + storage adapter
  components/  UI + panels (swipe deck, outfit card, shade picker, side menu, …)
  lib/         drive backup, notifications, haptics, dates
  theme/       design tokens, fonts, motion
__tests__/     engine + store + golden snapshots (94 tests)
android/       prebuilt native project (built in CI)
```

## 🚀 Build & release (CI)

Releases are **tag‑driven** — there is no local Android build. Pushing a `vX.Y.Z` tag runs
[`.github/workflows/release-apk.yml`](.github/workflows/release-apk.yml), which builds a signed
release APK on GitHub's runners and publishes it as a GitHub Release.

```bash
# cut a release
git tag v1.0.1 && git push origin v1.0.1
```

Required repository **secrets** (Settings → Secrets and variables → Actions):

| Secret | What it is |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | base64 of the release keystore |
| `ANDROID_KEYSTORE_PASSWORD` | keystore (store) password |
| `ANDROID_KEY_ALIAS` | signing key alias |
| `ANDROID_KEY_PASSWORD` | signing key password |

> ⚠️ Keep the keystore safe — losing it means you can't ship updates to the installed app.

## 💻 Local development

```bash
npm ci
npx expo start      # run in Expo Go / a dev client
npx tsc --noEmit    # typecheck
npx jest            # unit tests
```

Regenerate the native `android/` project after changing `app.json`/plugins:
`npx expo prebuild --platform android --no-install` (then re‑apply the release signing block in
`android/app/build.gradle`).

## 📄 License

Proprietary — © 2026 aucksy. All rights reserved. See [LICENSE](LICENSE).
