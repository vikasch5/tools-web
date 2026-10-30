/**
 * Photo and signature specs for Indian online application forms, and the
 * helpers that make a JPEG land inside a form's KB range.
 *
 * Specs change with each notification. Sources (checked October 2026):
 * bank exams — Punjab & Sind Bank recruitment notice (IBPS format, 2024);
 * the rest — exam guides from Physics Wallah, Vision IAS and visafoto.
 * The page tells people to confirm against their own notification.
 */

export type FormKind = "photo" | "signature" | "thumb" | "document";

export type FormPreset = {
  id: string;
  group: string;
  label: string;
  kind: FormKind;
  /** Output size in pixels. */
  width: number;
  height: number;
  /** Allowed file size, as the form states it. */
  minKb: number;
  maxKb: number;
  note: string;
};

export const formPresets: FormPreset[] = [
  { id: "bank-photo", group: "Bank exams (IBPS, SBI, RBI, RRB bank)", label: "Photo (200 × 230 px, 20–50 KB)", kind: "photo", width: 200, height: 230, minKb: 20, maxKb: 50, note: "Recent colour photo, light background, face clearly visible." },
  { id: "bank-signature", group: "Bank exams (IBPS, SBI, RBI, RRB bank)", label: "Signature (140 × 60 px, 10–20 KB)", kind: "signature", width: 140, height: 60, minKb: 10, maxKb: 20, note: "Sign on white paper with a black pen. Capital letters are not accepted." },
  { id: "bank-thumb", group: "Bank exams (IBPS, SBI, RBI, RRB bank)", label: "Left thumb impression (240 × 240 px, 20–50 KB)", kind: "thumb", width: 240, height: 240, minKb: 20, maxKb: 50, note: "Black or blue ink on white paper." },
  { id: "bank-declaration", group: "Bank exams (IBPS, SBI, RBI, RRB bank)", label: "Handwritten declaration (800 × 400 px, 50–100 KB)", kind: "document", width: 800, height: 400, minKb: 50, maxKb: 100, note: "Written in English in black ink on white paper, not in capital letters." },
  { id: "ssc-signature", group: "SSC (CGL, CHSL, MTS, GD)", label: "Signature (4 × 2 cm, 10–20 KB)", kind: "signature", width: 280, height: 140, minKb: 10, maxKb: 20, note: "SSC now takes the photo live in its portal; only the signature is uploaded." },
  { id: "upsc-photo", group: "UPSC", label: "Photo (20–200 KB)", kind: "photo", width: 350, height: 450, minKb: 20, maxKb: 200, note: "Plain white background, taken within the last 10 days." },
  { id: "upsc-signature", group: "UPSC", label: "Signature (20–100 KB)", kind: "signature", width: 350, height: 500, minKb: 20, maxKb: 100, note: "UPSC asks for three signatures, one below the other, on one sheet." },
  { id: "gds-photo", group: "India Post GDS", label: "Photo (320 × 400 px, 30–100 KB)", kind: "photo", width: 320, height: 400, minKb: 30, maxKb: 100, note: "Recent colour photo with a light background." },
  { id: "gds-signature", group: "India Post GDS", label: "Signature (300 × 120 px, 20–100 KB)", kind: "signature", width: 300, height: 120, minKb: 20, maxKb: 100, note: "Black ink on white paper." },
  { id: "pan-photo", group: "PAN card (online application)", label: "Photo (3.5 × 2.5 cm, up to 20 KB)", kind: "photo", width: 197, height: 276, minKb: 1, maxKb: 20, note: "White background. Portals differ; this uses the stricter 20 KB limit." },
  { id: "pan-signature", group: "PAN card (online application)", label: "Signature (2 × 4.5 cm, up to 10 KB)", kind: "signature", width: 354, height: 157, minKb: 1, maxKb: 10, note: "Black ink on white paper." },
];

export const presetGroups = [...new Set(formPresets.map((p) => p.group))];

