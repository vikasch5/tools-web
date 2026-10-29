import { describe, expect, it } from "vitest";
import { describeTarget, findTargetEncoding, scaledSize, targetBytes, targetLabel } from "./image-target";

/** Fake encoder: size grows with pixel count (scale²) and with quality. */
function fakeEncoder(fullSize: number) {
  const calls: [number, number][] = [];
  const encode = async (scale: number, quality: number) => {
    calls.push([scale, quality]);
    const bytes = Math.round(fullSize * scale * scale * (0.15 + quality));
    return new Blob([new Uint8Array(bytes)], { type: "image/jpeg" });
  };
  return { encode, calls };
}

describe("findTargetEncoding", () => {
  it("keeps the top quality when the image already fits", async () => {
    const { encode, calls } = fakeEncoder(10_000);
    const r = await findTargetEncoding(encode, { target: 50_000 });
    expect(r).toMatchObject({ reached: true, quality: 0.92, scale: 1 });
    expect(calls).toHaveLength(1);
  });

  it("lowers quality to the preferred level before shrinking the image", async () => {
    const { encode } = fakeEncoder(100_000);
    // At scale 1: 0.7 → 85,000 bytes fits, 0.92 → 107,000 does not.
    const r = await findTargetEncoding(encode, { target: 95_000 });
    expect(r).toMatchObject({ reached: true, scale: 1 });
    expect(r.blob.size).toBeLessThanOrEqual(95_000);
    expect(r.quality).toBeGreaterThanOrEqual(0.7);
    expect(r.quality).toBeLessThan(0.92);
  });

  it("shrinks instead of dropping below the preferred quality", async () => {
    const { encode } = fakeEncoder(100_000);
    const r = await findTargetEncoding(encode, { target: 60_000 });
    expect(r.reached).toBe(true);
    expect(r.scale).toBeLessThan(1);
    expect(r.scale).toBeGreaterThan(0.75);
    expect(r.quality).toBeGreaterThanOrEqual(0.7);
  });

  it("goes below the preferred quality only at the smallest size", async () => {
    const { encode } = fakeEncoder(100_000);
    const r = await findTargetEncoding(encode, { target: 12_000, minScale: 0.5 });
    expect(r).toMatchObject({ reached: true, scale: 0.5 });
    expect(r.quality).toBeLessThan(0.7);
  });

  it("finds a scale close to the largest one that fits", async () => {
    // A size curve far from scale², like real JPEGs of detailed photos.
    const encode = async (scale: number, quality: number) =>
      new Blob([new Uint8Array(Math.round(1_000_000 * scale ** 3 * (0.15 + quality)))]);
    const r = await findTargetEncoding(encode, { target: 50_000 });
    expect(r.reached).toBe(true);
    expect(r.blob.size).toBeLessThanOrEqual(50_000);
    expect(r.blob.size).toBeGreaterThan(45_000);
  });

  it("scales down when even the lowest quality is too big", async () => {
    const { encode } = fakeEncoder(5_000_000);
    const r = await findTargetEncoding(encode, { target: 50_000 });
    expect(r.reached).toBe(true);
    expect(r.scale).toBeLessThan(1);
    expect(r.blob.size).toBeLessThanOrEqual(50_000);
  });

  it("never returns a file over the target as reached", async () => {
    for (const full of [12_345, 400_000, 2_000_000, 9_999_999]) {
      for (const kb of [10, 20, 50, 100, 200]) {
        const { encode } = fakeEncoder(full);
        const r = await findTargetEncoding(encode, { target: targetBytes(kb) });
        if (r.reached) expect(r.blob.size, `${full} → ${kb} KB`).toBeLessThanOrEqual(targetBytes(kb));
      }
    }
  });

  it("reports when the target cannot be reached", async () => {
    // An encoder with a fixed overhead that no scale can get under.
    const encode = async () => new Blob([new Uint8Array(2000)]);
    const r = await findTargetEncoding(encode, { target: 1000 });
    expect(r.reached).toBe(false);
    expect(r.blob.size).toBe(2000);
  });
});

describe("target helpers", () => {
  it("counts a kilobyte as 1,000 bytes and labels megabytes", () => {
    expect(targetBytes(50)).toBe(50_000);
    expect(targetLabel(50)).toBe("50 KB");
    expect(targetLabel(1000)).toBe("1 MB");
    expect(targetLabel(1500)).toBe("1500 KB");
  });

  it("keeps scaled images at least one pixel", () => {
    expect(scaledSize({ width: 4000, height: 3000 }, 0.25)).toEqual({ width: 1000, height: 750 });
    expect(scaledSize({ width: 10, height: 2 }, 0.01)).toEqual({ width: 1, height: 1 });
  });

  it("describes results in plain words", () => {
    const start = { width: 4000, height: 3000 };
    expect(describeTarget(start, { size: 48_200, quality: 0.71, scale: 1, reached: true }, 50)).toBe(
      "48.2 KB (under 50 KB) at 71% quality",
    );
    expect(describeTarget(start, { size: 19_000, quality: 0.3, scale: 0.2, reached: true }, 20)).toBe(
      "19.0 KB (under 20 KB) at 30% quality, resized to 800 × 600 px",
    );
    expect(describeTarget(start, { size: 30_000, quality: 0.3, scale: 0.02, reached: false }, 10)).toBe(
      "30.0 KB, still over 10 KB at 80 × 60 px",
    );
  });
});
