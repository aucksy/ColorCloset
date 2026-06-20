import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS, KEYS, shadeName, type ColorKey } from '@/engine';
import { Icon } from '@/components/Icon';
import { ShadePicker } from '@/components/ShadePicker';
import { useStore, useActiveWardrobe } from '@/store/useStore';
import { fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/useTheme';

interface Props {
  slot: 'tops' | 'bottoms';
}

/**
 * The manual colour palette. Two columns so each colour patch is large enough
 * to tap comfortably. Tap the patch to select the colour; a selected colour
 * shows a compact "Shades ⌄ · N" affordance that opens a floating multi-select
 * picker (`ShadePicker`) for recording which shades you actually own. Reads the
 * active gender×mode wardrobe bucket.
 */
export function SwatchGrid({ slot }: Props) {
  const t = useTheme();
  const w = useActiveWardrobe();
  const selected = slot === 'tops' ? w.tops : w.bottoms;
  const shades = slot === 'tops' ? w.shadeTops : w.shadeBottoms;
  const toggleColor = useStore((s) => s.toggleColor);
  const [openKey, setOpenKey] = useState<ColorKey | null>(null);

  return (
    <View style={styles.grid}>
      {KEYS.map((k: ColorKey) => {
        const on = selected.includes(k);
        const def = COLORS[k].baseIdx;
        const picked = shades[k] ?? [def];
        const fill = COLORS[k].shades[picked[0] ?? def];
        const label =
          picked.length === 1 ? shadeName(k, picked[0]) : `${picked.length} shades`;
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
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Shades for ${k}, ${picked.length} picked: ${label}`}
                  accessibilityHint="Opens the shade picker"
                  onPress={() => setOpenKey(k)}
                  style={({ pressed }) => [styles.affordance, { backgroundColor: t.bg, opacity: pressed ? 0.7 : 1 }]}
                >
                  <Text
                    numberOfLines={1}
                    style={[styles.affordanceTxt, { color: t.muted, fontFamily: fonts.uiSemi }]}
                  >
                    Shades
                  </Text>
                  <Icon name="chevron-down" size={13} color={t.muted} />
                  <View style={[styles.dot, { backgroundColor: t.line2 }]} />
                  <Text style={[styles.count, { color: t.accent, fontFamily: fonts.uiBold }]}>{picked.length}</Text>
                </Pressable>
              )}
            </View>
            <Text style={[styles.name, { color: on ? t.ink : t.muted, fontFamily: fonts.uiSemi }]}>{k}</Text>
          </View>
        );
      })}

      {openKey && <ShadePicker slot={slot} colorKey={openKey} onClose={() => setOpenKey(null)} />}
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
  affordance: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  affordanceTxt: { fontSize: 11.5, letterSpacing: 0.2 },
  dot: { width: 3, height: 3, borderRadius: 1.5, marginHorizontal: 1 },
  count: { fontSize: 11.5 },
  name: { fontSize: 12, textAlign: 'center', paddingVertical: 9, paddingHorizontal: 4 },
});
