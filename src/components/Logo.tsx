import { Circle, Defs, LinearGradient, Path, Rect, Stop, Svg } from 'react-native-svg';

/**
 * The ColorCloset mark — "Half-Open · Noir": a champagne-bordered wardrobe with one
 * door swung open, garments (beige / forest green / white) on a gold rail. Matches the
 * launcher icon (scripts/make-icons.mjs). Authored in the 240x240 layout.
 */
const GOLD = '#E6C074';

function Garment({ hookCx, x, fill, h }: { hookCx: number; x: number; fill: string; h: number }) {
  return (
    <>
      <Circle cx={hookCx} cy={59} r={4} stroke={GOLD} strokeWidth={2} fill="none" />
      <Rect x={x} y={64} width={22} height={h} rx={6} fill={fill} />
    </>
  );
}

export function Logo({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 240 240">
      <Defs>
        <LinearGradient id="lcab" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#241f19" /><Stop offset="1" stopColor="#15110d" />
        </LinearGradient>
        <LinearGradient id="lint" x1="0" y1="0" x2="0.4" y2="1">
          <Stop offset="0" stopColor="#1d1815" /><Stop offset="1" stopColor="#0d0a08" />
        </LinearGradient>
        <LinearGradient id="lgold" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#f3dca0" /><Stop offset="1" stopColor="#caa052" />
        </LinearGradient>
        <LinearGradient id="lrdoor" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#2c261e" /><Stop offset="1" stopColor="#191510" />
        </LinearGradient>
        <LinearGradient id="lldoor" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#221c15" /><Stop offset="1" stopColor="#3c342a" />
        </LinearGradient>
        <LinearGradient id="lbeige" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#e7d9b7" /><Stop offset="1" stopColor="#c9b78d" />
        </LinearGradient>
        <LinearGradient id="lgreen" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#3d7053" /><Stop offset="1" stopColor="#264835" />
        </LinearGradient>
        <LinearGradient id="lwhite" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#f6f2ea" /><Stop offset="1" stopColor="#dbd4c6" />
        </LinearGradient>
      </Defs>

      <Rect x={44} y={31} width={152} height={178} rx={15} fill="url(#lcab)" />
      <Rect x={45.2} y={32.2} width={149.6} height={175.6} rx={13.8} fill="none" stroke={GOLD} strokeWidth={2.5} strokeOpacity={0.55} />
      <Rect x={53} y={40} width={134} height={160} rx={8} fill="url(#lint)" />
      <Rect x={70} y={60.5} width={70} height={2.4} rx={1.2} fill="url(#lgold)" />
      <Garment hookCx={81} x={70} fill="url(#lbeige)" h={60} />
      <Garment hookCx={107} x={96} fill="url(#lgreen)" h={66} />
      <Garment hookCx={133} x={122} fill="url(#lwhite)" h={56} />
      <Rect x={145} y={40} width={42} height={160} rx={8} fill="url(#lrdoor)" />
      <Rect x={151} y={112} width={4} height={26} rx={2} fill="url(#lgold)" />
      <Path d="M52 40 L26 50 L26 190 L52 200 Z" fill="url(#lldoor)" />
      <Path d="M52 40 L26 50 L26 190 L52 200 Z" fill="none" stroke={GOLD} strokeWidth={1.4} strokeOpacity={0.5} />
      <Rect x={30} y={108} width={4} height={26} rx={2} fill="url(#lgold)" />
    </Svg>
  );
}
