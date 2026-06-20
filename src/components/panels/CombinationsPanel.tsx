import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { comboName, comboUniverse, hx, shadeHex, skinObj, type Combo } from '@/engine';
import { Icon } from '@/components/Icon';
import { PanelShell } from '@/components/PanelShell';
import { ProgressBar } from '@/components/ProgressBar';
import { useActiveWardrobe, useStore } from '@/store/useStore';
import { useUiStore } from '@/store/uiStore';
import { fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/useTheme';

export function CombinationsPanel() {
  const t = useTheme();
  const closePanel = useUiStore((s) => s.closePanel);
  const setPane = useUiStore((s) => s.setPane);
  const w = useActiveWardrobe();
  const mst = useStore((s) => s.mst);
  const gender = useStore((s) => s.gender);
  const mode = useStore((s) => s.mode);
  const loadCombo = useStore((s) => s.loadCombo);
  const restoreDismissed = useStore((s) => s.restoreDismissed);
  const clearWorn = useStore((s) => s.clearWorn);

  const [notWornOpen, setNotWornOpen] = useState(true);
  const [wornOpen, setWornOpen] = useState(true);
  const [dismissedOpen, setDismissedOpen] = useState(false);

  const uni = comboUniverse(w.tops, w.bottoms, skinObj(mst), gender, mode);
  const active = uni.filter((c) => !w.dismissed[c.id]);
  const notWorn = active.filter((c) => !w.worn[c.id]);
  const did = active.filter((c) => w.worn[c.id]);
  const dismissedCombos = uni.filter((c) => w.dismissed[c.id]);
  const total = active.length;
  const wornCount = did.length;

  const open = (c: Combo) => {
    loadCombo(c.t, c.b);
    setPane('rec'); // switch to "Style me" so the loaded combo is visible
    closePanel();
  };

  const Row = ({ c, isWorn, i }: { c: Combo; isWorn: boolean; i: number }) => (
    <Animated.View entering={FadeInDown.duration(340).delay(Math.min(i, 9) * 34)}>
      <Pressable onPress={() => open(c)} style={({ pressed }) => [styles.row, { backgroundColor: t.glass, borderColor: t.line, opacity: pressed ? 0.7 : isWorn ? 0.62 : 1 }]}>
        <View style={[styles.pair, { borderColor: t.line2 }]}>
          <View style={{ flex: 1, backgroundColor: shadeHex(c.t, w.shadeTops[c.t]?.[0]) }} />
          <View style={{ flex: 1, backgroundColor: shadeHex(c.b, w.shadeBottoms[c.b]?.[0]) }} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cn, { color: t.ink, fontFamily: fonts.uiSemi }]}>{c.t} + {c.b}</Text>
          <Text style={[styles.cs, { color: t.muted, fontFamily: fonts.uiRegular }]}>{comboName(c.t, c.b, c.curated)}</Text>
        </View>
        <View style={[styles.badge, isWorn ? { backgroundColor: t.glass2, borderColor: t.line, borderWidth: 1 } : { backgroundColor: t.gold }]}>
          <Text style={[styles.badgeTxt, { color: isWorn ? t.muted : t.onGold, fontFamily: fonts.monoBold }]}>
            {isWorn ? `WORN · ${w.worn[c.id]}` : 'NOT WORN'}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );

  const Header = ({ label, count, open: isOpen, onToggle }: { label: string; count: number; open: boolean; onToggle: () => void }) => (
    <Pressable onPress={onToggle} style={({ pressed }) => [styles.secHead, { backgroundColor: t.glass2, borderColor: t.line2, opacity: pressed ? 0.75 : 1 }]}>
      <Text style={[styles.secLabel, { color: t.ink, fontFamily: fonts.uiBold }]}>{label}</Text>
      <View style={[styles.cnt, { backgroundColor: t.glass, borderColor: t.line }]}>
        <Text style={[styles.cntTxt, { color: t.muted, fontFamily: fonts.monoBold }]}>{count}</Text>
      </View>
      <View style={{ flex: 1 }} />
      <Icon name={isOpen ? 'chevron-down' : 'chevron-right'} size={18} color={t.accent} />
    </Pressable>
  );

  return (
    <PanelShell title="Your rotation" onClose={closePanel}>
      <View style={styles.head}>
        <Text style={[styles.count, { color: t.muted, fontFamily: fonts.monoBold }]}>
          <Text style={{ color: t.ink }}>{wornCount}</Text> of {total} worn
        </Text>
        <ProgressBar pct={total ? Math.round((wornCount / total) * 100) : 0} big />
      </View>

      {active.length === 0 && dismissedCombos.length === 0 && (
        <Text style={[styles.empty, { color: t.muted, fontFamily: fonts.uiRegular }]}>
          No combinations yet. Add a few colours to your tops and bottoms first.
        </Text>
      )}

      {notWorn.length > 0 && (
        <>
          <Header label="Haven't worn" count={notWorn.length} open={notWornOpen} onToggle={() => setNotWornOpen((v) => !v)} />
          {notWornOpen && notWorn.map((c, i) => <Row key={c.id} c={c} isWorn={false} i={i} />)}
        </>
      )}

      {did.length > 0 && (
        <>
          <Header label="Worn" count={did.length} open={wornOpen} onToggle={() => setWornOpen((v) => !v)} />
          {wornOpen && did.map((c, i) => <Row key={c.id} c={c} isWorn i={i} />)}
        </>
      )}

      {dismissedCombos.length > 0 && (
        <>
          <Header label="Not for me" count={dismissedCombos.length} open={dismissedOpen} onToggle={() => setDismissedOpen((v) => !v)} />
          {dismissedOpen &&
            dismissedCombos.map((c) => (
              <View key={c.id} style={[styles.row, { backgroundColor: t.glass, borderColor: t.line, opacity: 0.7 }]}>
                <View style={[styles.pair, { borderColor: t.line2 }]}>
                  <View style={{ flex: 1, backgroundColor: shadeHex(c.t, w.shadeTops[c.t]?.[0]) || hx(c.t) }} />
                  <View style={{ flex: 1, backgroundColor: shadeHex(c.b, w.shadeBottoms[c.b]?.[0]) || hx(c.b) }} />
                </View>
                <Text style={[styles.cn, { flex: 1, color: t.muted, fontFamily: fonts.uiSemi }]}>{c.t} + {c.b}</Text>
                <Pressable onPress={() => restoreDismissed(c.id)} style={[styles.restore, { borderColor: t.line2 }]}>
                  <Text style={[styles.restoreTxt, { color: t.accent, fontFamily: fonts.uiSemi }]}>Restore</Text>
                </Pressable>
              </View>
            ))}
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
  head: { gap: 10, marginBottom: 6 },
  count: { fontSize: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 10 },
  pair: { width: 50, height: 50, borderRadius: 13, overflow: 'hidden', borderWidth: 1 },
  cn: { fontSize: 14.5 },
  cs: { fontSize: 11.5, marginTop: 2 },
  badge: { paddingVertical: 5, paddingHorizontal: 9, borderRadius: 8 },
  badgeTxt: { fontSize: 9, letterSpacing: 0.4 },
  secHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18, marginBottom: 12, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 13, borderWidth: 1 },
  secLabel: { fontSize: 14 },
  cnt: { minWidth: 26, paddingHorizontal: 7, height: 20, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  cntTxt: { fontSize: 11 },
  restore: { borderWidth: 1, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12 },
  restoreTxt: { fontSize: 12 },
  empty: { fontSize: 13, lineHeight: 20, marginTop: 20, textAlign: 'center' },
  link: { fontSize: 13, textAlign: 'center' },
});
