import { StyleSheet, Text, View } from 'react-native';
import { PanelShell } from '@/components/PanelShell';
import { useUiStore } from '@/store/uiStore';
import { fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/useTheme';

const STEPS = [
  'Pick your skin tone — used softly to surface combinations that tend to flatter you.',
  'Add the colours of your tops and bottoms — no item-by-item tagging.',
  'Get combinations from what you own, plus the one colour worth buying to unlock the most new looks.',
];

export function AboutPanel() {
  const t = useTheme();
  const closePanel = useUiStore((s) => s.closePanel);
  return (
    <PanelShell title="How it works" onClose={closePanel}>
      <Text style={[styles.p, { color: t.ink, fontFamily: fonts.uiRegular }]}>
        ColorCloset does one thing: tells you what colour combinations to wear from the clothes you
        already own.
      </Text>
      {STEPS.map((s, i) => (
        <View key={i} style={styles.step}>
          <Text style={[styles.num, { color: t.accent, fontFamily: fonts.mono }]}>
            {String(i + 1).padStart(2, '0')}
          </Text>
          <Text style={[styles.stepTxt, { color: t.ink, fontFamily: fonts.uiRegular }]}>{s}</Text>
        </View>
      ))}
      <Text style={[styles.mut, { color: t.muted, fontFamily: fonts.uiRegular }]}>
        Skin-tone guidance is based on established colour principles, but it&apos;s a nudge, not a
        verdict — if you love a colour, wear it.
      </Text>
    </PanelShell>
  );
}

const styles = StyleSheet.create({
  p: { fontSize: 14, lineHeight: 23, marginBottom: 14 },
  step: { flexDirection: 'row', gap: 12, marginBottom: 14, alignItems: 'flex-start' },
  num: { fontSize: 13, width: 22 },
  stepTxt: { flex: 1, fontSize: 13.5, lineHeight: 20 },
  mut: { fontSize: 13, lineHeight: 21, marginTop: 6 },
});
