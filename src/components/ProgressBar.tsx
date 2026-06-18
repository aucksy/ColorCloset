import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/theme/useTheme';

interface Props {
  /** 0-100 */
  pct: number;
  big?: boolean;
}

export function ProgressBar({ pct, big }: Props) {
  const t = useTheme();
  const reduced = useReducedMotion();
  const clamped = Math.max(0, Math.min(100, pct));
  const w = useSharedValue(clamped);

  useEffect(() => {
    w.value = withTiming(clamped, { duration: reduced ? 0 : 600 });
  }, [clamped, reduced, w]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${w.value}%` }));

  return (
    <View style={[styles.track, { height: big ? 9 : 6, backgroundColor: t.track }]}>
      <Animated.View style={[styles.fill, fillStyle]}>
        <LinearGradient
          colors={[t.gold, t.goldSoft]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flex: 1, borderRadius: 99, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 99, overflow: 'hidden' },
});
