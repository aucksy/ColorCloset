import { useRouter } from 'expo-router';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Alert, BackHandler, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { ReminderPanel } from '@/components/panels/ReminderPanel';
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
  const clearWorn = useStore((s) => s.clearWorn);
  const saved = useStore((s) => s.saved);

  const openDrawer = useUiStore((s) => s.openDrawer);
  const openPanel = useUiStore((s) => s.openPanel);
  const closePanel = useUiStore((s) => s.closePanel);
  const drawerOpen = useUiStore((s) => s.drawerOpen);
  const closeDrawer = useUiStore((s) => s.closeDrawer);
  const showToast = useUiStore((s) => s.showToast);
  const panel = useUiStore((s) => s.panel);

  useLayoutEffect(() => {
    if (!current) {
      if (browseMode === 'swipe') next();
      else regenerate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // When everything's been worn, offer to reset the worn history (once per all-worn state).
  const prompted = useRef(false);
  useEffect(() => {
    const allWorn = total > 0 && wornCount >= total;
    if (allWorn && !prompted.current) {
      prompted.current = true;
      Alert.alert(
        'You’ve worn them all',
        `That’s all ${total} combinations marked worn. Reset your worn history to start a fresh round?`,
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Reset worn', style: 'destructive', onPress: () => { clearWorn(); regenerate(); } },
        ]
      );
    }
    if (!allWorn) prompted.current = false;
  }, [wornCount, total, clearWorn, regenerate]);

  const onAnother = () => {
    const roundDone = another();
    if (roundDone) showToast("You've seen them all — looping back round");
  };
  const onWore = () => {
    markWorn();
    showToast("Marked worn — here's a fresh one");
  };
  const onSave = (): boolean => {
    if (isSaved) {
      showToast('Already in your looks');
      return false;
    }
    saveCurrent();
    showToast('Saved to your looks');
    return true;
  };

  return (
    <View style={[styles.root, { backgroundColor: t.bg, paddingTop: insets.top }]}>
      <View style={styles.topbar}>
        <Pressable accessibilityRole="button" accessibilityLabel="Menu" onPress={openDrawer} style={[styles.hamb, { backgroundColor: t.glass, borderColor: t.line }]}>
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

      {/* sticky status — always visible (no scroll needed): swipe counter or worn progress */}
      {pane === 'rec' && current && (
        <View style={styles.status}>
          {browseMode === 'swipe' ? (
            <View style={styles.swipeStatus}>
              <Text style={[styles.counter, { color: t.muted, fontFamily: fonts.monoBold }]}>
                <Text style={{ color: t.accent }}>{(deckPos < 0 ? 0 : deckPos) + 1}</Text> of {total}
              </Text>
              <Text style={[styles.hint, { color: t.faint, fontFamily: fonts.uiRegular }]}>Swipe · double-tap to save</Text>
            </View>
          ) : (
            <View style={styles.prog}>
              <ProgressBar pct={total ? Math.round((wornCount / total) * 100) : 0} />
              <Pressable onPress={() => openPanel('combos')} style={[styles.progLabel, { backgroundColor: t.glass2, borderColor: t.line2 }]}>
                <Text style={[styles.progTxt, { color: t.ink, fontFamily: fonts.monoBold }]}>
                  Worn <Text style={{ color: t.accent }}>{wornCount}</Text> of {total} · list ›
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      )}

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 12, paddingBottom: insets.bottom + (pane === 'rec' && current ? 104 : 40) }}
        showsVerticalScrollIndicator={false}
      >
        {pane === 'rec' ? (
          <Animated.View key="rec" entering={FadeIn.duration(motion.fast)}>
            <Text style={[styles.chLabel, { color: t.faint, fontFamily: fonts.mono }]}>STYLE</Text>
            <ChipRow items={STYLES.map((s) => ({ value: s as StyleName, label: s }))} value={style} onChange={setStyle} />

            <View style={{ marginTop: 14 }}>
              {current ? (
                browseMode === 'swipe' ? (
                  <SwipeDeck pos={deckPos} total={total} onNext={next} onPrev={prev} onSave={onSave} />
                ) : (
                  <OutfitCard />
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
            </View>
          </Animated.View>
        ) : (
          <Animated.View key="shop" entering={FadeIn.duration(motion.fast)}>
            <WhatToBuyPane />
          </Animated.View>
        )}
      </ScrollView>

      {/* always-visible action bar */}
      {pane === 'rec' && current && (
        <View style={[styles.bar, { backgroundColor: t.bg, borderTopColor: t.line, paddingBottom: insets.bottom + 10 }]}>
          {browseMode === 'classic' && (
            <Button title="Another" variant="goldline" onPress={onAnother} style={{ flex: 1 }} icon={<Icon name="refresh" size={18} color={t.goldSoft} strokeWidth={2.2} />} />
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isSaved ? 'Saved' : 'Save look'}
            accessibilityState={{ selected: isSaved }}
            onPress={onSave}
            style={[styles.iconAct, { borderColor: isSaved ? t.accent : t.line2 }]}
          >
            <Icon name={isSaved ? 'heart-fill' : 'heart'} size={20} color={t.accent} />
          </Pressable>
          <Button title="Mark it worn" onPress={onWore} style={{ flex: 1.2 }} icon={<Icon name="check" size={18} color={t.onGold} strokeWidth={2.6} />} />
        </View>
      )}

      {panel === 'skin' && <SkinPanel />}
      {panel === 'about' && <AboutPanel />}
      {panel === 'combos' && <CombinationsPanel />}
      {panel === 'saved' && <SavedPanel />}
      {panel === 'reminder' && <ReminderPanel />}
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
  status: { paddingHorizontal: 18, paddingTop: 12 },
  swipeStatus: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  counter: { fontSize: 13 },
  hint: { fontSize: 11 },
  chLabel: { fontSize: 10, letterSpacing: 1.6, marginTop: 8, marginBottom: 7 },
  prog: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  progLabel: { borderWidth: 1, borderRadius: 99, paddingVertical: 7, paddingHorizontal: 13 },
  progTxt: { fontSize: 11 },
  bar: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', gap: 10, alignItems: 'stretch', paddingHorizontal: 18, paddingTop: 10, borderTopWidth: 1 },
  iconAct: { width: 56, borderWidth: 1, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  emptyRec: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 },
  emptyIc: { width: 56, height: 56, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyH: { fontSize: 19, marginBottom: 7, textAlign: 'center' },
  emptyP: { fontSize: 13, lineHeight: 20, textAlign: 'center', maxWidth: 250 },
  emptyBtn: { alignSelf: 'stretch', paddingHorizontal: 50, marginTop: 18 },
});
