/**
 * Generates ColorCloset's logo assets from SVG (run: `node scripts/make-icons.mjs`).
 * Mark: a 12-segment colour wheel (the product is colour) framed by a thin
 * champagne-gold ring, on the app's dark tile. Outputs the launcher icon,
 * Android adaptive foreground/background/monochrome, splash mark, and favicon.
 */
import { Resvg } from '@resvg/resvg-js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'images');

const DARK = '#0D0D11';
const GOLD = '#C9A86A';
const WHEEL = [
  '#D8584F', '#DD7E3C', '#D8A23C', '#B9B24A', '#5FA85C', '#3FA77E',
  '#3DA0A6', '#3A78B0', '#4F5DB0', '#7E5BC0', '#B452A8', '#CC5274',
];

const S = 1024; // authoring canvas
const C = S / 2;
const rad = (d) => (d * Math.PI) / 180;
const pt = (r, a) => [C + r * Math.cos(a), C + r * Math.sin(a)];
const n = (x) => x.toFixed(2);

/** 12 annular sectors (a segmented colour-wheel ring) with a small gap between them. */
function sectors(R, r, gap = 3) {
  let out = '';
  for (let i = 0; i < 12; i++) {
    const a0 = rad(i * 30 + gap / 2 - 90);
    const a1 = rad((i + 1) * 30 - gap / 2 - 90);
    const [x0o, y0o] = pt(R, a0);
    const [x1o, y1o] = pt(R, a1);
    const [x1i, y1i] = pt(r, a1);
    const [x0i, y0i] = pt(r, a0);
    const d = `M ${n(x0o)} ${n(y0o)} A ${n(R)} ${n(R)} 0 0 1 ${n(x1o)} ${n(y1o)} L ${n(x1i)} ${n(y1i)} A ${n(r)} ${n(r)} 0 0 0 ${n(x0i)} ${n(y0i)} Z`;
    out += `<path d="${d}" fill="${WHEEL[i]}"/>`;
  }
  return out;
}

/** The wheel plus its gold framing ring. */
function wheel(R, r, goldWidth = 9) {
  const goldR = R + R * 0.06;
  return (
    sectors(R, r) +
    `<circle cx="${C}" cy="${C}" r="${n(goldR)}" fill="none" stroke="${GOLD}" stroke-width="${goldWidth}" stroke-opacity="0.9"/>` +
    `<circle cx="${C}" cy="${C}" r="${n(r - r * 0.06)}" fill="none" stroke="${GOLD}" stroke-width="${goldWidth * 0.6}" stroke-opacity="0.5"/>`
  );
}

const glow = `<defs><radialGradient id="g" cx="26%" cy="12%" r="70%">
  <stop offset="0" stop-color="${GOLD}" stop-opacity="0.20"/>
  <stop offset="0.6" stop-color="${GOLD}" stop-opacity="0"/>
</radialGradient></defs>`;

const svg = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">${inner}</svg>`;

// Full-bleed launcher icon (iOS masks the corners): dark tile + glow + framed wheel.
const iconSvg = svg(`${glow}<rect width="${S}" height="${S}" fill="${DARK}"/><rect width="${S}" height="${S}" fill="url(#g)"/>${wheel(320, 188, 11)}`);

// Android adaptive foreground: wheel only, transparent, inside the ~66% safe zone.
const foregroundSvg = svg(wheel(268, 158, 9));

// Android adaptive background: dark tile + subtle glow.
const backgroundSvg = svg(`${glow}<rect width="${S}" height="${S}" fill="${DARK}"/><rect width="${S}" height="${S}" fill="url(#g)"/>`);

// Monochrome (themed icons): a single white ring silhouette, transparent.
const monoSvg = svg(
  `<path fill="#ffffff" fill-rule="evenodd" d="M ${C} ${C} m -300 0 a 300 300 0 1 0 600 0 a 300 300 0 1 0 -600 0 M ${C} ${C} m -176 0 a 176 176 0 1 0 352 0 a 176 176 0 1 0 -352 0"/>`
);

// Splash mark: framed wheel, transparent (shown on the dark splash background).
const splashSvg = svg(wheel(360, 212, 12));

function render(svgStr, file, width) {
  const r = new Resvg(svgStr, { fitTo: { mode: 'width', value: width }, background: 'rgba(0,0,0,0)' });
  fs.writeFileSync(path.join(DIR, file), r.render().asPng());
  console.log('wrote', file, width + 'px');
}

render(iconSvg, 'icon.png', 1024);
render(foregroundSvg, 'android-icon-foreground.png', 1024);
render(backgroundSvg, 'android-icon-background.png', 1024);
render(monoSvg, 'android-icon-monochrome.png', 1024);
render(splashSvg, 'splash-icon.png', 1024);
render(foregroundSvg, 'favicon.png', 96);
console.log('done');
