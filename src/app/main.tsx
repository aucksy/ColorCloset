import { useRouter } from 'expo-router';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { STYLES, buildDeck, comboUniverse, skinObj, type Mode, type StyleName } from '@/engine';
import { Button } from '@/components/Button';
import { ChipRow } from '@/components/ChipRow';
import { Icon } from '@/components/Icon';
import { Logo } from '@/components/Logo';
import { Segmented } from '@/components/Segmented';
import { SideMenu } from '@/components/SideMenu';
import { SwipeDeck } from '@/components/SwipeDeck';
import { Toast } from '@/components/Toast';
import { AboutPanel } from '@/components/panels/AboutPanel';
import { BackupPanel } from '@/components/panels/BackupPanel';
import { BuyPanel } from '@/components/panels/BuyPanel';
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

// Top toggle is now Formal / Casual (the active wardrobe mode).
const MODE_OPTIONS = [
  { value: 'formal' as Mode, label: 'Formal' },
  { value: 'casual' as Mode, label: 'Casual' },
] as const;

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
  const setMode = useStore((s) => s.setMode);
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

  const openDrawer = useUiStore((s) => s.openDrawer);
  const closePanel = useUiStore((s) => s.closePanel);
  const drawerOpen = useUiStore((s) => s.drawerOpen);
  const closeDrawer = useUiStore((s) => s.closeDrawer);
  const showToast = useUiStore((s) => s.showToast);
  const panel = useUiStore((s) => s.panel);

  // The browsable deck for the SELECTED style (excludes "not for me").
  const deck = useMemo(
    () =>
      buildDeck({ tops: w.tops, bottoms: w.bottoms, skin: skinObj(mst), style, gender, mode }).filter(
        (c) => !w.dismissed[c.id]
      ),
    [w.tops, w.bottoms, w.dismissed, mst, style, gender, mode]
  );
  const total = deck.length; // current style's deck size (for in-style position + last-card detection)

  // GLOBAL stats across ALL styles in the active bucket — the counter and the "worn them
  // all" prompt are GLOBAL, not per-style: per-style deck size + worn count, plus totals.
  const { styleLen, styleWorn, grandTotal, grandWorn } = useMemo(() => {
    const len = STYLES.reduce((m, s) => ((m[s] = 0), m), {} as Record<StyleName, number>);
    const wn = STYLES.reduce((m, s) => ((m[s] = 0), m), {} as Record<StyleName, number>);
    comboUniverse(w.tops, w.bottoms, skinObj(mst), gender, mode).forEach((c) => {
      if (w.dismissed[c.id]) return;
      len[c.style] += 1;
      if (w.worn[c.id]) wn[c.style] += 1;
    });
    return {
      styleLen: len,
      styleWorn: wn,
      grandTotal: STYLES.reduce((n, s) => n + len[s], 0),
      grandWorn: STYLES.reduce((n, s) => n + wn[s], 0),
    };
  }, [w.tops, w.bottoms, w.dismissed, w.worn, mst, gender, mode]);

  // Global position of the current card = combos in earlier styles + position within this style.
  const styleOffset = STYLES.slice(0, Math.max(0, STYLES.indexOf(style))).reduce((n, s) => n + styleLen[s], 0);
  const globalPos = grandTotal === 0 ? 0 : styleOffset + (deckPos < 0 ? 0 : deckPos) + 1;

  // Cyclic next style (from `from`) that still has any / unworn looks — for auto-advance.
  const nextStyleWith = (from: StyleName, pred: (s: StyleName) => boolean): StyleName | undefined => {
    const i = STYLES.indexOf(from);
    return STYLES.slice(i + 1).concat(STYLES.slice(0, i)).find(pred);
  };

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
      return false;
    });
    return () => sub.remove();
  }, [panel, drawerOpen, closePanel, closeDrawer]);

  const isSaved = !!current && w.saved.some((x) => x.t === current.t && x.b === current.b);

  // Dismissible "double-tap to save" coachmark — shows once, AFTER the user has swiped a
  // card or two (not on the very first card), only while browsing recs, never if seen.
  const [coachVisible, setCoachVisible] = useState(false);
  const [swipes, setSwipes] = useState(0);
  const coachShown = useRef(false);
  useEffect(() => {
    if (coachSeen || coachShown.current) return;
    if (!current || swipes < 2) return;
    // Latch the one-shot guard only when it ACTUALLY shows, so an interrupted timer
    // reschedules rather than permanently suppressing the coachmark.
    const showId = setTimeout(() => {
      coachShown.current = true;
      setCoachVisible(true);
    }, 400);
    return () => clearTimeout(showId);
  }, [coachSeen, current, swipes]);

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

  // Offer to reset worn history once EVERY combo (all styles) has been worn — global, not
  // per-style — via a themed in-app dialog (not the OS Alert).
  const [showWornAll, setShowWornAll] = useState(false);
  const prompted = useRef(false);
  useEffect(() => {
    const allWorn = grandTotal > 0 && grandWorn >= grandTotal;
    if (allWorn && !prompted.current) {
      prompted.current = true;
      setShowWornAll(true);
    }
    if (!allWorn) prompted.current = false;
  }, [grandWorn, grandTotal]);

  const onStyle = (s: StyleName) => { setOnToday(false); setStyle(s); };
  const onNext = () => {
    setOnToday(false);
    setSwipes((n) => n + 1);
    // On the last card of this style, hop to the next non-empty style (cyclic via STYLES
    // order) so swiping flows across styles and loops back instead of dead-ending.
    if (total > 0 && deckPos >= total - 1) {
      const nextStyle = nextStyleWith(style, (s) => styleLen[s] > 0);
      if (nextStyle && nextStyle !== style) {
        setStyle(nextStyle);
        showToast(`That's all your ${style} looks — showing ${nextStyle}`);
        return;
      }
    }
    next();
  };
  const onPrev = () => { setOnToday(false); setSwipes((n) => n + 1); prev(); };
  const onWore = () => {
    setOnToday(false);
    // Was this the last UNWORN look in the current style? (decide before marking)
    const lastInStyle = styleLen[style] - styleWorn[style] <= 1;
    markWorn();
    const ns = lastInStyle ? nextStyleWith(style, (s) => styleLen[s] - styleWorn[s] > 0) : undefined;
    if (ns && ns !== style) {
      setStyle(ns);
      showToast(`Worn all your ${style} looks — showing ${ns}`);
    } else {
      showToast("Marked worn — here's a fresh one");
    }
  };
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
  // Mode-aware noun for empty-state copy (no more hard-coded "office").
  const lookWord = mode === 'casual' ? 'casual' : 'office';
  // The selected style has no looks, but the bucket has combos in other styles (#5).
  const isEmptyStyle = !current && grandTotal > 0 && styleLen[style] === 0;
  const addColours = () => router.push({ pathname: '/onboarding', params: { mode: 'add' } });

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
        <Segmented value={mode} options={MODE_OPTIONS} onChange={setMode} />
      </View>

      {/* sticky status — always visible without scrolling */}
      {current && (
        <View style={styles.status}>
          <Text style={[styles.counter, { color: t.muted, fontFamily: fonts.monoBold }]}>
            <Text style={{ color: t.accent }}>{globalPos}</Text> of {grandTotal}
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
        contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 12, paddingBottom: insets.bottom + (current ? 104 : 40) }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View key="rec" entering={FadeIn.duration(motion.fast)}>
          <Text style={[styles.chLabel, { color: t.faint, fontFamily: fonts.mono }]}>STYLE</Text>
          <ChipRow items={STYLES.map((s) => ({ value: s as StyleName, label: s }))} value={style} onChange={onStyle} />

            <View style={{ marginTop: 12 }}>
              {current ? (
                <SwipeDeck pos={deckPos} total={total} onNext={onNext} onPrev={onPrev} onSave={onSave} />
              ) : isEmptyStyle ? (
                <View style={styles.emptyRec}>
                  <View style={[styles.emptyIc, { backgroundColor: t.glass, borderColor: t.line }]}>
                    <Icon name="grid" size={24} color={t.accent} />
                  </View>
                  <Text style={[styles.emptyH, { color: t.ink, fontFamily: fonts.display }]}>No {style} looks yet</Text>
                  <Text style={[styles.emptyP, { color: t.muted, fontFamily: fonts.uiRegular }]}>
                    Add more colours to start seeing {lookWord} looks for this style — or try another style above.
                  </Text>
                  <View style={styles.emptyBtn}>
                    <Button title="Add colours" variant="goldline" onPress={addColours} />
                  </View>
                </View>
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
                    <Button title="Add casual colours" variant="goldline" onPress={addColours} />
                  </View>
                </View>
              ) : (
                <View style={styles.emptyRec}>
                  <View style={[styles.emptyIc, { backgroundColor: t.glass, borderColor: t.line }]}>
                    <Icon name="grid" size={24} color={t.accent} />
                  </View>
                  <Text style={[styles.emptyH, { color: t.ink, fontFamily: fonts.display }]}>No combinations yet</Text>
                  <Text style={[styles.emptyP, { color: t.muted, fontFamily: fonts.uiRegular }]}>
                    Add a few colours to your wardrobe to start seeing {lookWord} looks.
                  </Text>
                  <View style={styles.emptyBtn}>
                    <Button title="Add colours" variant="goldline" onPress={addColours} />
                  </View>
                </View>
              )}
          </View>
        </Animated.View>
      </ScrollView>

      {/* dismissible coachmark — appears once after the user has swiped a couple of cards */}
      {current && coachVisible && (
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
      {current && (
        <View style={[styles.bar, { backgroundColor: t.bg, borderTopColor: t.line, paddingBottom: insets.bottom + 10 }]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Not for me" onPress={onDismiss} style={[styles.iconAct, { borderColor: t.line2 }]}>
            <Icon name="thumbs-down" size={20} color={t.muted} strokeWidth={2} />
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
      {panel === 'buy' && <BuyPanel />}

      {/* themed "worn them all" dialog (replaces the OS Alert) — global, all styles worn */}
      {showWornAll && (
        <View style={[StyleSheet.absoluteFill, styles.modalWrap]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dismiss"
            onPress={() => setShowWornAll(false)}
            style={[StyleSheet.absoluteFill, styles.modalScrim]}
          />
          <Animated.View entering={FadeInDown.duration(motion.base)} style={[styles.modalCard, { backgroundColor: t.surface, borderColor: t.line2 }]}>
            <Text style={[styles.modalTitle, { color: t.ink, fontFamily: fonts.display }]}>You’ve worn them all</Text>
            <Text style={[styles.modalBody, { color: t.muted, fontFamily: fonts.uiRegular }]}>
              That’s all {grandTotal} of your {lookWord} looks. Reset your worn history to start a fresh round?
            </Text>
            <View style={styles.modalBtns}>
              <Pressable onPress={() => setShowWornAll(false)} style={({ pressed }) => [styles.modalGhost, { borderColor: t.line2, opacity: pressed ? 0.6 : 1 }]}>
                <Text style={[styles.modalGhostTxt, { color: t.muted, fontFamily: fonts.uiSemi }]}>Not now</Text>
              </Pressable>
              <View style={{ flex: 1 }}>
                <Button title="Reset worn" onPress={() => { setOnToday(false); clearWorn(); regenerate(); setShowWornAll(false); }} />
              </View>
            </View>
          </Animated.View>
        </View>
      )}

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
  modalWrap: { alignItems: 'center', justifyContent: 'center', zIndex: 80, paddingHorizontal: 30 },
  modalScrim: { backgroundColor: 'rgba(5,5,8,0.6)' },
  modalCard: { borderWidth: 1, borderRadius: 22, padding: 22, width: '100%', maxWidth: 360 },
  modalTitle: { fontSize: 22, marginBottom: 8 },
  modalBody: { fontSize: 13.5, lineHeight: 20, marginBottom: 18 },
  modalBtns: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  modalGhost: { borderWidth: 1, borderRadius: 14, paddingVertical: 13, paddingHorizontal: 18 },
  modalGhostTxt: { fontSize: 14 },
});
