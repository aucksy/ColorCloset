import { useEffect } from 'react';
import Animated, {
  interpolateColor,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Circle, Line, Path, Svg } from 'react-native-svg';
import { rgbString } from '@/engine';

const AnimatedPath = Animated.createAnimatedComponent(Path);

// Corporate dress shirt: shoulders, short sleeves, collar V, torso to hem.
const TOP_PATH =
  'M120 28 L150 40 L196 66 L180 110 L160 100 L160 196 Q160 208 148 208 L92 208 Q80 208 80 196 L80 100 L60 110 L44 66 L90 40 Z';
const COLLAR_L = 'M120 30 L100 46 L114 61 L120 49 Z';
const COLLAR_R = 'M120 30 L140 46 L126 61 L120 49 Z';
// Formal trousers: waistband, straight legs with a centre crease, tapered hems.
const BOTTOM_PATH =
  'M84 24 L156 24 L160 118 L150 210 Q149 216 143 216 L129 216 Q124 216 123 210 L120 150 L117 210 Q116 216 111 216 L97 216 Q91 216 90 210 L80 118 Z';
const WAISTBAND = 'M84 24 L156 24 L157 40 L83 40 Z';

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
      {/* outline over the animated fill */}
      <Path d={d} fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth={1.2} />

      {kind === 'top' ? (
        <>
          {/* collar flaps + centre placket + buttons → reads as a formal shirt */}
          <Path d={COLLAR_L} fill="rgba(0,0,0,0.20)" />
          <Path d={COLLAR_R} fill="rgba(0,0,0,0.20)" />
          <Line x1={120} y1={50} x2={120} y2={202} stroke="rgba(0,0,0,0.16)" strokeWidth={2} />
          {[88, 116, 144, 172].map((cy) => (
            <Circle key={cy} cx={120} cy={cy} r={2.6} fill="rgba(255,255,255,0.5)" />
          ))}
        </>
      ) : (
        <>
          {/* waistband + leg creases → reads as formal trousers */}
          <Path d={WAISTBAND} fill="rgba(0,0,0,0.16)" />
          <Line x1={104} y1={44} x2={106} y2={206} stroke="rgba(255,255,255,0.10)" strokeWidth={1.5} />
          <Line x1={136} y1={44} x2={134} y2={206} stroke="rgba(255,255,255,0.10)" strokeWidth={1.5} />
        </>
      )}
    </Svg>
  );
}
