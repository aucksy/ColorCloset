import { useRouter } from 'expo-router';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Alert, BackHandler, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { STYLES, buildDeck, skinObj, type StyleName } from '@/engine';
import { Button } from '@/components/Button';
import { ChipRow } from '@/components/ChipRow';
import { Icon } from '@/components/Icon';
import { Logo } from '@/components/Logo';
import { Segmented } from '@/components/Segmented';
import { SideMenu } from '@/components/SideMenu';
import { SwipeDeck } from '@/components/SwipeDeck';
import { Toast } from '@/components/Toast';
import { WhatToBuyPane } from '@/components/WhatToBuyPane';
import { AboutPanel } from '@/components/panels/AboutPanel';
import { BackupPanel } from '@/components/panels/BackupPanel';
import { CombinationsPanel } from '@/components/panels/CombinationsPanel';
import { ReminderPanel } from '@/components/panels/ReminderPanel';
import { SavedPanel } from '@/components/panels/SavedPanel';
import { SkinPanel } from '@/components/panels/SkinPanel';
import { SourcesPanel } from '@/components/panels/SourcesPanel';
import { useMotion } from '@/theme/useMotion';
import { useActiveWardrobe, useStore } from '@/store/useStore';
import { useUiStore } from '@/store/uiStore';
import { fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/useTheme';

const hashDay = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
};

