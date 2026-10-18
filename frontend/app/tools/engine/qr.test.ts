import { describe, expect, it } from "vitest";
import { contrastRatio, describeQr, encodeQr, qrSvg, wifiPayload } from "./qr";

describe("qr", () => {
  it("encodes text and grows with error correction", () => {
    expect(describeQr("https://example.com", "M")).toBe("Version 2 · 25 × 25 modules");
    expect(encodeQr("https://example.com", "H").version).toBeGreaterThanOrEqual(2);
  });

  it("builds Wi-Fi payloads with escaping", () => {
    expect(wifiPayload('Cafe;Guest', 'pa:ss"1', "WPA")).toBe('WIFI:T:WPA;S:Cafe\\;Guest;P:pa\\:ss\\"1;;');
    expect(wifiPayload("Open", "", "nopass", true)).toBe("WIFI:T:nopass;S:Open;H:true;;");
  });

  it("draws an SVG with a quiet zone", () => {
    const svg = qrSvg([[true, false], [false, true]], "#000000", "#ffffff", 4);
    expect(svg).toContain('viewBox="0 0 10 10"');
    expect(svg).toContain("M4 4h1v1h-1zM5 5h1v1h-1z");
  });

  it("rejects too much data and measures contrast", () => {
    expect(() => encodeQr("x".repeat(5000), "H")).toThrow(/too much data/);
    expect(Math.round(contrastRatio("#000000", "#ffffff"))).toBe(21);
  });
});
