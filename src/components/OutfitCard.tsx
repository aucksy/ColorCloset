import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { catFor, shadeHex, skinObj, whyFor } from '@/engine';
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
  const occasion = useStore((s) => s.occasion);
  const style = useStore((s) => s.style);
  const depth = useStore((s) => s.depth);
  const undertone = useStore((s) => s.undertone);
  const shadeTops = useStore((s) => s.shadeTops);
  const shadeBottoms = useStore((s) => s.shadeBottoms);
  const worn = useStore((s) => s.worn);

  if (!current) return null;
  const { t: topK, b: botK } = current;
  const skin = skinObj(depth, undertone);
  const catLabel = style ? style.toUpperCase() : catFor(topK, botK);
  const topHex = shadeHex(topK, shadeTops[topK]);
  const botHex = shadeHex(botK, shadeBottoms[botK]);
  const why = whyFor(topK, botK, occasion, style);
  const flatterHit = skin.flatter.includes(topK) || skin.flatter.includes(botK);
  const id = `${topK}|${botK}`;
  const wornDate = worn[id];

  return (
    <View style={styles.wrap}>
      <Animated.View key={`hdr-${id}`} entering={FadeInDown.duration(motion.base)} style={styles.center}>
        <Text style={[styles.cat, { color: t.accent, fontFamily: fonts.mono }]}>
          {catLabel} · {occasion.toUpperCase()}
        </Text>
        <Text style={[styles.name, { color: t.ink, fontFamily: fonts.display }]}>{name}</Text>
      </Animated.View>

      <View style={styles.sils}>
        <View style={styles.sil}>
          <GarmentSilhouette kind="top" color={topHex} duration={motion.slow} />
          <Text style={[styles.lab, { color: t.ink, fontFamily: fonts.uiBold }]}>{topK}</Text>
          <Text style={[styles.sub, { color: t.muted, fontFamily: fonts.mono }]}>TOP</Text>
        </View>
        <Text style={[styles.plus, { color: t.faint, fontFamily: fonts.display }]}>+</Text>
        <View style={styles.sil}>
          <GarmentSilhouette kind="bottom" color={botHex} duration={motion.slow} />
          <Text style={[styles.lab, { color: t.ink, fontFamily: fonts.uiBold }]}>{botK}</Text>
          <Text style={[styles.sub, { color: t.muted, fontFamily: fonts.mono }]}>BOTTOM</Text>
        </View>
      </View>

      <Animated.View key={`ftr-${id}`} entering={FadeIn.duration(motion.base)} style={styles.center}>
      <View style={styles.pills}>
        {flatterHit && (
          <View style={[styles.pill, { backgroundColor: 'rgba(201,168,106,0.10)', borderColor: 'rgba(201,168,106,0.22)' }]}>
            <Icon name="star" size={13} color={t.accent} />
            <Text style={[styles.pillTxt, { color: t.accent, fontFamily: fonts.uiSemi }]}>
              Flatters your {skin.short.toLowerCase()} tone
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
            <Text
              key={i}
              style={seg.bold ? { color: t.accent, fontFamily: fonts.uiBold } : undefined}
            >
              {seg.text}
            </Text>
          ))}
        </Text>
      </View>
      </Animated.View>
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
  pills: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginTop: 12 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 99,
    borderWidth: 1,
  },
  pillTxt: { fontSize: 11.5 },
  why: { borderWidth: 1, borderRadius: 16, padding: 15, marginTop: 16, width: '100%' },
  whyTxt: { fontSize: 13.5, lineHeight: 21 },
});
