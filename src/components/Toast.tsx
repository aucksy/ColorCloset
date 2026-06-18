import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Icon } from '@/components/Icon';
import { useUiStore } from '@/store/uiStore';
import { fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/useTheme';

export function Toast() {
  const t = useTheme();
  const toast = useUiStore((s) => s.toast);
  const v = useSharedValue(0);

  useEffect(() => {
    if (!toast.n) return;
    v.value = withTiming(1, { duration: 280 });
    const id = setTimeout(() => {
      v.value = withTiming(0, { duration: 280 });
    }, 2000);
    return () => clearTimeout(id);
  }, [toast.n, v]);

  const style = useAnimatedStyle(() => ({
    opacity: v.value,
    transform: [{ translateY: (1 - v.value) * 16 }],
  }));

  if (!toast.n) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.toast,
        { backgroundColor: t.surface, borderColor: t.line2 },
        style,
      ]}
    >
      <Icon name="check" size={15} color={t.accent} strokeWidth={3} />
      <Text style={[styles.msg, { color: t.ink, fontFamily: fonts.uiSemi }]}>{toast.msg}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 26,
    marginHorizontal: 'auto',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 13,
    borderWidth: 1,
  },
  msg: { fontSize: 12.5 },
});
