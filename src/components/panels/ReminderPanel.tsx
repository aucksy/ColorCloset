import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PanelShell } from '@/components/PanelShell';
import { syncReminders } from '@/lib/notify';
import { useStore } from '@/store/useStore';
import { useUiStore } from '@/store/uiStore';
import { fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/useTheme';

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']; // index 0..6 = Sun..Sat
const toWeekday = (i: number) => i + 1; // expo: 1 = Sunday .. 7 = Saturday

function fmt(h: number, m: number) {
  const ap = h < 12 ? 'AM' : 'PM';
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${String(m).padStart(2, '0')} ${ap}`;
}

/** Daily outfit-reminder settings (local notifications). */
export function ReminderPanel() {
  const t = useTheme();
  const closePanel = useUiStore((s) => s.closePanel);
  const showToast = useUiStore((s) => s.showToast);
  const notify = useStore((s) => s.notify);
  const setNotify = useStore((s) => s.setNotify);

  // Apply a settings change and re-sync the OS schedule.
  const apply = (patch: Partial<typeof notify>) => {
    const nextNotify = { ...notify, ...patch };
    setNotify(patch);
    syncReminders(nextNotify).then((ok) => {
      if (nextNotify.enabled && !ok) {
        setNotify({ enabled: false }); // revert the toggle — permission wasn't granted
        showToast('Allow notifications to get reminders');
      }
    });
  };

  const toggleDay = (i: number) => {
    const wd = toWeekday(i);
    const days = notify.days.includes(wd) ? notify.days.filter((d) => d !== wd) : [...notify.days, wd].sort((a, b) => a - b);
    apply({ days });
  };
  const bumpHour = (d: number) => apply({ hour: (notify.hour + d + 24) % 24 });
  const bumpMin = (d: number) => apply({ minute: (notify.minute + d + 60) % 60 });

  return (
    <PanelShell title="Daily reminder" onClose={closePanel}>
      <Text style={[styles.p, { color: t.muted, fontFamily: fonts.uiRegular }]}>
        A gentle nudge — “Today’s outfit recommendation” — at a time you choose. Everything runs on your
        device; nothing leaves your phone.
      </Text>

      <Pressable onPress={() => apply({ enabled: !notify.enabled })} style={[styles.toggle, { backgroundColor: t.glass, borderColor: t.line }]}>
        <Text style={[styles.toggleTxt, { color: t.ink, fontFamily: fonts.uiSemi }]}>Daily reminder</Text>
        <View style={[styles.switch, { backgroundColor: notify.enabled ? t.accent : t.track }]}>
          <View style={[styles.knob, { left: notify.enabled ? 21 : 3 }]} />
        </View>
      </Pressable>

      <Text style={[styles.label, { color: t.faint, fontFamily: fonts.mono }]}>TIME</Text>
      <View style={[styles.timeRow, { backgroundColor: t.glass, borderColor: t.line }]}>
        <Stepper t={t} onDown={() => bumpHour(-1)} onUp={() => bumpHour(1)} />
        <Text style={[styles.time, { color: t.ink, fontFamily: fonts.displaySemi }]}>{fmt(notify.hour, notify.minute)}</Text>
        <Stepper t={t} onDown={() => bumpMin(-15)} onUp={() => bumpMin(15)} label="min" />
      </View>

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
    </PanelShell>
  );
}

function Stepper({ t, onDown, onUp, label }: { t: ReturnType<typeof useTheme>; onDown: () => void; onUp: () => void; label?: string }) {
  return (
    <View style={styles.stepper}>
      <Pressable onPress={onDown} style={[styles.stepBtn, { borderColor: t.line2 }]}>
        <Text style={[styles.stepGlyph, { color: t.ink }]}>−</Text>
      </Pressable>
      {label && <Text style={[styles.stepLabel, { color: t.faint, fontFamily: fonts.mono }]}>{label}</Text>}
      <Pressable onPress={onUp} style={[styles.stepBtn, { borderColor: t.line2 }]}>
        <Text style={[styles.stepGlyph, { color: t.ink }]}>＋</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  p: { fontSize: 13, lineHeight: 20, marginBottom: 18 },
  toggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 16, paddingVertical: 15, paddingHorizontal: 16 },
  toggleTxt: { fontSize: 15 },
  switch: { width: 42, height: 24, borderRadius: 99, justifyContent: 'center' },
  knob: { position: 'absolute', top: 3, width: 18, height: 18, borderRadius: 9, backgroundColor: '#fff' },
  label: { fontSize: 10, letterSpacing: 1.6, marginTop: 24, marginBottom: 10 },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16 },
  time: { fontSize: 26 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepBtn: { width: 38, height: 38, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  stepGlyph: { fontSize: 20, lineHeight: 22 },
  stepLabel: { fontSize: 9 },
  days: { flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  day: { flex: 1, aspectRatio: 1, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  dayTxt: { fontSize: 14 },
});
