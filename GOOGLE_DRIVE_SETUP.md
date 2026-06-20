# Google Drive backup — one-time setup

The app code is done. To switch it on you (the owner) need to create OAuth
credentials in Google Cloud Console and paste **one value** back into the app.
This is the only part I can't do for you — Google ties the credentials to your
account and to the app's signing key.

It takes ~10 minutes and is free.

---

## What you'll end up with

- A Google Cloud project with the **Drive API** enabled.
- An **OAuth consent screen** (in "Testing" mode, with you as a test user — so no
  Google verification/review is needed for personal use).
- Two OAuth client IDs:
  - **Android** — authorises sign-in from the installed app (uses the package name + signing SHA-1 below). You don't copy anything from it; Google just needs it to exist.
  - **Web** — its **client ID** string is what the app needs. You paste it into `app.json`.

The app uses the narrow **`drive.file`** scope: ColorCloset can only see the one
backup file it creates (`colorcloset-backup.json`) — never anything else in your Drive.

---

## The values you'll need

| Field | Value |
|---|---|
| Android package name | `com.colorcloset.app` |
| Signing certificate **SHA-1** | `E0:39:25:48:8D:B7:B5:96:60:BF:8D:5A:8A:3B:D5:3D:B0:01:03:2A` |
| (SHA-256, if asked) | `9D:D0:C5:AD:48:F2:7E:51:8F:C9:6A:CE:73:B8:D5:63:3C:4F:75:95:68:7E:93:58:35:97:41:9D:AA:32:CB:06` |

> The SHA-1 is the fingerprint of the keystore EAS uses to sign your APK. It was
> read from the latest build and stays the same for future EAS builds of this
> project. (To re-check it yourself any time: `eas credentials` → Android →
> the keystore's SHA-1, or `apksigner verify --print-certs your.apk`.)

---

> **Shortcut — reuse your existing project.** You already have a Google Cloud project
> **`gmailapi-491903`** (from `C:\Reconcilliation\GmailPDFDownloader` — the Gmail PDF
> downloader, project number `240978491498`). You can reuse it and **skip step 1**: its
> OAuth consent screen is already set up with your account as a test user. Just enable the
> Drive API in it (step 2) and add the two new OAuth clients (steps 4–5). The existing
> *Desktop/Gmail* client there is **not** reusable for the app — Android sign-in needs a
> *Web* client + an *Android* client, which you'll create fresh in this same project.

## Steps

### 1. Create / pick a project
1. Go to <https://console.cloud.google.com/> and create a project (e.g. "ColorCloset"),
   **or reuse `gmailapi-491903`** per the shortcut above.

### 2. Enable the Drive API
1. **APIs & Services → Library** → search **Google Drive API** → **Enable**.

### 3. Configure the OAuth consent screen
1. **APIs & Services → OAuth consent screen**.
2. User type: **External** → Create.
3. App name: `ColorCloset`; user support email + developer email: your email. Save.
4. **Scopes** → Add → search for and add `.../auth/drive.file` (Drive API,
   "See, edit, create, and delete only the specific Drive files you use with this app"). Save.
5. **Test users** → Add your own Google account. Save.
6. Leave it in **Testing** (don't "Publish" — testing mode avoids any review for personal use).

### 4. Create the **Android** OAuth client
1. **APIs & Services → Credentials → Create credentials → OAuth client ID**.
2. Application type: **Android**.
3. Package name: `com.colorcloset.app`.
4. SHA-1 certificate fingerprint: paste the **SHA-1** from the table above.
5. Create. (Nothing to copy — it just has to exist.)

### 5. Create the **Web** OAuth client
1. **Create credentials → OAuth client ID** again.
2. Application type: **Web application**. Name it e.g. "ColorCloset Web".
3. No redirect URIs needed. Create.
4. **Copy the Client ID** — it looks like `1234567890-abcdef.apps.googleusercontent.com`.

### 6. Paste the Web client ID into the app
In `app.json`, replace the placeholder:

```jsonc
"extra": {
  "googleWebClientId": "PASTE-YOUR-WEB-CLIENT-ID.apps.googleusercontent.com",
  ...
}
```

(Or just send me the Web client ID and I'll set it + rebuild.)

### 7. Rebuild the APK
Google Sign-In is a native module, so it only works in a real build (not Expo Go).
The next EAS build picks everything up:

```
eas build -p android --profile preview
```

Install that APK, open **☰ → Backup & restore → Connect Google Drive**, sign in,
and you're set. "Back up now", "Restore from Drive", and the "Auto-back up" toggle
will all work.

---

## Notes & gotchas

- **"Google hasn't verified this app"** on the consent screen is expected in testing
  mode. Tap **Advanced → Go to ColorCloset (unsafe)** — it's your own app/account.
- **`DEVELOPER_ERROR` on sign-in** almost always means the SHA-1 / package name in
  the Android OAuth client doesn't match the installed APK, or the Web client ID is
  wrong/missing. Re-check step 4 and the `googleWebClientId` value.
- If you ever change EAS signing keys, add the new SHA-1 to the Android client.
- Restore works on a fresh install / new phone: sign in with the same Google account
  and tap "Restore from Drive" — `drive.file` access to the app's own file persists
  across reinstalls.
