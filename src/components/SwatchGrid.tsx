import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS, KEYS, shadeName, type ColorKey, type ShadeIndex } from '@/engine';
import { Icon } from '@/components/Icon';
import { useStore, useActiveWardrobe } from '@/store/useStore';
import { fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/useTheme';

interface Props {
  slot: 'tops' | 'bottoms';
}

/**
 * The manual colour palette. Two columns so each colour patch — and the named
 * shade chips beneath it — are large enough to tap comfortably. Tap the patch to
 * select the colour; tap the shade chips (more than one allowed) to record which
 * shades you actually own. Reads the active gender×mode wardrobe bucket.
 */
export function SwatchGrid({ slot }: Props) {
  const t = useTheme();
  const w = useActiveWardrobe();
  const selected = slot === 'tops' ? w.tops : w.bottoms;
  const shades = slot === 'tops' ? w.shadeTops : w.shadeBottoms;
  const toggleColor = useStore((s) => s.toggleColor);
  const toggleShade = useStore((s) => s.toggleShade);

  return (
    <View style={styles.grid}>
      {KEYS.map((k: ColorKey) => {
        const on = selected.includes(k);
        const def = COLORS[k].baseIdx;
        const picked = shades[k] ?? [def];
        const fill = COLORS[k].shades[picked[0] ?? def];
        const count = COLORS[k].shades.length;
        return (
          <View key={k} style={styles.cellWrap}>
            <View style={[styles.swatch, { borderColor: on ? t.accent : 'transparent' }]}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={k}
                accessibilityState={{ selected: on }}
                onPress={() => toggleColor(slot, k)}
                style={({ pressed }) => [styles.patch, { backgroundColor: fill, opacity: pressed ? 0.85 : 1 }]}
              >
                {on && (
                  <View style={[styles.check, { backgroundColor: t.accent }]}>
                    <Icon name="check" size={14} color={t.onGold} strokeWidth={3} />
                  </View>
                )}
              </Pressable>

              {on && (
                <View style={[styles.strip, { backgroundColor: t.bg }]}>
                  {COLORS[k].shades.map((sh, i) => {
                    const active = picked.includes(i as ShadeIndex);
                    return (
                      <Pressable
                        key={i}
                        accessibilityRole="button"
                        accessibilityLabel={`${shadeName(k, i)} (shade ${i + 1} of ${count})`}
                        accessibilityState={{ selected: active }}
                        onPress={() => toggleShade(slot, k, i as ShadeIndex)}
                        style={({ pressed }) => [styles.chipHit, { transform: [{ scale: pressed ? 0.9 : 1 }] }]}
                        hitSlop={4}
                      >
                        <View
                          style={[
                            styles.chip,
                            { backgroundColor: sh, borderColor: t.line2 },
                            active && { borderColor: t.accent, borderWidth: 2.6 },
                          ]}
                        />
                      </Pressable>
                    );
                  })}
                </View>
              )}

              {on && picked.length > 0 && (
                <Text
                  numberOfLines={1}
                  style={[styles.shadeCaption, { color: t.muted, fontFamily: fonts.ui, backgroundColor: t.bg }]}
                >
                  {picked.length === 1
                    ? shadeName(k, picked[0])
                    : `${picked.length} shades`}
                </Text>
              )}
            </View>
            <Text style={[styles.name, { color: on ? t.ink : t.muted, fontFamily: fonts.uiSemi }]}>{k}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  cellWrap: { width: '47%', flexGrow: 1, minWidth: 150 },
  swatch: { borderRadius: 18, borderWidth: 2.5, overflow: 'hidden' },
  patch: { height: 80, width: '100%' },
  check: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  strip: { flexDirection: 'row', gap: 4, paddingHorizontal: 6, paddingTop: 6 },
  chipHit: { flex: 1, alignItems: 'stretch' },
  chip: { height: 38, borderRadius: 7, borderWidth: 1 },
  shadeCaption: { fontSize: 10.5, textAlign: 'center', paddingBottom: 6, paddingTop: 3, paddingHorizontal: 6 },
  name: { fontSize: 12, textAlign: 'center', paddingVertical: 9, paddingHorizontal: 4 },
});