/**
 * Forms count a KB as 1,000 or 1,024 bytes. To pass both, the maximum
 * uses 1,000 and the minimum uses 1,024.
 */
export const maxBytesFor = (kb: number) => kb * 1000;
export const minBytesFor = (kb: number) => kb * 1024;

export function describePreset(p: Pick<FormPreset, "width" | "height" | "minKb" | "maxKb">) {
  const range = p.minKb > 1 ? `${p.minKb}–${p.maxKb} KB` : `up to ${p.maxKb} KB`;
  return `${p.width} × ${p.height} px JPG, ${range}`;
}

/**
 * Pads a JPEG with comment (COM) segments right after the start marker so
 * it reaches `minBytes`. The picture is unchanged; forms with a minimum
 * size check only the file size. Each segment holds at most 65,533 bytes.
 */
export function padJpeg(data: Uint8Array, minBytes: number): Uint8Array {
  if (data.length >= minBytes) return data;
  if (data[0] !== 0xff || data[1] !== 0xd8) throw new Error("Not a JPEG file.");
  const segments: Uint8Array[] = [];
  let missing = minBytes - data.length;
  while (missing > 0) {
    const payload = Math.min(65533, Math.max(1, missing - 4));
    const segment = new Uint8Array(payload + 4);
    segment[0] = 0xff;
    segment[1] = 0xfe;
    segment[2] = (payload + 2) >> 8;
    segment[3] = (payload + 2) & 0xff;
    segment.fill(0x20, 4); // spaces
    segments.push(segment);
    missing -= segment.length;
  }
  const extra = segments.reduce((n, s) => n + s.length, 0);
  const out = new Uint8Array(data.length + extra);
  out.set(data.subarray(0, 2), 0);
  let at = 2;
  for (const s of segments) {
    out.set(s, at);
    at += s.length;
  }
  out.set(data.subarray(2), at);
  return out;
}

/**
 * Bounding box of the ink on a scanned signature: pixels darker than
 * `threshold` (0–255 luminance), with a margin. Null when nothing is dark.
 */
export function inkBounds(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  threshold = 160,
  marginFraction = 0.06,
) {
  let left = width;
  let right = -1;
  let top = height;
  let bottom = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const luma = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
      if (pixels[i + 3] > 128 && luma < threshold) {
        if (x < left) left = x;
        if (x > right) right = x;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
      }
    }
  }
  if (right < 0) return null;
  const margin = Math.round(Math.max(right - left, bottom - top) * marginFraction) + 1;
  const x = Math.max(0, left - margin);
  const y = Math.max(0, top - margin);
  return {
    x,
    y,
    width: Math.min(width, right + margin + 1) - x,
    height: Math.min(height, bottom + margin + 1) - y,
  };
}

/**
 * Turns a photographed signature into clean ink on white: light paper
 * (with shadows and tint) becomes white, ink becomes darker. In place.
 */
export function cleanPaper(pixels: Uint8ClampedArray, paper = 175, ink = 90) {
  for (let i = 0; i < pixels.length; i += 4) {
    const luma = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
    // 0 at ink level or darker, 1 at paper level or lighter.
    const t = Math.min(1, Math.max(0, (luma - ink) / (paper - ink)));
    for (let c = 0; c < 3; c++) {
      const v = pixels[i + c];
      pixels[i + c] = Math.round(v * (1 - t) * 0.6 + 255 * t);
    }
    pixels[i + 3] = 255;
  }
}

/**
 * Smallest rect of the given aspect (width / height) that contains `box`
 * plus a margin, centred on it. It may reach past the image edges; those
 * parts are filled with white.
 */
export function containRect(box: { x: number; y: number; width: number; height: number }, aspect: number, margin = 0.1) {
  let width = box.width * (1 + margin * 2);
  let height = box.height * (1 + margin * 2);
  if (width / height > aspect) height = width / aspect;
  else width = height * aspect;
  return {
    x: box.x + box.width / 2 - width / 2,
    y: box.y + box.height / 2 - height / 2,
    width,
    height,
  };
}
