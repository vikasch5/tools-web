import { describe, expect, it } from "vitest";
import {
  calculateCompound,
  calculateFd,
  calculateGratuity,
  calculateGst,
  calculateHra,
  calculateLumpsum,
  calculatePpf,
  calculateSip,
  inr,
} from "./finance";

describe("inr", () => {
  it("groups digits the Indian way", () => {
    expect(inr(1234567.891)).toBe("₹12,34,567.89");
    expect(inr(4068209.22, true)).toBe("₹40,68,209");
  });
});

describe("GST", () => {
  it("adds GST and splits it into CGST and SGST", () => {
    expect(calculateGst(1000, 18, "add")).toEqual({ ok: true, base: 1000, tax: 180, total: 1180, cgst: 90, sgst: 90, igst: 0 });
  });
  it("removes GST from an inclusive price", () => {
    const r = calculateGst(1180, 18, "remove", true);
    expect(r).toMatchObject({ ok: true, base: 1000, tax: 180, igst: 180, cgst: 0 });
  });
  it("keeps halves adding up on odd paise", () => {
    const r = calculateGst(101, 5, "add");
    if (!r.ok) throw new Error();
    expect(r.cgst + r.sgst).toBeCloseTo(r.tax, 10);
  });
  it("rejects nonsense", () => {
    expect(calculateGst(0, 18, "add").ok).toBe(false);
    expect(calculateGst(100, 120, "add").ok).toBe(false);
  });
});

describe("SIP and lump sum", () => {
  it("matches the standard SIP formula (instalments at the start of each month)", () => {
    const r = calculateSip(10_000, 12, 10);
    if (!r.ok) throw new Error();
    expect(r.invested).toBe(1_200_000);
    expect(r.total).toBeCloseTo(2_323_390.76, 0);
    expect(r.years).toHaveLength(10);
  });
  it("grows faster with a step-up", () => {
    const flat = calculateSip(10_000, 12, 10);
    const up = calculateSip(10_000, 12, 10, 10);
    if (!flat.ok || !up.ok) throw new Error();
    expect(up.invested).toBeCloseTo(10_000 * 12 * ((1.1 ** 10 - 1) / 0.1), 0);
    expect(up.total).toBeGreaterThan(flat.total);
  });
  it("compounds a lump sum yearly", () => {
    const r = calculateLumpsum(100_000, 12, 10);
    expect(r).toMatchObject({ ok: true, total: 310_584.82 });
  });
});

describe("FD and compound interest", () => {
  it("compounds an FD quarterly like a bank", () => {
    const r = calculateFd(100_000, 7, 60);
    expect(r).toMatchObject({ ok: true, maturity: 141_477.82, effectiveRate: 7.19 });
  });
  it("handles a term that ends mid-quarter", () => {
    const r = calculateFd(100_000, 7, 13);
    if (!r.ok) throw new Error();
    expect(r.maturity).toBeGreaterThan(100_000 * 1.0175 ** 4);
    expect(r.maturity).toBeLessThan(100_000 * 1.0175 ** 5);
  });
  it("adds monthly deposits", () => {
    const r = calculateCompound(0, 0, 24, "yearly", 1000);
    expect(r).toMatchObject({ ok: true, invested: 24_000, maturity: 24_000 });
    const yearly = calculateCompound(10_000, 10, 24, "yearly");
    expect(yearly).toMatchObject({ ok: true, maturity: 12_100 });
  });
});

describe("PPF", () => {
  it("matches the usual 15-year figure", () => {
    expect(calculatePpf(150_000)).toMatchObject({ ok: true, invested: 2_250_000, total: 4_068_209.22 });
  });
  it("enforces the deposit limits and 5-year extensions", () => {
    expect(calculatePpf(200_000).ok).toBe(false);
    expect(calculatePpf(100_000, 7.1, 18).ok).toBe(false);
    expect(calculatePpf(100_000, 7.1, 20)).toMatchObject({ ok: true });
  });
});

describe("gratuity", () => {
  it("uses 15/26 and rounds 6+ months up when covered by the Act", () => {
    expect(calculateGratuity({ wages: 50_000, years: 9, months: 7 })).toMatchObject({
      ok: true,
      eligible: true,
      countedYears: 10,
      amount: 288_461.54,
      taxable: 0,
    });
  });
  it("uses 15/30 and completed years when not covered", () => {
    expect(calculateGratuity({ wages: 30_000, years: 6, months: 8, covered: false })).toMatchObject({ countedYears: 6, amount: 90_000 });
  });
  it("applies the eligibility periods and the tax-free cap", () => {
    expect(calculateGratuity({ wages: 50_000, years: 4, months: 11 })).toMatchObject({ eligible: false });
    expect(calculateGratuity({ wages: 50_000, years: 1, fixedTerm: true })).toMatchObject({ eligible: true, countedYears: 1 });
    expect(calculateGratuity({ wages: 300_000, years: 30 })).toMatchObject({ taxFree: 2_000_000 });
  });
});

describe("HRA", () => {
  it("exempts the least of the three amounts", () => {
    const r = calculateHra({ salary: 600_000, hra: 240_000, rent: 300_000, bigCity: true });
    expect(r).toMatchObject({ ok: true, exempt: 240_000, taxable: 0 });
    const small = calculateHra({ salary: 600_000, hra: 240_000, rent: 180_000, bigCity: false });
    expect(small).toMatchObject({ exempt: 120_000, taxable: 120_000 });
  });
  it("gives nothing when rent is under 10% of salary", () => {
    expect(calculateHra({ salary: 600_000, hra: 100_000, rent: 50_000, bigCity: true })).toMatchObject({ exempt: 0, taxable: 100_000 });
  });
});
