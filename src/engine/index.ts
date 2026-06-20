/**
 * ColorCloset colour-intelligence engine — the core IP.
 * Pure, deterministic, dependency-free. Ported verbatim from the validated
 * web prototype; all numeric weights are the prototype's exact starting tuning.
 *
 * Barrel: re-exports every engine module so callers import from `@/engine`
 * (or `../engine`) rather than reaching into individual files.
 */
export * from './types';
export * from './colors';
export * from './constants';
export * from './data';
export * from './skin';
export * from './combos';
export * from './scoring';
export * from './deck';
export * from './gap';
export * from './naming';
export * from './leather';
