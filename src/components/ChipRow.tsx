import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/useTheme';

export interface ChipItem<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  items: ChipItem<T>[];
  value: T;
  onChange: (v: T) => void;
  /** Wrap instead of horizontal scroll (used for undertone in the skin picker). */
  wrap?: boolean;
}

export function ChipRow<T extends string>({ items, value, onChange, wrap }: Props<T>) {
  const t = useTheme();

  const chips = items.map((it) => {
    const selected = it.value === value;
    const inner = (
      <Text
        style={[
          styles.label,
          { fontFamily: fonts.uiSemi, color: selected ? t.onGold : t.muted },
        ]}
      >
        {it.label}
      </Text>
    );
    return (
      <Pressable
        key={it.value}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        onPress={() => onChange(it.value)}
        style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.95 : 1 }], borderRadius: 12 }]}
      >
        {selected ? (
          <LinearGradient
            colors={t.goldGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.chip}
          >
            {inner}
          </LinearGradient>
        ) : (
          <View style={[styles.chip, { backgroundColor: t.glass, borderWidth: 1, borderColor: t.line }]}>
            {inner}
          </View>
        )}
      </Pressable>
    );
  });

  if (wrap) return <View style={styles.wrap}>{chips}</View>;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scroll}
    >
      {chips}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: 8, paddingVertical: 2 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 12 },
  label: { fontSize: 12.5 },
});
