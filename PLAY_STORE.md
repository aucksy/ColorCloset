# Publishing ColorCloset to Google Play

This is the end-to-end checklist to get ColorCloset onto the Play Store. The repo side is
already set up — the rest is done in the Google Play Console and Google Cloud Console.

Package name (permanent once published): **`com.colorcloset.app`**

---

## ✅ Already done in this repo

- **CI builds a signed `.aab`** (Android App Bundle — what Play requires) *and* a `.apk` for
  sideloading. Push a `v*` tag → both are attached to the GitHub Release.
  (`.github/workflows/release-apk.yml`, `bundleRelease`.)
- **Unused `SYSTEM_ALERT_WINDOW` permission removed** from the release manifest (avoids Play
  review friction; the app never draws over other apps).
- **Target API 35** (Expo SDK 56 default) — meets Play's current target-API requirement.
- **Store assets generated** (`node scripts/make-store-assets.mjs`):
  - `store/play-icon-512.png` — 512×512 high-res icon.
  - `store/feature-graphic-1024x500.png` — feature graphic.
- **Privacy policy** ready to host: `docs/privacy.html` (+ `docs/index.html` landing).

---

## 1. One-time prerequisites

1. **Google Play Developer account** — register at <https://play.google.com/console> ($25 one-time).
2. **Host the privacy policy** — in the GitHub repo: *Settings → Pages → Build from a branch →
   `main` / `/docs`*. After ~1 min the policy is live at:
   **`https://aucksy.github.io/ColorCloset/privacy.html`** (this is the URL Play needs).

## 2. Get the app bundle to upload

1. Tag a release (e.g. `git tag v1.0.6 && git push origin v1.0.6`).
2. When CI finishes, download **`colorcloset-v1.0.6.aab`** from the GitHub Release. That `.aab`
   is what you upload to Play. (The `.apk` is only for direct sideload testing.)

> `versionCode` comes from the CI run number, so every new tag = a higher `versionCode`
> automatically (Play rejects re-using a `versionCode`).

## 3. Create the app in Play Console

*All apps → Create app.* Name **ColorCloset**, app (not game), Free, accept declarations.

## 4. Play App Signing + ⚠️ the Google Sign-In SHA-1 step (CRITICAL — don't skip)

New apps use **Play App Signing** by default: you upload an `.aab` signed with your *upload key*
(our release keystore), and **Google re-signs the installed app with a different *app signing
key***. This means the app installed from Play has a **different SHA-1** than your keystore's.

Google Drive backup uses Google Sign-In, which is locked to a SHA-1 in the Google Cloud OAuth
client. **If you don't add Play's app-signing SHA-1, Drive sign-in will silently fail for everyone
who installs from Play** (the same "choose account, then nothing happens" bug we hit before).

Do this after the first upload:

1. Play Console → your app → **Test and release → Setup → App signing**. Copy the
   **App signing key certificate → SHA-1** (and SHA-256).
2. Google Cloud Console (project that owns the OAuth client) → **APIs & Services → Credentials**
   → the **Android OAuth client** for `com.colorcloset.app` → **add** that SHA-1.
   - Keep the existing upload-key SHA-1 too (so locally-built/sideloaded APKs keep working).
   - You can add multiple SHA-1s to one Android client.
3. Also add the SHA-256 if prompted; changes can take a little while to propagate.

## 5. OAuth consent screen (so any user can sign in to Drive)

Google Cloud Console → **APIs & Services → OAuth consent screen**:

- User type **External**, fill app name/logo, support email, and the **privacy policy URL** above.
- Scopes used: `.../auth/userinfo.email`, `.../auth/userinfo.profile`, and
  **`.../auth/drive.file`**. `drive.file` is a *sensitive* scope but **not** a *restricted* one,
  so it does **not** require the annual third-party security assessment.
- **Publish** the consent screen (move from *Testing* to *In production*). While it's in Testing,
  only added test users can sign in. Google may ask you to verify the app (brand/domain) — that's
  normal for sensitive scopes.

## 6. Store listing (Main store listing)

- **App name:** `ColorCloset`
- **Short description (≤80):**
  `Know what to wear — office outfits from the colours already in your wardrobe.`
