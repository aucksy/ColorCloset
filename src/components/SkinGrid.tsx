import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MST_SWATCHES, tierOf } from '@/engine';
import { Icon } from '@/components/Icon';
import { fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/useTheme';

interface Props {
  value: number | null;
  onSelect: (mst: number) => void;
}

export function SkinGrid({ value, onSelect }: Props) {
  const t = useTheme();
  const tier = value != null ? tierOf(value) : null;
  return (
    <View>
      <View style={styles.grid}>
        {MST_SWATCHES.map((s, i) => {
          const mst = i + 1;
          const selected = mst === value;
          return (
            <Pressable
              key={s.mst}
              accessibilityRole="button"
              accessibilityLabel={`Skin tone ${mst} of ${MST_SWATCHES.length}`}
              accessibilityState={{ selected }}
              onPress={() => onSelect(mst)}
              style={({ pressed }) => [
                styles.cell,
                { transform: [{ scale: pressed ? 0.96 : 1 }] },
              ]}
            >
              <View
                style={[
                  styles.swatch,
                  {
                    backgroundColor: s.hex,
                    borderColor: selected ? t.accent : t.line,
                    borderWidth: selected ? 2.5 : 1,
                  },
                ]}
              >
                {selected && (
                  <View style={[styles.check, { backgroundColor: t.accent }]}>
                    <Icon name="check" size={11} color={t.onGold} strokeWidth={3} />
                  </View>
                )}
              </View>
              <Text style={[styles.num, { color: t.muted, fontFamily: fonts.uiSemi }]}>{mst}</Text>
            </Pressable>
          );
        })}
      </View>
      {tier && (
        <Text
          accessibilityRole="text"
          style={[styles.tier, { color: t.muted, fontFamily: fonts.uiSemi }]}
        >
          {tier} tones
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 14 },
  cell: {
    width: '16%',
    alignItems: 'center',
    gap: 7,
  },
  swatch: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  num: { fontSize: 11, textAlign: 'center' },
  tier: { fontSize: 12.5, textAlign: 'center', marginTop: 16 },
  check: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 19,
    height: 19,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
