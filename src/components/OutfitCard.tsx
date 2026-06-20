import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import {
  LEATHER_HEX,
  catFor,
  comboWhy,
  findCurated,
  leatherFor,
  shadeHex,
  shadeHexByName,
  shadeName,
  skinObj,
  tierNote,
} from '@/engine';
import { GarmentSilhouette } from '@/components/GarmentSilhouette';
import { Icon } from '@/components/Icon';
import { useActiveWardrobe, useStore } from '@/store/useStore';
import { fonts } from '@/theme/fonts';
import { useMotion } from '@/theme/useMotion';
import { useTheme } from '@/theme/useTheme';

export function OutfitCard() {
  const t = useTheme();
  const motion = useMotion();
  const current = useStore((s) => s.current);
  const name = useStore((s) => s.currentName);
  const mst = useStore((s) => s.mst);
  const gender = useStore((s) => s.gender);
  const mode = useStore((s) => s.mode);
  const w = useActiveWardrobe();

  if (!current) return null;
  const { t: topK, b: botK } = current;

  const skin = skinObj(mst);
  // Curated metadata for this gender×mode bucket (null when no profile gender yet).
  const cur = gender ? findCurated(topK, botK, gender, mode) : null;

  // Owned shade indices for the active bucket (first owned shade per base).
  const topIdx = w.shadeTops[topK]?.[0];
  const botIdx = w.shadeBottoms[botK]?.[0];

  // Display names + silhouette colours: curated shade names/hexes when curated,
  // otherwise the owned (or default) shade for the base.
  const topName = cur ? cur.topShade : shadeName(topK, topIdx);
  const botName = cur ? cur.bottomShade : shadeName(botK, botIdx);
  const topHex = cur ? shadeHexByName(cur.topShade) : shadeHex(topK, topIdx);
  const botHex = cur ? shadeHexByName(cur.bottomShade) : shadeHex(botK, botIdx);

  // Eyebrow: category label + (specific curated region, e.g. "JAPANESE/TOKYO").
  const catLabel = catFor(topK, botK, gender ?? undefined, mode);
  const regionSpecific = cur && !cur.region.startsWith('Universal');
  const eyebrow = regionSpecific ? `${catLabel} · ${cur!.region.toUpperCase()}` : catLabel;

  // "Why" rationale (named-shade aware, shade names bold).
  const why = comboWhy({ t: topK, b: botK, curated: cur, topShadeIdx: topIdx, bottomShadeIdx: botIdx });
  // Tier line — non-null ONLY when a curated combo flatters the user's specific tier.
  const tier = tierNote(cur, skin);

  const id = `${topK}|${botK}`;
  const wornDate = w.worn[id];
  const leather = leatherFor(botK);
  const leatherHex = LEATHER_HEX[leather];

  return (
    <View style={styles.wrap}>
      <Animated.View key={`hdr-${id}`} entering={FadeInDown.duration(motion.base)} style={styles.center}>
        <Text style={[styles.cat, { color: t.accent, fontFamily: fonts.mono }]}>{eyebrow}</Text>
        <Text style={[styles.name, { color: t.ink, fontFamily: fonts.display }]}>{name}</Text>
      </Animated.View>

      <View style={styles.sils}>
        <View style={styles.sil}>
          <GarmentSilhouette kind="top" color={topHex} duration={motion.slow} />
          <Text style={[styles.lab, { color: t.ink, fontFamily: fonts.uiBold }]}>{topName}</Text>
          {topName !== topK && (
            <Text style={[styles.base, { color: t.faint, fontFamily: fonts.uiRegular }]}>{topK}</Text>
          )}
          <Text style={[styles.sub, { color: t.muted, fontFamily: fonts.mono }]}>SHIRT</Text>
        </View>
        <Text style={[styles.plus, { color: t.faint, fontFamily: fonts.display }]}>+</Text>
        <View style={styles.sil}>
          <GarmentSilhouette kind="bottom" color={botHex} duration={motion.slow} />
          <Text style={[styles.lab, { color: t.ink, fontFamily: fonts.uiBold }]}>{botName}</Text>
          {botName !== botK && (
            <Text style={[styles.base, { color: t.faint, fontFamily: fonts.uiRegular }]}>{botK}</Text>
          )}
          <Text style={[styles.sub, { color: t.muted, fontFamily: fonts.mono }]}>TROUSERS</Text>
        </View>
      </View>

      <Animated.View key={`ftr-${id}`} entering={FadeIn.duration(motion.base)} style={styles.center}>
        {/* belt + shoe recommendation (office attire) — same leather for both */}
        <View style={[styles.leather, { backgroundColor: t.glass, borderColor: t.line }]}>
          <Text style={[styles.leatherLab, { color: t.faint, fontFamily: fonts.mono }]}>FINISH WITH</Text>
          <View style={styles.leatherItems}>
            <LeatherItem hex={leatherHex} ring={t.line2} label="Belt" name={leather} t={t} />
            <LeatherItem hex={leatherHex} ring={t.line2} label="Shoes" name={leather} t={t} />
          </View>
        </View>

        {(tier || wornDate) && (
          <View style={styles.pills}>
            {wornDate && (
              <View style={[styles.pill, { backgroundColor: t.glass, borderColor: t.line }]}>
                <Icon name="clock" size={13} color={t.muted} />
                <Text style={[styles.pillTxt, { color: t.muted, fontFamily: fonts.uiSemi }]}>Worn {wornDate}</Text>
              </View>
            )}
          </View>
        )}

        {tier && (
          <Text style={[styles.tier, { color: t.accent, fontFamily: fonts.uiSemi }]}>{tier}</Text>
        )}

        <View style={[styles.why, { backgroundColor: t.glass, borderColor: t.line }]}>
          <Text style={[styles.whyTxt, { color: t.ink, fontFamily: fonts.uiRegular }]}>
            {why.map((seg, i) => (
              <Text key={i} style={seg.bold ? { color: t.accent, fontFamily: fonts.uiBold } : undefined}>
                {seg.text}
              </Text>
            ))}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

function LeatherItem({ hex, ring, label, name, t }: { hex: string; ring: string; label: string; name: string; t: ReturnType<typeof useTheme> }) {
  return (
    <View style={styles.leatherItem}>
      <View style={[styles.leatherSw, { backgroundColor: hex, borderColor: ring }]} />
      <Text style={[styles.leatherTxt, { color: t.ink, fontFamily: fonts.uiSemi }]}>
        {label} · <Text style={{ color: t.muted }}>{name}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingTop: 8, paddingHorizontal: 4 },
  center: { alignItems: 'center', width: '100%' },
  cat: { fontSize: 10, letterSpacing: 2, textAlign: 'center' },
  name: { fontSize: 30, marginTop: 7, marginBottom: 14, textAlign: 'center', letterSpacing: -0.3 },
  sils: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 16, minHeight: 210, width: '100%' },
  sil: { width: 130, alignItems: 'center' },
  lab: { marginTop: 11, fontSize: 12.5, textAlign: 'center' },
  base: { fontSize: 10, marginTop: 2, textAlign: 'center' },
  sub: { fontSize: 9, letterSpacing: 0.8, marginTop: 3 },
  plus: { fontSize: 22, alignSelf: 'center', marginBottom: 36 },
  leather: { borderWidth: 1, borderRadius: 14, paddingVertical: 11, paddingHorizontal: 14, marginTop: 14, alignSelf: 'stretch', gap: 9 },
  leatherLab: { fontSize: 9, letterSpacing: 1.4 },
  leatherItems: { flexDirection: 'row', gap: 22 },
  leatherItem: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  leatherSw: { width: 16, height: 16, borderRadius: 5, borderWidth: 1 },
  leatherTxt: { fontSize: 12 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginTop: 12 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 99, borderWidth: 1 },
  pillTxt: { fontSize: 11.5 },
  tier: { fontSize: 12, marginTop: 12, textAlign: 'center' },
  why: { borderWidth: 1, borderRadius: 16, padding: 15, marginTop: 16, width: '100%' },
  whyTxt: { fontSize: 13.5, lineHeight: 21 },
});
