import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CLOTH, OCC, STYLES, skinObj, uniStats, type Occasion, type StyleName, type TypeFilter } from '@/engine';
import { Button } from '@/components/Button';
import { ChipRow } from '@/components/ChipRow';
import { Icon } from '@/components/Icon';
import { OutfitCard } from '@/components/OutfitCard';
import { ProgressBar } from '@/components/ProgressBar';
import { Segmented, type Pane } from '@/components/Segmented';
import { SideMenu } from '@/components/SideMenu';
import { Toast } from '@/components/Toast';
import { WhatToBuyPane } from '@/components/WhatToBuyPane';
import { AboutPanel } from '@/components/panels/AboutPanel';
import { CombinationsPanel } from '@/components/panels/CombinationsPanel';
import { SavedPanel } from '@/components/panels/SavedPanel';
import { SkinPanel } from '@/components/panels/SkinPanel';
import { TypeTaggingPanel } from '@/components/panels/TypeTaggingPanel';
import { useMotion } from '@/theme/useMotion';
import { useStore } from '@/store/useStore';
import { useUiStore } from '@/store/uiStore';
import { fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/useTheme';

export default function Main() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const motion = useMotion();
  const [pane, setPane] = useState<Pane>('rec');

  const current = useStore((s) => s.current);
  const occasion = useStore((s) => s.occasion);
  const style = useStore((s) => s.style);
  const setOccasion = useStore((s) => s.setOccasion);
  const setStyle = useStore((s) => s.setStyle);
  const typeFilter = useStore((s) => s.typeFilter);
  const setTypeFilter = useStore((s) => s.setTypeFilter);
  const types = useStore((s) => s.types);
  const tops = useStore((s) => s.tops);
  const bottoms = useStore((s) => s.bottoms);
  const depth = useStore((s) => s.depth);
  const undertone = useStore((s) => s.undertone);
  const worn = useStore((s) => s.worn);
  const regenerate = useStore((s) => s.regenerate);
  const another = useStore((s) => s.another);
  const markWorn = useStore((s) => s.markWorn);
  const saveCurrent = useStore((s) => s.saveCurrent);

  const openDrawer = useUiStore((s) => s.openDrawer);
  const openPanel = useUiStore((s) => s.openPanel);
  const showToast = useUiStore((s) => s.showToast);
  const panel = useUiStore((s) => s.panel);

  // Ensure an outfit is showing on first entry.
  useEffect(() => {
    if (!current) regenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const skin = skinObj(depth, undertone);
  const { total, worn: wornCount } = uniStats(tops, bottoms, skin, worn);
  const hasTags = Object.keys(types).some((k) => (types[k]?.length ?? 0) > 0);

  const onAnother = () => {
    const roundDone = another();
    if (roundDone) showToast("You've seen them all — looping back round");
  };
  const onWore = () => {
    markWorn();
    showToast("Marked worn — here's a fresh one");
  };
  const onSave = () => {
    saveCurrent();
    showToast('Saved to your looks');
  };

  return (
    <View style={[styles.root, { backgroundColor: t.bg, paddingTop: insets.top }]}>
      {/* top bar */}
      <View style={styles.topbar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Menu"
          onPress={openDrawer}
          style={[styles.hamb, { backgroundColor: t.glass, borderColor: t.line }]}
        >
          <Icon name="menu" size={18} color={t.ink} />
        </Pressable>
        <View style={styles.brand}>
          <View style={styles.mk} />
          <Text style={[styles.brandTxt, { color: t.ink, fontFamily: fonts.uiBold }]}>ColorCloset</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Edit skin tone"
          onPress={() => openPanel('skin')}
          style={[styles.pill, { backgroundColor: t.glass, borderColor: t.line }]}
        >
          <View style={[styles.pillDot, { backgroundColor: skin.dot }]} />
          <Text style={[styles.pillTxt, { color: t.muted, fontFamily: fonts.uiSemi }]}>{skin.name}</Text>
          <Icon name="pencil" size={11} color={t.faint} />
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: 18, marginTop: 6 }}>
        <Segmented value={pane} onChange={setPane} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 14, paddingBottom: insets.bottom + 30 }}
        showsVerticalScrollIndicator={false}
      >
        {pane === 'rec' ? (
          <Animated.View key="rec" entering={FadeIn.duration(motion.fast)}>
            <Text style={[styles.chLabel, { color: t.faint, fontFamily: fonts.mono }]}>OCCASION</Text>
            <ChipRow
              items={OCC.map((o) => ({ value: o as Occasion, label: o }))}
              value={occasion}
              onChange={setOccasion}
            />
            <Text style={[styles.chLabel, { color: t.faint, fontFamily: fonts.mono }]}>STYLE</Text>
            <ChipRow
              items={STYLES.map((s) => ({ value: s as StyleName, label: s }))}
              value={style}
              onChange={setStyle}
            />
            {hasTags && (
              <>
                <Text style={[styles.chLabel, { color: t.faint, fontFamily: fonts.mono }]}>FOR</Text>
                <ChipRow
                  items={[{ value: 'all' as TypeFilter, label: 'All' }, ...CLOTH.map((c) => ({ value: c.id as TypeFilter, label: c.name }))]}
                  value={typeFilter}
                  onChange={setTypeFilter}
                />
              </>
            )}

            <View style={styles.prog}>
              <ProgressBar pct={total ? Math.round((wornCount / total) * 100) : 0} />
              <Pressable onPress={() => openPanel('combos')} style={[styles.progLabel, { backgroundColor: t.glass2, borderColor: t.line2 }]}>
                <Text style={[styles.progTxt, { color: t.ink, fontFamily: fonts.monoBold }]}>
                  Worn <Text style={{ color: t.accent }}>{wornCount}</Text> of {total} · see list ›
                </Text>
              </Pressable>
            </View>

            <OutfitCard />

            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Save look"
                onPress={onSave}
                style={[styles.iconAct, { borderColor: t.line2 }]}
              >
                <Icon name="bookmark" size={20} color={t.ink} />
              </Pressable>
              <Button title="Mark it worn" onPress={onWore} style={{ flex: 1 }} icon={<Icon name="check" size={18} color={t.onGold} strokeWidth={3} />} />
              <Button title="Another" variant="ghost" onPress={onAnother} style={{ flex: 1 }} icon={<Icon name="refresh" size={18} color={t.ink} />} />
            </View>
          </Animated.View>
        ) : (
          <Animated.View key="shop" entering={FadeIn.duration(motion.fast)}>
            <WhatToBuyPane />
          </Animated.View>
        )}
      </ScrollView>

      {/* overlays */}
      {panel === 'skin' && <SkinPanel />}
      {panel === 'about' && <AboutPanel />}
      {panel === 'combos' && <CombinationsPanel />}
      {panel === 'saved' && <SavedPanel />}
      {panel === 'types' && <TypeTaggingPanel />}
      <SideMenu />
      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 16, paddingBottom: 10 },
  hamb: { width: 40, height: 40, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  mk: { width: 24, height: 24, borderRadius: 7, backgroundColor: '#C9A86A' },
  brandTxt: { fontSize: 15 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingLeft: 7, paddingRight: 11, borderRadius: 99, borderWidth: 1 },
  pillDot: { width: 14, height: 14, borderRadius: 7 },
  pillTxt: { fontSize: 11 },
  chLabel: { fontSize: 10, letterSpacing: 1.6, marginTop: 14, marginBottom: 7 },
  prog: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14, marginBottom: 6 },
  progLabel: { borderWidth: 1, borderRadius: 99, paddingVertical: 7, paddingHorizontal: 13 },
  progTxt: { fontSize: 11 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 18, alignItems: 'stretch' },
  iconAct: { width: 56, borderWidth: 1, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
