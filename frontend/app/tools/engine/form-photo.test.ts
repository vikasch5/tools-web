import { describe, expect, it } from "vitest";
import {
  cleanPaper,
  containRect,
  describePreset,
  formPresets,
  inkBounds,
  maxBytesFor,
  minBytesFor,
  padJpeg,
} from "./form-photo";

/** RGBA pixels of a white image with a dark rectangle. */
function page(width: number, height: number, ink?: { x: number; y: number; w: number; h: number }) {
  const px = new Uint8ClampedArray(width * height * 4).fill(255);
  if (ink)
    for (let y = ink.y; y < ink.y + ink.h; y++)
      for (let x = ink.x; x < ink.x + ink.w; x++) px.set([20, 20, 30, 255], (y * width + x) * 4);
  return px;
}

describe("form presets", () => {
  it("have sane sizes and ranges", () => {
    const ids = new Set<string>();
    for (const p of formPresets) {
      expect(ids.has(p.id), p.id).toBe(false);
      ids.add(p.id);
      expect(p.width * p.height, p.id).toBeGreaterThan(1000);
      expect(p.minKb, p.id).toBeLessThan(p.maxKb);
      expect(maxBytesFor(p.maxKb) - minBytesFor(p.minKb), p.id).toBeGreaterThan(0);
    }
  });

  it("describe themselves", () => {
    expect(describePreset(formPresets.find((p) => p.id === "bank-photo")!)).toBe("200 × 230 px JPG, 20–50 KB");
    expect(describePreset(formPresets.find((p) => p.id === "pan-signature")!)).toBe("354 × 157 px JPG, up to 10 KB");
  });
});

describe("padJpeg", () => {
  const jpeg = Uint8Array.from([0xff, 0xd8, 0xff, 0xdb, 1, 2, 3, 0xff, 0xd9]);

  it("adds comment segments after the start marker up to the size", () => {
    const out = padJpeg(jpeg, 20_000);
    expect(out.length).toBeGreaterThanOrEqual(20_000);
    expect(out.length).toBeLessThan(20_010);
    expect([...out.subarray(0, 4)]).toEqual([0xff, 0xd8, 0xff, 0xfe]);
    expect([...out.subarray(out.length - 7)]).toEqual([0xff, 0xdb, 1, 2, 3, 0xff, 0xd9]);
  });

  it("splits padding into valid segments over 64 KB", () => {
    const out = padJpeg(jpeg, 150_000);
    let at = 2;
    let segments = 0;
    while (out[at] === 0xff && out[at + 1] === 0xfe) {
      const length = (out[at + 2] << 8) | out[at + 3];
      expect(length).toBeLessThanOrEqual(65535);
      at += 2 + length;
      segments++;
    }
    expect(segments).toBe(3);
    expect([out[at], out[at + 1]]).toEqual([0xff, 0xdb]);
  });

  it("leaves big enough files alone and rejects non-JPEGs", () => {
    expect(padJpeg(jpeg, 5)).toBe(jpeg);
    expect(() => padJpeg(Uint8Array.from([1, 2, 3]), 100)).toThrow();
  });
});

describe("signature helpers", () => {
  it("finds the ink with a margin", () => {
    const box = inkBounds(page(400, 200, { x: 100, y: 80, w: 150, h: 30 }), 400, 200);
    expect(box).toEqual({ x: 90, y: 70, width: 170, height: 50 });
    expect(inkBounds(page(50, 50), 50, 50)).toBeNull();
  });

  it("fits a box inside a rect of the output's shape", () => {
    const wide = containRect({ x: 100, y: 100, width: 300, height: 50 }, 140 / 60, 0);
    expect(wide.width / wide.height).toBeCloseTo(140 / 60);
    expect(wide.width).toBeCloseTo(300);
    expect(wide.x).toBeCloseTo(100);
    const tall = containRect({ x: 0, y: 0, width: 100, height: 100 }, 2, 0.1);
    expect(tall).toEqual({ x: -70, y: -10, width: 240, height: 120 });
  });

  it("whitens paper and darkens ink", () => {
    const px = Uint8ClampedArray.from([200, 195, 190, 255, 60, 60, 70, 255, 130, 130, 130, 255]);
    cleanPaper(px);
    expect([...px.subarray(0, 3)]).toEqual([255, 255, 255]);
    expect(px[4]).toBeLessThan(60);
    expect(px[8]).toBeGreaterThan(130);
  });
});
