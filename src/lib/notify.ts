/**
 * Local daily-outfit reminders via expo-notifications. Vibrate-only (no sound). We
 * re-sync the full schedule whenever settings change — serialized so rapid changes
 * can't interleave, and permission is confirmed before the existing schedule is wiped.
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { NotifySettings } from '@/store/useStore';

const CHANNEL = 'daily-outfit';

/** Show reminders silently (vibrate, no sound) even if the app is foregrounded. */
export function configureNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

async function ensurePermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

async function ensureChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL, {
    name: 'Daily outfit',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: null, // vibrate only — no sound
    enableVibrate: true,
    vibrationPattern: [0, 220, 120, 220],
  });
}

async function doSync(notify: NotifySettings): Promise<boolean> {
  try {
    if (!notify.enabled || notify.days.length === 0) {
      await Notifications.cancelAllScheduledNotificationsAsync();
      return true;
    }
    const ok = await ensurePermission();
    if (!ok) return false; // don't wipe a working schedule on denial

    await Notifications.cancelAllScheduledNotificationsAsync();
    await ensureChannel();
    for (const weekday of notify.days) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Today's outfit recommendation",
          body: 'Open ColorCloset to see what to wear today.',
          sound: false,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday, // 1 = Sunday .. 7 = Saturday
          hour: notify.hour,
          minute: notify.minute,
          channelId: CHANNEL,
        },
      });
    }
    return true;
  } catch {
    return false;
  }
}

// Serialize re-syncs so rapid setting changes can't interleave cancel/schedule calls.
let chain: Promise<boolean> = Promise.resolve(true);

/** Cancel and (re)build the reminder schedule from the current settings. */
export function syncReminders(notify: NotifySettings): Promise<boolean> {
  const run = () => doSync(notify);
  chain = chain.then(run, run);
  return chain;
}

/** Fire a one-off reminder ~5s out so the user can confirm reminders work. */
export async function sendTestReminder(): Promise<boolean> {
  try {
    const ok = await ensurePermission();
    if (!ok) return false;
    await ensureChannel();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Today's outfit recommendation",
        body: 'Test reminder — your daily nudge is set up correctly.',
        sound: false,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 5,
        channelId: CHANNEL,
      },
    });
    return true;
  } catch {
    return false;
  }
}
