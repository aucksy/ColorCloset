import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS, KEYS, type ColorKey, type ShadeIndex } from '@/engine';
import { Icon } from '@/components/Icon';
import { useStore } from '@/store/useStore';
import { fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/useTheme';

interface Props {
  slot: 'tops' | 'bottoms';
}

/**
 * The manual colour palette: tap a patch to select; tap shade segments to record
 * which shades (light->dark) you own — you can pick more than one per colour.
 */
export function SwatchGrid({ slot }: Props) {
  const t = useTheme();
  const selected = useStore((s) => (slot === 'tops' ? s.tops : s.bottoms));
  const shades = useStore((s) => (slot === 'tops' ? s.shadeTops : s.shadeBottoms));
  const toggleColor = useStore((s) => s.toggleColor);
  const toggleShade = useStore((s) => s.toggleShade);

  return (
    <View style={styles.grid}>
      {KEYS.map((k: ColorKey) => {
        const on = selected.includes(k);
        const picked = shades[k] ?? [2];
        const fill = COLORS[k].shades[picked[0] ?? 2];
        return (
          <View key={k} style={styles.cellWrap}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={k}
              accessibilityState={{ selected: on }}
              onPress={() => toggleColor(slot, k)}
              style={({ pressed }) => [
                styles.swatch,
                { borderColor: on ? t.accent : 'transparent', transform: [{ scale: pressed ? 0.93 : 1 }] },
              ]}
            >
              <View style={[styles.fill, { backgroundColor: fill }]}>
                {on && (
                  <View style={styles.strip}>
                    {COLORS[k].shades.map((sh, i) => (
                      <Pressable
                        key={i}
                        accessibilityRole="button"
                        accessibilityLabel={`${k} shade ${i + 1} of 5`}
                        accessibilityState={{ selected: picked.includes(i as ShadeIndex) }}
                        onPress={() => toggleShade(slot, k, i as ShadeIndex)}
                        style={[
                          styles.seg,
                          { backgroundColor: sh },
                          picked.includes(i as ShadeIndex) && styles.segActive,
                        ]}
                      />
                    ))}
                  </View>
                )}
              </View>
              {on && (
                <View style={[styles.check, { backgroundColor: t.accent }]}>
                  <Icon name="check" size={13} color={t.onGold} strokeWidth={3} />
                </View>
              )}
              <Text
                style={[styles.name, { color: on ? t.ink : t.muted, fontFamily: fonts.uiSemi }]}
              >
                {k}
              </Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 11 },
  cellWrap: { width: '30%', flexGrow: 1, minWidth: 86 },
  swatch: {
    borderRadius: 18,
    borderWidth: 2.5,
    overflow: 'hidden',
  },
  fill: { height: 92, width: '100%', justifyContent: 'flex-end' },
  strip: { flexDirection: 'row', height: 34, borderTopWidth: 1.5, borderTopColor: 'rgba(255,255,255,0.35)' },
  seg: { flex: 1 },
  segActive: {
    borderWidth: 2.5,
    borderColor: '#fff',
  },
  check: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 23,
    height: 23,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: 11, textAlign: 'center', paddingVertical: 9, paddingHorizontal: 4 },
});
