/**
 * Generates ColorCloset's logo assets from SVG (run: `node scripts/make-icons.mjs`).
 * Mark: the "Armoire" — a champagne-bordered wardrobe cabinet with the full colour
 * spectrum glowing down the door seam (colour lives inside the closet), gold handles
 * and feet, on the app's deep-black tile. Ported from the Claude Design exploration
 * (concept 06 · Armoire). Outputs the launcher icon, Android adaptive
 * foreground/background/monochrome, splash mark, and favicon.
 */
import { Resvg } from '@resvg/resvg-js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'images');

const GOLD_BORDER = '#E6C074';
// Vertical door-seam spectrum (top -> bottom), from the design.
const SEAM = ['#ef5350', '#ff8a3d', '#ffd34d', '#b6e05a', '#4cd2a0', '#38b6e0', '#5a7bf0', '#9b6bf0', '#d667c8'];

const VB = 240; // authoring canvas (matches the design's 240px tile)
const CX = VB / 2;
const CY = VB / 2;
const n = (x) => Number(x).toFixed(2);

const seamStops = SEAM.map((c, i) => `<stop offset="${n(i / (SEAM.length - 1))}" stop-color="${c}"/>`).join('');

const defs = (k) => `<defs>
  <radialGradient id="bg" cx="50%" cy="28%" r="82%">
    <stop offset="0" stop-color="#211d18"/>
    <stop offset="0.58" stop-color="#0d0c0d"/>
    <stop offset="1" stop-color="#060607"/>
  </radialGradient>
  <linearGradient id="sheen" x1="0" y1="0" x2="${VB}" y2="${VB * 0.75}" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#ffffff" stop-opacity="0.12"/>
    <stop offset="0.38" stop-color="#ffffff" stop-opacity="0"/>
  </linearGradient>
  <linearGradient id="cab" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#221e19"/>
    <stop offset="1" stop-color="#15110d"/>
  </linearGradient>
  <linearGradient id="seam" x1="0" y1="0" x2="0" y2="1">${seamStops}</linearGradient>
  <linearGradient id="handle" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#f3dca0"/><stop offset="1" stop-color="#cda053"/>
  </linearGradient>
  <linearGradient id="foot" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#e6c074"/><stop offset="1" stop-color="#b9893f"/>
  </linearGradient>
  <filter id="blur" x="-60%" y="-60%" width="220%" height="220%">
    <feGaussianBlur stdDeviation="${n(4.5 * k)}"/>
  </filter>
</defs>`;

/** The armoire cabinet group, scaled by k about the tile centre (transparent bg). */
function armoire(k) {
  const w = 120 * k, h = 158 * k;
  const x = CX - w / 2, y = CY - h / 2;
  const rr = 16 * k;
  const glowW = 16 * k, crispW = 5 * k;
  const handleW = 5 * k, handleH = 34 * k, handleTop = y + 62 * k;
  const footW = 14 * k, footH = 14 * k, footTop = y + h - 5 * k;
  const r = (px, py, pw, ph, prx, fill, extra = '') =>
    `<rect x="${n(px)}" y="${n(py)}" width="${n(pw)}" height="${n(ph)}" rx="${n(prx)}" ${fill} ${extra}/>`;
  return [
    // cabinet body + inset gold border
    r(x, y, w, h, rr, 'fill="url(#cab)"'),
    r(x + 1.2 * k, y + 1.2 * k, w - 2.4 * k, h - 2.4 * k, rr - 1.2 * k, 'fill="none"',
      `stroke="${GOLD_BORDER}" stroke-width="${n(2 * k)}" stroke-opacity="0.5"`),
    // glowing spectrum seam (soft halo + crisp core)
    r(CX - glowW / 2, y + 14 * k, glowW, h - 28 * k, glowW / 2, 'fill="url(#seam)"', 'opacity="0.8" filter="url(#blur)"'),
    r(CX - crispW / 2, y + 16 * k, crispW, h - 32 * k, crispW / 2, 'fill="url(#seam)"'),
    // two gold door handles flanking the seam
    r(CX - 16 * k - handleW / 2, handleTop, handleW, handleH, handleW / 2, 'fill="url(#handle)"'),
    r(CX + 16 * k - handleW / 2, handleTop, handleW, handleH, handleW / 2, 'fill="url(#handle)"'),
    // two gold feet
    r(x + 14 * k, footTop, footW, footH, 3 * k, 'fill="url(#foot)"'),
    r(x + w - 28 * k, footTop, footW, footH, 3 * k, 'fill="url(#foot)"'),
  ].join('');
}

const svg = (inner, k = 1) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${VB}" height="${VB}" viewBox="0 0 ${VB} ${VB}">${defs(k)}${inner}</svg>`;

const tile = `<rect width="${VB}" height="${VB}" fill="url(#bg)"/>`;
const sheen = `<rect width="${VB}" height="${VB}" fill="url(#sheen)"/>`;

// Full-bleed launcher icon (the OS masks the corners): tile + armoire + sheen.
const iconSvg = svg(`${tile}${armoire(1)}${sheen}`, 1);

// Android adaptive foreground: armoire only, transparent, inside the ~66% safe zone.
const foregroundSvg = svg(armoire(0.82), 0.82);

// Android adaptive background: the dark tile + sheen.
const backgroundSvg = svg(`${tile}${sheen}`, 1);

// Splash mark: armoire, transparent (shown on the dark splash background).
const splashSvg = svg(armoire(1), 1);

// Monochrome (themed icons): white wardrobe silhouette with the seam knocked out.
const monoSvg = (() => {
  const k = 0.82;
  const w = 120 * k, h = 158 * k;
  const x = CX - w / 2, y = CY - h / 2;
  const rr = 16 * k;
  const seamW = 7 * k, footW = 14 * k, footH = 14 * k, footTop = y + h - 5 * k;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${VB}" height="${VB}" viewBox="0 0 ${VB} ${VB}">
    <mask id="seamMask">
      <rect width="${VB}" height="${VB}" fill="#fff"/>
      <rect x="${n(CX - seamW / 2)}" y="${n(y + 16 * k)}" width="${n(seamW)}" height="${n(h - 32 * k)}" rx="${n(seamW / 2)}" fill="#000"/>
    </mask>
    <rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="${n(rr)}" fill="#ffffff" mask="url(#seamMask)"/>
    <rect x="${n(x + 14 * k)}" y="${n(footTop)}" width="${n(footW)}" height="${n(footH)}" rx="${n(3 * k)}" fill="#ffffff"/>
    <rect x="${n(x + w - 28 * k)}" y="${n(footTop)}" width="${n(footW)}" height="${n(footH)}" rx="${n(3 * k)}" fill="#ffffff"/>
  </svg>`;
})();

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
