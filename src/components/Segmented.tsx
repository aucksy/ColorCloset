import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { fonts } from '@/theme/fonts';
import { useMotion } from '@/theme/useMotion';
import { useTheme } from '@/theme/useTheme';

export type Pane = 'rec' | 'shop';

interface Props {
  value: Pane;
  onChange: (p: Pane) => void;
}

export function Segmented({ value, onChange }: Props) {
  const t = useTheme();
  const motion = useMotion();
  const [w, setW] = useState(0);
  const thumbW = w > 0 ? (w - 8) / 2 : 0;

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: withTiming(value === 'shop' ? thumbW : 0, { duration: motion.fast }) }],
  }));

  const tab = (pane: Pane, label: string) => {
    const on = value === pane;
    return (
      <Pressable
        accessibilityRole="tab"
        accessibilityState={{ selected: on }}
        onPress={() => onChange(pane)}
        style={styles.tab}
      >
        <Text style={[styles.label, { color: on ? t.onGold : t.muted, fontFamily: fonts.uiSemi }]}>
          {label}
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
      {tab('rec', 'Style me')}
      {tab('shop', 'What to buy')}
    </View>
  );
}

const styles = StyleSheet.create({
  seg: { flexDirection: 'row', borderRadius: 16, borderWidth: 1, padding: 4 },
  thumb: { position: 'absolute', top: 4, bottom: 4, left: 4, borderRadius: 12, overflow: 'hidden' },
  tab: { flex: 1, paddingVertical: 11, alignItems: 'center', zIndex: 1 },
  label: { fontSize: 13.5 },
});
