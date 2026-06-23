/**
 * Generates Google Play Store listing assets (run: `node scripts/make-store-assets.mjs`):
 *   store/play-icon-512.png        — 512×512 high-res app icon (required by Play)
 *   store/feature-graphic-1024x500.png — 1024×500 feature graphic (required by Play)
 * Reuses the CC Mark art from icon-art.mjs and the app's bundled fonts so the listing is
 * on-brand. Screenshots must be captured from the running app (Play needs ≥2 phone shots).
 */
import { Resvg } from '@resvg/resvg-js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { VB, n, defs, mark, ambiance, tile, sheen, svg } from './icon-art.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'store');
fs.mkdirSync(OUT, { recursive: true });

// ---- locate fonts + read their internal family names (so font-family matches) ----
const fontFile = (p) => path.join(ROOT, 'node_modules/@expo-google-fonts', p);
const FRAUNCES = fontFile('fraunces/600SemiBold/Fraunces_600SemiBold.ttf');
const JAKARTA = fontFile('plus-jakarta-sans/500Medium/PlusJakartaSans_500Medium.ttf');
const MONO = fontFile('space-mono/700Bold/SpaceMono_700Bold.ttf');

function familyName(file) {
  const buf = fs.readFileSync(file);
  const numTables = buf.readUInt16BE(4);
  let off = 12, nameOff = -1;
  for (let i = 0; i < numTables; i++) {
    if (buf.toString('ascii', off, off + 4) === 'name') nameOff = buf.readUInt32BE(off + 8);
    off += 16;
  }
  if (nameOff < 0) return 'sans-serif';
  const count = buf.readUInt16BE(nameOff + 2);
  const strOff = nameOff + buf.readUInt16BE(nameOff + 4);
  let rec = nameOff + 6, name = null;
  for (let i = 0; i < count; i++) {
    const pid = buf.readUInt16BE(rec);
    const nameID = buf.readUInt16BE(rec + 6);
    const len = buf.readUInt16BE(rec + 8);
    const o = buf.readUInt16BE(rec + 10);
    if (nameID === 1) {
      const s = buf.slice(strOff + o, strOff + o + len);
      // platform 3 (Windows) name strings are UTF-16BE; Buffer has no utf16be, so swap to LE.
      const txt = pid === 3 ? Buffer.from(s).swap16().toString('utf16le') : s.toString('latin1');
      if (pid === 3) name = txt;
      else if (!name) name = txt;
    }
    rec += 12;
  }
  return name || 'sans-serif';
}
const fFraunces = familyName(FRAUNCES);
const fJakarta = familyName(JAKARTA);
const fMono = familyName(MONO);
console.log('fonts:', JSON.stringify({ fFraunces, fJakarta, fMono }));

function renderPng(svgStr, width, file, fontFiles) {
  const r = new Resvg(svgStr, {
    fitTo: { mode: 'width', value: width },
    background: 'rgba(0,0,0,0)',
    font: fontFiles ? { fontFiles, loadSystemFonts: true, defaultFontFamily: fFraunces } : undefined,
  });
  fs.writeFileSync(path.join(OUT, file), r.render().asPng());
  console.log('wrote store/' + file, width + 'px wide');
}

// ---- 1) 512 high-res icon: the full-bleed master (no transparency, no baked rounding) ----
const iconSvg = svg(`${tile}${ambiance}${mark}${sheen}`);
renderPng(iconSvg, 512, 'play-icon-512.png');

// ---- 2) feature graphic 1024×500 ----
const W = 1024, H = 500;
const iconSz = 296, ix = 80, iy = (H - iconSz) / 2, k = iconSz / VB, rad = 64;
const tx = ix + iconSz + 60; // text column start
const feature =
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${defs}` +
  `<defs>` +
  `<radialGradient id="featbg" cx="34%" cy="44%" r="85%"><stop offset="0" stop-color="#191510"/><stop offset="0.6" stop-color="#0d0b09"/><stop offset="1" stop-color="#070606"/></radialGradient>` +
  `<clipPath id="itile"><rect x="${ix}" y="${iy}" width="${iconSz}" height="${iconSz}" rx="${rad}"/></clipPath>` +
  `</defs>` +
  `<rect width="${W}" height="${H}" fill="url(#featbg)"/>` +
  // icon tile (full composition clipped to a squircle) + gold hairline
  `<g clip-path="url(#itile)"><g transform="translate(${ix} ${iy}) scale(${n(k)})">${tile}${ambiance}${mark}${sheen}</g></g>` +
  `<rect x="${ix}" y="${iy}" width="${iconSz}" height="${iconSz}" rx="${rad}" fill="none" stroke="rgba(230,192,116,0.30)" stroke-width="1.5"/>` +
  // text column
  `<text x="${tx}" y="196" font-family="${fMono}" font-size="15" letter-spacing="3.4" fill="#E6C074">WHAT TO WEAR, SOLVED</text>` +
  `<text x="${tx}" y="266" font-family="${fFraunces}" font-size="66" fill="#F4EFE6"><tspan fill="#F4EFE6">Color</tspan><tspan fill="#E6C074">Closet</tspan></text>` +
  `<text x="${tx}" y="322" font-family="${fJakarta}" font-size="23" fill="#b9b1a4">Office outfits built from the colours</text>` +
  `<text x="${tx}" y="354" font-family="${fJakarta}" font-size="23" fill="#b9b1a4">already hanging in your wardrobe.</text>` +
  `</svg>`;
renderPng(feature, W, 'feature-graphic-1024x500.png', [FRAUNCES, JAKARTA, MONO]);

console.log('done');