export default function Main() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const motion = useMotion();
  const [onToday, setOnToday] = useState(false);

  const current = useStore((s) => s.current);
  const deckPos = useStore((s) => s.deckPos);
  const style = useStore((s) => s.style);
  const setStyle = useStore((s) => s.setStyle);
  const mst = useStore((s) => s.mst);
  const gender = useStore((s) => s.gender);
  const mode = useStore((s) => s.mode);
  const regenerate = useStore((s) => s.regenerate);
  const next = useStore((s) => s.next);
  const prev = useStore((s) => s.prev);
  const goToIndex = useStore((s) => s.goToIndex);
  const markWorn = useStore((s) => s.markWorn);
  const dismiss = useStore((s) => s.dismiss);
  const saveCurrent = useStore((s) => s.saveCurrent);
  const clearWorn = useStore((s) => s.clearWorn);
  const setLastPickDay = useStore((s) => s.setLastPickDay);
  const coachSeen = useStore((s) => s.coachSeen);
  const markCoachSeen = useStore((s) => s.markCoachSeen);

  // All wardrobe data + history reads the ACTIVE gender×mode bucket.
  const w = useActiveWardrobe();

  // Pane lives in uiStore so the rotation/saved panels can switch back to "Style me".
  const pane = useUiStore((s) => s.pane);
  const setPane = useUiStore((s) => s.setPane);
  const openDrawer = useUiStore((s) => s.openDrawer);
  const closePanel = useUiStore((s) => s.closePanel);
  const drawerOpen = useUiStore((s) => s.drawerOpen);
  const closeDrawer = useUiStore((s) => s.closeDrawer);
  const showToast = useUiStore((s) => s.showToast);
  const panel = useUiStore((s) => s.panel);

  // The browsable deck (excludes "not for me") — drives the counter + worn progress.
  const deck = useMemo(
    () =>
      buildDeck({ tops: w.tops, bottoms: w.bottoms, skin: skinObj(mst), style, gender, mode }).filter(
        (c) => !w.dismissed[c.id]
      ),
    [w.tops, w.bottoms, w.dismissed, mst, style, gender, mode]
  );
  const total = deck.length;
  const wornCount = useMemo(() => deck.filter((c) => w.worn[c.id]).length, [deck, w.worn]);

  // Per-style browsable deck size (post "not for me"), so onNext can hop to the next
  // non-empty style once the current style's cards are exhausted (#15 auto-advance).
  const styleLen = useMemo(
    () =>
      STYLES.reduce((m, s) => {
        m[s] = buildDeck({
          tops: w.tops,
          bottoms: w.bottoms,
          skin: skinObj(mst),
          style: s,
          gender,
          mode,
        }).filter((c) => !w.dismissed[c.id]).length;
        return m;
      }, {} as Record<StyleName, number>),
    [w.tops, w.bottoms, w.dismissed, mst, gender, mode]
  );

  // First entry: seed a decisive "Today's pick" once a day (a strong, day-stable look).
  useLayoutEffect(() => {
    const day = new Date().toISOString().slice(0, 10);
    if (deck.length && w.lastPickDay !== day) {
      const span = Math.max(1, Math.ceil(deck.length * 0.3));
      goToIndex(hashDay(day) % span);
      setLastPickDay(day);
      setOnToday(true);
    } else if (!current) {
      regenerate();
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
  }, [panel, drawerOpen, closePanel, closeDrawer, pane, setPane]);

  const isSaved = !!current && w.saved.some((x) => x.t === current.t && x.b === current.b);

  // Dismissible "double-tap to save" coachmark — shows once, after the first card
  // entrance settles, only while browsing recs and never if already acknowledged.
  const [coachVisible, setCoachVisible] = useState(false);
  const coachShown = useRef(false);
  useEffect(() => {
    if (coachSeen || coachShown.current) return;
    if (pane !== 'rec' || !current) return;
    // Latch the one-shot guard only when it ACTUALLY shows — not when scheduled — so a
    // swipe / style-change within the delay (which churns `current` and re-runs this
    // effect) reschedules the timer instead of permanently suppressing the coachmark.
    const showId = setTimeout(() => {
      coachShown.current = true;
      setCoachVisible(true);
    }, motion.base + 700);
    return () => clearTimeout(showId);
  }, [coachSeen, pane, current, motion.base]);

  // Auto-dismiss the coachmark after a few seconds once it's on screen.
  useEffect(() => {
    if (!coachVisible) return;
    const id = setTimeout(() => {
      setCoachVisible(false);
      markCoachSeen();
    }, 4000);
    return () => clearTimeout(id);
  }, [coachVisible, markCoachSeen]);

  const dismissCoach = () => {
    setCoachVisible(false);
    markCoachSeen();
  };

  // Offer to reset worn history once everything's been worn.
  const prompted = useRef(false);
  useEffect(() => {
    const allWorn = total > 0 && wornCount >= total;
    if (allWorn && !prompted.current) {
      prompted.current = true;
      Alert.alert('You’ve worn them all', `That’s all ${total} combinations. Reset your worn history to start a fresh round?`, [
        { text: 'Not now', style: 'cancel' },
        { text: 'Reset worn', style: 'destructive', onPress: () => { setOnToday(false); clearWorn(); regenerate(); } },
      ]);
    }
    if (!allWorn) prompted.current = false;
  }, [wornCount, total, clearWorn, regenerate]);

  const onStyle = (s: StyleName) => { setOnToday(false); setStyle(s); };
  const onNext = () => {
    setOnToday(false);
    // On the last card of this style, hop to the next non-empty style (cyclic via STYLES
    // order from the current one) instead of wrapping — so swiping flows across styles.
    if (total > 0 && deckPos >= total - 1) {
      const i = STYLES.indexOf(style);
      const nextStyle =
        i >= 0
          ? STYLES.slice(i + 1).concat(STYLES.slice(0, i)).find((s) => styleLen[s] > 0)
          : undefined;
      if (nextStyle) {
        setStyle(nextStyle);
        showToast(`That's all your ${style} looks — showing ${nextStyle}`);
        return;
      }
    }
    next();
  };
  const onPrev = () => { setOnToday(false); prev(); };
  const onWore = () => { setOnToday(false); markWorn(); showToast("Marked worn — here's a fresh one"); };
  const onDismiss = () => { setOnToday(false); dismiss(); showToast('Hidden — find it under “Not for me”'); };
  const onSave = (): boolean => {
    if (isSaved) {
      showToast('Already in your looks');
      return false;
    }
    saveCurrent();
    showToast('Saved to your looks');
    return true;
  };

  // Casual lazy onboarding: an empty casual bucket gets mode-aware copy/CTA.
  const isEmptyCasual = mode === 'casual' && w.tops.length === 0 && w.bottoms.length === 0;

  return (
    <View style={[styles.root, { backgroundColor: t.bg, paddingTop: insets.top }]}>
      <View style={styles.topbar}>
        <Pressable accessibilityRole="button" accessibilityLabel="Menu" onPress={openDrawer} style={[styles.hamb, { backgroundColor: t.glass, borderColor: t.line }]}>
          <Icon name="menu" size={18} color={t.ink} />
        </Pressable>
        <View style={styles.brand}>
          <Logo size={26} />
          <Text style={[styles.brandTxt, { color: t.ink, fontFamily: fonts.display }]}>
            Color<Text style={{ color: t.accent }}>Closet</Text>
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={{ paddingHorizontal: 18, marginTop: 6 }}>
        <Segmented value={pane} onChange={setPane} />
      </View>

      {/* sticky status — always visible without scrolling */}
      {pane === 'rec' && current && (
        <View style={styles.status}>
          <Text style={[styles.counter, { color: t.muted, fontFamily: fonts.monoBold }]}>
            <Text style={{ color: t.accent }}>{(deckPos < 0 ? 0 : deckPos) + 1}</Text> of {total}
          </Text>
          {onToday ? (
            <View style={[styles.todayPill, { borderColor: t.accent, backgroundColor: 'rgba(201,168,106,0.12)' }]}>
              <Icon name="star" size={12} color={t.accent} />
              <Text style={[styles.todayTxt, { color: t.accent, fontFamily: fonts.uiBold }]}>TODAY’S PICK</Text>
            </View>
          ) : (
            <Text style={[styles.hint, { color: t.faint, fontFamily: fonts.uiRegular }]}>Swipe to browse</Text>
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
            <ChipRow items={STYLES.map((s) => ({ value: s as StyleName, label: s }))} value={style} onChange={onStyle} />

            <View style={{ marginTop: 12 }}>
              {current ? (
                <SwipeDeck pos={deckPos} total={total} onNext={onNext} onPrev={onPrev} onSave={onSave} />
              ) : isEmptyCasual ? (
                <View style={styles.emptyRec}>
                  <View style={[styles.emptyIc, { backgroundColor: t.glass, borderColor: t.line }]}>
                    <Icon name="grid" size={24} color={t.accent} />
                  </View>
                  <Text style={[styles.emptyH, { color: t.ink, fontFamily: fonts.display }]}>No casual looks yet</Text>
                  <Text style={[styles.emptyP, { color: t.muted, fontFamily: fonts.uiRegular }]}>
                    Add the colours you wear casually.
                  </Text>
                  <View style={styles.emptyBtn}>
                    <Button title="Add casual colours" variant="goldline" onPress={() => router.push({ pathname: '/onboarding', params: { mode: 'add' } })} />
                  </View>
                </View>
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

      {/* dismissible coachmark — appears once after the first card settles */}
      {pane === 'rec' && current && coachVisible && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Got it"
          onPress={dismissCoach}
          style={[styles.coachWrap, { bottom: insets.bottom + 96 }]}
        >
          <Animated.View
            entering={FadeInDown.duration(motion.base)}
            style={[styles.coach, { backgroundColor: t.surface, borderColor: t.accent }]}
          >
            <Icon name="heart" size={15} color={t.accent} />
            <Text style={[styles.coachTxt, { color: t.ink, fontFamily: fonts.uiSemi }]}>Double-tap to save a look</Text>
          </Animated.View>
        </Pressable>
      )}

      {/* always-visible action bar: not-for-me · save · mark worn */}
      {pane === 'rec' && current && (
        <View style={[styles.bar, { backgroundColor: t.bg, borderTopColor: t.line, paddingBottom: insets.bottom + 10 }]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Not for me" onPress={onDismiss} style={[styles.iconAct, { borderColor: t.line2 }]}>
            <Icon name="x" size={20} color={t.muted} strokeWidth={2.4} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isSaved ? 'Saved' : 'Save look'}
            accessibilityState={{ selected: isSaved }}
            onPress={onSave}
            style={[styles.iconAct, { borderColor: isSaved ? t.accent : t.line2 }]}
          >
            <Icon name={isSaved ? 'heart-fill' : 'heart'} size={20} color={t.accent} />
          </Pressable>
          <Button title="Mark it worn" onPress={onWore} style={{ flex: 1 }} icon={<Icon name="check" size={18} color={t.onGold} strokeWidth={2.6} />} />
        </View>
      )}

      {panel === 'skin' && <SkinPanel />}
      {panel === 'about' && <AboutPanel />}
      {panel === 'combos' && <CombinationsPanel />}
      {panel === 'saved' && <SavedPanel />}
      {panel === 'reminder' && <ReminderPanel />}
      {panel === 'backup' && <BackupPanel />}
      {panel === 'sources' && <SourcesPanel />}
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
  brandTxt: { fontSize: 19, letterSpacing: -0.3 },
  status: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 12 },
  counter: { fontSize: 13 },
  hint: { fontSize: 11 },
  todayPill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 99, paddingVertical: 4, paddingHorizontal: 10 },
  todayTxt: { fontSize: 10, letterSpacing: 0.8 },
  chLabel: { fontSize: 10, letterSpacing: 1.6, marginTop: 8, marginBottom: 7 },
  coachWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 40 },
  coach: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 99, paddingVertical: 9, paddingHorizontal: 15 },
  coachTxt: { fontSize: 12.5 },
  bar: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', gap: 10, alignItems: 'stretch', paddingHorizontal: 18, paddingTop: 10, borderTopWidth: 1 },
  iconAct: { width: 56, borderWidth: 1, borderRadius: 18, alignItems: 'center', justifyContent: 'center', paddingVertical: 14 },
  emptyRec: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 },
  emptyIc: { width: 56, height: 56, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyH: { fontSize: 19, marginBottom: 7, textAlign: 'center' },
  emptyP: { fontSize: 13, lineHeight: 20, textAlign: 'center', maxWidth: 250 },
  emptyBtn: { alignSelf: 'stretch', paddingHorizontal: 50, marginTop: 18 },
});
