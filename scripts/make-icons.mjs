/**
 * Generates ColorCloset's logo assets from SVG (run: `node scripts/make-icons.mjs`).
 *
 * Mark: the "Noir" CC Mark (Claude Design — "ColorCloset Icon Spec") — a champagne gold
 * wardrobe rail carrying three signature garments (beige / forest green / ivory) on gold
 * hooks, over the app's deep obsidian tile with a faint door-frame keyline, centre seam
 * and warm champagne glow. One master → every platform mask. Outputs the launcher icon,
 * Android adaptive foreground/background/monochrome, splash mark, and favicon.
 *
 * Source of truth: claude.ai/design "ColorCloset app icon design" → CC Mark.dc.html.
 * Keep src/components/Logo.tsx in sync with the mark drawn here.
 */
import { Resvg } from '@resvg/resvg-js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'images');
const GOLD = '#E6C074';
const VB = 240;
const n = (x) => Number(x).toFixed(2);

const defs = `<defs>
  <radialGradient id="bg" cx="50%" cy="26%" r="86%">
    <stop offset="0" stop-color="#211d18"/><stop offset="0.58" stop-color="#0d0c0d"/><stop offset="1" stop-color="#060607"/>
  </radialGradient>
  <radialGradient id="glow" cx="50%" cy="50%" r="50%">
    <stop offset="0" stop-color="#e9c880" stop-opacity="0.13"/><stop offset="0.64" stop-color="#e9c880" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="seam" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#e6c074" stop-opacity="0"/><stop offset="0.28" stop-color="#e6c074" stop-opacity="0.11"/>
    <stop offset="0.72" stop-color="#e6c074" stop-opacity="0.11"/><stop offset="1" stop-color="#e6c074" stop-opacity="0"/>
  </linearGradient>
  <linearGradient id="rail" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#a9823f"/><stop offset="0.5" stop-color="#f6e3b0"/><stop offset="1" stop-color="#a9823f"/>
  </linearGradient>
  <linearGradient id="gBeige" x1="0" y1="0" x2="0.28" y2="1"><stop offset="0" stop-color="#ecdebd"/><stop offset="1" stop-color="#c9b78d"/></linearGradient>
  <linearGradient id="gGreen" x1="0" y1="0" x2="0.28" y2="1"><stop offset="0" stop-color="#427a59"/><stop offset="1" stop-color="#244432"/></linearGradient>
  <linearGradient id="gWhite" x1="0" y1="0" x2="0.28" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#dbd4c6"/></linearGradient>
  <linearGradient id="sheen" x1="${VB}" y1="0" x2="84" y2="200" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#ffffff" stop-opacity="0.08"/><stop offset="0.4" stop-color="#ffffff" stop-opacity="0"/>
  </linearGradient>
</defs>`;

// One garment hanging from a gold hook: a rounded-shoulder body (round top, near-square
// foot — border-radius 14/19 top, 5 bottom) with a faint rim highlight, plus the hook ring.
const garmentBody = (x, w, h, fill) => {
  const y = 88, trx = 14, tryy = 19, br = 5;
  const d =
    `M ${x} ${y + tryy} Q ${x} ${y} ${x + trx} ${y} L ${x + w - trx} ${y} Q ${x + w} ${y} ${x + w} ${y + tryy} ` +
    `L ${x + w} ${y + h - br} Q ${x + w} ${y + h} ${x + w - br} ${y + h} L ${x + br} ${y + h} Q ${x} ${y + h} ${x} ${y + h - br} Z`;
  return `<path d="${d}" fill="${fill}"/><path d="${d}" fill="none" stroke="#ffffff" stroke-opacity="0.16" stroke-width="0.8"/>`;
};
const hook = (cx) => `<circle cx="${cx}" cy="84" r="4" fill="none" stroke="${GOLD}" stroke-width="2"/>`;

// The recognisable mark: rail + three garments + hooks (no tile — the adaptive
// foreground, splash and in-app Logo all reuse this on a transparent canvas).
const mark = `
  <rect x="62" y="87" width="116" height="1.4" rx="0.7" fill="#000" opacity="0.4"/>
  <rect x="62" y="84" width="116" height="3" rx="1.5" fill="url(#rail)"/>
  ${garmentBody(78, 28, 60, 'url(#gBeige)')}
  ${garmentBody(106, 28, 66, 'url(#gGreen)')}
  ${garmentBody(134, 28, 56, 'url(#gWhite)')}
  ${hook(95)}${hook(123)}${hook(151)}
`;

// Background ambiance that lives behind the mark (door keyline, centre seam, glow).
const ambiance = `
  <rect x="36" y="30" width="168" height="180" rx="24" fill="none" stroke="${GOLD}" stroke-opacity="0.13" stroke-width="1.5"/>
  <rect x="119.5" y="44" width="1" height="152" fill="url(#seam)"/>
  <circle cx="120" cy="125" r="77" fill="url(#glow)"/>
`;

