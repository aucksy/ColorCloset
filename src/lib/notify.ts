/**
 * Local daily-outfit reminders via expo-notifications. We re-sync the full schedule
 * whenever the user changes their reminder settings: cancel everything, then (if
 * enabled and permitted) schedule one repeating weekly notification per chosen day.
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { NotifySettings } from '@/store/useStore';

const CHANNEL = 'daily-outfit';

async function ensurePermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

async function doSync(notify: NotifySettings): Promise<boolean> {
  try {
    // Disabling (or no days): just clear the schedule.
    if (!notify.enabled || notify.days.length === 0) {
      await Notifications.cancelAllScheduledNotificationsAsync();
      return true;
    }
    // Enabling: confirm permission BEFORE wiping the existing schedule, so a denial
    // never silently kills working reminders.
    const ok = await ensurePermission();
    if (!ok) return false;

    await Notifications.cancelAllScheduledNotificationsAsync();
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL, {
        name: 'Daily outfit',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
    for (const weekday of notify.days) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Today's outfit recommendation",
          body: 'Open ColorCloset to see what to wear today.',
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

// Serialize re-syncs so rapid setting changes can't interleave cancel/schedule calls
// (which would leave the OS schedule out of sync with the final settings).
let chain: Promise<boolean> = Promise.resolve(true);

/** Cancel and (re)build the reminder schedule from the current settings. */
export function syncReminders(notify: NotifySettings): Promise<boolean> {
  const run = () => doSync(notify);
  chain = chain.then(run, run);
  return chain;
}
