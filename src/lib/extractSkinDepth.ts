/**
 * Estimate skin DEPTH (not undertone) from a photo — typically a front-camera
 * selfie. Rather than blindly averaging the centre of the frame (which pulls in
 * hair, eyes, background and clothing), we first detect *skin* pixels with a
 * YCbCr skin-tone test that holds across the whole fair->rich range, average only
 * those, and match the result to the nearest depth swatch. If too few skin pixels
 * are found we fall back to a central-box average so a real photo always yields a
 * best guess; the manual depth chips remain available either way.
 *
 * Depth is the only signal recoverable with any reliability from a casual photo —
 * undertone is intentionally not modelled.
 */
import { AlphaType, ColorType, Skia } from '@shopify/react-native-skia';
import { DEPTHS, rgb, type DepthId } from '@/engine';

const SAMPLE = 96;

/** Classic YCbCr skin-tone gate, widened to cover deep/rich skin too. */
function isSkin(r: number, g: number, b: number): boolean {
  const y = 0.299 * r + 0.587 * g + 0.114 * b;
  const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
  const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
  return y > 30 && y < 250 && cb >= 77 && cb <= 132 && cr >= 132 && cr <= 178 && r > b;
}

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

  // Pass 1: average only skin-classified pixels across the whole frame.
  let sr = 0, sg = 0, sb = 0, n = 0;
  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3] < 128) continue; // transparent
    const r = px[i], g = px[i + 1], b = px[i + 2];
    if (isSkin(r, g, b)) {
      sr += r; sg += g; sb += b; n++;
    }
  }

  // Fall back to a central-box average if skin detection found too little
  // (a poorly-lit or oddly-framed shot still gets a best guess).
  const total = (px.length / 4) | 0;
  if (n < total * 0.02) {
    sr = sg = sb = n = 0;
    const lo = Math.floor(SAMPLE * 0.3);
    const hi = Math.ceil(SAMPLE * 0.7);
    for (let y = lo; y < hi; y++) {
      for (let x = lo; x < hi; x++) {
        const i = (y * SAMPLE + x) * 4;
        if (px[i + 3] < 128) continue;
        sr += px[i]; sg += px[i + 1]; sb += px[i + 2]; n++;
      }
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
