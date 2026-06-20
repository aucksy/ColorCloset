/**
 * Google Drive backup/restore.
 *
 * Sign-in is handled by @react-native-google-signin/google-signin (native, so it
 * needs a dev/preview build — not Expo Go). We request the narrow `drive.file`
 * scope (the app can only see files it created), keep ONE canonical backup file
 * (`colorcloset-backup.json`), and talk to the Drive v3 REST API directly with the
 * access token. `drive.file` access is tied to the OAuth client + user, so the
 * backup is still found after a reinstall or on a new phone.
 *
 * Requires a Google Web OAuth client id in app.json -> extra.googleWebClientId,
 * plus an Android OAuth client registered with the app's package + signing SHA-1.
 * See GOOGLE_DRIVE_SETUP.md.
 */
import Constants from 'expo-constants';
import {
  GoogleSignin,
  isErrorWithCode,
  statusCodes,
} from '@react-native-google-signin/google-signin';

const FILE_NAME = 'colorcloset-backup.json';
const SCOPE = 'https://www.googleapis.com/auth/drive.file';
const DRIVE = 'https://www.googleapis.com/drive/v3';
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3';

/** The Web OAuth client id, read from app config (placeholder until the owner sets it). */
const webClientId: string =
  (Constants.expoConfig?.extra as { googleWebClientId?: string } | undefined)?.googleWebClientId ?? '';

let configured = false;

/** True once a real Web client id has been provided (not the placeholder). */
export function isDriveConfigured(): boolean {
  return !!webClientId && !webClientId.startsWith('REPLACE_WITH');
}

/** Configure Google Sign-In once. No-op (and safe) when the client id isn't set yet. */
export function configureDrive(): void {
  if (configured || !isDriveConfigured()) return;
  try {
    GoogleSignin.configure({ webClientId, scopes: [SCOPE], offlineAccess: false });
    configured = true;
  } catch {
    // Swallow — surfaced later when the user actually taps a Drive action.
  }
}

/** Pull the email off whatever shape this google-signin version returns. */
function emailOf(res: any): string | null {
  return res?.data?.user?.email ?? res?.user?.email ?? null;
}

export class DriveError extends Error {}

function ensureReady() {
  if (!isDriveConfigured()) throw new DriveError('Google Drive isn’t set up in this build.');
  configureDrive();
}

/** Interactive sign-in. Returns the account email, or null if the user cancelled. */
export async function signInToDrive(): Promise<string | null> {
  ensureReady();
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const res = await GoogleSignin.signIn();
    if ((res as any)?.type === 'cancelled') return null;
    return emailOf(res);
  } catch (e) {
    if (isErrorWithCode(e)) {
      if (e.code === statusCodes.SIGN_IN_CANCELLED) return null;
      if (e.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE)
        throw new DriveError('Google Play services isn’t available on this device.');
    }
    throw new DriveError('Couldn’t sign in to Google.');
  }
}

/** Silent sign-in (no UI). Returns the email if a session exists, else null. */
export async function getCurrentDriveUser(): Promise<string | null> {
  if (!isDriveConfigured()) return null;
  configureDrive();
  try {
    const res = await GoogleSignin.signInSilently();
    if ((res as any)?.type && (res as any).type !== 'success') return null;
    return emailOf(res);
  } catch {
    return null;
  }
}

export async function signOutDrive(): Promise<void> {
  try {
    await GoogleSignin.signOut();
  } catch {
    /* ignore */
  }
}

/** Get a fresh access token, refreshing the silent session first. */
async function accessToken(): Promise<string> {
  ensureReady();
  try {
    await GoogleSignin.signInSilently();
  } catch {
    throw new DriveError('Not signed in to Google.');
  }
  const { accessToken: token } = await GoogleSignin.getTokens();
  if (!token) throw new DriveError('Couldn’t get a Google access token.');
  return token;
}

async function api(token: string, url: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new DriveError(`Drive request failed (${res.status}). ${detail.slice(0, 140)}`);
  }
  return res;
}

/** Find our single backup file id (most recent), or null. */
async function findBackupId(token: string): Promise<string | null> {
  const q = encodeURIComponent(`name = '${FILE_NAME}' and trashed = false`);
  const url = `${DRIVE}/files?q=${q}&spaces=drive&orderBy=modifiedTime desc&pageSize=1&fields=files(id,modifiedTime)`;
  const res = await api(token, url);
  const json = (await res.json()) as { files?: { id: string }[] };
  return json.files?.[0]?.id ?? null;
}

/**
 * Upload `data` (the exportData() JSON string) to Drive, creating the backup file
 * the first time and overwriting it after that. Returns an ISO timestamp.
 */
export async function backupToDrive(data: string): Promise<string> {
  const token = await accessToken();
  const existing = await findBackupId(token);

  if (existing) {
    await api(token, `${UPLOAD}/files/${existing}?uploadType=media&fields=id`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: data,
    });
  } else {
    const boundary = 'colorcloset-backup-boundary';
    const metadata = JSON.stringify({ name: FILE_NAME, mimeType: 'application/json' });
    const body =
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n` +
      `--${boundary}\r\nContent-Type: application/json\r\n\r\n${data}\r\n` +
      `--${boundary}--`;
    await api(token, `${UPLOAD}/files?uploadType=multipart&fields=id`, {
      method: 'POST',
      headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
      body,
    });
  }
  return new Date().toISOString();
}

/** Download the backup file contents (the JSON string), or null if none exists. */
export async function restoreFromDrive(): Promise<string | null> {
  const token = await accessToken();
  const id = await findBackupId(token);
  if (!id) return null;
  const res = await api(token, `${DRIVE}/files/${id}?alt=media`);
  return res.text();
}
