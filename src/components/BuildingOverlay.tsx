import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { fonts } from '@/theme/fonts';
import { useMotion } from '@/theme/useMotion';
import { useTheme } from '@/theme/useTheme';

const SUBS = [
  'Reading your colours',
  'Checking colour theory',
  'Pairing tops with bottoms',
  'Ranking by what flatters you',
];

interface Props {
  total: number;
  onDone: () => void;
}

/** Brief payoff transition: counts up to the true universe size, then enters the app. */
export function BuildingOverlay({ total, onDone }: Props) {
  const t = useTheme();
  const motion = useMotion();
  const [count, setCount] = useState(0);
  const [sub, setSub] = useState(SUBS[0]);
  const [ready, setReady] = useState(false);
  const spin = useSharedValue(0);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    if (motion.reduced) {
      setCount(total);
      setReady(true);
      const id = setTimeout(() => doneRef.current(), motion.buildingTotal);
      return () => clearTimeout(id);
    }

    spin.value = withRepeat(withTiming(1, { duration: 1000, easing: Easing.linear }), -1);

    // count-up (cubic ease-out) starting ~700ms in
    let raf = 0;
    const startCount = setTimeout(() => {
      const start = Date.now();
      const dur = 1100;
      const tick = () => {
        const p = Math.min(1, (Date.now() - start) / dur);
        const e = 1 - Math.pow(1 - p, 3);
        setCount(Math.round(total * e));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, 700);

    // cycling status lines
    let i = 0;
    const labels = setInterval(() => {
      i = (i + 1) % SUBS.length;
      setSub(SUBS[i]);
    }, 620);

    const readyAt = setTimeout(() => {
      clearInterval(labels);
      setReady(true);
    }, 2050);

    const done = setTimeout(() => doneRef.current(), motion.buildingTotal);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(startCount);
      clearInterval(labels);
      clearTimeout(readyAt);
      clearTimeout(done);
    };
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ringStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value * 360}deg` }] }));

  return (
    <View style={[styles.wrap, { backgroundColor: t.bg }]}>
      <View style={styles.vis}>
        <Animated.View style={[styles.ring, { borderColor: t.line, borderTopColor: t.accent }, ringStyle]} />
        <Text style={[styles.count, { color: t.ink, fontFamily: fonts.displaySemi }]}>{count}</Text>
      </View>
      <Text style={[styles.title, { color: t.ink, fontFamily: fonts.display }]}>
        Building your combinations
      </Text>
      <Text style={[styles.sub, { color: ready ? t.accent : t.muted, fontFamily: fonts.mono }]}>
        {ready ? `${total} combinations ready` : `${sub}…`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', gap: 22, padding: 40 },
  vis: { width: 148, height: 148, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: 148, height: 148, borderRadius: 74, borderWidth: 3 },
  count: { fontSize: 54, lineHeight: 58 },
  title: { fontSize: 25, textAlign: 'center' },
  sub: { fontSize: 12.5, minHeight: 18, textAlign: 'center' },
});
