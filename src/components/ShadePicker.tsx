import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInUp, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SHADE_TIERS, type ColorKey, type ShadeIndex } from '@/engine';
import { Icon } from '@/components/Icon';
import { useActiveWardrobe, useStore } from '@/store/useStore';
import { fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/useTheme';

interface Props {
  slot: 'tops' | 'bottoms';
  colorKey: ColorKey;
  onClose: () => void;
}

/**
 * Floating shade picker for a single colour. Opened from `SwatchGrid`'s
 * "Shades ⌄" affordance. Lists the colour's 5-step light→dark ramp as
 * multi-select rows (swatch + tier name "Lightest…Deepest" + check), reusing
 * `toggleShade` (which enforces a minimum of one selection). A transparent
 * `Modal` with a dim backdrop; tapping the backdrop closes it.
 */
export function ShadePicker({ slot, colorKey, onClose }: Props) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const w = useActiveWardrobe();
  const toggleShade = useStore((s) => s.toggleShade);

  const shadeMap = slot === 'tops' ? w.shadeTops : w.shadeBottoms;
  const def = COLORS[colorKey].baseIdx;
  const picked = shadeMap[colorKey] ?? [def];
  const ramp = COLORS[colorKey].shades;

  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(160)} style={styles.fill}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close shade picker"
          onPress={onClose}
          style={[StyleSheet.absoluteFill, styles.scrim]}
        />
        <View pointerEvents="box-none" style={[styles.center, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          <Animated.View
            entering={FadeInUp.duration(220).springify().damping(18)}
            style={[styles.sheet, { backgroundColor: t.surface, borderColor: t.line2 }]}
          >
            <View style={styles.head}>
              <Text style={[styles.title, { color: t.ink, fontFamily: fonts.display }]}>{colorKey} shades</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Done"
                onPress={onClose}
                style={({ pressed }) => [styles.close, { backgroundColor: t.glass, opacity: pressed ? 0.6 : 1 }]}
                hitSlop={6}
              >
                <Icon name="x" size={16} color={t.muted} />
              </Pressable>
            </View>
            <Text style={[styles.hint, { color: t.faint, fontFamily: fonts.uiRegular }]}>
              Pick every shade you own — light to deep.
            </Text>

            {ramp.map((sh, i) => {
              const active = picked.includes(i as ShadeIndex);
              const tier = SHADE_TIERS[i];
              return (
                <Pressable
                  key={i}
                  accessibilityRole="checkbox"
                  accessibilityLabel={`${tier} ${colorKey}`}
                  accessibilityState={{ checked: active }}
                  onPress={() => toggleShade(slot, colorKey, i as ShadeIndex)}
                  style={({ pressed }) => [
                    styles.row,
                    { borderColor: active ? t.accent : t.line },
                    active && { backgroundColor: t.glass },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <View style={[styles.swatch, { backgroundColor: sh, borderColor: t.line2 }]} />
                  <Text style={[styles.tier, { color: active ? t.ink : t.muted, fontFamily: fonts.uiSemi }]}>{tier}</Text>
                  <View
                    style={[
                      styles.tick,
                      { borderColor: active ? t.accent : t.line2, backgroundColor: active ? t.accent : 'transparent' },
                    ]}
                  >
                    {active && <Icon name="check" size={13} color={t.onGold} strokeWidth={3} />}
                  </View>
                </Pressable>
              );
            })}
          </Animated.View>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  scrim: { backgroundColor: 'rgba(5,5,8,0.55)' },
  center: { flex: 1, justifyContent: 'center', paddingHorizontal: 26 },
  sheet: {
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    maxWidth: 360,
    width: '100%',
    alignSelf: 'center',
  },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 18 },
  close: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  hint: { fontSize: 11.5, lineHeight: 16, paddingTop: 2, paddingBottom: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  swatch: { width: 34, height: 34, borderRadius: 9, borderWidth: 1 },
  tier: { flex: 1, fontSize: 14.5 },
  tick: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
});
