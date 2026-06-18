import { Pressable, StyleSheet, Text, View } from 'react-native';
import { nameFor, shadeHex, skinObj, uniStats, type Combo } from '@/engine';
import { PanelShell } from '@/components/PanelShell';
import { ProgressBar } from '@/components/ProgressBar';
import { useStore } from '@/store/useStore';
import { useUiStore } from '@/store/uiStore';
import { fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/useTheme';

// Deterministic name in lists (no per-render shuffle).
const fixedName = (t: string, b: string) => nameFor(t, b, undefined, () => 0);

export function CombinationsPanel() {
  const t = useTheme();
  const closePanel = useUiStore((s) => s.closePanel);
  const tops = useStore((s) => s.tops);
  const bottoms = useStore((s) => s.bottoms);
  const depth = useStore((s) => s.depth);
  const worn = useStore((s) => s.worn);
  const shadeTops = useStore((s) => s.shadeTops);
  const shadeBottoms = useStore((s) => s.shadeBottoms);
  const loadCombo = useStore((s) => s.loadCombo);
  const clearWorn = useStore((s) => s.clearWorn);

  const { uni, total, worn: wornCount } = uniStats(tops, bottoms, skinObj(depth), worn);
  const notWorn = uni.filter((c) => !worn[c.id]);
  const did = uni.filter((c) => worn[c.id]);

  const open = (c: Combo) => {
    loadCombo(c.t, c.b);
    closePanel();
  };

  const Row = ({ c, isWorn }: { c: Combo; isWorn: boolean }) => (
    <Pressable
      onPress={() => open(c)}
      style={[styles.row, { backgroundColor: t.glass, borderColor: t.line, opacity: isWorn ? 0.6 : 1 }]}
    >
      <View style={[styles.pair, { borderColor: t.line2 }]}>
        <View style={{ flex: 1, backgroundColor: shadeHex(c.t, shadeTops[c.t]?.[0]) }} />
        <View style={{ flex: 1, backgroundColor: shadeHex(c.b, shadeBottoms[c.b]?.[0]) }} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.cn, { color: t.ink, fontFamily: fonts.uiSemi }]}>
          {c.t} + {c.b}
        </Text>
        <Text style={[styles.cs, { color: t.muted, fontFamily: fonts.uiRegular }]}>
          {fixedName(c.t, c.b)}
        </Text>
      </View>
      <View
        style={[
          styles.badge,
          isWorn
            ? { backgroundColor: t.glass2, borderColor: t.line, borderWidth: 1 }
            : { backgroundColor: t.gold },
        ]}
      >
        <Text style={[styles.badgeTxt, { color: isWorn ? t.muted : t.onGold, fontFamily: fonts.monoBold }]}>
          {isWorn ? `WORN · ${worn[c.id]}` : 'NOT WORN'}
        </Text>
      </View>
    </Pressable>
  );

  return (
    <PanelShell title="Your combinations" onClose={closePanel}>
      <View style={styles.head}>
        <Text style={[styles.count, { color: t.muted, fontFamily: fonts.monoBold }]}>
          <Text style={{ color: t.ink }}>{wornCount}</Text> of {total} worn
        </Text>
        <ProgressBar pct={total ? Math.round((wornCount / total) * 100) : 0} big />
      </View>

      {uni.length === 0 && (
        <Text style={[styles.empty, { color: t.muted, fontFamily: fonts.uiRegular }]}>
          No combinations yet. Add a few colours to your tops and bottoms first.
        </Text>
      )}

      {notWorn.length > 0 && (
        <Text style={[styles.sec, { color: t.faint, fontFamily: fonts.mono }]}>
          HAVEN&apos;T WORN ({notWorn.length})
        </Text>
      )}
      {notWorn.map((c) => (
        <Row key={c.id} c={c} isWorn={false} />
      ))}

      {did.length > 0 && (
        <Text style={[styles.sec, { color: t.faint, fontFamily: fonts.mono }]}>WORN ({did.length})</Text>
      )}
      {did.map((c) => (
        <Row key={c.id} c={c} isWorn />
      ))}

      {did.length > 0 && (
        <Pressable onPress={clearWorn} style={{ marginTop: 16, padding: 10 }}>
          <Text style={[styles.link, { color: t.muted, fontFamily: fonts.ui }]}>Reset worn history</Text>
        </Pressable>
      )}
    </PanelShell>
  );
}

const styles = StyleSheet.create({
  head: { gap: 10, marginBottom: 8 },
  count: { fontSize: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 13, padding: 11, borderRadius: 15, borderWidth: 1, marginBottom: 9 },
  pair: { width: 42, height: 42, borderRadius: 11, overflow: 'hidden', borderWidth: 1 },
  cn: { fontSize: 13.5 },
  cs: { fontSize: 11, marginTop: 1 },
  badge: { paddingVertical: 5, paddingHorizontal: 9, borderRadius: 8 },
  badgeTxt: { fontSize: 9, letterSpacing: 0.4 },
  sec: { fontSize: 10, letterSpacing: 1.8, marginTop: 20, marginBottom: 11 },
  empty: { fontSize: 13, lineHeight: 20, marginTop: 20, textAlign: 'center' },
  link: { fontSize: 13, textAlign: 'center' },
});
