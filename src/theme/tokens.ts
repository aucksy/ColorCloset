/**
 * Design tokens. Values are the prototype's :root variables (PRD §12.1).
 * Calm, editorial, dark-by-default, warm champagne-gold accent.
 */

/** Brand golds — constant across themes. */
export const GOLD = '#C9A86A';
export const GOLD_SOFT = '#DCC094';
/** Primary button / selection gradient (soft -> deep). */
export const GOLD_GRADIENT: [string, string] = [GOLD_SOFT, GOLD];
/** Ink colour used on top of the gold gradient. */
export const ON_GOLD = '#1A1610';

export interface Theme {
  name: 'dark' | 'light';
  bg: string;
  bg2: string;
  ink: string;
  muted: string;
  faint: string;
  surface: string;
  line: string;
  line2: string;
  glass: string;
  glass2: string;
  accent: string;
  track: string;
  gold: string;
  goldSoft: string;
  goldGradient: [string, string];
  onGold: string;
}

export const dark: Theme = {
  name: 'dark',
  bg: '#0D0D11',
  bg2: '#0A0A0D',
  ink: '#F4F2EC',
  muted: '#9C9AA6',
  faint: '#65636F',
  surface: '#16161C',
  line: 'rgba(255,255,255,0.08)',
  line2: 'rgba(255,255,255,0.14)',
  glass: 'rgba(255,255,255,0.045)',
  glass2: 'rgba(255,255,255,0.08)',
  accent: GOLD_SOFT,
  track: 'rgba(255,255,255,0.08)',
  gold: GOLD,
  goldSoft: GOLD_SOFT,
  goldGradient: GOLD_GRADIENT,
  onGold: ON_GOLD,
};

export const light: Theme = {
  name: 'light',
  bg: '#F2F1F3',
  bg2: '#E9E8EC',
  ink: '#1A1A20',
  muted: '#6B6A76',
  faint: '#A6A5B0',
  surface: '#FFFFFF',
  line: 'rgba(20,20,30,0.07)',
  line2: 'rgba(20,20,30,0.13)',
  glass: 'rgba(255,255,255,0.7)',
  glass2: 'rgba(255,255,255,0.9)',
  accent: '#9C7A2E',
  track: 'rgba(20,20,30,0.08)',
  gold: GOLD,
  goldSoft: GOLD_SOFT,
  goldGradient: GOLD_GRADIENT,
  onGold: ON_GOLD,
};

export const themes = { dark, light };
