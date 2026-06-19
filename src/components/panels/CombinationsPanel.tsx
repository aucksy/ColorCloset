import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { nameFor, shadeHex, skinObj, uniStats, type Combo } from '@/engine';
import { Icon } from '@/components/Icon';
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

  const [notWornOpen, setNotWornOpen] = useState(true);
  const [wornOpen, setWornOpen] = useState(true);

  const { uni, total, worn: wornCount } = uniStats(tops, bottoms, skinObj(depth), worn);
  const notWorn = uni.filter((c) => !worn[c.id]);
  const did = uni.filter((c) => worn[c.id]);

  const open = (c: Combo) => {
    loadCombo(c.t, c.b);
    closePanel();
  };

  const Row = ({ c, isWorn, i }: { c: Combo; isWorn: boolean; i: number }) => (
    <Animated.View entering={FadeInDown.duration(360).delay(Math.min(i, 9) * 36)}>
      <Pressable onPress={() => open(c)} style={[styles.row, { backgroundColor: t.glass, borderColor: t.line, opacity: isWorn ? 0.6 : 1 }]}>
        <View style={[styles.pair, { borderColor: t.line2 }]}>
          <View style={{ flex: 1, backgroundColor: shadeHex(c.t, shadeTops[c.t]?.[0]) }} />
          <View style={{ flex: 1, backgroundColor: shadeHex(c.b, shadeBottoms[c.b]?.[0]) }} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cn, { color: t.ink, fontFamily: fonts.uiSemi }]}>{c.t} + {c.b}</Text>
          <Text style={[styles.cs, { color: t.muted, fontFamily: fonts.uiRegular }]}>{fixedName(c.t, c.b)}</Text>
        </View>
        <View style={[styles.badge, isWorn ? { backgroundColor: t.glass2, borderColor: t.line, borderWidth: 1 } : { backgroundColor: t.gold }]}>
          <Text style={[styles.badgeTxt, { color: isWorn ? t.muted : t.onGold, fontFamily: fonts.monoBold }]}>
            {isWorn ? `WORN · ${worn[c.id]}` : 'NOT WORN'}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );

  const SectionHeader = ({ label, count, open: isOpen, onToggle }: { label: string; count: number; open: boolean; onToggle: () => void }) => (
    <Pressable onPress={onToggle} style={({ pressed }) => [styles.secHead, { opacity: pressed ? 0.6 : 1 }]}>
      <Icon name={isOpen ? 'chevron-down' : 'chevron-right'} size={15} color={t.muted} />
      <Text style={[styles.sec, { color: t.faint, fontFamily: fonts.mono }]}>
        {label} ({count})
      </Text>
      <Text style={[styles.tapHint, { color: t.faint, fontFamily: fonts.uiRegular }]}>{isOpen ? 'tap to hide' : 'tap to show'}</Text>
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
        <>
          <SectionHeader label="HAVEN'T WORN" count={notWorn.length} open={notWornOpen} onToggle={() => setNotWornOpen((v) => !v)} />
          {notWornOpen && notWorn.map((c, i) => <Row key={c.id} c={c} isWorn={false} i={i} />)}
        </>
      )}

      {did.length > 0 && (
        <>
          <SectionHeader label="WORN" count={did.length} open={wornOpen} onToggle={() => setWornOpen((v) => !v)} />
          {wornOpen && did.map((c, i) => <Row key={c.id} c={c} isWorn i={i} />)}
        </>
      )}

      {did.length > 0 && (
        <Animated.View entering={FadeIn}>
          <Pressable onPress={clearWorn} style={{ marginTop: 16, padding: 10 }}>
            <Text style={[styles.link, { color: t.muted, fontFamily: fonts.ui }]}>Reset worn history</Text>
          </Pressable>
        </Animated.View>
      )}
    </PanelShell>
  );
}

const styles = StyleSheet.create({
  head: { gap: 10, marginBottom: 8 },
  count: { fontSize: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 10 },
  pair: { width: 50, height: 50, borderRadius: 13, overflow: 'hidden', borderWidth: 1 },
  cn: { fontSize: 14.5 },
  cs: { fontSize: 11.5, marginTop: 2 },
  badge: { paddingVertical: 5, paddingHorizontal: 9, borderRadius: 8 },
  badgeTxt: { fontSize: 9, letterSpacing: 0.4 },
  secHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20, marginBottom: 11 },
  sec: { fontSize: 10, letterSpacing: 1.8 },
  tapHint: { fontSize: 10, marginLeft: 'auto' },
  empty: { fontSize: 13, lineHeight: 20, marginTop: 20, textAlign: 'center' },
  link: { fontSize: 13, textAlign: 'center' },
});
