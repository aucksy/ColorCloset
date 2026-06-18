import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { hx, shadeHex, type BuySuggestion } from '@/engine';
import { useStore } from '@/store/useStore';
import { fonts } from '@/theme/fonts';
import { useMotion } from '@/theme/useMotion';
import { useTheme } from '@/theme/useTheme';

interface Props {
  suggestion: BuySuggestion;
  /** Which slot the candidate would be added to. */
  slot: 'tops' | 'bottoms';
  index: number;
}

export function BuyCard({ suggestion, slot, index }: Props) {
  const t = useTheme();
  const motion = useMotion();
  const shadeTops = useStore((s) => s.shadeTops);
  const shadeBottoms = useStore((s) => s.shadeBottoms);
  const { c, pairs, fl } = suggestion;
  const shown = pairs.slice(0, 6);
  const extra = pairs.length - shown.length;

  return (
    <Animated.View
      entering={FadeInDown.duration(motion.base).delay(index * 70)}
      style={[styles.card, { backgroundColor: t.glass, borderColor: t.line }]}
    >
      <View style={styles.head}>
        <View style={[styles.sw, { backgroundColor: hx(c), borderColor: t.line2 }]} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[styles.name, { color: t.ink, fontFamily: fonts.display }]}>{c}</Text>
          <Text style={[styles.meta, { color: t.muted, fontFamily: fonts.uiRegular }]}>
            {fl && <Text style={{ color: t.accent, fontFamily: fonts.uiBold }}>flatters you · </Text>}
            {pairs.length} new look{pairs.length > 1 ? 's' : ''}
          </Text>
        </View>
        <LinearGradient colors={t.goldGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.unlock}>
          <Text style={[styles.unlockN, { color: t.onGold, fontFamily: fonts.monoBold }]}>+{pairs.length}</Text>
          <Text style={[styles.unlockL, { color: t.onGold, fontFamily: fonts.mono }]}>LOOKS</Text>
        </LinearGradient>
      </View>

      <View style={[styles.combos, { borderTopColor: t.line }]}>
        <Text style={[styles.lead, { color: t.faint, fontFamily: fonts.mono }]}>
          {slot === 'bottoms' ? 'PAIRS WITH YOUR TOPS' : 'PAIRS WITH YOUR BOTTOMS'}
        </Text>
        <View style={styles.grid}>
          {shown.map((piece) => {
            const topHex = slot === 'bottoms' ? shadeHex(piece, shadeTops[piece]) : hx(c);
            const botHex = slot === 'bottoms' ? hx(c) : shadeHex(piece, shadeBottoms[piece]);
            return (
              <View key={piece} style={styles.item}>
                <View style={[styles.pair, { borderColor: t.line2 }]}>
                  <View style={{ flex: 1, backgroundColor: topHex }} />
                  <View style={{ flex: 1, backgroundColor: botHex }} />
                </View>
                <Text numberOfLines={1} style={[styles.piece, { color: t.muted, fontFamily: fonts.uiRegular }]}>
                  {piece}
                </Text>
              </View>
            );
          })}
          {extra > 0 && (
            <Text style={[styles.more, { color: t.muted, fontFamily: fonts.monoBold }]}>+{extra}</Text>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 15, borderRadius: 20, borderWidth: 1, marginBottom: 11 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  sw: { width: 50, height: 50, borderRadius: 14, borderWidth: 1 },
  name: { fontSize: 18 },
  meta: { fontSize: 11.5, marginTop: 2 },
  unlock: { paddingVertical: 7, paddingHorizontal: 11, borderRadius: 11, alignItems: 'center' },
  unlockN: { fontSize: 13 },
  unlockL: { fontSize: 8, letterSpacing: 0.5, opacity: 0.85 },
  combos: { marginTop: 13, paddingTop: 13, borderTopWidth: 1 },
  lead: { fontSize: 9.5, letterSpacing: 1.4, marginBottom: 11 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'flex-start' },
  item: { width: 52, alignItems: 'center', gap: 5 },
  pair: { width: 46, height: 46, borderRadius: 12, overflow: 'hidden', borderWidth: 1 },
  piece: { fontSize: 10, textAlign: 'center', maxWidth: 52 },
  more: { fontSize: 12, alignSelf: 'center', paddingTop: 14, paddingHorizontal: 4 },
});
