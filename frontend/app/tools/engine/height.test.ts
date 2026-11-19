import { describe, expect, it } from "vitest";
import { cmToFeet, decimalFeetReadings, describeHeight, feetToCm, heightChart, toFeetInches } from "./height";

describe("height", () => {
  it("converts feet and inches to centimetres", () => {
    expect(feetToCm(5, 8)).toMatchObject({ ok: true, cm: 172.7, m: 1.73, totalInches: 68 });
    expect(feetToCm(6, 0)).toMatchObject({ cm: 182.9 });
    expect(feetToCm(5.5)).toMatchObject({ cm: 167.6, feet: { ft: 5, in: 6 } });
    expect(feetToCm(0).ok).toBe(false);
    expect(feetToCm(11).ok).toBe(false);
  });

  it("converts centimetres to feet and inches", () => {
    expect(cmToFeet(170)).toMatchObject({ feet: { ft: 5, in: 6.9 }, totalInches: 66.9 });
    expect(cmToFeet(152.4)).toMatchObject({ feet: { ft: 5, in: 0 } });
    // 182.87 cm rounds to 72.0 in: 6 ft 0 in, never 5 ft 12 in.
    expect(toFeetInches(71.996)).toEqual({ ft: 6, in: 0 });
  });

  it("gives both readings of shorthand like 5.8 ft", () => {
    const r = decimalFeetReadings("5.8")!;
    expect(r.decimal).toMatchObject({ cm: 176.8, feet: { ft: 5, in: 9.6 } });
    expect(r.shorthand).toMatchObject({ cm: 172.7, inches: 8 });
    expect(decimalFeetReadings("5.11")!.shorthand).toMatchObject({ cm: 180.3 });
    // .5 ft could be 5 in, but .05 and .25 cannot be inches.
    expect(decimalFeetReadings("5.25")!.shorthand).toBeUndefined();
    expect(decimalFeetReadings("5.05")!.shorthand).toBeUndefined();
    expect(decimalFeetReadings("5")).toBeUndefined();
    expect(describeHeight("5.8 ft")).toBe("5.8 ft (decimal) = 5 ft 9.6 in = 176.8 cm\n5 ft 8 in = 172.7 cm");
  });

  it("builds a chart from 4 ft 6 in to 7 ft", () => {
    const chart = heightChart();
    expect(chart).toHaveLength(31);
    expect(chart[0]).toMatchObject({ ft: 4, in: 6, cm: 137.2 });
    expect(chart.at(-1)).toMatchObject({ ft: 7, in: 0, cm: 213.4, decimalFeet: 7 });
    expect(chart.find((r) => r.ft === 5 && r.in === 8)).toMatchObject({ cm: 172.7, decimalFeet: 5.67 });
  });
});
