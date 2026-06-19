import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { OutfitCard } from '@/components/OutfitCard';
import { fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/useTheme';

interface Props {
  pos: number; // 0-based deck position
  total: number;
  onNext: () => void; // swipe left
  onPrev: () => void; // swipe right
  onSave: () => void; // double-tap
}

/**
 * Tinder-style browse: drag the card left/right to walk every look in order; the
 * "x of N" counter updates as each new card lands. Double-tap saves. (Mark-worn is
 * a separate button outside the deck.)
 */
export function SwipeDeck({ pos, total, onNext, onPrev, onSave }: Props) {
  const t = useTheme();
  const { width } = useWindowDimensions();
  const tx = useSharedValue(0);
  const THRESH = width * 0.26;
  const OFF = width * 1.2;

  const pan = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .onUpdate((e) => {
      tx.value = e.translationX;
    })
    .onEnd((e) => {
      if (e.translationX <= -THRESH) {
        tx.value = withTiming(-OFF, { duration: 200 }, (fin) => {
          if (fin) {
            runOnJS(onNext)();
            tx.value = 0;
          }
        });
      } else if (e.translationX >= THRESH) {
        tx.value = withTiming(OFF, { duration: 200 }, (fin) => {
          if (fin) {
            runOnJS(onPrev)();
            tx.value = 0;
          }
        });
      } else {
        tx.value = withSpring(0, { damping: 18, stiffness: 180 });
      }
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .maxDuration(280)
    .onEnd(() => {
      runOnJS(onSave)();
    });

  const gesture = Gesture.Race(doubleTap, pan);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { rotate: `${interpolate(tx.value, [-width, 0, width], [-7, 0, 7])}deg` },
    ],
    opacity: interpolate(Math.abs(tx.value), [0, width * 0.85], [1, 0.35]),
  }));

  const display = (pos < 0 ? 0 : pos) + 1;

  return (
    <View>
      <View style={styles.counterRow}>
        <Text style={[styles.counter, { color: t.muted, fontFamily: fonts.monoBold }]}>
          <Text style={{ color: t.accent }}>{display}</Text> of {total}
        </Text>
        <Text style={[styles.hint, { color: t.faint, fontFamily: fonts.uiRegular }]}>
          Swipe to browse · double-tap to save
        </Text>
      </View>
      <GestureDetector gesture={gesture}>
        <Animated.View style={cardStyle}>
          <OutfitCard />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  counterRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 },
  counter: { fontSize: 13 },
  hint: { fontSize: 11 },
});
