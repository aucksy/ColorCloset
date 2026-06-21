/**
 * Minimal stroke-icon set, ported from the prototype's inline 24x24 SVGs.
 * fill:none, round caps/joins, stroke = currentColor (passed via `color`).
 */
import { type ReactNode } from 'react';
import { Circle, Path, Svg } from 'react-native-svg';

export type IconName =
  | 'chevron-left'
  | 'chevron-right'
  | 'check'
  | 'x'
  | 'download'
  | 'grid'
  | 'menu'
  | 'pencil'
  | 'heart'
  | 'heart-fill'
  | 'bell'
  | 'chevron-down'
  | 'star'
  | 'clock'
  | 'moon'
  | 'sun'
  | 'info'
  | 'setup'
  | 'reset'
  | 'list'
  | 'trash'
  | 'cloud'
  | 'logout'
  | 'thumbs-down'
  | 'bag';

function paths(name: IconName, c: string, sw: number): ReactNode {
  const p = (d: string, fill = 'none') => (
    <Path d={d} stroke={c} strokeWidth={sw} fill={fill} strokeLinecap="round" strokeLinejoin="round" />
  );
  switch (name) {
    case 'chevron-left':
      return p('M15 6l-6 6 6 6');
    case 'chevron-right':
      return p('M9 6l6 6-6 6');
    case 'check':
      return p('M5 12l5 5 9-10');
    case 'x':
      return p('M6 6l12 12M18 6L6 18');
    case 'download':
      return p('M12 3v12M8 11l4 4 4-4M5 21h14');
    case 'grid':
      return p('M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z');
    case 'menu':
      return p('M4 7h16M4 12h16M4 17h16');
    case 'pencil':
      return p('M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z');
    case 'heart':
      return p('M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7z');
    case 'heart-fill':
      return p('M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7z', c);
    case 'bell':
      return p('M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0');
    case 'chevron-down':
      return p('M6 9l6 6 6-6');
    case 'star':
      return p('M12 3l2.6 6.3L21 10l-5 4 1.4 6.5L12 17l-5.4 3.5L8 14l-5-4 6.4-.7z');
    case 'clock':
      return (
        <>
          <Circle cx={12} cy={12} r={9} stroke={c} strokeWidth={sw} fill="none" />
          {p('M12 7v5l3 2')}
        </>
      );
    case 'moon':
      return p('M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z');
    case 'sun':
      return (
        <>
          <Circle cx={12} cy={12} r={4.2} stroke={c} strokeWidth={sw} fill="none" />
          {p('M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.4 1.4M17.6 17.6 19 19M19 5l-1.4 1.4M6.4 17.6 5 19')}
        </>
      );
    case 'info':
      return (
        <>
          <Circle cx={12} cy={12} r={9} stroke={c} strokeWidth={sw} fill="none" />
          {p('M12 16v-4M12 8h.01')}
        </>
      );
    case 'setup':
      return p('M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M3 12h18');
    case 'reset':
      return p('M3 12a9 9 0 1 1 3 6.7M3 21v-5h5');
    case 'list':
      return p('M4 7h16M4 12h16M4 17h10');
    case 'trash':
      return p('M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13');
    case 'cloud':
      return p('M7 18a4 4 0 0 1-.4-7.98A6 6 0 0 1 18 9a4 4 0 0 1 0 9z');
    case 'logout':
      return p('M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H3');
    case 'thumbs-down':
      return p('M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17');
    case 'bag':
      return p('M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0');
  }
}

interface Props {
  name: IconName;
  size?: number;
  color: string;
  strokeWidth?: number;
}

export function Icon({ name, size = 18, color, strokeWidth = 2 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {paths(name, color, strokeWidth)}
    </Svg>
  );
}
