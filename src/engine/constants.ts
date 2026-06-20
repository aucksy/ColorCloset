/**
 * Engine constants: style/mode/gender vocabularies, display labels, ranking
 * thresholds, and the curated source list. Pure data — no logic, no platform
 * imports. Type names are pulled from './types' (spec §11).
 */
import type { StyleName, Mode, Gender } from './types';

/** The four wardrobe styles, in onboarding/segmented display order. */
export const STYLES: StyleName[] = ['Minimal', 'Classic', 'Bold', 'Statement'];

/** The two wardrobe modes (one active at a time, toggled in the sidebar). */
export const MODES: Mode[] = ['formal', 'casual'];

/** The two profile-level genders (chosen once at onboarding). */
export const GENDERS: Gender[] = ['male', 'female'];

/** Inclusion threshold for the combo universe (spec §8). Below this, a non-curated
 *  pair is dropped; curated pairs are always included regardless of score. */
export const UNIVERSE_THRESHOLD = 0.55;

/** Minimum score for a colour to be offered as a gap suggestion (spec §9). */
export const GAP_THRESHOLD = 0.62;

/** Mode → user-facing label (sidebar toggle, eyebrows). */
export const MODE_LABEL: Record<Mode, string> = { formal: 'Formal', casual: 'Casual' };

/** Gender → user-facing label (brand subline, onboarding cards). */
export const GENDER_LABEL: Record<Gender, string> = { male: 'Men', female: 'Women' };

/**
 * The five most authentic / trustworthy sources behind the colour logic, surfaced
 * in the "Colour science sources" panel (spec §13.5). Transcribed from the research
 * doc's "TOP 5 MOST AUTHENTIC / TRUSTWORTHY SOURCES" section — one short note each.
 */
export const SOURCES: { name: string; note: string }[] = [
  {
    name: 'Pantone Color Institute',
    note: 'The globally recognised colour authority — sets the industry standard for colour naming and forecasting.',
  },
  {
    name: 'Monk Skin Tone Scale (Dr. Ellis Monk, Harvard, with Google)',
    note: 'Open-source, peer-reviewed, inclusive skin-tone scale — the basis for our skin-tone model.',
  },
  {
    name: 'Who What Wear',
    note: 'Leading fashion publication, authoritative on current and enduring colour pairings for women.',
  },
  {
    name: "Gentleman's Gazette / Bond Suits",
    note: 'Respected classic-menswear authorities — rigorous on colour, shades and combinations.',
  },
  {
    name: 'The Concept Wardrobe',
    note: 'Trusted, methodical colour-analysis resource grounding which colours flatter which colouring.',
  },
];
