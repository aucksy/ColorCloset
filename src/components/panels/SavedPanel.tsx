import { Pressable, StyleSheet, Text, View } from 'react-native';
import { hx } from '@/engine';
import { Icon } from '@/components/Icon';
import { PanelShell } from '@/components/PanelShell';
import { useStore } from '@/store/useStore';
import { useUiStore } from '@/store/uiStore';
import { fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/useTheme';

export function SavedPanel() {
  const t = useTheme();
  const closePanel = useUiStore((s) => s.closePanel);
  const saved = useStore((s) => s.saved);
  const deleteSaved = useStore((s) => s.deleteSaved);

  return (
    <PanelShell title="Saved looks" onClose={closePanel}>
      {saved.length === 0 ? (
        <View style={styles.empty}>
          <View style={[styles.emptyIc, { backgroundColor: t.glass, borderColor: t.line }]}>
            <Icon name="bookmark" size={25} color={t.accent} />
          </View>
          <Text style={[styles.emptyH, { color: t.ink, fontFamily: fonts.display }]}>No looks yet</Text>
          <Text style={[styles.emptyP, { color: t.muted, fontFamily: fonts.uiRegular }]}>
            Tap the bookmark on a combination you like to keep it here.
          </Text>
        </View>
      ) : (
        saved.map((it) => (
          <View key={it.id} style={[styles.item, { backgroundColor: t.glass, borderColor: t.line }]}>
            <View style={[styles.pair, { borderColor: t.line2 }]}>
              <View style={{ flex: 1, backgroundColor: it.th || hx(it.t) }} />
              <View style={{ flex: 1, backgroundColor: it.bh || hx(it.b) }} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sn, { color: t.ink, fontFamily: fonts.display }]}>{it.name}</Text>
              <Text style={[styles.sd, { color: t.muted, fontFamily: fonts.mono }]}>
                {it.t} + {it.b} · {it.style} · {it.date}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Delete saved look"
              onPress={() => deleteSaved(it.id)}
              style={[styles.del, { backgroundColor: t.glass, borderColor: t.line }]}
            >
              <Icon name="trash" size={15} color={t.muted} />
            </Pressable>
          </View>
        ))
      )}
    </PanelShell>
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 13, borderRadius: 16, borderWidth: 1, marginBottom: 11 },
  pair: { width: 46, height: 46, borderRadius: 12, overflow: 'hidden', borderWidth: 1 },
  sn: { fontSize: 16 },
  sd: { fontSize: 11, marginTop: 2 },
  del: { width: 34, height: 34, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingVertical: 54, paddingHorizontal: 20 },
  emptyIc: { width: 56, height: 56, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyH: { fontSize: 19, marginBottom: 7 },
  emptyP: { fontSize: 13, lineHeight: 20, textAlign: 'center', maxWidth: 230 },
});
