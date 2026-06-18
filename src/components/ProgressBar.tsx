import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/useTheme';

interface Props {
  /** 0-100 */
  pct: number;
  big?: boolean;
}

export function ProgressBar({ pct, big }: Props) {
  const t = useTheme();
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <View style={[styles.track, { height: big ? 9 : 6, backgroundColor: t.track }]}>
      <LinearGradient
        colors={[t.gold, t.goldSoft]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.fill, { width: `${clamped}%` }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flex: 1, borderRadius: 99, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 99 },
});
