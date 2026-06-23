# Publishing ColorCloset to Google Play

End-to-end checklist, verified against the **June 2026** Play Console. The repo side is done;
the rest happens in the Google Play Console and Google Cloud Console.

Package name (permanent once published): **`com.colorcloset.app`**

> **Two tips that make the Console far less confusing:**
> 1. The left nav is reorganised often. Use the **search bar at the very top** of Play Console
>    to jump to any page by name (e.g. type "App signing", "Data safety", "Production").
> 2. Your app's **Dashboard** shows a **"Set up your app"** task list and a **publishing
>    overview** — that checklist is the source of truth for what's still required. Work it top
>    to bottom; this doc explains each item.

---

## ⚠️ Read this first — the part that surprises everyone

If your Play **developer account is personal and was created after 13 Nov 2023**, Google
**locks the Production track** until you:

1. Run a **Closed test** with **at least 12 testers**, who stay **opted in for 14 consecutive
   days** (and actually open/use the app — Google tracks engagement), then
2. Go to **Dashboard → Apply for production** and answer 3 short sections about your test.

So the real path for a new personal account is **Internal test → Closed test (12 testers ×
14 days) → Apply for production → Production**. You can't skip to Production on day one.
*(This does NOT apply to organisation accounts, or personal accounts made before that date —
those can go straight to Production.)*

---

## ✅ Already done in this repo

- **CI builds a signed `.aab`** (Android App Bundle — Play's required upload format) and a
  `.apk` (sideload only). Push a `v*` tag → both attach to the GitHub Release.
- **Target API 35** (meets Play's requirement). Unused `SYSTEM_ALERT_WINDOW` removed.
- **Listing assets** (`node scripts/make-store-assets.mjs`): `store/play-icon-512.png`,
  `store/feature-graphic-1024x500.png`.
- **Privacy policy** ready to host: `docs/privacy.html`.

---

## Step 1 — Account + privacy policy

1. **Create the developer account** at <https://play.google.com/console> ($25 once). New
   accounts must **verify identity** (legal name, address, phone) before you can publish — do
   this early as it can take a day. Set your public **developer name**.
2. **Host the privacy policy:** repo → **Settings → Pages → Build from a branch → `main` /
   `/docs` → Save**. After ~1 min it's live at
   **`https://aucksy.github.io/ColorCloset/privacy.html`** — that's the URL Play needs.

## Step 2 — Get the app bundle

Tag a release (`git tag v1.0.7 && git push origin v1.0.7`), wait for CI, then download
**`colorcloset-v1.0.7.aab`** from the GitHub Release. That `.aab` is what you upload to Play.
(`versionCode` auto-increments per tag, so Play never sees a duplicate.)

## Step 3 — Create the app

Play Console → **Create app**. Default language English, app name **ColorCloset**, type **App**,
**Free**, accept the declarations → **Create app**. You land on the app **Dashboard**.

## Step 4 — Work the Dashboard "Set up your app" tasks

These are the required items (search the name if you can't find it). Order doesn't matter much;
finish them all.

**a) App content / policy** *(search "App content")* — answer each card:
- **Privacy policy:** the URL from Step 1.
- **App access:** "All functionality is available without special access." (Drive backup is
  optional; the app fully works without signing in, so reviewers need no test login.)
- **Ads:** No ads.
- **Content ratings:** fill the questionnaire (Utility/Lifestyle, no objectionable content →
  expect Everyone / PEGI 3).
- **Target audience and content:** choose adult ages (e.g. 18+). Not designed for children →
  keeps you out of the Families programme.
- **Data safety:** see the table at the bottom of this doc.
- **Government apps / Financial features / Health:** No.

**b) Main store listing** *(search "Main store listing")*:
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
- **Phone screenshots (required, 2–8):** capture from the app on a phone (Welcome, swipe deck,
  the four-wardrobes / skin-tone screens, Colour science). 16:9 or 9:16, each side 320–3840 px.
  *(Needs the running app — grab these from your device. Tell me if you want help framing them.)*

**c) Store settings** *(search "Store settings")*: category **Lifestyle**, tags fashion/style,
support email **`simpleapps108@gmail.com`**.

