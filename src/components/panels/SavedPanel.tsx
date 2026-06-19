import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { hx } from '@/engine';
import { Icon } from '@/components/Icon';
import { PanelShell } from '@/components/PanelShell';
import { useStore } from '@/store/useStore';
import { useUiStore } from '@/store/uiStore';
import { fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/useTheme';

/** Saved looks — tap to open the look on the main screen (like the rotation list). */
export function SavedPanel() {
  const t = useTheme();
  const closePanel = useUiStore((s) => s.closePanel);
  const saved = useStore((s) => s.saved);
  const worn = useStore((s) => s.worn);
  const deleteSaved = useStore((s) => s.deleteSaved);
  const loadCombo = useStore((s) => s.loadCombo);

  const open = (tk: string, bk: string) => {
    loadCombo(tk, bk);
    closePanel();
  };

  return (
    <PanelShell title="Saved looks" onClose={closePanel}>
      {saved.length === 0 ? (
        <View style={styles.empty}>
          <View style={[styles.emptyIc, { backgroundColor: t.glass, borderColor: t.line }]}>
            <Icon name="heart" size={25} color={t.accent} />
          </View>
          <Text style={[styles.emptyH, { color: t.ink, fontFamily: fonts.display }]}>No looks yet</Text>
          <Text style={[styles.emptyP, { color: t.muted, fontFamily: fonts.uiRegular }]}>
            Double-tap a look you love (or tap the heart) to keep it here.
          </Text>
        </View>
      ) : (
        saved.map((it, i) => {
          const wornDate = worn[`${it.t}|${it.b}`];
          return (
            <Animated.View key={it.id} entering={FadeInDown.duration(340).delay(Math.min(i, 9) * 34)}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Open ${it.name}`}
                onPress={() => open(it.t, it.b)}
                style={({ pressed }) => [styles.item, { backgroundColor: t.glass, borderColor: t.line, opacity: pressed ? 0.7 : 1 }]}
              >
                <View style={[styles.pair, { borderColor: t.line2 }]}>
                  <View style={{ flex: 1, backgroundColor: it.th || hx(it.t) }} />
                  <View style={{ flex: 1, backgroundColor: it.bh || hx(it.b) }} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sn, { color: t.ink, fontFamily: fonts.display }]}>{it.name}</Text>
                  <Text style={[styles.sd, { color: t.muted, fontFamily: fonts.mono }]}>
                    {it.t} + {it.b} · {it.style}
                  </Text>
                  <Text style={[styles.worn, { color: wornDate ? t.accent : t.faint, fontFamily: fonts.mono }]}>
                    {wornDate ? `LAST WORN ${wornDate}` : 'NOT WORN YET'}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Delete saved look"
                  onPress={() => deleteSaved(it.id)}
                  hitSlop={8}
                  style={[styles.del, { backgroundColor: t.glass, borderColor: t.line }]}
                >
                  <Icon name="trash" size={15} color={t.muted} />
                </Pressable>
              </Pressable>
            </Animated.View>
          );
        })
      )}
    </PanelShell>
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 13, borderRadius: 16, borderWidth: 1, marginBottom: 11 },
  pair: { width: 50, height: 50, borderRadius: 13, overflow: 'hidden', borderWidth: 1 },
  sn: { fontSize: 16 },
  sd: { fontSize: 11, marginTop: 2 },
  worn: { fontSize: 9.5, letterSpacing: 0.4, marginTop: 4 },
  del: { width: 34, height: 34, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingVertical: 54, paddingHorizontal: 20 },
  emptyIc: { width: 56, height: 56, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyH: { fontSize: 19, marginBottom: 7 },
  emptyP: { fontSize: 13, lineHeight: 20, textAlign: 'center', maxWidth: 230 },
});