- **Full description (≤4000):**

  ```
  ColorCloset tells you exactly what to wear — built only from the colours already hanging in
  your wardrobe. No shopping, no guesswork.

  Tell it the colours you own, and it deals you a swipeable deck of polished outfit pairings for
  the office (and the weekend). Swipe through looks, save your favourites, and mark what you've
  worn so you never repeat too soon.

  • Built from YOUR colours — every suggestion uses clothes you actually own.
  • A deck of looks — swipe through office-ready pairings, tuned by style: Minimal, Classic,
    Bold and Statement.
  • Four wardrobes in one — separate Formal and Casual closets for him and her.
  • Made for you — tune suggestions to your skin tone on the Monk Skin Tone scale; we lean into
    the colours that flatter you most, never ruling any out.
  • Grounded in real colour science — Pantone, the Monk Skin Tone research and trusted menswear
    sources, so every pairing has a reason.
  • A gentle daily nudge — an optional reminder at a time you choose (vibrate-only).
  • Yours and private — everything runs on your device. Optional one-tap backup to your own
    Google Drive. No accounts, no ads, no tracking.
  ```

- **App icon:** upload `store/play-icon-512.png`.
- **Feature graphic:** upload `store/feature-graphic-1024x500.png`.
- **Phone screenshots (required, 2–8):** capture from the app on a phone (Welcome, the swipe
  deck, the four-wardrobes/skin-tone screens, Colour science). PNG/JPEG, 16:9 or 9:16,
  each side 320–3840 px. *(These need the running app — grab them from your device.)*
- **App category:** Lifestyle. **Tags:** fashion / style.
- **Contact email:** `aakashpahuja1990@gmail.com`. **Privacy policy:** the URL from step 1.

## 7. App content (left nav → "App content")

- **Privacy policy:** same URL.
- **Ads:** No ads.
- **App access:** *All functionality is available without special access.* (Drive backup is
  optional; the app is fully usable without signing in — so reviewers need no test login.)
- **Content rating:** complete the questionnaire (Utility/Lifestyle, no objectionable content →
  expect Everyone / PEGI 3).
- **Target audience:** select adult ages (e.g. 18+). The app is **not** designed for children →
  this keeps it out of the Families program.
- **Data safety:** see below.
- **Government apps / Financial features / Health:** No.

### Data safety answers (review & confirm honestly)

ColorCloset has **no server, no analytics, no ads, no third-party sharing**. Suggested answers:

- **Does your app collect or share required user data types?**
  - If you only ever ship the app *without* anyone connecting Drive, you could answer minimally —
    but since the Drive feature exists, disclose it:
  - **Personal info → Email address** — *Collected* (not shared). Purposes: **App functionality**
    and **Account management**. Mark **collection optional** (only when the user connects Drive).
    *Encrypted in transit:* Yes. *Can users request deletion:* Yes (sign out / reset in-app).
  - **The wardrobe backup** is your own data written to **your own Google Drive** via the
    `drive.file` scope; the developer cannot access it. Disclose it as user-controlled cloud
    storage (App activity) and note encryption in transit.
- **Is all data encrypted in transit?** Yes (Google APIs use HTTPS).
- **Account creation / deletion:** the app does **not** create an account (it uses your existing
  Google account only for Drive), so the account-deletion URL requirement doesn't apply; the
  privacy policy explains how to delete on-device data and the Drive backup.

## 8. Release

1. Recommended path: **Testing → Internal testing → Create release** first. Upload the `.aab`,
   add yourself as a tester, install via the opt-in link, sanity-check (especially Drive sign-in
   *after* step 4 is done).
2. When happy: **Production → Create release** → upload the `.aab` → add release notes → roll out.
3. First production submission goes through Google review (can take a few days).

## 9. Shipping updates later

Same loop you already use: push a new `v*` tag → download the new `.aab` from the Release →
upload to a Play release. `versionCode` auto-increments, `versionName` is the tag.

---

### Quick reference

| Item | Value |
| --- | --- |
| Package | `com.colorcloset.app` |
| Upload artifact | `colorcloset-<tag>.aab` (GitHub Release) |
| Privacy policy | `https://aucksy.github.io/ColorCloset/privacy.html` |
| Play icon | `store/play-icon-512.png` |
| Feature graphic | `store/feature-graphic-1024x500.png` |
| Sensitive scope | `drive.file` (no security assessment required) |
| Must-not-skip | Add **Play app-signing SHA-1** to the Google OAuth Android client |
