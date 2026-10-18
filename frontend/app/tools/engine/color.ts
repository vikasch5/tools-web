export type Rgb = { r: number; g: number; b: number; alpha: number };

export type ColorFormats = {
  hex: string;
  rgb: string;
  hsl: string;
  hsv: string;
  cmyk: string;
};

const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);
const round = (n: number, d = 0) => Number(n.toFixed(d));

const named: Record<string, string> = {
  black: "#000000",
  white: "#ffffff",
  red: "#ff0000",
  lime: "#00ff00",
  green: "#008000",
  blue: "#0000ff",
  yellow: "#ffff00",
  cyan: "#00ffff",
  aqua: "#00ffff",
  magenta: "#ff00ff",
  fuchsia: "#ff00ff",
  gray: "#808080",
  grey: "#808080",
  silver: "#c0c0c0",
  maroon: "#800000",
  olive: "#808000",
  navy: "#000080",
  purple: "#800080",
  teal: "#008080",
  orange: "#ffa500",
};

/** Parses one number of rgb()/hsl(): "50%", "0.5", "120deg". */
function part(token: string, percentOf: number) {
  const t = token.trim();
  if (/^[-+]?(\d+\.?\d*|\.\d+)%$/.test(t)) return (parseFloat(t) / 100) * percentOf;
  if (/^[-+]?(\d+\.?\d*|\.\d+)(deg)?$/.test(t)) return parseFloat(t);
  return NaN;
}

function hslToRgb(h: number, s: number, l: number) {
  const hue = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] =
    hue < 60 ? [c, x, 0] : hue < 120 ? [x, c, 0] : hue < 180 ? [0, c, x] : hue < 240 ? [0, x, c] : hue < 300 ? [x, 0, c] : [c, 0, x];
  return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 };
}

/**
 * Reads HEX (#rgb, #rgba, #rrggbb, #rrggbbaa, with or without #), rgb()/rgba(),
 * hsl()/hsla() in comma or space syntax, and basic colour names.
 */
export function parseAnyColor(input: string): Rgb | null {
  const text = input.trim().toLowerCase();
  if (named[text]) return parseAnyColor(named[text]);

  const hexMatch = text.match(/^#?([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/);
  if (hexMatch) {
    let h = hexMatch[1];
    if (h.length <= 4) h = [...h].map((c) => c + c).join("");
    const n = (i: number) => parseInt(h.slice(i, i + 2), 16);
    return { r: n(0), g: n(2), b: n(4), alpha: h.length === 8 ? round(n(6) / 255, 3) : 1 };
  }

  const fn = text.match(/^(rgba?|hsla?)\((.*)\)$/);
  if (!fn) return null;
  const [main, slashAlpha] = fn[2].split("/");
  const parts = main.split(/[\s,]+/).filter(Boolean);
  if (slashAlpha !== undefined) parts.push(slashAlpha);
  if (parts.length < 3 || parts.length > 4) return null;
  const alpha = parts[3] === undefined ? 1 : part(parts[3], 1);

  let rgb: { r: number; g: number; b: number };
  if (fn[1].startsWith("rgb")) {
    rgb = { r: part(parts[0], 255), g: part(parts[1], 255), b: part(parts[2], 255) };
  } else {
    if (!parts[1].endsWith("%") || !parts[2].endsWith("%")) return null;
    rgb = hslToRgb(part(parts[0], 360), part(parts[1], 1), part(parts[2], 1));
  }
  if ([rgb.r, rgb.g, rgb.b, alpha].some((n) => Number.isNaN(n))) return null;
  return {
    r: round(clamp(rgb.r, 0, 255)),
    g: round(clamp(rgb.g, 0, 255)),
    b: round(clamp(rgb.b, 0, 255)),
    alpha: round(clamp(alpha, 0, 1), 3),
  };
}

const hex2 = (n: number) => n.toString(16).padStart(2, "0");

export function toHex({ r, g, b, alpha }: Rgb) {
  return `#${hex2(r)}${hex2(g)}${hex2(b)}${alpha < 1 ? hex2(Math.round(alpha * 255)) : ""}`;
}

function toHsl({ r, g, b }: Rgb) {
  const [rr, gg, bb] = [r / 255, g / 255, b / 255];
  const max = Math.max(rr, gg, bb);
  const min = Math.min(rr, gg, bb);
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  return { h: hue(rr, gg, bb, max, d), s: s * 100, l: l * 100 };
}

function hue(r: number, g: number, b: number, max: number, d: number) {
  if (d === 0) return 0;
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}

export function formatColor(color: Rgb): ColorFormats {
  const { r, g, b, alpha } = color;
  const a = alpha < 1 ? ` / ${round(alpha, 3)}` : "";
  const hsl = toHsl(color);
  const max = Math.max(r, g, b) / 255;
  const d = max - Math.min(r, g, b) / 255;
  const k = 1 - max;
  const cmy = (c: number) => (k === 1 ? 0 : (1 - c / 255 - k) / (1 - k)) * 100;
  return {
    hex: toHex(color),
    rgb: `rgb(${r} ${g} ${b}${a})`,
    hsl: `hsl(${round(hsl.h)} ${round(hsl.s)}% ${round(hsl.l)}%${a})`,
    hsv: `hsv(${round(hue(r / 255, g / 255, b / 255, max, d))}, ${round(max === 0 ? 0 : (d / max) * 100)}%, ${round(max * 100)}%)`,
    cmyk: `cmyk(${round(cmy(r))}%, ${round(cmy(g))}%, ${round(cmy(b))}%, ${round(k * 100)}%)`,
  };
}

/** WCAG 2 relative luminance and contrast ratio (alpha ignored). */
function luminance({ r, g, b }: Rgb) {
  const lin = (c: number) => {
    const v = c / 255;
    return v <= 0.040_45 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contrastRatio(a: Rgb, b: Rgb) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return round((hi + 0.05) / (lo + 0.05), 2);
}

/** WCAG level for normal-size text. */
export const contrastLevel = (ratio: number) => (ratio >= 7 ? "AAA" : ratio >= 4.5 ? "AA" : ratio >= 3 ? "AA large text only" : "Fails");

export function describeColor(input: string) {
  const c = parseAnyColor(input);
  if (!c) return "Not a colour";
  const f = formatColor(c);
  const white = contrastRatio(c, { r: 255, g: 255, b: 255, alpha: 1 });
  const black = contrastRatio(c, { r: 0, g: 0, b: 0, alpha: 1 });
  return `${f.hex}\n${f.rgb}\n${f.hsl}\n${f.hsv}\n${f.cmyk}\nContrast with white ${white}:1 (${contrastLevel(white)}), with black ${black}:1 (${contrastLevel(black)})`;
}
