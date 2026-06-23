import { useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { syncReminders } from '@/lib/notify';
import { useStore } from '@/store/useStore';
import { useUiStore } from '@/store/uiStore';
import { fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/useTheme';

type ThemeT = ReturnType<typeof useTheme>;

/**
 * One-time, *explained* notification-permission ask. It appears the first time a set-up
 * user lands on the main screen with the daily reminder on but permission not yet decided
 * — telling them what reminders do before the OS dialog ever shows. On Allow we request
 * permission and then drop them into the Daily reminder settings to pick a time (the
 * toggle stays on); on deny / "Maybe later" we flip the toggle off so it tells the truth.
 *
 * This lives on the main screen (not in onboarding) so it covers BOTH arrival paths:
 * a fresh set-up and a restore-a-backup — both reach main with setupComplete + reminder on.
 */
export function NotifyPrimer() {
  const t = useTheme();
  const setupComplete = useStore((s) => s.setupComplete);
  const notify = useStore((s) => s.notify);
  const notifyAsked = useStore((s) => s.notifyAsked);
  const markNotifyAsked = useStore((s) => s.markNotifyAsked);
  const setNotify = useStore((s) => s.setNotify);
  const openPanel = useUiStore((s) => s.openPanel);

  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  const due = setupComplete && notify.enabled && !notifyAsked;

  useEffect(() => {
    if (!due) return;
    let cancelled = false;
    // If notifications are already granted (e.g. allowed in a prior build), don't
    // re-prompt — quietly arm the schedule and mark the ask as handled.
    Notifications.getPermissionsAsync()
      .then((p) => {
        if (cancelled) return;
        if (p.granted) {
          markNotifyAsked();
          syncReminders(notify);
        } else {
          setVisible(true);
        }
      })
      .catch(() => {
        if (!cancelled) setVisible(true);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [due]);

  const onAllow = async () => {
    setBusy(true);
    // notify.enabled is already true here, so syncReminders requests permission and,
    // on grant, schedules the weekly reminders; its boolean is the grant result.
    const ok = await syncReminders(notify);
    markNotifyAsked();
    setBusy(false);
    setVisible(false);
    if (ok) {
      openPanel('reminder'); // hand them to the time/day picker — reminder stays on
    } else {
      setNotify({ enabled: false }); // denied → keep the toggle honest…
      syncReminders({ ...notify, enabled: false }); // …and cancel any lingering schedule
    }
  };

  // Explicit "Maybe later": a real decision to skip reminders — turn the toggle off (so
  // it's never on without permission), stop nagging, and clear any existing schedule.
  const onDecline = () => {
    markNotifyAsked();
    setNotify({ enabled: false });
    setVisible(false);
    syncReminders({ ...notify, enabled: false });
  };

  // Hardware/gesture back = neutral dismiss: hide without deciding, so the default-on
  // reminder is preserved and we can ask again the next time the main screen mounts.
  const onDismiss = () => setVisible(false);

  return (
    <Modal visible={visible} transparent statusBarTranslucent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: t.surface, borderColor: t.line2 }]}>
          <View style={[styles.badge, { backgroundColor: t.glass2, borderColor: t.accent }]}>
            <Icon name="bell" size={26} color={t.accent} />
          </View>

          <Text style={[styles.title, { color: t.ink, fontFamily: fonts.display }]}>
            Your daily outfit nudge
          </Text>
          <Text style={[styles.body, { color: t.muted, fontFamily: fonts.uiRegular }]}>
            We can send one gentle reminder — “Today’s outfit recommendation” — at a time you choose, so
            you’re never stuck staring at the wardrobe.
          </Text>

          <View style={styles.bullets}>
            <Bullet t={t} text="You pick the time and days" />
            <Bullet t={t} text="Vibrate-only — never makes a sound" />
            <Bullet t={t} text="Runs on your phone, always private" />
          </View>

          <View style={{ height: 20 }} />
          <Button
            title={busy ? 'Just a sec…' : 'Allow reminders'}
            onPress={onAllow}
            disabled={busy}
            icon={
              busy ? (
                <ActivityIndicator size="small" color={t.onGold} />
              ) : (
                <Icon name="bell" size={18} color={t.onGold} />
              )
            }
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Maybe later"
            onPress={onDecline}
            disabled={busy}
            hitSlop={8}
            style={styles.later}
          >
            <Text style={[styles.laterTxt, { color: t.muted, fontFamily: fonts.uiSemi }]}>Maybe later</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function Bullet({ t, text }: { t: ThemeT; text: string }) {
  return (
    <View style={styles.bulletRow}>
      <View style={[styles.check, { backgroundColor: t.accent }]}>
        <Icon name="check" size={11} color={t.onGold} strokeWidth={3} />
      </View>
      <Text style={[styles.bulletTxt, { color: t.ink, fontFamily: fonts.uiRegular }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', paddingHorizontal: 26 },
  sheet: { borderWidth: 1, borderRadius: 24, padding: 24, alignItems: 'center' },
  badge: {
    width: 56,
    height: 56,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: { fontSize: 24, letterSpacing: -0.3, textAlign: 'center' },
  body: { fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 10, maxWidth: 320 },
  bullets: { alignSelf: 'stretch', marginTop: 22, gap: 13 },
  bulletRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  check: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  bulletTxt: { fontSize: 13.5, flex: 1 },
  later: { marginTop: 14, paddingVertical: 8, paddingHorizontal: 16 },
  laterTxt: { fontSize: 14 },
});
