import { Circle, Defs, LinearGradient, Path, Rect, Stop, Svg } from 'react-native-svg';
import { useStore, type LogoVariant } from '@/store/useStore';

/**
 * The in-app brand mark. Five selectable variants (chosen from the sidebar so the
 * owner can test premium options). All share the spectrum + champagne-gold language.
 */
const WHEEL = [
  '#D8584F', '#DD7E3C', '#D8A23C', '#B9B24A', '#5FA85C', '#3FA77E',
  '#3DA0A6', '#3A78B0', '#4F5DB0', '#7E5BC0', '#B452A8', '#CC5274',
];
const SEAM = ['#ef5350', '#ff8a3d', '#ffd34d', '#b6e05a', '#4cd2a0', '#38b6e0', '#5a7bf0', '#9b6bf0', '#d667c8'];
const GOLD = '#C9A86A';
const GOLD_BORDER = '#E6C074';
const C = 50;

const rad = (d: number) => (d * Math.PI) / 180;
const pt = (radius: number, a: number): [number, number] => [C + radius * Math.cos(a), C + radius * Math.sin(a)];

function sector(i: number, R: number, r: number, gap: number): string {
  const a0 = rad(i * 30 + gap / 2 - 90);
  const a1 = rad((i + 1) * 30 - gap / 2 - 90);
  const [x0o, y0o] = pt(R, a0);
  const [x1o, y1o] = pt(R, a1);
  const [x1i, y1i] = pt(r, a1);
  const [x0i, y0i] = pt(r, a0);
  return `M ${x0o} ${y0o} A ${R} ${R} 0 0 1 ${x1o} ${y1o} L ${x1i} ${y1i} A ${r} ${r} 0 0 0 ${x0i} ${y0i} Z`;
}
const ringSectors = (R: number, r: number, gap = 4) => WHEEL.map((fill, i) => ({ fill, d: sector(i, R, r, gap) }));

export function Logo({ size = 24, variant }: { size?: number; variant?: LogoVariant }) {
  const stored = useStore((s) => s.logoVariant);
  const v = variant ?? stored;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="cabG" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#221e19" />
          <Stop offset="1" stopColor="#15110d" />
        </LinearGradient>
        <LinearGradient id="seamG" x1="0" y1="0" x2="0" y2="1">
          {SEAM.map((c, i) => (
            <Stop key={i} offset={`${i / (SEAM.length - 1)}`} stopColor={c} />
          ))}
        </LinearGradient>
        <LinearGradient id="goldG" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#f3dca0" />
          <Stop offset="1" stopColor="#c79b4c" />
        </LinearGradient>
      </Defs>
      {v === 'armoire' && <Armoire />}
      {v === 'wheel' && <Wheel />}
      {v === 'ring' && <Ring />}
      {v === 'medallion' && <Medallion />}
      {v === 'hanger' && <Hanger />}
    </Svg>
  );
}

/** 06 · Armoire — a champagne-bordered wardrobe with the spectrum down the seam. */
function Armoire() {
  const W = 48, H = 64, X = (100 - W) / 2, Y = (100 - H) / 2, RR = 7;
  return (
    <>
      <Rect x={X} y={Y} width={W} height={H} rx={RR} fill="url(#cabG)" />
      <Rect x={X + 0.8} y={Y + 0.8} width={W - 1.6} height={H - 1.6} rx={RR - 0.8} fill="none" stroke={GOLD_BORDER} strokeWidth={1.4} strokeOpacity={0.55} />
      <Rect x={50 - 2.2} y={Y + 7} width={4.4} height={H - 14} rx={2.2} fill="url(#seamG)" opacity={0.45} />
      <Rect x={50 - 1} y={Y + 8} width={2} height={H - 16} rx={1} fill="url(#seamG)" />
      <Rect x={43.5 - 1} y={Y + 26} width={2} height={13} rx={1} fill="url(#goldG)" />
      <Rect x={56.5 - 1} y={Y + 26} width={2} height={13} rx={1} fill="url(#goldG)" />
      <Rect x={X + 6} y={Y + H - 2} width={5.5} height={5.5} rx={1.4} fill="url(#goldG)" />
      <Rect x={X + W - 11.5} y={Y + H - 2} width={5.5} height={5.5} rx={1.4} fill="url(#goldG)" />
    </>
  );
}

/** 02 · Segmented Wheel — the literal colour wheel in a gold ring. */
function Wheel() {
  return (
    <>
      {ringSectors(42, 24, 4).map((s, i) => (
        <Path key={i} d={s.d} fill={s.fill} />
      ))}
      <Circle cx={C} cy={C} r={45.5} fill="none" stroke={GOLD} strokeWidth={3} strokeOpacity={0.9} />
      <Circle cx={C} cy={C} r={21.5} fill="none" stroke={GOLD} strokeWidth={1.6} strokeOpacity={0.5} />
    </>
  );
}

/** 01 · Spectrum Ring — a thin spectrum hoop around a single gold pearl. */
function Ring() {
  return (
    <>
      {ringSectors(46, 36, 2).map((s, i) => (
        <Path key={i} d={s.d} fill={s.fill} />
      ))}
      <Circle cx={C} cy={C} r={26} fill="url(#goldG)" />
      <Circle cx={C} cy={C} r={26} fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth={1} />
    </>
  );
}

/** 04 · Gold Medallion — a colour wheel set into a champagne medallion. */
function Medallion() {
  return (
    <>
      <Circle cx={C} cy={C} r={47} fill="url(#goldG)" />
      <Circle cx={C} cy={C} r={34} fill="#0c0b0c" />
      {ringSectors(32, 16, 5).map((s, i) => (
        <Path key={i} d={s.d} fill={s.fill} />
      ))}
      <Circle cx={C} cy={C} r={14} fill="#15110d" />
    </>
  );
}

/** 05 · Closet Cue — a gold hanger framed by the spectrum. */
function Hanger() {
  return (
    <>
      {ringSectors(46, 38, 2).map((s, i) => (
        <Path key={i} d={s.d} fill={s.fill} />
      ))}
      <Path d="M50 38 C50 31 44.5 27.5 40 31 C36.5 33.8 38.5 39 43 38.6" stroke="url(#goldG)" strokeWidth={4} strokeLinecap="round" fill="none" />
      <Path d="M50 38 L30 56 Q27 58.5 31.5 60 L68.5 60 Q73 58.5 70 56 Z" stroke="url(#goldG)" strokeWidth={4} strokeLinejoin="round" strokeLinecap="round" fill="rgba(230,192,116,0.12)" />
    </>
  );
}
