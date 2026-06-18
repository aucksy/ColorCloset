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
  | 'grid'
  | 'menu'
  | 'pencil'
  | 'bookmark'
  | 'refresh'
  | 'star'
  | 'clock'
  | 'moon'
  | 'sun'
  | 'info'
  | 'setup'
  | 'reset'
  | 'list'
  | 'trash'
  | 'tags';

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
      return p('M5 13l4 4L19 7');
    case 'grid':
      return p('M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z');
    case 'menu':
      return p('M4 7h16M4 12h16M4 17h16');
    case 'pencil':
      return p('M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z');
    case 'bookmark':
      return p('M5 4h14v16l-7-3.5L5 20z');
    case 'refresh':
      return p('M21 12a9 9 0 1 1-3-6.7M21 4v5h-5');
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
    case 'tags':
      return p('M7 7h12M7 12h12M7 17h7');
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
