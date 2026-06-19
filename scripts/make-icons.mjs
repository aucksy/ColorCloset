/**
 * Generates ColorCloset's logo assets from SVG (run: `node scripts/make-icons.mjs`).
 * Mark: "Half-Open · Noir" (Claude Design concept 14) — a champagne-bordered wardrobe
 * with one door swung open, revealing garments (beige / forest green / white) hanging
 * on a gold rail, on the app's deep-black tile. Outputs the launcher icon, Android
 * adaptive foreground/background/monochrome, splash mark, and favicon.
 */
import { Resvg } from '@resvg/resvg-js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'images');
const GOLD_BORDER = '#E6C074';
const VB = 240;
const n = (x) => Number(x).toFixed(2);

const defs = `<defs>
  <radialGradient id="bg" cx="50%" cy="28%" r="82%">
    <stop offset="0" stop-color="#211d18"/><stop offset="0.58" stop-color="#0d0c0d"/><stop offset="1" stop-color="#060607"/>
  </radialGradient>
  <linearGradient id="sheen" x1="0" y1="0" x2="${VB}" y2="${VB * 0.75}" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#ffffff" stop-opacity="0.1"/><stop offset="0.38" stop-color="#ffffff" stop-opacity="0"/>
  </linearGradient>
  <linearGradient id="cab" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#241f19"/><stop offset="1" stop-color="#15110d"/></linearGradient>
  <linearGradient id="interior" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="#1d1815"/><stop offset="1" stop-color="#0d0a08"/></linearGradient>
  <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3dca0"/><stop offset="1" stop-color="#caa052"/></linearGradient>
  <linearGradient id="rdoor" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2c261e"/><stop offset="1" stop-color="#191510"/></linearGradient>
  <linearGradient id="ldoor" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#221c15"/><stop offset="1" stop-color="#3c342a"/></linearGradient>
  <linearGradient id="gBeige" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e7d9b7"/><stop offset="1" stop-color="#c9b78d"/></linearGradient>
  <linearGradient id="gGreen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3d7053"/><stop offset="1" stop-color="#264835"/></linearGradient>
  <linearGradient id="gWhite" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6f2ea"/><stop offset="1" stop-color="#dbd4c6"/></linearGradient>
</defs>`;

const garment = (hookCx, x, fill, h) =>
  `<circle cx="${hookCx}" cy="59" r="4" stroke="${GOLD_BORDER}" stroke-width="2" fill="none"/>` +
  `<rect x="${x}" y="64" width="22" height="${h}" rx="6" fill="${fill}"/>`;

// The cabinet, authored at the full 240 layout (scaled about centre by `scaled`).
const cabinet = `
  <rect x="44" y="31" width="152" height="178" rx="15" fill="url(#cab)"/>
  <rect x="45.2" y="32.2" width="149.6" height="175.6" rx="13.8" fill="none" stroke="${GOLD_BORDER}" stroke-width="2.5" stroke-opacity="0.55"/>
  <rect x="53" y="40" width="134" height="160" rx="8" fill="url(#interior)"/>
  <rect x="70" y="60.5" width="70" height="2.4" rx="1.2" fill="url(#gold)"/>
  ${garment(81, 70, 'url(#gBeige)', 60)}
  ${garment(107, 96, 'url(#gGreen)', 66)}
  ${garment(133, 122, 'url(#gWhite)', 56)}
  <rect x="145" y="40" width="42" height="160" rx="8" fill="url(#rdoor)"/>
  <rect x="146.2" y="41.2" width="39.6" height="157.6" rx="7" fill="none" stroke="${GOLD_BORDER}" stroke-width="1" stroke-opacity="0.4"/>
  <rect x="151" y="112" width="4" height="26" rx="2" fill="url(#gold)"/>
  <path d="M52 40 L26 50 L26 190 L52 200 Z" fill="url(#ldoor)"/>
  <path d="M52 40 L26 50 L26 190 L52 200 Z" fill="none" stroke="${GOLD_BORDER}" stroke-width="1.4" stroke-opacity="0.5"/>
  <rect x="30" y="108" width="4" height="26" rx="2" fill="url(#gold)"/>
  <rect x="51" y="40" width="1.6" height="160" fill="rgba(247,231,187,0.45)"/>
`;

const scaled = (k) => `<g transform="translate(120 120) scale(${n(k)}) translate(-120 -120)">${cabinet}</g>`;

const svg = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" width="${VB}" height="${VB}" viewBox="0 0 ${VB} ${VB}">${defs}${inner}</svg>`;
const tile = `<rect width="${VB}" height="${VB}" fill="url(#bg)"/>`;
const sheen = `<rect width="${VB}" height="${VB}" fill="url(#sheen)"/>`;

const iconSvg = svg(`${tile}${scaled(0.82)}${sheen}`);
const foregroundSvg = svg(scaled(0.7));
const backgroundSvg = svg(`${tile}${sheen}`);
const splashSvg = svg(scaled(0.92));

// Monochrome themed icon: a clean white wardrobe silhouette with a hinged open door.
const monoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${VB}" height="${VB}" viewBox="0 0 ${VB} ${VB}">
  <g transform="translate(120 120) scale(0.74) translate(-120 -120)">
    <mask id="m">
      <rect width="${VB}" height="${VB}" fill="#fff"/>
      <rect x="62" y="50" width="120" height="140" rx="9" fill="#000"/>
    </mask>
    <rect x="50" y="38" width="144" height="164" rx="15" fill="#ffffff" mask="url(#m)"/>
    <rect x="138" y="50" width="8" height="140" fill="#ffffff"/>
    <path d="M58 40 L26 52 L26 188 L58 200 Z" fill="#ffffff"/>
  </g>
</svg>`;

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
