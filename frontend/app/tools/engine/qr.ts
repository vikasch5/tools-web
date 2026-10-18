import { encode } from "uqr";

export type QrLevel = "L" | "M" | "Q" | "H";
export type WifiSecurity = "WPA" | "WEP" | "nopass";

/** Escapes \ ; , : and " as the Wi-Fi QR format requires. */
const wifiEscape = (text: string) => text.replace(/([\;,:"])/g, "\\$1");

/** The text phones read to join a Wi-Fi network. */
export function wifiPayload(ssid: string, password: string, security: WifiSecurity, hidden = false) {
  if (!ssid) throw new Error("Enter the network name.");
  return `WIFI:T:${security};S:${wifiEscape(ssid)};${security === "nopass" ? "" : `P:${wifiEscape(password)};`}${hidden ? "H:true;" : ""};`;
}

export function encodeQr(text: string, level: QrLevel) {
  if (!text) throw new Error("Enter some text or a link.");
  try {
    const qr = encode(text, { ecc: level, border: 0 });
    return { version: qr.version, size: qr.size, modules: qr.data };
  } catch {
    throw new Error("This is too much data for a QR code. Shorten it, or lower the error correction.");
  }
}

/** Crisp SVG: one path of unit squares, with a quiet zone of `margin` modules. */
export function qrSvg(modules: boolean[][], dark: string, light: string, margin = 4) {
  const size = modules.length + margin * 2;
  let path = "";
  modules.forEach((row, y) =>
    row.forEach((on, x) => {
      if (on) path += `M${x + margin} ${y + margin}h1v1h-1z`;
    }),
  );
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges"><rect width="${size}" height="${size}" fill="${light}"/><path d="${path}" fill="${dark}"/></svg>`;
}

export function describeQr(text: string, level: QrLevel) {
  const qr = encodeQr(text, level);
  return `Version ${qr.version} · ${qr.size} × ${qr.size} modules`;
}

/** WCAG relative-luminance contrast; scanners need a clearly darker foreground. */
export function contrastRatio(a: string, b: string) {
  const lum = (hex: string) => {
    const [r, g, b] = [1, 3, 5].map((i) => {
      const c = parseInt(hex.slice(i, i + 2), 16) / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [x, y] = [lum(a), lum(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
