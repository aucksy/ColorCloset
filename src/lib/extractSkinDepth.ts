/**
 * Estimate skin DEPTH (not undertone) from a photo. Samples the central region
 * (where a face/skin tends to be), averages it, and matches to the nearest depth
 * swatch. Depth is the only signal recoverable with any reliability from a casual
 * photo — undertone is intentionally not modelled. Manual depth chips remain the
 * fallback when this is unsure or the user prefers.
 */
import { AlphaType, ColorType, Skia } from '@shopify/react-native-skia';
import { DEPTHS, rgb, type DepthId } from '@/engine';

const SAMPLE = 64;
const BOX = 0.3; // central 30% box

export async function extractSkinDepth(uri: string): Promise<DepthId | null> {
  let px: Uint8Array | null = null;
  try {
    const data = await Skia.Data.fromURI(uri);
    const img = Skia.Image.MakeImageFromEncoded(data);
    if (!img) return null;
    const surface = Skia.Surface.MakeOffscreen(SAMPLE, SAMPLE) ?? Skia.Surface.Make(SAMPLE, SAMPLE);
    if (!surface) return null;
    const canvas = surface.getCanvas();
    canvas.drawImageRect(
      img,
      Skia.XYWHRect(0, 0, img.width(), img.height()),
      Skia.XYWHRect(0, 0, SAMPLE, SAMPLE),
      Skia.Paint()
    );
    surface.flush();
    px = surface.makeImageSnapshot().readPixels(0, 0, {
      width: SAMPLE,
      height: SAMPLE,
      colorType: ColorType.RGBA_8888,
      alphaType: AlphaType.Unpremul,
    }) as Uint8Array | null;
  } catch {
    return null;
  }
  if (!px) return null;

  const lo = Math.floor(SAMPLE * (0.5 - BOX / 2));
  const hi = Math.ceil(SAMPLE * (0.5 + BOX / 2));
  let sr = 0, sg = 0, sb = 0, n = 0;
  for (let y = lo; y < hi; y++) {
    for (let x = lo; x < hi; x++) {
      const i = (y * SAMPLE + x) * 4;
      if (px[i + 3] < 128) continue;
      sr += px[i]; sg += px[i + 1]; sb += px[i + 2]; n++;
    }
  }
  if (!n) return null;
  const avg: [number, number, number] = [sr / n, sg / n, sb / n];

  let best: DepthId | null = null;
  let bd = Infinity;
  for (const d of DEPTHS) {
    const [r, g, b] = rgb(d.dot);
    const dd = (r - avg[0]) ** 2 + (g - avg[1]) ** 2 + (b - avg[2]) ** 2;
    if (dd < bd) { bd = dd; best = d.id; }
  }
  return best;
}
