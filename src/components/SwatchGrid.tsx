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
 * The manual colour palette. Two columns so each colour patch — and the 5 shade
 * chips beneath it — are large enough to tap comfortably. Tap the patch to select
 * the colour; tap the shade chips (more than one allowed) to record which shades
 * you actually own.
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
                        accessibilityLabel={`${k} shade ${i + 1} of 5`}
                        accessibilityState={{ selected: active }}
                        onPress={() => toggleShade(slot, k, i as ShadeIndex)}
                        style={({ pressed }) => [styles.chipHit, { transform: [{ scale: pressed ? 0.9 : 1 }] }]}
                        hitSlop={4}
                      >
                        <View style={[styles.chip, { backgroundColor: sh }, active && { borderColor: '#fff', borderWidth: 2.5 }]} />
                      </Pressable>
                    );
                  })}
                </View>
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
  strip: { flexDirection: 'row', gap: 4, padding: 6 },
  chipHit: { flex: 1, alignItems: 'stretch' },
  chip: { height: 38, borderRadius: 7, borderColor: 'rgba(255,255,255,0.2)', borderWidth: 1 },
  name: { fontSize: 12, textAlign: 'center', paddingVertical: 9, paddingHorizontal: 4 },
});
