import { StyleSheet, Text, View } from 'react-native';
import { gapSuggestions, skinObj } from '@/engine';
import { BuyCard } from '@/components/BuyCard';
import { Icon } from '@/components/Icon';
import { useStore } from '@/store/useStore';
import { fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/useTheme';

/** "What to buy" gap engine UI — the one or two colours that unlock the most new looks. */
export function WhatToBuyPane() {
  const t = useTheme();
  const tops = useStore((s) => s.tops);
  const bottoms = useStore((s) => s.bottoms);
  const depth = useStore((s) => s.depth);

  const { asTops, asBottoms } = gapSuggestions(tops, bottoms, skinObj(depth));
  const empty = asTops.length === 0 && asBottoms.length === 0;

  return (
    <View>
      <View style={styles.intro}>
        <Text style={[styles.eyebrow, { color: t.accent, fontFamily: fonts.mono }]}>SMART ADDITIONS</Text>
        <Text style={[styles.h, { color: t.ink, fontFamily: fonts.display }]}>One piece, more outfits</Text>
        <Text style={[styles.p, { color: t.muted, fontFamily: fonts.uiRegular }]}>
          Based on the colours you own and what flatters you, these unlock the most new combinations.
        </Text>
      </View>

      {empty ? (
        <View style={styles.empty}>
          <View style={[styles.emptyIc, { backgroundColor: t.glass, borderColor: t.line }]}>
            <Icon name="check" size={25} color={t.accent} strokeWidth={2.4} />
          </View>
          <Text style={[styles.emptyH, { color: t.ink, fontFamily: fonts.display }]}>You&apos;re well covered</Text>
          <Text style={[styles.emptyP, { color: t.muted, fontFamily: fonts.uiRegular }]}>
            Your current colours already pair into plenty of looks.
          </Text>
        </View>
      ) : (
        <>
          {asBottoms.length > 0 && (
            <View style={styles.section}>
              <SectionHeading t={t}>Bottoms to buy</SectionHeading>
              {asBottoms.slice(0, 3).map((s, i) => (
                <BuyCard key={s.c} suggestion={s} slot="bottoms" index={i} />
              ))}
            </View>
          )}
          {asTops.length > 0 && (
            <View style={styles.section}>
              <SectionHeading t={t}>Tops to buy</SectionHeading>
              {asTops.slice(0, 3).map((s, i) => (
                <BuyCard key={s.c} suggestion={s} slot="tops" index={i} />
              ))}
            </View>
          )}
        </>
      )}

      <Text style={[styles.foot, { color: t.faint, fontFamily: fonts.uiRegular }]}>
        Suggestions are about versatility, not trends — buy only what earns its place.
      </Text>
    </View>
  );
}

function SectionHeading({ t, children }: { t: ReturnType<typeof useTheme>; children: React.ReactNode }) {
  return (
    <View style={styles.secHWrap}>
      <Text style={[styles.secH, { color: t.ink, fontFamily: fonts.display }]}>{children}</Text>
      <View style={[styles.secAccent, { backgroundColor: t.accent }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  intro: { marginTop: 4, marginBottom: 16 },
  eyebrow: { fontSize: 10, letterSpacing: 2.2, marginBottom: 8 },
  h: { fontSize: 23, marginBottom: 6 },
  p: { fontSize: 13, lineHeight: 20 },
  section: { marginBottom: 26 },
  secHWrap: { marginBottom: 14, marginLeft: 2 },
  secH: { fontSize: 28, letterSpacing: -0.4 },
  secAccent: { width: 40, height: 3, borderRadius: 2, marginTop: 7 },
  foot: { fontSize: 11.5, lineHeight: 17, marginTop: 14, textAlign: 'center' },
  empty: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 },
  emptyIc: { width: 56, height: 56, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyH: { fontSize: 19, marginBottom: 7 },
  emptyP: { fontSize: 13, lineHeight: 20, textAlign: 'center', maxWidth: 230 },
});
