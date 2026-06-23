import { Circle, Defs, G, LinearGradient, Path, Rect, Stop, Svg } from 'react-native-svg';

/**
 * The ColorCloset mark — the "Noir" CC Mark: a champagne gold wardrobe rail carrying
 * three signature garments (beige / forest green / ivory) on gold hooks. Drawn on a
 * transparent canvas so it sits on the app's own surface; kept in sync with the launcher
 * icon (scripts/make-icons.mjs → "ColorCloset Icon Spec"). Authored in the 240×240 layout
 * and scaled up about its optical centre to fill the square.
 */
const GOLD = '#E6C074';

// One garment body: a rounded-shoulder arch (round top, near-square foot) with a faint rim.
function Garment({ x, w, h, fill }: { x: number; w: number; h: number; fill: string }) {
  const y = 88;
  const trx = 14;
  const tryy = 19;
  const br = 5;
  const d =
    `M ${x} ${y + tryy} Q ${x} ${y} ${x + trx} ${y} L ${x + w - trx} ${y} Q ${x + w} ${y} ${x + w} ${y + tryy} ` +
    `L ${x + w} ${y + h - br} Q ${x + w} ${y + h} ${x + w - br} ${y + h} L ${x + br} ${y + h} Q ${x} ${y + h} ${x} ${y + h - br} Z`;
  return (
    <>
      <Path d={d} fill={fill} />
      <Path d={d} fill="none" stroke="#ffffff" strokeOpacity={0.16} strokeWidth={0.8} />
    </>
  );
}

export function Logo({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 240 240">
      <Defs>
        <LinearGradient id="lrail" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#a9823f" />
          <Stop offset="0.5" stopColor="#f6e3b0" />
          <Stop offset="1" stopColor="#a9823f" />
        </LinearGradient>
        <LinearGradient id="lBeige" x1="0" y1="0" x2="0.28" y2="1">
          <Stop offset="0" stopColor="#ecdebd" /><Stop offset="1" stopColor="#c9b78d" />
        </LinearGradient>
        <LinearGradient id="lGreen" x1="0" y1="0" x2="0.28" y2="1">
          <Stop offset="0" stopColor="#427a59" /><Stop offset="1" stopColor="#244432" />
        </LinearGradient>
        <LinearGradient id="lWhite" x1="0" y1="0" x2="0.28" y2="1">
          <Stop offset="0" stopColor="#ffffff" /><Stop offset="1" stopColor="#dbd4c6" />
        </LinearGradient>
      </Defs>

      <G originX={120} originY={118} scale={1.3}>
        {/* rail (with a faint shadow line beneath) */}
        <Rect x={62} y={87} width={116} height={1.4} rx={0.7} fill="#000" opacity={0.4} />
        <Rect x={62} y={84} width={116} height={3} rx={1.5} fill="url(#lrail)" />

        {/* garments */}
        <Garment x={78} w={28} h={60} fill="url(#lBeige)" />
        <Garment x={106} w={28} h={66} fill="url(#lGreen)" />
        <Garment x={134} w={28} h={56} fill="url(#lWhite)" />

        {/* hooks */}
        <Circle cx={95} cy={84} r={4} fill="none" stroke={GOLD} strokeWidth={2} />
        <Circle cx={123} cy={84} r={4} fill="none" stroke={GOLD} strokeWidth={2} />
        <Circle cx={151} cy={84} r={4} fill="none" stroke={GOLD} strokeWidth={2} />
      </G>
    </Svg>
  );
}