const tile = `<rect width="${VB}" height="${VB}" fill="url(#bg)"/>`;
const sheen = `<rect width="${VB}" height="${VB}" fill="url(#sheen)"/>`;
// Centre the mark (optical centre ~120,117) and scale about the canvas centre.
const markScaled = (k) => `<g transform="translate(120 120) scale(${n(k)}) translate(-120 -117)">${mark}</g>`;

const svg = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" width="${VB}" height="${VB}" viewBox="0 0 ${VB} ${VB}">${defs}${inner}</svg>`;

const iconSvg = svg(`${tile}${ambiance}${mark}${sheen}`); // full-bleed master
const foregroundSvg = svg(markScaled(1.12)); // adaptive fg — mark only, within the safe circle
const backgroundSvg = svg(`${tile}${ambiance}${sheen}`); // adaptive bg — tile + ambiance
const splashSvg = svg(markScaled(1.5)); // splash mark on transparent

// Monochrome themed icon: a clean white silhouette of the rail + three garments + hooks.
const monoMark = `
  <g transform="translate(120 120) scale(1.12) translate(-120 -117)">
    <rect x="62" y="84" width="116" height="3" rx="1.5" fill="#ffffff"/>
    <path d="M 78 107 Q 78 88 92 88 L 92 88 Q 106 88 106 107 L 106 143 Q 106 148 101 148 L 83 148 Q 78 148 78 143 Z" fill="#ffffff"/>
    <path d="M 106 107 Q 106 88 120 88 L 120 88 Q 134 88 134 107 L 134 149 Q 134 154 129 154 L 111 154 Q 106 154 106 149 Z" fill="#ffffff"/>
    <path d="M 134 107 Q 134 88 148 88 L 148 88 Q 162 88 162 107 L 162 139 Q 162 144 157 144 L 139 144 Q 134 144 134 139 Z" fill="#ffffff"/>
    <circle cx="95" cy="84" r="4" fill="none" stroke="#ffffff" stroke-width="2"/>
    <circle cx="123" cy="84" r="4" fill="none" stroke="#ffffff" stroke-width="2"/>
    <circle cx="151" cy="84" r="4" fill="none" stroke="#ffffff" stroke-width="2"/>
  </g>`;
const monoSvg = svg(monoMark);

function renderTo(dir, file, svgStr, width) {
  const r = new Resvg(svgStr, { fitTo: { mode: 'width', value: width }, background: 'rgba(0,0,0,0)' });
  fs.writeFileSync(path.join(dir, file), r.render().asPng());
}
const render = (svgStr, file, width) => {
  renderTo(DIR, file, svgStr, width);
  console.log('wrote', file, width + 'px');
};

// Expo-managed assets (master icon, iOS/web, splash, favicon, adaptive layers).
render(iconSvg, 'icon.png', 1024);
render(foregroundSvg, 'android-icon-foreground.png', 1024);
render(backgroundSvg, 'android-icon-background.png', 1024);
render(monoSvg, 'android-icon-monochrome.png', 1024);
render(splashSvg, 'splash-icon.png', 1024);
render(foregroundSvg, 'favicon.png', 96);

// Android native res. CI builds the committed android/ directly (no `expo prebuild`),
// so the launcher mipmaps must be regenerated here. We emit PNG (resvg's native output)
// and drop the stale .webp — Android resolves @mipmap/ic_launcher_* by resource name, so
// the extension is irrelevant and PNG mipmaps are standard.
const RES = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'android', 'app', 'src', 'main', 'res');
const ADAPTIVE = { mdpi: 108, hdpi: 162, xhdpi: 216, xxhdpi: 324, xxxhdpi: 432 }; // 108dp foreground/background
const LEGACY = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 }; // 48dp legacy square/round (API < 26)
const clipCircle = `<clipPath id="rc"><circle cx="120" cy="120" r="120"/></clipPath>`;
const iconRoundSvg = svg(`${clipCircle}<g clip-path="url(#rc)">${tile}${ambiance}${mark}${sheen}</g>`);
const rmIf = (p) => { if (fs.existsSync(p)) fs.unlinkSync(p); };

if (fs.existsSync(RES)) {
  for (const [dpi, a] of Object.entries(ADAPTIVE)) {
    const dir = path.join(RES, `mipmap-${dpi}`);
    if (!fs.existsSync(dir)) continue;
    const l = LEGACY[dpi];
    renderTo(dir, 'ic_launcher_foreground.png', foregroundSvg, a);
    renderTo(dir, 'ic_launcher_background.png', backgroundSvg, a);
    renderTo(dir, 'ic_launcher_monochrome.png', monoSvg, a);
    renderTo(dir, 'ic_launcher.png', iconSvg, l);
    renderTo(dir, 'ic_launcher_round.png', iconRoundSvg, l);
    for (const f of ['ic_launcher_foreground', 'ic_launcher_background', 'ic_launcher_monochrome', 'ic_launcher', 'ic_launcher_round'])
      rmIf(path.join(dir, `${f}.webp`));
    console.log('android mipmap-' + dpi, '→ png (webp removed)');
  }
} else {
  console.log('android/ not present — skipped native res');
}
console.log('done');
