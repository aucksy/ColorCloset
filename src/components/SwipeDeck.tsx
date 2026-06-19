import { useEffect, useRef } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Icon } from '@/components/Icon';
import { OutfitCard } from '@/components/OutfitCard';
import { hapticLight, hapticSuccess } from '@/lib/haptics';
import { useStore } from '@/store/useStore';
import { useTheme } from '@/theme/useTheme';

interface Props {
  pos: number; // 0-based deck position
  total: number;
  onNext: () => void; // swipe left
  onPrev: () => void; // swipe right
  onSave: () => void; // double-tap
}

/**
 * Tinder-style browse. The card sits on a visible stack so it reads as swipeable; on
 * first use it nudges itself left/right once. A light flick (low distance OR velocity)
 * commits; the card flies off, the store advances, and — keyed on the new pos — the
 * next card slides in. Haptics fire on each swipe; double-tap saves with a heart burst.
 */
export function SwipeDeck({ pos, total, onNext, onPrev, onSave }: Props) {
  const t = useTheme();
  const { width } = useWindowDimensions();
  const tx = useSharedValue(0);
  const heart = useSharedValue(0);
  const THRESH = width * 0.18;
  const FLICK = 650;
  const OFF = width * 1.2;

  const hintSeen = useStore((s) => s.swipeHintSeen);
  const markHintSeen = useStore((s) => s.markSwipeHintSeen);

  // First-time affordance: a gentle left/right nudge so the user sees it's swipeable.
  useEffect(() => {
    if (!hintSeen) {
      tx.value = withDelay(
        450,
        withSequence(
          withTiming(-46, { duration: 320 }),
          withTiming(32, { duration: 300 }),
          withSpring(0, { damping: 14, stiffness: 140 })
        )
      );
      const id = setTimeout(markHintSeen, 1600);
      return () => clearTimeout(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // After the new look commits (pos changed), slide the next card in from the edge.
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    tx.value = withTiming(0, { duration: 180 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos]);

  const pan = Gesture.Pan()
    .activeOffsetX([-8, 8])
    .onUpdate((e) => {
      tx.value = e.translationX;
    })
    .onEnd((e) => {
      if (total <= 1) {
        tx.value = withSpring(0, { damping: 18, stiffness: 180 });
        return;
      }
      const goNext = e.translationX <= -THRESH || e.velocityX <= -FLICK;
      const goPrev = e.translationX >= THRESH || e.velocityX >= FLICK;
      if (goNext) {
        runOnJS(hapticLight)();
        tx.value = withTiming(-OFF, { duration: 180 }, (fin) => {
          if (fin) runOnJS(onNext)();
        });
      } else if (goPrev) {
        runOnJS(hapticLight)();
        tx.value = withTiming(OFF, { duration: 180 }, (fin) => {
          if (fin) runOnJS(onPrev)();
        });
      } else {
        tx.value = withSpring(0, { damping: 18, stiffness: 180 });
      }
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .maxDuration(280)
    .onEnd(() => {
      runOnJS(hapticSuccess)();
      runOnJS(onSave)();
      heart.value = withSequence(
        withTiming(1, { duration: 150 }),
        withDelay(280, withTiming(0, { duration: 220 }))
      );
    });

  const gesture = Gesture.Race(doubleTap, pan);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { rotate: `${interpolate(tx.value, [-width, 0, width], [-7, 0, 7], Extrapolation.CLAMP)}deg` },
    ],
    opacity: interpolate(Math.abs(tx.value), [0, width * 0.85], [1, 0.4], Extrapolation.CLAMP),
  }));

  const heartStyle = useAnimatedStyle(() => ({
    opacity: heart.value,
    transform: [{ scale: interpolate(heart.value, [0, 1], [0.4, 1.25]) }],
  }));

  return (
    <View style={styles.stage}>
      {/* stacked ghosts behind, so it reads as a deck of cards */}
      <View pointerEvents="none" style={[styles.ghost, styles.ghost2, { backgroundColor: t.glass, borderColor: t.line }]} />
      <View pointerEvents="none" style={[styles.ghost, styles.ghost1, { backgroundColor: t.glass2, borderColor: t.line }]} />

      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.card, { backgroundColor: t.surface, borderColor: t.line }, cardStyle]}>
          <OutfitCard />
          <Animated.View pointerEvents="none" style={[styles.heart, heartStyle]}>
            <Icon name="heart-fill" size={96} color={t.accent} />
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { position: 'relative', marginTop: 4 },
  card: { borderRadius: 24, borderWidth: 1, paddingTop: 14, paddingHorizontal: 12, paddingBottom: 18, overflow: 'hidden' },
  ghost: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, borderRadius: 24, borderWidth: 1 },
  ghost1: { transform: [{ translateY: 9 }, { scaleX: 0.955 }], opacity: 0.7 },
  ghost2: { transform: [{ translateY: 18 }, { scaleX: 0.91 }], opacity: 0.4 },
  heart: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
});
