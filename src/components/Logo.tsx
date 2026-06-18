import { Defs, LinearGradient, Rect, Stop, Svg } from 'react-native-svg';

/**
 * The ColorCloset mark — the "Armoire": a champagne-bordered wardrobe cabinet with
 * the colour spectrum glowing down the door seam, gold handles and feet. Matches the
 * launcher icon (see scripts/make-icons.mjs). Authored in a 100x100 viewBox.
 */
const SEAM = ['#ef5350', '#ff8a3d', '#ffd34d', '#b6e05a', '#4cd2a0', '#38b6e0', '#5a7bf0', '#9b6bf0', '#d667c8'];
const GOLD_BORDER = '#E6C074';

// Cabinet geometry (100x100 box).
const W = 56;
const H = 74;
const X = (100 - W) / 2; // 22
const Y = (100 - H) / 2; // 13
const RR = 7.5;

export function Logo({ size = 24 }: { size?: number }) {
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
        <LinearGradient id="handG" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#f3dca0" />
          <Stop offset="1" stopColor="#cda053" />
        </LinearGradient>
        <LinearGradient id="footG" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#e6c074" />
          <Stop offset="1" stopColor="#b9893f" />
        </LinearGradient>
      </Defs>

      {/* cabinet body + inset gold border */}
      <Rect x={X} y={Y} width={W} height={H} rx={RR} fill="url(#cabG)" />
      <Rect x={X + 0.8} y={Y + 0.8} width={W - 1.6} height={H - 1.6} rx={RR - 0.8} fill="none" stroke={GOLD_BORDER} strokeWidth={1.5} strokeOpacity={0.55} />

      {/* glowing spectrum door seam (soft halo + crisp core) */}
      <Rect x={50 - 2.6} y={Y + 7} width={5.2} height={H - 14} rx={2.6} fill="url(#seamG)" opacity={0.45} />
      <Rect x={50 - 1.2} y={Y + 8} width={2.4} height={H - 16} rx={1.2} fill="url(#seamG)" />

      {/* gold handles flanking the seam */}
      <Rect x={42.5 - 1.2} y={Y + 29} width={2.4} height={16} rx={1.2} fill="url(#handG)" />
      <Rect x={57.5 - 1.2} y={Y + 29} width={2.4} height={16} rx={1.2} fill="url(#handG)" />

      {/* gold feet */}
      <Rect x={X + 6.5} y={Y + H - 2.3} width={6.5} height={6.5} rx={1.6} fill="url(#footG)" />
      <Rect x={X + W - 13} y={Y + H - 2.3} width={6.5} height={6.5} rx={1.6} fill="url(#footG)" />
    </Svg>
  );
}
