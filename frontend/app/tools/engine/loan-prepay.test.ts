import { describe, expect, it } from "vitest";
import { calculateLoan, calculatePrepayments, describePrepayment, formatMonths, scheduleCsv } from "./loan";

const home = { principal: 5_000_000, annualRate: 8.5, months: 240 };

describe("calculatePrepayments", () => {
  it("matches the plain loan without prepayments", () => {
    const plain = calculateLoan(home);
    const r = calculatePrepayments(home);
    if (!plain.ok || !r.ok) throw new Error("expected results");
    expect(r.payment).toBe(43391.16);
    expect(r.months).toBe(240);
    expect(r.totalInterest).toBeCloseTo(plain.totalInterest, 0);
    expect(r.interestSaved).toBeCloseTo(0, 0);
    expect(r.schedule.at(-1)!.balance).toBe(0);
  });

  it("finishes early when the EMI is kept", () => {
    const r = calculatePrepayments({ ...home, yearly: 100_000 });
    if (!r.ok) throw new Error(r.message);
    expect(r.months).toBe(168);
    expect(r.monthsSaved).toBe(72);
    expect(r.finalPayment).toBe(43391.16);
    expect(r.interestSaved).toBeGreaterThan(1_800_000);
    // 13 full yearly payments; the loan is cleared around the 14th.
    expect(r.totalPrepaid).toBeGreaterThanOrEqual(1_300_000);
    expect(r.totalPrepaid).toBeLessThanOrEqual(1_400_000);
  });

  it("lowers the EMI but keeps the end date in EMI mode", () => {
    const r = calculatePrepayments({ ...home, oneTime: 500_000, oneTimeMonth: 24, mode: "emi" });
    if (!r.ok) throw new Error(r.message);
    expect(r.months).toBe(240);
    expect(r.finalPayment).toBeLessThan(r.payment);
    expect(r.schedule[23].emi).toBeCloseTo(43391.16, 1);
    expect(r.schedule[24].emi).toBeCloseTo(r.finalPayment, 1);
    expect(r.schedule.at(-1)!.balance).toBe(0);
  });

  it("never prepays more than the balance", () => {
    const r = calculatePrepayments({ principal: 100_000, annualRate: 10, months: 12, oneTime: 1_000_000, oneTimeMonth: 1 });
    if (!r.ok) throw new Error(r.message);
    expect(r.months).toBe(1);
    expect(r.totalPrepaid).toBeLessThan(100_000);
  });

  it("handles a 0% loan and rejects bad input", () => {
    const r = calculatePrepayments({ principal: 12_000, annualRate: 0, months: 12, extraMonthly: 1000 });
    expect(r).toMatchObject({ ok: true, months: 6, totalInterest: 0 });
    expect(calculatePrepayments({ ...home, principal: 0 }).ok).toBe(false);
  });
});

describe("loan helpers", () => {
  it("formats durations", () => {
    expect(formatMonths(168)).toBe("14 years");
    expect(formatMonths(195)).toBe("16 years 3 months");
    expect(formatMonths(1)).toBe("1 month");
  });

  it("writes a CSV schedule", () => {
    const r = calculatePrepayments({ principal: 1200, annualRate: 0, months: 2 });
    if (!r.ok) throw new Error(r.message);
    expect(scheduleCsv(r.schedule)).toBe(
      "Month,EMI,Principal,Interest,Prepayment,Balance\n1,600.00,600.00,0.00,0.00,600.00\n2,600.00,600.00,0.00,0.00,0.00\n",
    );
  });

  it("summarises the effect of prepaying", () => {
    expect(describePrepayment({ ...home, yearly: 100_000 })).toMatch(/^EMI: 43,391.16\nPaid off in: 14 years\nInterest saved: 1,8\d\d,\d{3}\.\d\d$/);
  });
});
