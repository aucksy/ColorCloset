import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { BackHandler, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { comboUniverse, skinNote, skinObj } from '@/engine';
import { BuildingOverlay } from '@/components/BuildingOverlay';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { SkinGrid } from '@/components/SkinGrid';
import { SwatchGrid } from '@/components/SwatchGrid';
import { useStore } from '@/store/useStore';
import { fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/useTheme';

export default function Onboarding() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const addMode = mode === 'add'; // launched from "Add more colours" — skip the skin step

  const firstStep = addMode ? 1 : 0;
  const [step, setStep] = useState(firstStep);
  const [building, setBuilding] = useState(false);

  const depth = useStore((s) => s.depth);
  const tops = useStore((s) => s.tops);
  const bottoms = useStore((s) => s.bottoms);
  const setDepth = useStore((s) => s.setDepth);
  const completeSetup = useStore((s) => s.completeSetup);
  const regenerate = useStore((s) => s.regenerate);

  // Universe size before any edits this session — drives the "+N new" delta in add mode.
  const [beforeTotal] = useState(() => comboUniverse(tops, bottoms, skinObj(depth)).length);
  const total = useMemo(() => comboUniverse(tops, bottoms, skinObj(depth)).length, [tops, bottoms, depth]);

  // Android back: step back through the flow; in add mode the first step exits to main.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (building) return true;
      if (step > firstStep) { setStep(step - 1); return true; }
      if (addMode) { router.back(); return true; }
      return false;
    });
    return () => sub.remove();
  }, [step, building, addMode, firstStep, router]);

  const back = () => {
    if (step > firstStep) setStep(step - 1);
    else if (addMode) router.back();
  };
  const finish = () => setBuilding(true);
  const onBuilt = () => {
    if (!addMode) completeSetup();
    regenerate();
    if (addMode) router.back();
    else router.replace('/main');
  };

  const totalSteps = addMode ? 2 : 3;
  const dotIndex = addMode ? step - 1 : step; // 0-based within the visible flow
  const eyebrow = `Step ${dotIndex + 1} of ${totalSteps}`;
  const canBack = step > firstStep || addMode;

  return (
    <View style={[styles.root, { backgroundColor: t.bg, paddingTop: insets.top }]}>
      <View style={styles.top}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={addMode && step === firstStep ? 'Close' : 'Back'}
          onPress={back}
          style={[styles.back, { opacity: canBack ? 1 : 0 }]}
          disabled={!canBack}
        >
          <Icon name="chevron-left" size={15} color={t.muted} />
          <Text style={[styles.backTxt, { color: t.muted, fontFamily: fonts.ui }]}>
            {addMode && step === firstStep ? 'Close' : 'Back'}
          </Text>
        </Pressable>
        <View style={styles.dots}>
          {Array.from({ length: totalSteps }).map((_, nm) => (
            <View key={nm} style={[styles.dot, { backgroundColor: nm <= dotIndex ? t.accent : t.track, width: nm === dotIndex ? 22 : 7 }]} />
          ))}
        </View>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Animated.View key={step} entering={FadeInDown.duration(420)}>
          <Text style={[styles.eyebrow, { color: t.accent, fontFamily: fonts.mono }]}>{eyebrow.toUpperCase()}</Text>

          {step === 0 && (
            <>
              <Text style={[styles.title, { color: t.ink, fontFamily: fonts.display }]}>
                First, your <Text style={{ color: t.accent, fontFamily: fonts.displayItalic }}>skin tone.</Text>
              </Text>
              <Lead t={t}>Pick the depth closest to yours — we use it gently to nudge what flatters you. It never rules a colour out.</Lead>
              <Text style={[styles.label, { color: t.faint, fontFamily: fonts.mono }]}>PICK A DEPTH</Text>
              <SkinGrid value={depth} onSelect={setDepth} />
              {depth && (
                <Text style={[styles.note, { color: t.muted, borderLeftColor: t.accent, fontFamily: fonts.uiRegular }]}>
                  {skinNote(depth)}
                </Text>
              )}
            </>
          )}

          {step === 1 && (
            <WardrobeStep
              t={t}
              slot="tops"
              title={addMode ? 'Add tops.' : 'Your tops.'}
              lead="Tap every colour you own — pick more than one shade per colour if you like."
            />
          )}

          {step === 2 && (
            <WardrobeStep
              t={t}
              slot="bottoms"
              title={addMode ? 'Add bottoms.' : 'Now your bottoms.'}
              lead="Your trousers, jeans and chinos — tap the colours you own."
            />
          )}
        </Animated.View>
      </ScrollView>

      <View style={[styles.foot, { paddingBottom: insets.bottom + 18 }]}>
        {step === 0 && <Button title="Continue" onPress={() => setStep(1)} disabled={!depth} icon={<Icon name="chevron-right" size={18} color={t.onGold} />} />}
        {step === 1 && <Button title="Continue" onPress={() => setStep(2)} disabled={tops.length === 0} icon={<Icon name="chevron-right" size={18} color={t.onGold} />} />}
        {step === 2 && <Button title={addMode ? 'Update my combinations' : 'See my combinations'} onPress={finish} disabled={bottoms.length === 0} icon={<Icon name="chevron-right" size={18} color={t.onGold} />} />}
      </View>

      {building && <BuildingOverlay total={total} addedFrom={addMode ? beforeTotal : undefined} onDone={onBuilt} />}
    </View>
  );
}

type ThemeT = ReturnType<typeof useTheme>;

function WardrobeStep({ t, slot, title, lead }: { t: ThemeT; slot: 'tops' | 'bottoms'; title: string; lead: string }) {
  return (
    <>
      <Text style={[styles.title, { color: t.ink, fontFamily: fonts.display }]}>{title}</Text>
      <Lead t={t}>{lead}</Lead>
      <View style={{ marginTop: 18 }}>
        <SwatchGrid slot={slot} />
      </View>
    </>
  );
}

function Lead({ children, t }: { children: React.ReactNode; t: ThemeT }) {
  return <Text style={[styles.lead, { color: t.muted, fontFamily: fonts.uiRegular }]}>{children}</Text>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingTop: 8 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 5, width: 60 },
  backTxt: { fontSize: 13 },
  dots: { flexDirection: 'row', gap: 7 },
  dot: { height: 7, borderRadius: 99 },
  body: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 26 },
  eyebrow: { fontSize: 10, letterSpacing: 2.4, marginTop: 8 },
  title: { fontSize: 30, lineHeight: 33, marginTop: 14, marginBottom: 8, letterSpacing: -0.4 },
  lead: { fontSize: 14, lineHeight: 21, maxWidth: 340 },
  label: { fontSize: 10, letterSpacing: 1.6, marginTop: 22, marginBottom: 9 },
  note: { fontSize: 12.5, lineHeight: 19, marginTop: 18, borderLeftWidth: 2, paddingLeft: 12 },
  foot: { paddingHorizontal: 22, paddingTop: 12 },
});
