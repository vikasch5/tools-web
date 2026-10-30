import { describe, expect, it } from "vitest";
import { calculateTax, compareRegimes, describeTax, slabTax, slabsFor } from "./income-tax";

const tax = (input: Parameters<typeof calculateTax>[0]) => {
  const r = calculateTax(input);
  if ("error" in r) throw new Error(r.error);
  return r;
};

describe("new regime, FY 2026-27", () => {
  it("is tax-free up to ₹12 lakh taxable (₹12.75 lakh salary)", () => {
    expect(tax({ regime: "new", salary: 1_275_000 })).toMatchObject({ taxableIncome: 1_200_000, slabTax: 60_000, rebate: 60_000, totalTax: 0 });
  });
  it("applies the slabs and 4% cess", () => {
    expect(tax({ regime: "new", salary: 1_500_000 })).toMatchObject({ taxableIncome: 1_425_000, slabTax: 93_750, totalTax: 97_500 });
  });
  it("gives marginal relief just above ₹12 lakh", () => {
    const r = tax({ regime: "new", salary: 1_285_000 });
    expect(r.taxableIncome).toBe(1_210_000);
    expect(r.slabTax - r.rebate).toBe(10_000);
    expect(r.totalTax).toBe(10_400);
  });
  it("adds 10% surcharge above ₹50 lakh, with marginal relief at the threshold", () => {
    expect(tax({ regime: "new", salary: 6_075_000 })).toMatchObject({ taxableIncome: 6_000_000, slabTax: 1_380_000, surcharge: 138_000, totalTax: 1_578_720 });
    const edge = tax({ regime: "new", salary: 5_076_000 });
    expect(edge.taxableIncome).toBe(5_001_000);
    expect(edge.slabTax + edge.surcharge).toBe(1_081_000);
  });
  it("caps the surcharge at 25% in the new regime", () => {
    const r = tax({ regime: "new", salary: 60_000_000 });
    expect(r.surcharge / r.slabTax).toBeCloseTo(0.25, 2);
  });
  it("ignores old-regime deductions but allows employer NPS", () => {
    const plain = tax({ regime: "new", salary: 2_000_000 });
    expect(tax({ regime: "new", salary: 2_000_000, section80C: 150_000, hraExemption: 200_000 }).totalTax).toBe(plain.totalTax);
    expect(tax({ regime: "new", salary: 2_000_000, employerNps: 100_000 }).totalTax).toBeLessThan(plain.totalTax);
  });
});

describe("old regime", () => {
  it("uses the age-based slabs", () => {
    expect(slabTax(1_000_000, slabsFor("old", "below60"))).toBe(112_500);
    expect(slabTax(1_000_000, slabsFor("old", "60to80"))).toBe(110_000);
    expect(slabTax(1_000_000, slabsFor("old", "above80"))).toBe(100_000);
  });
  it("applies deductions with their caps", () => {
    const r = tax({ regime: "old", salary: 1_500_000, section80C: 300_000, nps: 80_000, homeLoanInterest: 250_000, section80D: 25_000 });
    expect(r.deductions).toBe(50_000 + 150_000 + 50_000 + 200_000 + 25_000);
    expect(r.taxableIncome).toBe(1_025_000);
  });
  it("gives the ₹12,500 rebate up to ₹5 lakh, with no marginal relief", () => {
    expect(tax({ regime: "old", salary: 550_000 }).totalTax).toBe(0);
    expect(tax({ regime: "old", salary: 560_000 }).totalTax).toBe(15_080);
  });
});

describe("comparing regimes", () => {
  it("picks the cheaper regime", () => {
    const r = compareRegimes({ salary: 1_200_000 });
    if ("error" in r) throw new Error();
    expect(r.better).toBe("new");
    const heavy = compareRegimes({ salary: 2_500_000, section80C: 150_000, nps: 50_000, hraExemption: 400_000, homeLoanInterest: 200_000, section80D: 50_000 });
    if ("error" in heavy) throw new Error();
    expect(heavy.better).toBe("old");
  });
  it("describes the comparison", () => {
    expect(describeTax({ salary: 1_500_000 })).toBe("New regime: ₹97,500\nOld regime: ₹2,57,400\nNew regime saves ₹1,59,900");
  });
  it("rejects missing or negative income", () => {
    expect(calculateTax({ regime: "new", salary: 0 })).toHaveProperty("error");
    expect(calculateTax({ regime: "new", salary: -5 })).toHaveProperty("error");
  });
});
