import { describe, expect, it } from "vitest";
import {
  addDays,
  applyDiscounts,
  calculateGold,
  convertUnit,
  dateDifference,
  discountPercent,
  feetAndInches,
  formatQuantity,
  scoreTyping,
  smsParts,
  visibleLength,
} from "./everyday";

describe("dates", () => {
  it("counts years, months, days and working days", () => {
    const r = dateDifference("2026-01-01", "2026-10-30");
    expect(r).toMatchObject({ ok: true, years: 0, months: 9, days: 29, totalDays: 302 });
  });
  it("includes the end date when asked", () => {
    expect(dateDifference("2026-03-01", "2026-03-03", true)).toMatchObject({ totalDays: 3 });
    // Mon 2 – Sun 8 Nov 2026: 5 weekdays, 6 days excluding Sunday.
    expect(dateDifference("2026-11-02", "2026-11-08", true)).toMatchObject({ totalDays: 7, workingDays: 5, sixDayWorkingDays: 6, weeks: 1, weekDays: 0 });
  });
  it("works in either order and across leap years", () => {
    expect(dateDifference("2028-03-01", "2028-02-01")).toMatchObject({ totalDays: 29, months: 1, days: 0 });
  });
  it("adds days and months without overflowing short months", () => {
    expect(addDays("2026-01-31", 1, "months")!.toISOString().slice(0, 10)).toBe("2026-02-28");
    expect(addDays("2026-10-30", 90)!.toISOString().slice(0, 10)).toBe("2027-01-28");
    expect(addDays("bad", 1)).toBeNull();
  });
});

describe("discounts", () => {
  it("stacks percentages one after another", () => {
    expect(applyDiscounts(1000, [20, 10])).toEqual({ ok: true, final: 720, saved: 280, effectivePercent: 28 });
  });
  it("works out the discount from MRP and price", () => {
    expect(discountPercent(1999, 1299)).toBe(35.02);
    expect(applyDiscounts(100, [120]).ok).toBe(false);
  });
});

describe("gold", () => {
  it("prices 22K jewellery with making charges and 3% GST", () => {
    const r = calculateGold({ rate24k: 10_000, karat: 22, grams: 10, making: 12, makingType: "percent" });
    expect(r).toMatchObject({ ok: true, ratePerGram: 9169.17, goldValue: 91691.7 });
    if (!r.ok) throw new Error();
    expect(r.makingCharges).toBeCloseTo(11003, 0);
    expect(r.total).toBeCloseTo((r.goldValue + r.makingCharges) * 1.03, 1);
  });
  it("supports making charges per gram and no GST", () => {
    expect(calculateGold({ rate24k: 10_000, karat: 24, grams: 5, making: 500, makingType: "perGram", includeGst: false })).toMatchObject({
      goldValue: 50_000,
      makingCharges: 2500,
      gst: 0,
      total: 52_500,
    });
  });
});

describe("units", () => {
  it("converts common units", () => {
    expect(convertUnit(5.8, "length", "ft", "cm")).toBeCloseTo(176.784, 3);
    expect(convertUnit(1, "area", "acre", "sqft")).toBeCloseTo(43_560, 3);
    expect(convertUnit(1, "area", "guntha", "sqft")).toBeCloseTo(1089, 3);
    expect(convertUnit(100, "temperature", "C", "F")).toBe(212);
    expect(convertUnit(98.6, "temperature", "F", "C")).toBeCloseTo(37, 6);
    expect(convertUnit(1, "data", "GiB", "MB")).toBeCloseTo(1073.741824, 6);
  });
  it("formats for reading", () => {
    expect(formatQuantity(43560.0000001)).toBe("43,560");
    expect(formatQuantity(0.000000012)).toBe("1.2000e-8");
    expect(feetAndInches(1.7272)).toBe("5 ft 8 in");
  });
});

describe("character limits", () => {
  it("counts emoji and Indian scripts as people see them", () => {
    expect(visibleLength("नमस्ते")).toBe(3);
    expect(visibleLength("hi 👋🏽")).toBe(4);
  });
  it("splits SMS into parts", () => {
    expect(smsParts("a".repeat(160))).toMatchObject({ parts: 1, unicode: false });
    expect(smsParts("a".repeat(161))).toMatchObject({ parts: 2, perPart: 153 });
    expect(smsParts("नमस्ते")).toMatchObject({ unicode: true, parts: 1, perPart: 70 });
    expect(smsParts("a".repeat(159) + "€")).toMatchObject({ length: 161, parts: 2 });
  });
});

describe("typing", () => {
  it("scores net and raw WPM and accuracy", () => {
    const target = "the quick brown fox ";
    expect(scoreTyping(target, "the quick brown fox ", 12)).toMatchObject({ wpm: 20, rawWpm: 20, accuracy: 100, errors: 0 });
    expect(scoreTyping(target, "teh quick", 60)).toMatchObject({ correct: 7, errors: 2, accuracy: 77.8 });
  });
});
