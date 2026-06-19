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

/** Cancel and (re)build the reminder schedule from the current settings. */
export async function syncReminders(notify: NotifySettings): Promise<boolean> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!notify.enabled || notify.days.length === 0) return true;

    const ok = await ensurePermission();
    if (!ok) return false;

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
