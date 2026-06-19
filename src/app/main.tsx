import { useRouter } from 'expo-router';
import { useEffect, useLayoutEffect, useState } from 'react';
import { BackHandler, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { STYLES, skinObj, uniStats, type StyleName } from '@/engine';
import { Button } from '@/components/Button';
import { ChipRow } from '@/components/ChipRow';
import { Icon } from '@/components/Icon';
import { Logo } from '@/components/Logo';
import { OutfitCard } from '@/components/OutfitCard';
import { ProgressBar } from '@/components/ProgressBar';
import { Segmented, type Pane } from '@/components/Segmented';
import { SideMenu } from '@/components/SideMenu';
import { SwipeDeck } from '@/components/SwipeDeck';
import { Toast } from '@/components/Toast';
import { WhatToBuyPane } from '@/components/WhatToBuyPane';
import { AboutPanel } from '@/components/panels/AboutPanel';
import { CombinationsPanel } from '@/components/panels/CombinationsPanel';
import { SavedPanel } from '@/components/panels/SavedPanel';
import { SkinPanel } from '@/components/panels/SkinPanel';
import { useMotion } from '@/theme/useMotion';
import { useStore } from '@/store/useStore';
import { useUiStore } from '@/store/uiStore';
import { fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/useTheme';

export default function Main() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const motion = useMotion();
  const [pane, setPane] = useState<Pane>('rec');

  const current = useStore((s) => s.current);
  const deckPos = useStore((s) => s.deckPos);
  const style = useStore((s) => s.style);
  const setStyle = useStore((s) => s.setStyle);
  const browseMode = useStore((s) => s.browseMode);
  const tops = useStore((s) => s.tops);
  const bottoms = useStore((s) => s.bottoms);
  const depth = useStore((s) => s.depth);
  const worn = useStore((s) => s.worn);
  const regenerate = useStore((s) => s.regenerate);
  const another = useStore((s) => s.another);
  const next = useStore((s) => s.next);
  const prev = useStore((s) => s.prev);
  const markWorn = useStore((s) => s.markWorn);
  const saveCurrent = useStore((s) => s.saveCurrent);
  const saved = useStore((s) => s.saved);

  const openDrawer = useUiStore((s) => s.openDrawer);
  const openPanel = useUiStore((s) => s.openPanel);
  const closePanel = useUiStore((s) => s.closePanel);
  const drawerOpen = useUiStore((s) => s.drawerOpen);
  const closeDrawer = useUiStore((s) => s.closeDrawer);
  const showToast = useUiStore((s) => s.showToast);
  const panel = useUiStore((s) => s.panel);

  // Ensure an outfit is showing on first entry (before paint, to avoid a flash of
  // the empty state for returning users whose session `current` starts null).
  useLayoutEffect(() => {
    if (!current) regenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Android back: overlay → drawer → "Colors to buy" tab → Style me; only the bare
  // Style-me screen falls through to let the OS exit.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (panel) {
        closePanel();
        return true;
      }
      if (drawerOpen) {
        closeDrawer();
        return true;
      }
      if (pane === 'shop') {
        setPane('rec');
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [panel, drawerOpen, closePanel, closeDrawer, pane]);

  const skin = skinObj(depth);
  const { total, worn: wornCount } = uniStats(tops, bottoms, skin, worn);
  const isSaved = !!current && saved.some((x) => x.t === current.t && x.b === current.b);

  const onAnother = () => {
    const roundDone = another();
    if (roundDone) showToast("You've seen them all — looping back round");
  };
  const onWore = () => {
    markWorn();
    showToast("Marked worn — here's a fresh one");
  };
  const onSave = () => {
    if (isSaved) {
      showToast('Already in your looks');
      return;
    }
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
          <Logo size={24} />
          <Text style={[styles.brandTxt, { color: t.ink, fontFamily: fonts.uiBold }]}>ColorCloset</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={{ paddingHorizontal: 18, marginTop: 6 }}>
        <Segmented value={pane} onChange={setPane} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 14, paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {pane === 'rec' ? (
          <Animated.View key="rec" entering={FadeIn.duration(motion.fast)}>
            <Text style={[styles.chLabel, { color: t.faint, fontFamily: fonts.mono }]}>STYLE</Text>
            <ChipRow
              items={STYLES.map((s) => ({ value: s as StyleName, label: s }))}
              value={style}
              onChange={setStyle}
            />

            <View style={styles.prog}>
              <ProgressBar pct={total ? Math.round((wornCount / total) * 100) : 0} />
              <Pressable onPress={() => openPanel('combos')} style={[styles.progLabel, { backgroundColor: t.glass2, borderColor: t.line2 }]}>
                <Text style={[styles.progTxt, { color: t.ink, fontFamily: fonts.monoBold }]}>
                  Worn <Text style={{ color: t.accent }}>{wornCount}</Text> of {total} · see list ›
                </Text>
              </Pressable>
            </View>

            {current ? (
              browseMode === 'swipe' ? (
                <>
                  <SwipeDeck pos={deckPos} total={total} onNext={next} onPrev={prev} onSave={onSave} />
                  <View style={styles.worn}>
                    <Button title="Mark it worn" onPress={onWore} icon={<Icon name="check" size={18} color={t.onGold} strokeWidth={2.6} />} />
                  </View>
                </>
              ) : (
                <>
                  <OutfitCard />
                  <View style={styles.actions}>
                    <Button
                      title="Another"
                      variant="goldline"
                      onPress={onAnother}
                      style={{ flex: 1 }}
                      icon={<Icon name="refresh" size={18} color={t.goldSoft} strokeWidth={2.2} />}
                    />
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={isSaved ? 'Saved' : 'Save look'}
                      accessibilityState={{ selected: isSaved }}
                      onPress={onSave}
                      style={[styles.iconAct, { borderColor: isSaved ? t.accent : t.line2 }]}
                    >
                      <Icon name="bookmark" size={20} color={isSaved ? t.accent : t.ink} />
                    </Pressable>
                  </View>
                  <View style={styles.worn}>
                    <Button title="Mark it worn" onPress={onWore} icon={<Icon name="check" size={18} color={t.onGold} strokeWidth={2.6} />} />
                  </View>
                </>
              )
            ) : (
              <View style={styles.emptyRec}>
                <View style={[styles.emptyIc, { backgroundColor: t.glass, borderColor: t.line }]}>
                  <Icon name="grid" size={24} color={t.accent} />
                </View>
                <Text style={[styles.emptyH, { color: t.ink, fontFamily: fonts.display }]}>No combinations yet</Text>
                <Text style={[styles.emptyP, { color: t.muted, fontFamily: fonts.uiRegular }]}>
                  Add a few colours to your wardrobe to start seeing office looks.
                </Text>
                <View style={styles.emptyBtn}>
                  <Button title="Add colours" variant="goldline" onPress={() => router.push({ pathname: '/onboarding', params: { mode: 'add' } })} />
                </View>
              </View>
            )}
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
  brandTxt: { fontSize: 15 },
  chLabel: { fontSize: 10, letterSpacing: 1.6, marginTop: 14, marginBottom: 7 },
  prog: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14, marginBottom: 6 },
  progLabel: { borderWidth: 1, borderRadius: 99, paddingVertical: 7, paddingHorizontal: 13 },
  progTxt: { fontSize: 11 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 18, alignItems: 'stretch' },
  worn: { marginTop: 10 },
  iconAct: { width: 56, borderWidth: 1, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  emptyRec: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 20 },
  emptyIc: { width: 56, height: 56, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyH: { fontSize: 19, marginBottom: 7, textAlign: 'center' },
  emptyP: { fontSize: 13, lineHeight: 20, textAlign: 'center', maxWidth: 250 },
  emptyBtn: { alignSelf: 'stretch', paddingHorizontal: 50, marginTop: 18 },
});
