import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { PanelShell } from '@/components/PanelShell';
import { WheelTimePicker } from '@/components/WheelTimePicker';
import { sendTestReminder, syncReminders } from '@/lib/notify';
import { useStore } from '@/store/useStore';
import { useUiStore } from '@/store/uiStore';
import { fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/useTheme';

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']; // index 0..6 = Sun..Sat
const toWeekday = (i: number) => i + 1; // expo: 1 = Sunday .. 7 = Saturday

/** Daily outfit-reminder settings (local, vibrate-only notifications). */
export function ReminderPanel() {
  const t = useTheme();
  const closePanel = useUiStore((s) => s.closePanel);
  const showToast = useUiStore((s) => s.showToast);
  const notify = useStore((s) => s.notify);
  const setNotify = useStore((s) => s.setNotify);

  const apply = (patch: Partial<typeof notify>) => {
    const nextNotify = { ...notify, ...patch };
    setNotify(patch);
    syncReminders(nextNotify).then((ok) => {
      if (nextNotify.enabled && !ok) {
        setNotify({ enabled: false }); // permission wasn't granted — revert the toggle
        showToast('Allow notifications to get reminders');
      }
    });
  };

  const toggleDay = (i: number) => {
    const wd = toWeekday(i);
    const days = notify.days.includes(wd) ? notify.days.filter((d) => d !== wd) : [...notify.days, wd].sort((a, b) => a - b);
    apply({ days });
  };

  const test = () => {
    sendTestReminder().then((ok) =>
      showToast(ok ? 'Test reminder coming in ~5s (vibrate only)' : 'Allow notifications first')
    );
  };

  return (
    <PanelShell title="Daily reminder" onClose={closePanel}>
      <Text style={[styles.p, { color: t.muted, fontFamily: fonts.uiRegular }]}>
        A gentle nudge — “Today’s outfit recommendation” — at a time you choose. It vibrates only, never
        makes a sound, and everything runs on your device.
      </Text>

      <Pressable onPress={() => apply({ enabled: !notify.enabled })} style={[styles.toggle, { backgroundColor: t.glass, borderColor: t.line }]}>
        <Text style={[styles.toggleTxt, { color: t.ink, fontFamily: fonts.uiSemi }]}>Daily reminder</Text>
        <View style={[styles.switch, { backgroundColor: notify.enabled ? t.accent : t.track }]}>
          <View style={[styles.knob, { left: notify.enabled ? 21 : 3 }]} />
        </View>
      </Pressable>

      <Text style={[styles.label, { color: t.faint, fontFamily: fonts.mono }]}>TIME</Text>
      <WheelTimePicker hour={notify.hour} minute={notify.minute} onChange={(h, m) => apply({ hour: h, minute: m })} />

      <Text style={[styles.label, { color: t.faint, fontFamily: fonts.mono }]}>DAYS</Text>
      <View style={styles.days}>
        {DAY_LABELS.map((d, i) => {
          const on = notify.days.includes(toWeekday(i));
          return (
            <Pressable key={i} onPress={() => toggleDay(i)} style={[styles.day, { backgroundColor: on ? t.accent : t.glass, borderColor: on ? 'transparent' : t.line }]}>
              <Text style={[styles.dayTxt, { color: on ? t.onGold : t.muted, fontFamily: fonts.uiSemi }]}>{d}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.testBtn}>
        <Button title="Send a test now" variant="goldline" onPress={test} />
      </View>
      <Text style={[styles.hint, { color: t.faint, fontFamily: fonts.uiRegular }]}>
        Reminders repeat weekly on the chosen days. If a test doesn’t arrive, enable notifications for ColorCloset in your phone’s settings.
      </Text>
    </PanelShell>
  );
}

const styles = StyleSheet.create({
  p: { fontSize: 13, lineHeight: 20, marginBottom: 18 },
  toggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 16, paddingVertical: 15, paddingHorizontal: 16 },
  toggleTxt: { fontSize: 15 },
  switch: { width: 42, height: 24, borderRadius: 99, justifyContent: 'center' },
  knob: { position: 'absolute', top: 3, width: 18, height: 18, borderRadius: 9, backgroundColor: '#fff' },
  label: { fontSize: 10, letterSpacing: 1.6, marginTop: 24, marginBottom: 10 },
  days: { flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  day: { flex: 1, aspectRatio: 1, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  dayTxt: { fontSize: 14 },
  testBtn: { marginTop: 26 },
  hint: { fontSize: 11.5, lineHeight: 17, marginTop: 12 },
});
