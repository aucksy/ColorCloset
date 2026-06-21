import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { fonts } from '@/theme/fonts';
import { useMotion } from '@/theme/useMotion';
import { useTheme } from '@/theme/useTheme';

export interface SegOption<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  value: T;
  /** Exactly two options (left, right). */
  options: readonly [SegOption<T>, SegOption<T>];
  onChange: (v: T) => void;
}

/** A two-tab segmented control with a sliding gold thumb. Generic over the value type. */
export function Segmented<T extends string>({ value, options, onChange }: Props<T>) {
  const t = useTheme();
  const motion = useMotion();
  const [w, setW] = useState(0);
  const thumbW = w > 0 ? (w - 8) / 2 : 0;
  const onRight = value === options[1].value;

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: withTiming(onRight ? thumbW : 0, { duration: motion.fast }) }],
  }));

  const tab = (opt: SegOption<T>) => {
    const on = value === opt.value;
    return (
      <Pressable
        key={opt.value}
        accessibilityRole="tab"
        accessibilityState={{ selected: on }}
        onPress={() => onChange(opt.value)}
        style={styles.tab}
      >
        <Text style={[styles.label, { color: on ? t.onGold : t.muted, fontFamily: fonts.uiSemi }]}>
          {opt.label}
        </Text>
      </Pressable>
    );
  };

  return (
    <View
      style={[styles.seg, { backgroundColor: t.glass, borderColor: t.line }]}
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
    >
      {thumbW > 0 && (
        <Animated.View style={[styles.thumb, { width: thumbW }, thumbStyle]}>
          <LinearGradient colors={t.goldGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        </Animated.View>
      )}
      {tab(options[0])}
      {tab(options[1])}
    </View>
  );
}

const styles = StyleSheet.create({
  seg: { flexDirection: 'row', borderRadius: 16, borderWidth: 1, padding: 4 },
  thumb: { position: 'absolute', top: 4, bottom: 4, left: 4, borderRadius: 12, overflow: 'hidden' },
  tab: { flex: 1, paddingVertical: 11, alignItems: 'center', zIndex: 1 },
  label: { fontSize: 13.5 },
});
