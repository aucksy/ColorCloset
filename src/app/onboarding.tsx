import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TONES, comboUniverse, skinNote, skinObj, type ToneId } from '@/engine';
import { BuildingOverlay } from '@/components/BuildingOverlay';
import { Button } from '@/components/Button';
import { ChipRow } from '@/components/ChipRow';
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
  const [step, setStep] = useState(0);
  const [building, setBuilding] = useState(false);

  const depth = useStore((s) => s.depth);
  const undertone = useStore((s) => s.undertone);
  const tops = useStore((s) => s.tops);
  const bottoms = useStore((s) => s.bottoms);
  const setDepth = useStore((s) => s.setDepth);
  const setUndertone = useStore((s) => s.setUndertone);
  const completeSetup = useStore((s) => s.completeSetup);
  const regenerate = useStore((s) => s.regenerate);

  const total = useMemo(
    () => comboUniverse(tops, bottoms, skinObj(depth, undertone)).length,
    [tops, bottoms, depth, undertone]
  );

  const onBuilt = () => {
    completeSetup();
    regenerate();
    router.replace('/main');
  };

  const eyebrow = `Step ${step + 1} of 3`;

  return (
    <View style={[styles.root, { backgroundColor: t.bg, paddingTop: insets.top }]}>
      {/* top: back + progress dots */}
      <View style={styles.top}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => step > 0 && setStep(step - 1)}
          style={[styles.back, { opacity: step === 0 ? 0 : 1 }]}
          disabled={step === 0}
        >
          <Icon name="chevron-left" size={15} color={t.muted} />
          <Text style={[styles.backTxt, { color: t.muted, fontFamily: fonts.ui }]}>Back</Text>
        </Pressable>
        <View style={styles.dots}>
          {[0, 1, 2].map((n) => (
            <View
              key={n}
              style={[
                styles.dot,
                { backgroundColor: n <= step ? t.accent : t.track, width: n === step ? 22 : 7 },
              ]}
            />
          ))}
        </View>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={[styles.eyebrow, { color: t.accent, fontFamily: fonts.mono }]}>
          {eyebrow.toUpperCase()}
        </Text>

        {step === 0 && (
          <>
            <Title t={t}>
              First, your <Em t={t}>skin tone.</Em>
            </Title>
            <Lead t={t}>
              We use it gently — to nudge which combinations you&apos;ll likely love. It never rules a
              colour out.
            </Lead>
            <View style={{ marginTop: 26 }}>
              <SkinGrid value={depth} onSelect={setDepth} />
            </View>
            <Text style={[styles.label, { color: t.faint, fontFamily: fonts.mono }]}>
              UNDERTONE — OPTIONAL
            </Text>
            <ChipRow
              items={TONES.map((x) => ({ value: x.id as ToneId, label: x.name }))}
              value={undertone}
              onChange={setUndertone}
            />
            {depth && (
              <Text style={[styles.note, { color: t.muted, borderLeftColor: t.accent, fontFamily: fonts.uiRegular }]}>
                {skinNote(depth, undertone)}
              </Text>
            )}
          </>
        )}

        {step === 1 && (
          <>
            <Title t={t}>
              Your <Em t={t}>tops.</Em>
            </Title>
            <Lead t={t}>Tap the colours of your shirts and tees — pick a shade for each. No tagging.</Lead>
            <View style={{ marginTop: 22 }}>
              <SwatchGrid slot="tops" />
            </View>
          </>
        )}

        {step === 2 && (
          <>
            <Title t={t}>
              Now your <Em t={t}>bottoms.</Em>
            </Title>
            <Lead t={t}>Trousers, chinos, jeans — same idea. Tap the colours you own.</Lead>
            <View style={{ marginTop: 22 }}>
              <SwatchGrid slot="bottoms" />
            </View>
          </>
        )}
      </ScrollView>

      <View style={[styles.foot, { paddingBottom: insets.bottom + 18 }]}>
        {step === 0 && (
          <Button title="Continue" onPress={() => setStep(1)} disabled={!depth} icon={<Icon name="chevron-right" size={18} color={t.onGold} />} />
        )}
        {step === 1 && (
          <Button title="Continue" onPress={() => setStep(2)} disabled={tops.length === 0} icon={<Icon name="chevron-right" size={18} color={t.onGold} />} />
        )}
        {step === 2 && (
          <Button
            title="See my combinations"
            onPress={() => setBuilding(true)}
            disabled={bottoms.length === 0}
            icon={<Icon name="chevron-right" size={18} color={t.onGold} />}
          />
        )}
      </View>

      {building && <BuildingOverlay total={total} onDone={onBuilt} />}
    </View>
  );
}

function Title({ children, t }: { children: React.ReactNode; t: ReturnType<typeof useTheme> }) {
  return <Text style={[styles.title, { color: t.ink, fontFamily: fonts.display }]}>{children}</Text>;
}
function Em({ children, t }: { children: React.ReactNode; t: ReturnType<typeof useTheme> }) {
  return <Text style={{ color: t.accent, fontFamily: fonts.displayItalic }}>{children}</Text>;
}
function Lead({ children, t }: { children: React.ReactNode; t: ReturnType<typeof useTheme> }) {
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
  lead: { fontSize: 14, lineHeight: 21, maxWidth: 330 },
  label: { fontSize: 10, letterSpacing: 1.6, marginTop: 22, marginBottom: 9 },
  note: { fontSize: 12.5, lineHeight: 19, marginTop: 18, borderLeftWidth: 2, paddingLeft: 12 },
  foot: { paddingHorizontal: 22, paddingTop: 12 },
});
