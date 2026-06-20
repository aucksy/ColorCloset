import { StyleSheet, Text, View } from 'react-native';
import { PanelShell } from '@/components/PanelShell';
import { SOURCES } from '@/engine';
import { useUiStore } from '@/store/uiStore';
import { fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/useTheme';

export function SourcesPanel() {
  const t = useTheme();
  const closePanel = useUiStore((s) => s.closePanel);
  return (
    <PanelShell title="Colour science" onClose={closePanel}>
      <Text style={[styles.p, { color: t.ink, fontFamily: fonts.uiRegular }]}>
        The colour logic here is grounded in established, authentic sources.
      </Text>
      {SOURCES.map((s, i) => (
        <View key={s.name} style={styles.source}>
          <Text style={[styles.num, { color: t.accent, fontFamily: fonts.mono }]}>
            {String(i + 1).padStart(2, '0')}
          </Text>
          <View style={styles.srcBody}>
            <Text style={[styles.name, { color: t.ink, fontFamily: fonts.uiSemi }]}>{s.name}</Text>
            <Text style={[styles.note, { color: t.muted, fontFamily: fonts.uiRegular }]}>{s.note}</Text>
          </View>
        </View>
      ))}
    </PanelShell>
  );
}

const styles = StyleSheet.create({
  p: { fontSize: 14, lineHeight: 23, marginBottom: 16 },
  source: { flexDirection: 'row', gap: 12, marginBottom: 16, alignItems: 'flex-start' },
  num: { fontSize: 13, width: 22, marginTop: 1 },
  srcBody: { flex: 1, gap: 4 },
  name: { fontSize: 14, lineHeight: 20 },
  note: { fontSize: 13, lineHeight: 20 },
});
