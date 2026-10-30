/**
 * Indian income tax for individuals, FY 2026-27 (AY 2027-28), new and old
 * regimes. Budget 2026 kept the FY 2025-26 rates, so the figures below are
 * those of the Finance Act 2025 (checked October 2026). Special-rate
 * income such as capital gains is out of scope.
 */

export type Regime = "new" | "old";
export type AgeGroup = "below60" | "60to80" | "above80";

type Slab = [upTo: number, rate: number];

export const TAX_YEAR = "FY 2026-27 (AY 2027-28)";

const newSlabs: Slab[] = [
  [400_000, 0],
  [800_000, 5],
  [1_200_000, 10],
  [1_600_000, 15],
  [2_000_000, 20],
  [2_400_000, 25],
  [Infinity, 30],
];

const oldSlabs: Record<AgeGroup, Slab[]> = {
  below60: [[250_000, 0], [500_000, 5], [1_000_000, 20], [Infinity, 30]],
  "60to80": [[300_000, 0], [500_000, 5], [1_000_000, 20], [Infinity, 30]],
  above80: [[500_000, 0], [1_000_000, 20], [Infinity, 30]],
};

export const rules = {
  new: { standardDeduction: 75_000, rebateUpTo: 1_200_000, maxRebate: 60_000, surchargeCap: 25 },
  old: { standardDeduction: 50_000, rebateUpTo: 500_000, maxRebate: 12_500, surchargeCap: 37 },
  cess: 4,
  limits: { section80C: 150_000, nps80CCD1B: 50_000, homeLoanInterest: 200_000 },
};

/** [income above, surcharge %] */
const surchargeBands: [number, number][] = [
  [5_00_00_000, 37],
  [2_00_00_000, 25],
  [1_00_00_000, 15],
  [50_00_000, 10],
];

export const slabsFor = (regime: Regime, age: AgeGroup = "below60") => (regime === "new" ? newSlabs : oldSlabs[age]);

export function slabTax(income: number, slabs: Slab[]) {
  let tax = 0;
  let from = 0;
  for (const [upTo, rate] of slabs) {
    if (income <= from) break;
    tax += ((Math.min(income, upTo) - from) * rate) / 100;
    from = upTo;
  }
  return tax;
}

export type TaxInput = {
  regime: Regime;
  age?: AgeGroup;
  /** Gross salary or pension for the year (before the standard deduction). */
  salary: number;
  /** Interest, rent received after its 30% deduction, freelance profit… */
  otherIncome?: number;
  /** Old regime: 80C (PPF, ELSS, EPF, life insurance…), capped at ₹1.5 lakh. */
  section80C?: number;
  /** Old regime: health insurance premiums under 80D. */
  section80D?: number;
  /** Old regime: own contribution to NPS under 80CCD(1B), capped at ₹50,000. */
  nps?: number;
  /** Old regime: exempt HRA (see the HRA calculator). */
  hraExemption?: number;
  /** Old regime: interest on a home loan for a self-occupied home, capped at ₹2 lakh. */
  homeLoanInterest?: number;
  /** Old regime: any other deductions (80E, 80G, 80TTA…). */
  otherDeductions?: number;
  /** Both regimes: employer's NPS contribution, 80CCD(2). */
  employerNps?: number;
};

export type TaxBreakdown = {
  regime: Regime;
  grossIncome: number;
  deductions: number;
  taxableIncome: number;
  slabTax: number;
  rebate: number;
  surcharge: number;
  cess: number;
  totalTax: number;
  /** Total tax as a share of gross income, %. */
  effectiveRate: number;
};

const clamp = (n: number | undefined, max = Infinity) => Math.min(Math.max(n ?? 0, 0), max);

export function calculateTax(input: TaxInput): TaxBreakdown | { error: string } {
  const values = [input.salary, input.otherIncome, input.section80C, input.section80D, input.nps, input.hraExemption, input.homeLoanInterest, input.otherDeductions, input.employerNps];
  if (values.some((v) => v !== undefined && (!Number.isFinite(v) || v < 0))) return { error: "Enter amounts as positive numbers." };
  const { regime, age = "below60" } = input;
  const r = rules[regime];
  const salary = clamp(input.salary);
  const grossIncome = salary + clamp(input.otherIncome);
  if (grossIncome === 0) return { error: "Enter your income for the year." };

  let deductions = Math.min(salary, r.standardDeduction) + clamp(input.employerNps);
  if (regime === "old")
    deductions +=
      clamp(input.section80C, rules.limits.section80C) +
      clamp(input.section80D) +
      clamp(input.nps, rules.limits.nps80CCD1B) +
      clamp(input.hraExemption) +
      clamp(input.homeLoanInterest, rules.limits.homeLoanInterest) +
      clamp(input.otherDeductions);
  const taxableIncome = Math.max(0, Math.round(grossIncome - deductions));

  const slabs = slabsFor(regime, age);
  const base = slabTax(taxableIncome, slabs);

  // Rebate under 87A, with marginal relief just above the new regime's
  // limit: the tax may not exceed the income above ₹12 lakh.
  let rebate = 0;
  if (taxableIncome <= r.rebateUpTo) rebate = Math.min(base, r.maxRebate);
  else if (regime === "new") rebate = Math.max(0, base - (taxableIncome - r.rebateUpTo));
  const afterRebate = base - rebate;

  // Surcharge, with marginal relief at each threshold: tax + surcharge may
  // rise by no more than the income above that threshold.
  let surcharge = 0;
  const band = surchargeBands.find(([above]) => taxableIncome > above);
  if (band) {
    const rate = Math.min(band[1], r.surchargeCap);
    surcharge = (afterRebate * rate) / 100;
    const [threshold] = band;
    const lower = surchargeBands.find(([above]) => threshold > above);
    const taxAtThreshold = slabTax(threshold, slabs);
    const atThreshold = taxAtThreshold * (1 + Math.min(lower?.[1] ?? 0, r.surchargeCap) / 100);
    const cap = atThreshold + (taxableIncome - threshold);
    if (afterRebate + surcharge > cap) surcharge = Math.max(0, cap - afterRebate);
  }

  const cess = ((afterRebate + surcharge) * rules.cess) / 100;
  const totalTax = Math.round(afterRebate + surcharge + cess);
  return {
    regime,
    grossIncome,
    deductions: Math.round(deductions),
    taxableIncome,
    slabTax: Math.round(base),
    rebate: Math.round(rebate),
    surcharge: Math.round(surcharge),
    cess: Math.round(cess),
    totalTax,
    effectiveRate: Math.round((totalTax / grossIncome) * 1000) / 10,
  };
}

export function compareRegimes(input: Omit<TaxInput, "regime">) {
  const next = calculateTax({ ...input, regime: "new" });
  const old = calculateTax({ ...input, regime: "old" });
  if ("error" in next) return next;
  if ("error" in old) return old;
  const better: Regime | "same" = next.totalTax < old.totalTax ? "new" : old.totalTax < next.totalTax ? "old" : "same";
  return { new: next, old, better, saving: Math.abs(next.totalTax - old.totalTax) };
}

const rupees = (n: number) => "₹" + n.toLocaleString("en-IN");

export function describeTax(input: Omit<TaxInput, "regime">) {
  const r = compareRegimes(input);
  if ("error" in r) return r.error;
  const verdict = r.better === "same" ? "Both regimes cost the same" : `${r.better === "new" ? "New" : "Old"} regime saves ${rupees(r.saving)}`;
  return `New regime: ${rupees(r.new.totalTax)}\nOld regime: ${rupees(r.old.totalTax)}\n${verdict}`;
}
