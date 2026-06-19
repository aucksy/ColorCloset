/**
 * Thin wrapper over expo-haptics. Every call is best-effort — wrapped so a device
 * without a haptic motor (or a failed call) never throws into the UI.
 */
import * as Haptics from 'expo-haptics';

export const hapticLight = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
};

export const hapticMedium = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
};

export const hapticSuccess = () => {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
};
