/**
 * On-device wardrobe colour extraction (the "scanner").
 *
 * Pipeline (all on-device, no ML, deterministic):
 *  1. Decode the photo with Skia and downscale to a small offscreen surface.
 *  2. Keep only the central region (drop the outer border = background).
 *  3. Grey-world white-balance to neutralise the photo's colour cast.
 *  4. k-means cluster the pixels into dominant colours.
 *  5. Map each significant cluster to the nearest of the 16 named colours.
 *
 * This is materially better than naive nearest-pixel counting, but colour from a
 * casual photo is still hard — the manual palette is always the reliable fallback.
 */
import { AlphaType, ColorType, Skia } from '@shopify/react-native-skia';
import { KEYS, nearest, type ColorKey } from '@/engine';

const SAMPLE = 84; // offscreen size
const BORDER = 0.15; // ignore outer 15%
const MIN_SHARE = 0.06; // a colour must be >6% of kept pixels
const K = 6;
const ITERS = 8;

type RGB = [number, number, number];

function loadPixels(uri: string): Promise<Uint8Array | null> {
  return Skia.Data.fromURI(uri).then((data) => {
    const img = Skia.Image.MakeImageFromEncoded(data);
    if (!img) return null;
    const surface = Skia.Surface.MakeOffscreen(SAMPLE, SAMPLE) ?? Skia.Surface.Make(SAMPLE, SAMPLE);
    if (!surface) return null;
    const canvas = surface.getCanvas();
    const paint = Skia.Paint();
    canvas.drawImageRect(
      img,
      Skia.XYWHRect(0, 0, img.width(), img.height()),
      Skia.XYWHRect(0, 0, SAMPLE, SAMPLE),
      paint
    );
    surface.flush();
    const snap = surface.makeImageSnapshot();
    const px = snap.readPixels(0, 0, {
      width: SAMPLE,
      height: SAMPLE,
      colorType: ColorType.RGBA_8888,
      alphaType: AlphaType.Unpremul,
    });
    return (px as Uint8Array) ?? null;
  });
}

/** Collect central pixels, grey-world white-balanced. */
function centralPixels(px: Uint8Array): RGB[] {
  const lo = Math.floor(SAMPLE * BORDER);
  const hi = SAMPLE - lo;
  const pts: RGB[] = [];
  let sr = 0, sg = 0, sb = 0;
  for (let y = lo; y < hi; y++) {
    for (let x = lo; x < hi; x++) {
      const i = (y * SAMPLE + x) * 4;
      if (px[i + 3] < 128) continue; // transparent
      const r = px[i], g = px[i + 1], b = px[i + 2];
      pts.push([r, g, b]);
      sr += r; sg += g; sb += b;
    }
  }
  if (!pts.length) return pts;
  // grey-world: scale each channel toward the overall mean grey
  const n = pts.length;
  const mr = sr / n, mg = sg / n, mb = sb / n;
  const grey = (mr + mg + mb) / 3;
  const kr = mr ? grey / mr : 1, kg = mg ? grey / mg : 1, kb = mb ? grey / mb : 1;
  for (const p of pts) {
    p[0] = Math.max(0, Math.min(255, p[0] * kr));
    p[1] = Math.max(0, Math.min(255, p[1] * kg));
    p[2] = Math.max(0, Math.min(255, p[2] * kb));
  }
  return pts;
}

function dist2(a: RGB, b: RGB): number {
  return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
}

/** Deterministic k-means; returns clusters with their weights (fraction of pixels). */
function kmeans(pts: RGB[]): { center: RGB; weight: number }[] {
  // deterministic spread init: evenly-strided samples
  const centers: RGB[] = [];
  for (let k = 0; k < K; k++) {
    const idx = Math.floor((k + 0.5) * (pts.length / K));
    centers.push([...pts[Math.min(idx, pts.length - 1)]] as RGB);
  }
  const assign = new Array(pts.length).fill(0);
  for (let it = 0; it < ITERS; it++) {
    for (let p = 0; p < pts.length; p++) {
      let best = 0, bd = Infinity;
      for (let k = 0; k < K; k++) {
        const d = dist2(pts[p], centers[k]);
        if (d < bd) { bd = d; best = k; }
      }
      assign[p] = best;
    }
    const sum: number[][] = Array.from({ length: K }, () => [0, 0, 0, 0]);
    for (let p = 0; p < pts.length; p++) {
      const k = assign[p];
      sum[k][0] += pts[p][0];
      sum[k][1] += pts[p][1];
      sum[k][2] += pts[p][2];
      sum[k][3] += 1;
    }
    for (let k = 0; k < K; k++) {
      if (sum[k][3] > 0) {
        centers[k] = [sum[k][0] / sum[k][3], sum[k][1] / sum[k][3], sum[k][2] / sum[k][3]];
      }
    }
  }
  const counts = new Array(K).fill(0);
  for (const a of assign) counts[a]++;
  return centers.map((center, k) => ({ center, weight: counts[k] / pts.length }));
}

/**
 * Extract up to six dominant garment colours from a photo, mapped to named colours.
 * Returns [] if nothing usable is found (caller should keep the manual palette).
 */
export async function extractColors(uri: string): Promise<ColorKey[]> {
  let px: Uint8Array | null = null;
  try {
    px = await loadPixels(uri);
  } catch {
    return [];
  }
  if (!px) return [];
  const pts = centralPixels(px);
  if (pts.length < 16) return [];

  const clusters = kmeans(pts).sort((a, b) => b.weight - a.weight);

  // Accumulate weight per nearest named colour.
  const byName = new Map<ColorKey, number>();
  for (const c of clusters) {
    const name = nearest(Math.round(c.center[0]), Math.round(c.center[1]), Math.round(c.center[2]));
    byName.set(name, (byName.get(name) ?? 0) + c.weight);
  }
  const ranked = [...byName.entries()].sort((a, b) => b[1] - a[1]);
  let picked = ranked.filter(([, w]) => w > MIN_SHARE).slice(0, 6).map(([name]) => name);
  if (picked.length < 2) picked = ranked.slice(0, 3).map(([name]) => name);
  // keep canonical palette order
  return KEYS.filter((k) => picked.includes(k)) as ColorKey[];
}
