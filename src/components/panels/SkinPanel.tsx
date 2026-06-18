import { StyleSheet, Text, View } from 'react-native';
import { skinNote } from '@/engine';
import { PanelShell } from '@/components/PanelShell';
import { SkinGrid } from '@/components/SkinGrid';
import { useStore } from '@/store/useStore';
import { useUiStore } from '@/store/uiStore';
import { fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/useTheme';

export function SkinPanel() {
  const t = useTheme();
  const closePanel = useUiStore((s) => s.closePanel);
  const depth = useStore((s) => s.depth);
  const setDepth = useStore((s) => s.setDepth);

  return (
    <PanelShell title="Your skin tone" onClose={closePanel}>
      <Text style={[styles.p, { color: t.muted, fontFamily: fonts.uiRegular }]}>
        Used softly to rank your combinations — it never rules a colour out.
      </Text>
      <View style={{ marginTop: 8 }}>
        <SkinGrid value={depth} onSelect={setDepth} />
      </View>
      <Text style={[styles.note, { color: t.muted, borderLeftColor: t.accent, fontFamily: fonts.uiRegular }]}>
        {skinNote(depth ?? 'medium')}
      </Text>
    </PanelShell>
  );
}

const styles = StyleSheet.create({
  p: { fontSize: 13, lineHeight: 20, marginBottom: 6 },
  note: { fontSize: 12.5, lineHeight: 19, marginTop: 18, borderLeftWidth: 2, paddingLeft: 12 },
});
