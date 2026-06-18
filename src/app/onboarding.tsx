import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, BackHandler, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CLOTH, DEPTHS, comboUniverse, skinNote, skinObj, type ClothType } from '@/engine';
import { BuildingOverlay } from '@/components/BuildingOverlay';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { SkinGrid } from '@/components/SkinGrid';
import { SwatchGrid } from '@/components/SwatchGrid';
import { extractColors } from '@/lib/extractColors';
import { extractSkinDepth } from '@/lib/extractSkinDepth';
import { pickImage, type PickSource } from '@/lib/pickImage';
import { useStore } from '@/store/useStore';
import { fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/useTheme';

export default function Onboarding() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [building, setBuilding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState('');
  const [topsTags, setTopsTags] = useState<ClothType[]>([]);
  const [bottomsTags, setBottomsTags] = useState<ClothType[]>([]);

  const depth = useStore((s) => s.depth);
  const tops = useStore((s) => s.tops);
  const bottoms = useStore((s) => s.bottoms);
  const setDepth = useStore((s) => s.setDepth);
  const setColors = useStore((s) => s.setColors);
  const addTypeToColors = useStore((s) => s.addTypeToColors);
  const completeSetup = useStore((s) => s.completeSetup);
  const regenerate = useStore((s) => s.regenerate);

  const total = useMemo(
    () => comboUniverse(tops, bottoms, skinObj(depth)).length,
    [tops, bottoms, depth]
  );

  // Android back: step backwards through onboarding (and block during building).
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (building) return true;
      if (step > 0) {
        setHint('');
        setStep(step - 1);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [step, building]);

  const scanSkin = async (source: PickSource) => {
    setBusy(true);
    setHint('');
    const uri = await pickImage(source);
    if (uri) {
      const d = await extractSkinDepth(uri);
      if (d) {
        setDepth(d);
        setHint(`Detected ${(DEPTHS.find((x) => x.id === d) || DEPTHS[2]).name} — adjust below if needed.`);
      } else {
        setHint("Couldn't read that — pick a shade below.");
      }
    }
    setBusy(false);
  };

  const scanWardrobe = async (slot: 'tops' | 'bottoms', source: PickSource) => {
    setBusy(true);
    setHint('');
    const uri = await pickImage(source);
    if (uri) {
      const colors = await extractColors(uri);
      if (colors.length) {
        setColors(slot, colors);
        setHint(`Read ${colors.length} colour${colors.length > 1 ? 's' : ''} — fix any below.`);
      } else {
        setHint("Couldn't read colours — tap them below.");
      }
    }
    setBusy(false);
  };

  const goToBottoms = () => {
    topsTags.forEach((tag) => addTypeToColors(tops, tag));
    setHint('');
    setStep(2);
  };
  const finish = () => {
    bottomsTags.forEach((tag) => addTypeToColors(bottoms, tag));
    setBuilding(true);
  };
  const onBuilt = () => {
    completeSetup();
    regenerate();
    router.replace('/main');
  };

  const eyebrow = `Step ${step + 1} of 3`;

  return (
    <View style={[styles.root, { backgroundColor: t.bg, paddingTop: insets.top }]}>
      <View style={styles.top}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => step > 0 && (setHint(''), setStep(step - 1))}
          style={[styles.back, { opacity: step === 0 ? 0 : 1 }]}
          disabled={step === 0}
        >
          <Icon name="chevron-left" size={15} color={t.muted} />
          <Text style={[styles.backTxt, { color: t.muted, fontFamily: fonts.ui }]}>Back</Text>
        </Pressable>
        <View style={styles.dots}>
          {[0, 1, 2].map((nm) => (
            <View key={nm} style={[styles.dot, { backgroundColor: nm <= step ? t.accent : t.track, width: nm === step ? 22 : 7 }]} />
          ))}
        </View>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Animated.View key={step} entering={FadeInDown.duration(420)}>
          <Text style={[styles.eyebrow, { color: t.accent, fontFamily: fonts.mono }]}>{eyebrow.toUpperCase()}</Text>

          {step === 0 && (
            <>
              <Title t={t}>
                First, your <Em t={t}>skin tone.</Em>
              </Title>
              <Lead t={t}>Scan your face or pick a shade — we read depth only, to gently nudge what flatters you. It never rules a colour out.</Lead>
              <ScanButtons t={t} busy={busy} onCamera={() => scanSkin('camera')} onGallery={() => scanSkin('gallery')} />
              {!!hint && <Text style={[styles.hint, { color: t.muted, fontFamily: fonts.uiRegular }]}>{hint}</Text>}
              <Text style={[styles.label, { color: t.faint, fontFamily: fonts.mono }]}>OR PICK A DEPTH</Text>
              <SkinGrid value={depth} onSelect={(d) => { setHint(''); setDepth(d); }} />
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
              title="Your tops."
              lead="Snap or upload a photo and we'll read the colours — or tap them below."
              busy={busy}
              hint={hint}
              onScan={(src) => scanWardrobe('tops', src)}
              tags={topsTags}
              onToggleTag={(tag) => setTopsTags((p) => (p.includes(tag) ? p.filter((x) => x !== tag) : [...p, tag]))}
            />
          )}

          {step === 2 && (
            <WardrobeStep
              t={t}
              slot="bottoms"
              title="Now your bottoms."
              lead="Same idea — a photo of your trousers, jeans and chinos, or tap the colours."
              busy={busy}
              hint={hint}
              onScan={(src) => scanWardrobe('bottoms', src)}
              tags={bottomsTags}
              onToggleTag={(tag) => setBottomsTags((p) => (p.includes(tag) ? p.filter((x) => x !== tag) : [...p, tag]))}
            />
          )}
        </Animated.View>
      </ScrollView>

      <View style={[styles.foot, { paddingBottom: insets.bottom + 18 }]}>
        {step === 0 && <Button title="Continue" onPress={() => { setHint(''); setStep(1); }} disabled={!depth} icon={<Icon name="chevron-right" size={18} color={t.onGold} />} />}
        {step === 1 && <Button title="Continue" onPress={goToBottoms} disabled={tops.length === 0} icon={<Icon name="chevron-right" size={18} color={t.onGold} />} />}
        {step === 2 && <Button title="See my combinations" onPress={finish} disabled={bottoms.length === 0} icon={<Icon name="chevron-right" size={18} color={t.onGold} />} />}
      </View>

      {building && <BuildingOverlay total={total} onDone={onBuilt} />}
    </View>
  );
}

