export type GradientStop = {
  /** #rrggbb */
  color: string;
  /** 0–100 */
  opacity: number;
  /** Position along the gradient, 0–100%. */
  position: number;
};

export type Gradient = {
  type: "linear" | "radial" | "conic";
  /** Degrees, for linear and conic. */
  angle: number;
  /** Radial shape. */
  shape: "circle" | "ellipse";
  stops: GradientStop[];
};

const hex2 = (n: number) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, "0");

function stopColor({ color, opacity }: GradientStop) {
  if (opacity >= 100) return color.toLowerCase();
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  return `rgb(${r} ${g} ${b} / ${Math.round(opacity)}%)`;
}

/** The CSS gradient function, e.g. linear-gradient(90deg, #ff0000 0%, …). */
export function gradientCss(g: Gradient) {
  const stops = [...g.stops]
    .sort((a, b) => a.position - b.position)
    .map((s) => `${stopColor(s)} ${Math.round(s.position)}%`)
    .join(", ");
  switch (g.type) {
    case "linear":
      return `linear-gradient(${Math.round(g.angle)}deg, ${stops})`;
    case "radial":
      return `radial-gradient(${g.shape} at center, ${stops})`;
    case "conic":
      return `conic-gradient(from ${Math.round(g.angle)}deg at center, ${stops})`;
  }
}

export function gradientDeclaration(g: Gradient) {
  return `background: ${gradientCss(g)};`;
}

/** Normalises #rgb, #rgba, #rrggbb, #rrggbbaa, rgb() and rgba() to hex + opacity. */
export function parseColor(input: string): { color: string; opacity: number } | null {
  const s = input.trim().toLowerCase();
  if (s === "transparent") return { color: "#000000", opacity: 0 };
  if (s === "white") return { color: "#ffffff", opacity: 100 };
  if (s === "black") return { color: "#000000", opacity: 100 };
  let m = s.match(/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/);
  if (m) {
    let h = m[1];
    if (h.length <= 4) h = [...h].map((c) => c + c).join("");
    const opacity = h.length === 8 ? Math.round((parseInt(h.slice(6), 16) / 255) * 100) : 100;
    return { color: `#${h.slice(0, 6)}`, opacity };
  }
  m = s.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)\s*(?:[,/]\s*([\d.]+%?)\s*)?\)$/);
  if (m) {
    const alpha = m[4] === undefined ? 1 : m[4].endsWith("%") ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
    return { color: `#${hex2(+m[1])}${hex2(+m[2])}${hex2(+m[3])}`, opacity: Math.round(alpha * 100) };
  }
  return null;
}

/** Splits on commas that are not inside brackets. */
function splitTopLevel(s: string) {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const char of s) {
    if (char === "(") depth++;
    if (char === ")") depth--;
    if (char === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
    } else current += char;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

const DIRECTIONS: Record<string, number> = {
  "to top": 0, "to top right": 45, "to right top": 45, "to right": 90, "to bottom right": 135,
  "to right bottom": 135, "to bottom": 180, "to bottom left": 225, "to left bottom": 225,
  "to left": 270, "to top left": 315, "to left top": 315,
};

/**
 * Reads an existing CSS gradient so it can be edited. Supports linear,
 * radial and conic gradients with hex or rgb() colours.
 */
export function parseGradient(input: string): Gradient | { error: string } {
  const s = input.trim().replace(/^background(-image)?\s*:\s*/i, "").replace(/;$/, "").trim();
  const m = s.match(/^(?:repeating-)?(linear|radial|conic)-gradient\((.*)\)$/is);
  if (!m) return { error: "Paste a CSS linear-gradient(), radial-gradient() or conic-gradient()." };
  const type = m[1].toLowerCase() as Gradient["type"];
  const parts = splitTopLevel(m[2]);
  let angle = type === "linear" ? 180 : 0;
  let shape: Gradient["shape"] = "ellipse";

  const first = parts[0]?.toLowerCase() ?? "";
  if (!parseColor(first.split(/\s+(?![^(]*\))/)[0])) {
    parts.shift();
    const deg = first.match(/(-?[\d.]+)(deg|turn|rad)/);
    if (deg) {
      const n = parseFloat(deg[1]);
      angle = deg[2] === "turn" ? n * 360 : deg[2] === "rad" ? (n * 180) / Math.PI : n;
    } else if (DIRECTIONS[first.trim()] !== undefined) angle = DIRECTIONS[first.trim()];
    if (/circle/.test(first)) shape = "circle";
  }

  const stops: GradientStop[] = [];
  for (const part of parts) {
    const [, colorText, pos] = part.match(/^(.+?)(?:\s+(-?[\d.]+)%)?$/) ?? [];
    const color = colorText ? parseColor(colorText) : null;
    if (!color) return { error: `Could not read the colour “${part}”. Use hex or rgb() colours.` };
    stops.push({
      ...color,
      position: pos !== undefined ? parseFloat(pos) : NaN,
    });
  }
  if (stops.length < 2) return { error: "A gradient needs at least two colour stops." };
  // Missing positions are spread evenly, as browsers do for the simple case.
  stops.forEach((stop, i) => {
    if (Number.isNaN(stop.position)) stop.position = (i / (stops.length - 1)) * 100;
  });
  return { type, angle: ((angle % 360) + 360) % 360, shape, stops };
}

const stop = (color: string, position: number): GradientStop => ({ color, opacity: 100, position });

/** Starting points offered in the generator. */
export const gradientPresets: { name: string; gradient: Gradient }[] = [
  { name: "Sunset", gradient: { type: "linear", angle: 135, shape: "ellipse", stops: [stop("#ff7a1a", 0), stop("#ec3a76", 100)] } },
  { name: "Ocean", gradient: { type: "linear", angle: 120, shape: "ellipse", stops: [stop("#0ea5e9", 0), stop("#6366f1", 100)] } },
  { name: "Mint", gradient: { type: "linear", angle: 160, shape: "ellipse", stops: [stop("#a7f3d0", 0), stop("#059669", 100)] } },
  { name: "Dusk", gradient: { type: "linear", angle: 180, shape: "ellipse", stops: [stop("#1e1b4b", 0), stop("#7c3aed", 55), stop("#f472b6", 100)] } },
  { name: "Glow", gradient: { type: "radial", angle: 0, shape: "circle", stops: [stop("#fde68a", 0), stop("#f97316", 60), stop("#7c2d12", 100)] } },
  { name: "Spectrum", gradient: { type: "conic", angle: 0, shape: "ellipse", stops: [stop("#ef4444", 0), stop("#eab308", 25), stop("#22c55e", 50), stop("#3b82f6", 75), stop("#ef4444", 100)] } },
];