## Step 5 — App signing + ⚠️ the Google Sign-In SHA-1 step (don't skip)

New apps use **Play App Signing**: you upload an `.aab` signed with your *upload key* (our
release keystore) and **Google re-signs the installed app with a different key** — so the app
from Play has a **different SHA-1** than your keystore. Google Drive backup uses Google Sign-In,
which is locked to a SHA-1, so **if you don't add Play's SHA-1, Drive sign-in silently fails for
everyone who installs from Play** (the "pick account → nothing happens" bug).

After your first upload (Step 6):
1. Play Console → search **"App signing"** (under *Test and release → App integrity*). Copy the
   **App signing key certificate → SHA-1** (and SHA-256).
2. Google Cloud Console → **APIs & Services → Credentials** → the **Android OAuth client** for
   `com.colorcloset.app` → **add** that SHA-1. Keep the upload-key SHA-1 too (so sideloaded APKs
   keep working). You can list several SHA-1s on one Android client.

## Step 6 — OAuth consent screen (so any user can sign in to Drive)

Google Cloud Console → **APIs & Services → OAuth consent screen**: User type **External**, fill
app name/logo/support email and the **privacy policy URL**. Scopes:
`userinfo.email`, `userinfo.profile`, **`drive.file`**. `drive.file` is *sensitive* but **not
restricted**, so no annual security assessment. **Publish** the consent screen (Testing →
In production) or only added test users can sign in.

## Step 7 — Testing → Production

1. **Internal testing** *(search "Internal testing")* → **Create new release** → upload the
   `.aab` → add yourself (and a few people) as testers → install via the opt-in link and sanity
   check — **especially Drive sign-in after Step 5**. Internal testing is instant, no minimums.
2. **Closed testing** *(search "Closed testing")* → create a release on the **Closed** track →
   add **≥12 testers** (an email list or a Google Group). Each tester must **open the opt-in
   link, install, and keep using the app for 14 consecutive days.** *(Required only for new
   personal accounts — see the top of this doc.)*
3. After 14 days of ≥12 engaged testers: **Dashboard → Apply for production**, answer the 3
   sections (recruiting/engagement/feedback; audience/value/installs; changes made/readiness).
   Google reviews in ~7 days.
4. **Production** *(search "Production")* → **Create new release** → upload the `.aab` → add
   release notes → **Review release** → **Start rollout to Production**. First review: ~1–7 days.

## Step 8 — Shipping updates later

Push a new `v*` tag → download the new `.aab` from the Release → upload it to a Play release.
`versionCode` auto-increments; `versionName` = the tag.

---

### Data safety answers (review & confirm honestly)

ColorCloset has **no server, no analytics, no ads, no third-party sharing**. Suggested answers:

- **Does your app collect or share user data?** Disclose the optional Drive feature:
  - **Personal info → Email address** — *Collected*, **not shared**. Purposes: **App
    functionality** + **Account management**. Mark **collection optional** (only if the user
    connects Drive). *Encrypted in transit:* Yes. *Users can request deletion:* Yes.
  - The **wardrobe backup** is written to **your own Google Drive** (`drive.file`); the developer
    can't access it. Disclose as user-controlled cloud storage; encrypted in transit.
- **All data encrypted in transit?** Yes (Google APIs use HTTPS).
- **Account creation/deletion:** the app does **not** create an account (it only uses your
  existing Google account for Drive), so the account-deletion-URL requirement doesn't apply; the
  privacy policy explains deleting on-device data and the Drive backup.

### Quick reference

| Item | Value |
| --- | --- |
| Package | `com.colorcloset.app` |
| Upload artifact | `colorcloset-<tag>.aab` (GitHub Release) |
| Privacy policy | `https://aucksy.github.io/ColorCloset/privacy.html` |
| Support / contact email | `simpleapps108@gmail.com` |
| Play icon | `store/play-icon-512.png` |
| Feature graphic | `store/feature-graphic-1024x500.png` |
| New personal account gate | Closed test, **12 testers × 14 days**, then **Apply for production** |
| Sensitive scope | `drive.file` (no security assessment) |
| Must-not-skip | Add **Play app-signing SHA-1** to the Google OAuth Android client |
