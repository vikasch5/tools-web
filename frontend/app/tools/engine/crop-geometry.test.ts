import { describe, expect, it } from "vitest";
import { centredRect, clampRect, dragRect, turnedSize } from "./crop-geometry";

const bounds = { width: 1000, height: 800 };

describe("crop geometry", () => {
  it("swaps sides for quarter turns", () => {
    expect(turnedSize({ width: 4000, height: 3000 }, 1)).toEqual({ width: 3000, height: 4000 });
    expect(turnedSize({ width: 4000, height: 3000 }, 2)).toEqual({ width: 4000, height: 3000 });
  });

  it("centres the largest rect of a ratio", () => {
    expect(centredRect(bounds, 1)).toEqual({ x: 100, y: 0, width: 800, height: 800 });
    expect(centredRect(bounds, 16 / 9)).toEqual({ x: 0, y: 119, width: 1000, height: 563 });
    expect(centredRect(bounds, 0, 0.8)).toEqual({ x: 100, y: 80, width: 800, height: 640 });
  });

  it("keeps rects inside the image", () => {
    expect(clampRect({ x: 900, y: -20, width: 300, height: 100 }, bounds)).toEqual({ x: 700, y: 0, width: 300, height: 100 });
    expect(clampRect({ x: 10, y: 10, width: 2, height: 2 }, bounds, 8)).toMatchObject({ width: 8, height: 8 });
  });

  it("moves and resizes freely", () => {
    const start = { x: 100, y: 100, width: 400, height: 300 };
    expect(dragRect(start, "move", 50, -500, bounds)).toEqual({ x: 150, y: 0, width: 400, height: 300 });
    expect(dragRect(start, "se", 100, 50, bounds)).toEqual({ x: 100, y: 100, width: 500, height: 350 });
    expect(dragRect(start, "nw", -200, -200, bounds)).toEqual({ x: 0, y: 0, width: 500, height: 400 });
    expect(dragRect(start, "e", -1000, 0, bounds)).toMatchObject({ x: 100, width: 8 });
  });

  it("keeps the ratio while resizing", () => {
    const start = { x: 100, y: 100, width: 400, height: 400 };
    const r = dragRect(start, "se", 200, 20, bounds, 1);
    expect(r.width).toBe(r.height);
    expect(r).toMatchObject({ x: 100, y: 100, width: 600 });
    const capped = dragRect(start, "se", 900, 900, bounds, 1);
    expect(capped).toEqual({ x: 100, y: 100, width: 700, height: 700 });
    const left = dragRect(start, "w", -50, 0, bounds, 1);
    expect(left).toMatchObject({ x: 50, width: 450, height: 450 });
  });
});
