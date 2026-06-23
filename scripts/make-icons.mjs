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
import { VB, n, defs, mark, ambiance, tile, sheen, glow, markScaled, svg, monoMark } from './icon-art.mjs';

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'images');

const iconSvg = svg(`${tile}${ambiance}${mark}${sheen}`); // full-bleed master
const foregroundSvg = svg(markScaled(1.12)); // adaptive fg — mark only, within the safe circle
const backgroundSvg = svg(`${tile}${ambiance}${sheen}`); // adaptive bg — tile + ambiance
const splashSvg = svg(markScaled(1.5)); // splash mark on transparent
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

  // Android 12+ splash icon (windowSplashScreenAnimatedIcon = drawable/splashscreen_logo).
  // Same no-prebuild gotcha. We mask the icon to a circle filling ~82% of the splash
  // canvas (the icon-with-background safe size) — much larger than expo's tiny default —
  // on the obsidian splash background, so the new mark reads big and centred on launch.
  const SPLASH = { mdpi: 288, hdpi: 432, xhdpi: 576, xxhdpi: 864, xxxhdpi: 1152 };
  const splashLogo = (canvas) => {
    const D = Math.round(canvas * 0.82);
    const off = (canvas - D) / 2;
    const k = D / VB;
    // clipPath must live in <defs>; clip and transform must be on SEPARATE nested groups
    // (resvg renders incorrectly when both are on one <g>).
    return (
      `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas}" height="${canvas}" viewBox="0 0 ${canvas} ${canvas}">${defs}` +
      `<defs><clipPath id="sclip"><circle cx="${canvas / 2}" cy="${canvas / 2}" r="${D / 2}"/></clipPath></defs>` +
      `<g clip-path="url(#sclip)"><g transform="translate(${n(off)} ${n(off)}) scale(${n(k)})">${tile}${glow}${mark}</g></g></svg>`
    );
  };
  for (const [dpi, c] of Object.entries(SPLASH)) {
    const dir = path.join(RES, `drawable-${dpi}`);
    if (!fs.existsSync(dir)) continue;
    renderTo(dir, 'splashscreen_logo.png', splashLogo(c), c);
    console.log('android drawable-' + dpi, 'splashscreen_logo.png');
  }
} else {
  console.log('android/ not present — skipped native res');
}
console.log('done');
