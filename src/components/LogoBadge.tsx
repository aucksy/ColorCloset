import { StyleSheet, View } from 'react-native';
import { Logo } from '@/components/Logo';

/**
 * The app mark presented in its obsidian app-icon tile — a small, theme-independent brand
 * badge for headers (so the wordmark always sits next to the real icon, not a bare mark).
 */
export function LogoBadge({ size = 36, radius = 11 }: { size?: number; radius?: number }) {
  return (
    <View style={[styles.badge, { width: size, height: size, borderRadius: radius }]}>
      <Logo size={Math.round(size * 0.84)} />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: '#14110d',
    borderWidth: 1,
    borderColor: 'rgba(230,192,116,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
