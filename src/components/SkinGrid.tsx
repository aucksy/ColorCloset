import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DEPTHS, type DepthId } from '@/engine';
import { Icon } from '@/components/Icon';
import { fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/useTheme';

interface Props {
  value: DepthId | null;
  onSelect: (d: DepthId) => void;
}

export function SkinGrid({ value, onSelect }: Props) {
  const t = useTheme();
  return (
    <View style={styles.grid}>
      {DEPTHS.map((s) => {
        const selected = s.id === value;
        return (
          <Pressable
            key={s.id}
            accessibilityRole="button"
            accessibilityLabel={`Skin depth ${s.name}`}
            accessibilityState={{ selected }}
            onPress={() => onSelect(s.id)}
            style={({ pressed }) => [
              styles.cell,
              {
                backgroundColor: selected ? t.glass2 : t.glass,
                borderColor: selected ? t.accent : t.line,
                transform: [{ scale: pressed ? 0.96 : 1 }],
              },
            ]}
          >
            {selected && (
              <View style={[styles.check, { backgroundColor: t.accent }]}>
                <Icon name="check" size={11} color={t.onGold} strokeWidth={3} />
              </View>
            )}
            <View style={[styles.dot, { backgroundColor: s.dot }]} />
            <Text style={[styles.name, { color: t.ink, fontFamily: fonts.uiSemi }]}>{s.name}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 13 },
  cell: {
    width: '30%',
    flexGrow: 1,
    borderRadius: 20,
    borderWidth: 1.5,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 10,
  },
  dot: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  name: { fontSize: 11.5, textAlign: 'center' },
  check: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 19,
    height: 19,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