type ThemeT = ReturnType<typeof useTheme>;

function ScanButtons({ t, busy, onCamera, onGallery }: { t: ThemeT; busy: boolean; onCamera: () => void; onGallery: () => void }) {
  return (
    <View style={{ marginTop: 22, gap: 10 }}>
      {busy ? (
        <View style={[styles.busy, { borderColor: t.line, backgroundColor: t.glass }]}>
          <ActivityIndicator color={t.accent} />
          <Text style={[styles.busyTxt, { color: t.muted, fontFamily: fonts.uiRegular }]}>Reading colours…</Text>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Button title="Scan with camera" variant="goldline" onPress={onCamera} icon={<Icon name="grid" size={18} color={t.goldSoft} />} />
          </View>
          <View style={{ flex: 1 }}>
            <Button title="Gallery" variant="ghost" onPress={onGallery} />
          </View>
        </View>
      )}
    </View>
  );
}

function WardrobeStep({
  t, slot, title, lead, busy, hint, onScan, tags, onToggleTag,
}: {
  t: ThemeT; slot: 'tops' | 'bottoms'; title: string; lead: string; busy: boolean; hint: string;
  onScan: (src: PickSource) => void; tags: ClothType[]; onToggleTag: (tag: ClothType) => void;
}) {
  return (
    <>
      <Text style={[styles.title, { color: t.ink, fontFamily: fonts.display }]}>{title}</Text>
      <Lead t={t}>{lead}</Lead>
      <ScanButtons t={t} busy={busy} onCamera={() => onScan('camera')} onGallery={() => onScan('gallery')} />
      {!!hint && <Text style={[styles.hint, { color: t.muted, fontFamily: fonts.uiRegular }]}>{hint}</Text>}
      <View style={{ marginTop: 18 }}>
        <SwatchGrid slot={slot} />
      </View>
      <Text style={[styles.label, { color: t.faint, fontFamily: fonts.mono }]}>THESE ARE — OPTIONAL</Text>
      <View style={styles.tagRow}>
        {CLOTH.map((ct) => {
          const on = tags.includes(ct.id as ClothType);
          return (
            <Pressable
              key={ct.id}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              onPress={() => onToggleTag(ct.id as ClothType)}
              style={[styles.tag, { backgroundColor: on ? t.accent : t.glass, borderColor: on ? 'transparent' : t.line }]}
            >
              <Text style={[styles.tagTxt, { color: on ? t.onGold : t.muted, fontFamily: fonts.uiSemi }]}>{ct.name}</Text>
            </Pressable>
          );
        })}
      </View>
    </>
  );
}

function Title({ children, t }: { children: React.ReactNode; t: ThemeT }) {
  return <Text style={[styles.title, { color: t.ink, fontFamily: fonts.display }]}>{children}</Text>;
}
function Em({ children, t }: { children: React.ReactNode; t: ThemeT }) {
  return <Text style={{ color: t.accent, fontFamily: fonts.displayItalic }}>{children}</Text>;
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
  hint: { fontSize: 12.5, lineHeight: 18, marginTop: 12 },
  busy: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 16, borderRadius: 18, borderWidth: 1 },
  busyTxt: { fontSize: 13 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1 },
  tagTxt: { fontSize: 12.5 },
  foot: { paddingHorizontal: 22, paddingTop: 12 },
});
