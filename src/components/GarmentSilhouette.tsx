import { useEffect } from 'react';
import Animated, {
  interpolateColor,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Path, Svg } from 'react-native-svg';
import { rgbString } from '@/engine';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const TOP_PATH =
  'M120 26 L152 38 L198 64 L182 108 L160 99 L160 196 Q160 208 148 208 L92 208 Q80 208 80 196 L80 99 L58 108 L42 64 L88 38 Z';
const TOP_COLLAR = 'M120 26 L105 50 L120 64 L135 50 Z';
const BOTTOM_PATH =
  'M84 24 L156 24 L160 118 L150 210 Q149 216 143 216 L129 216 Q124 216 123 210 L120 150 L117 210 Q116 216 111 216 L97 216 Q91 216 90 210 L80 118 Z';

interface Props {
  kind: 'top' | 'bottom';
  /** Hex of the chosen shade. */
  color: string;
  duration: number;
}

export function GarmentSilhouette({ kind, color, duration }: Props) {
  const d = kind === 'top' ? TOP_PATH : BOTTOM_PATH;
  const target = rgbString(color);
  const progress = useSharedValue(1);
  const from = useSharedValue(target);
  const to = useSharedValue(target);

  useEffect(() => {
    from.value = to.value;
    to.value = target;
    progress.value = 0;
    progress.value = withTiming(1, { duration });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  const animatedProps = useAnimatedProps(() => ({
    fill: interpolateColor(progress.value, [0, 1], [from.value, to.value]),
  }));

  return (
    <Svg width="100%" height={210} viewBox="0 0 240 230">
      <AnimatedPath d={d} animatedProps={animatedProps} />
      {/* outline + collar shadow on top of the animated fill */}
      <Path d={d} fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth={1.2} />
      {kind === 'top' && <Path d={TOP_COLLAR} fill="rgba(0,0,0,0.16)" />}
    </Svg>
  );
}
