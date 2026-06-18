import { Circle, Path, Svg } from 'react-native-svg';

/** The ColorCloset mark — a 12-segment colour wheel in a champagne-gold ring. */
const WHEEL = [
  '#D8584F', '#DD7E3C', '#D8A23C', '#B9B24A', '#5FA85C', '#3FA77E',
  '#3DA0A6', '#3A78B0', '#4F5DB0', '#7E5BC0', '#B452A8', '#CC5274',
];

const C = 50;
const R = 42;
const r = 24;
const GAP = 4;
const GOLD = '#C9A86A';

const rad = (d: number) => (d * Math.PI) / 180;
const pt = (radius: number, a: number): [number, number] => [C + radius * Math.cos(a), C + radius * Math.sin(a)];

function sectorPath(i: number): string {
  const a0 = rad(i * 30 + GAP / 2 - 90);
  const a1 = rad((i + 1) * 30 - GAP / 2 - 90);
  const [x0o, y0o] = pt(R, a0);
  const [x1o, y1o] = pt(R, a1);
  const [x1i, y1i] = pt(r, a1);
  const [x0i, y0i] = pt(r, a0);
  return `M ${x0o} ${y0o} A ${R} ${R} 0 0 1 ${x1o} ${y1o} L ${x1i} ${y1i} A ${r} ${r} 0 0 0 ${x0i} ${y0i} Z`;
}

const SECTORS = WHEEL.map((fill, i) => ({ fill, d: sectorPath(i) }));

export function Logo({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {SECTORS.map((s, i) => (
        <Path key={i} d={s.d} fill={s.fill} />
      ))}
      <Circle cx={C} cy={C} r={45.5} fill="none" stroke={GOLD} strokeWidth={3} strokeOpacity={0.9} />
      <Circle cx={C} cy={C} r={21.5} fill="none" stroke={GOLD} strokeWidth={1.6} strokeOpacity={0.5} />
    </Svg>
  );
}
