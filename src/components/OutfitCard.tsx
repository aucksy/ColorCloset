import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { LEATHER_HEX, catFor, leatherFor, shadeHex, skinObj, whyFor } from '@/engine';
import { GarmentSilhouette } from '@/components/GarmentSilhouette';
import { Icon } from '@/components/Icon';
import { useStore } from '@/store/useStore';
import { fonts } from '@/theme/fonts';
import { useMotion } from '@/theme/useMotion';
import { useTheme } from '@/theme/useTheme';

export function OutfitCard() {
  const t = useTheme();
  const motion = useMotion();
  const current = useStore((s) => s.current);
  const name = useStore((s) => s.currentName);
  const style = useStore((s) => s.style);
  const depth = useStore((s) => s.depth);
  const shadeTops = useStore((s) => s.shadeTops);
  const shadeBottoms = useStore((s) => s.shadeBottoms);
  const worn = useStore((s) => s.worn);

  if (!current) return null;
  const { t: topK, b: botK } = current;
  const skin = skinObj(depth);
  const catLabel = style ? style.toUpperCase() : catFor(topK, botK);
  const topHex = shadeHex(topK, shadeTops[topK]?.[0]);
  const botHex = shadeHex(botK, shadeBottoms[botK]?.[0]);
  const why = whyFor(topK, botK, style);
  const flatterHit = skin.flatter.includes(topK) || skin.flatter.includes(botK);
  const id = `${topK}|${botK}`;
  const wornDate = worn[id];
  const leather = leatherFor(botK);
  const leatherHex = LEATHER_HEX[leather];

  return (
    <View style={styles.wrap}>
      <Animated.View key={`hdr-${id}`} entering={FadeInDown.duration(motion.base)} style={styles.center}>
        <Text style={[styles.cat, { color: t.accent, fontFamily: fonts.mono }]}>{catLabel}</Text>
        <Text style={[styles.name, { color: t.ink, fontFamily: fonts.display }]}>{name}</Text>
      </Animated.View>

      <View style={styles.sils}>
        <View style={styles.sil}>
          <GarmentSilhouette kind="top" color={topHex} duration={motion.slow} />
          <Text style={[styles.lab, { color: t.ink, fontFamily: fonts.uiBold }]}>{topK}</Text>
          <Text style={[styles.sub, { color: t.muted, fontFamily: fonts.mono }]}>SHIRT</Text>
        </View>
        <Text style={[styles.plus, { color: t.faint, fontFamily: fonts.display }]}>+</Text>
        <View style={styles.sil}>
          <GarmentSilhouette kind="bottom" color={botHex} duration={motion.slow} />
          <Text style={[styles.lab, { color: t.ink, fontFamily: fonts.uiBold }]}>{botK}</Text>
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

        <View style={styles.pills}>
          {flatterHit && (
            <View style={[styles.pill, { backgroundColor: 'rgba(201,168,106,0.10)', borderColor: 'rgba(201,168,106,0.22)' }]}>
              <Icon name="star" size={13} color={t.accent} />
              <Text style={[styles.pillTxt, { color: t.accent, fontFamily: fonts.uiSemi }]}>
                Flatters your {skin.short.toLowerCase()} skin
              </Text>
            </View>
          )}
          {wornDate && (
            <View style={[styles.pill, { backgroundColor: t.glass, borderColor: t.line }]}>
              <Icon name="clock" size={13} color={t.muted} />
              <Text style={[styles.pillTxt, { color: t.muted, fontFamily: fonts.uiSemi }]}>Worn {wornDate}</Text>
            </View>
          )}
        </View>

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
  lab: { marginTop: 11, fontSize: 12.5 },
  sub: { fontSize: 9, letterSpacing: 0.8 },
  plus: { fontSize: 22, alignSelf: 'center', marginBottom: 36 },
  leather: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 14, marginTop: 14, alignSelf: 'stretch' },
  leatherLab: { fontSize: 9, letterSpacing: 1.4 },
  leatherItems: { flexDirection: 'row', gap: 16, flex: 1, justifyContent: 'flex-end' },
  leatherItem: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  leatherSw: { width: 16, height: 16, borderRadius: 5, borderWidth: 1 },
  leatherTxt: { fontSize: 12 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginTop: 12 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 99, borderWidth: 1 },
  pillTxt: { fontSize: 11.5 },
  why: { borderWidth: 1, borderRadius: 16, padding: 15, marginTop: 16, width: '100%' },
  whyTxt: { fontSize: 13.5, lineHeight: 21 },
});
