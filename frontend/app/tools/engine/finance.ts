/**
 * Indian personal-finance calculators: GST, SIP and lump sum, FD, compound
 * interest, PPF, gratuity and HRA. Pure functions; rupees in, rupees out.
 *
 * Rules checked in October 2026: GST slabs after the 22 Sep 2025 reform
 * (5%, 18%, 40%, plus 3% and 0.25% for gold and diamonds); PPF 7.1% for
 * Oct–Dec 2026; HRA 50% cities from 1 Apr 2026; gratuity under the
 * Payment of Gratuity Act and the Code on Social Security (Nov 2025).
 */

export type Fail = { ok: false; message: string };

const round2 = (n: number) => Math.round(n * 100) / 100;
const bad = (message: string): Fail => ({ ok: false, message });
const isAmount = (n: number) => Number.isFinite(n) && n >= 0;

/** ₹12,34,567.89, or without paise when `whole`. */
export function inr(n: number, whole = false) {
  return (
    "₹" +
    n.toLocaleString("en-IN", {
      minimumFractionDigits: whole ? 0 : 2,
      maximumFractionDigits: whole ? 0 : 2,
    })
  );
}

/** One row of a year-by-year growth table. */
export type GrowthYear = { year: number; invested: number; interest: number; balance: number };

/* ----------------------------------------------------------------- GST */

export const gstRates = [5, 18, 40, 3, 0.25] as const;

export type GstResult =
  | { ok: true; base: number; tax: number; total: number; cgst: number; sgst: number; igst: number }
  | Fail;

/**
 * `add`: amount is before tax. `remove`: amount already includes GST.
 * Within a state the tax splits into equal CGST and SGST; between states
 * it is all IGST.
 */
export function calculateGst(amount: number, rate: number, mode: "add" | "remove", interState = false): GstResult {
  if (!isAmount(amount) || amount === 0) return bad("Enter an amount above 0.");
  if (!Number.isFinite(rate) || rate < 0 || rate > 100) return bad("Enter a GST rate between 0% and 100%.");
  const base = mode === "add" ? amount : amount / (1 + rate / 100);
  const tax = mode === "add" ? (amount * rate) / 100 : amount - base;
  const half = round2(tax / 2);
  return {
    ok: true,
    base: round2(base),
    tax: round2(tax),
    total: round2(base + tax),
    cgst: interState ? 0 : half,
    sgst: interState ? 0 : round2(tax - half),
    igst: interState ? round2(tax) : 0,
  };
}

export function describeGst(amount: number, rate: number, mode: "add" | "remove") {
  const r = calculateGst(amount, rate, mode);
  if (!r.ok) return r.message;
  return `Before GST: ${inr(r.base)}\nGST: ${inr(r.tax)} (CGST ${inr(r.cgst)} + SGST ${inr(r.sgst)})\nTotal: ${inr(r.total)}`;
}

/* ---------------------------------------------------------- SIP / lump sum */

export type GrowthResult =
  | { ok: true; invested: number; returns: number; total: number; years: GrowthYear[] }
  | Fail;

/**
 * Monthly SIP with an optional yearly step-up. Each instalment is invested
 * at the start of the month and grows at the yearly return ÷ 12 per month,
 * as most fund-house calculators assume.
 */
export function calculateSip(monthly: number, annualReturn: number, years: number, stepUp = 0): GrowthResult {
  if (!isAmount(monthly) || monthly === 0) return bad("Enter a monthly amount above 0.");
  if (!Number.isFinite(annualReturn) || annualReturn < 0 || annualReturn > 50) return bad("Enter an expected return between 0% and 50%.");
  if (!Number.isInteger(years) || years < 1 || years > 50) return bad("Enter a period between 1 and 50 years.");
  if (!Number.isFinite(stepUp) || stepUp < 0 || stepUp > 100) return bad("Enter a yearly step-up between 0% and 100%.");
  const r = annualReturn / 100 / 12;
  let balance = 0;
  let invested = 0;
  let instalment = monthly;
  const table: GrowthYear[] = [];
  for (let y = 1; y <= years; y++) {
    for (let m = 0; m < 12; m++) {
      balance = (balance + instalment) * (1 + r);
      invested += instalment;
    }
    table.push({ year: y, invested: round2(invested), interest: round2(balance - invested), balance: round2(balance) });
    instalment *= 1 + stepUp / 100;
  }
  return { ok: true, invested: round2(invested), returns: round2(balance - invested), total: round2(balance), years: table };
}

/** One-time investment compounded yearly at the expected return. */
export function calculateLumpsum(amount: number, annualReturn: number, years: number): GrowthResult {
  if (!isAmount(amount) || amount === 0) return bad("Enter an amount above 0.");
  if (!Number.isFinite(annualReturn) || annualReturn < 0 || annualReturn > 50) return bad("Enter an expected return between 0% and 50%.");
  if (!Number.isInteger(years) || years < 1 || years > 50) return bad("Enter a period between 1 and 50 years.");
  const table: GrowthYear[] = [];
  for (let y = 1; y <= years; y++) {
    const balance = amount * (1 + annualReturn / 100) ** y;
    table.push({ year: y, invested: amount, interest: round2(balance - amount), balance: round2(balance) });
  }
  const total = table.at(-1)!.balance;
  return { ok: true, invested: amount, returns: round2(total - amount), total, years: table };
}

export function describeSip(monthly: number, annualReturn: number, years: number, stepUp = 0) {
  const r = calculateSip(monthly, annualReturn, years, stepUp);
  if (!r.ok) return r.message;
  return `Invested: ${inr(r.invested, true)}\nEstimated returns: ${inr(r.returns, true)}\nTotal value: ${inr(r.total, true)}`;
}

/* ------------------------------------------- FD and compound interest */

export const compoundings = { monthly: 12, quarterly: 4, "half-yearly": 2, yearly: 1 } as const;
export type Compounding = keyof typeof compoundings;

export type CompoundResult =
  | { ok: true; invested: number; interest: number; maturity: number; years: GrowthYear[]; effectiveRate: number }
  | Fail;

/**
 * Deposit with interest added every compounding period, and an optional
 * deposit at the start of every month. Interest earned during a period is
 * credited at its end, like a bank account. `months` is the full term.
 */
export function calculateCompound(
  principal: number,
  annualRate: number,
  months: number,
  compounding: Compounding = "quarterly",
  monthlyDeposit = 0,
): CompoundResult {
  if (!isAmount(principal) || !isAmount(monthlyDeposit) || principal + monthlyDeposit === 0)
    return bad("Enter a deposit above 0.");
  if (!Number.isFinite(annualRate) || annualRate < 0 || annualRate > 50) return bad("Enter an interest rate between 0% and 50%.");
  if (!Number.isInteger(months) || months < 1 || months > 600) return bad("Enter a term between 1 month and 50 years.");
  const perYear = compoundings[compounding];
  const monthsPerPeriod = 12 / perYear;
  const r = annualRate / 100;
  let balance = principal;
  let pending = 0;
  let invested = principal;
  const table: GrowthYear[] = [];
  for (let m = 1; m <= months; m++) {
    if (monthlyDeposit) {
      balance += monthlyDeposit;
      invested += monthlyDeposit;
    }
    // Within a period, interest builds on the balance at the period rate.
    pending += balance * (r / perYear / monthsPerPeriod);
    if (m % monthsPerPeriod === 0 || m === months) {
      balance += pending;
      pending = 0;
    }
    if (m % 12 === 0 || m === months)
      table.push({ year: Math.ceil(m / 12), invested: round2(invested), interest: round2(balance - invested), balance: round2(balance) });
  }
  return {
    ok: true,
    invested: round2(invested),
    interest: round2(balance - invested),
    maturity: round2(balance),
    years: table,
    effectiveRate: round2(((1 + r / perYear) ** perYear - 1) * 100),
  };
}

/** A bank FD: cumulative, compounded quarterly unless stated. */
export function calculateFd(principal: number, annualRate: number, months: number, compounding: Compounding = "quarterly") {
  return calculateCompound(principal, annualRate, months, compounding, 0);
}

export function describeFd(principal: number, annualRate: number, months: number) {
  const r = calculateFd(principal, annualRate, months);
  if (!r.ok) return r.message;
  return `Interest earned: ${inr(r.interest)}\nMaturity amount: ${inr(r.maturity)}\nEffective yearly rate: ${r.effectiveRate}%`;
}

/* ------------------------------------------------------------------ PPF */

export const PPF_RATE = 7.1;
export const PPF_MIN = 500;
export const PPF_MAX = 150_000;

/**
 * PPF with the same deposit every year, made before the 5th of April so it
 * earns interest for the whole year (interest is credited yearly). The
 * account runs 15 years and can be extended in blocks of 5 years.
 */
export function calculatePpf(yearly: number, rate = PPF_RATE, years = 15): GrowthResult {
  if (!Number.isFinite(yearly) || yearly < PPF_MIN || yearly > PPF_MAX)
    return bad(`Enter a yearly deposit between ${inr(PPF_MIN, true)} and ${inr(PPF_MAX, true)}.`);
  if (!Number.isFinite(rate) || rate < 0 || rate > 20) return bad("Enter an interest rate between 0% and 20%.");
  if (!Number.isInteger(years) || years < 15 || years > 50 || (years - 15) % 5 !== 0)
    return bad("A PPF account runs 15 years, extendable in blocks of 5 years.");
  let balance = 0;
  const table: GrowthYear[] = [];
  for (let y = 1; y <= years; y++) {
    balance = (balance + yearly) * (1 + rate / 100);
    table.push({ year: y, invested: yearly * y, interest: round2(balance - yearly * y), balance: round2(balance) });
  }
  const total = round2(balance);
  return { ok: true, invested: yearly * years, returns: round2(total - yearly * years), total, years: table };
}

export function describePpf(yearly: number, rate = PPF_RATE, years = 15) {
  const r = calculatePpf(yearly, rate, years);
  if (!r.ok) return r.message;
  return `Invested: ${inr(r.invested, true)}\nInterest earned: ${inr(r.returns, true)}\nMaturity value: ${inr(r.total, true)}`;
}

/* ------------------------------------------------------------- Gratuity */

/** Tax-free limit for gratuity paid to non-government employees. */
export const GRATUITY_TAX_FREE = 2_000_000;

export type GratuityResult =
  | { ok: true; eligible: true; amount: number; countedYears: number; taxFree: number; taxable: number }
  | { ok: true; eligible: false; reason: string }
  | Fail;

/**
 * Employers covered by the Gratuity Act (10 or more staff) pay 15 days'
 * wages per year of service, a month counting as 26 working days; a final
 * part-year of 6 months or more counts as a full year. Employers not
 * covered usually pay half a month (15/30) per completed year.
 * Wages = last basic pay + DA.
 */
export function calculateGratuity({
  wages,
  years,
  months = 0,
  covered = true,
  fixedTerm = false,
}: {
  wages: number;
  years: number;
  months?: number;
  covered?: boolean;
  fixedTerm?: boolean;
}): GratuityResult {
  if (!isAmount(wages) || wages === 0) return bad("Enter your last monthly basic pay plus DA.");
  if (!Number.isInteger(years) || years < 0 || years > 60) return bad("Enter whole years of service, 0–60.");
  if (!Number.isInteger(months) || months < 0 || months > 11) return bad("Enter extra months between 0 and 11.");
  const minYears = fixedTerm ? 1 : 5;
  if (years < minYears)
    return {
      ok: true,
      eligible: false,
      reason: fixedTerm
        ? "Fixed-term employees qualify after 1 year of service."
        : "Gratuity is due after 5 years of continuous service (earlier only on death or disablement).",
    };
  const countedYears = covered ? years + (months >= 6 ? 1 : 0) : years;
  const amount = round2(wages * (covered ? 15 / 26 : 15 / 30) * countedYears);
  const taxFree = Math.min(amount, GRATUITY_TAX_FREE);
  return { ok: true, eligible: true, amount, countedYears, taxFree, taxable: round2(amount - taxFree) };
}

export function describeGratuity(input: Parameters<typeof calculateGratuity>[0]) {
  const r = calculateGratuity(input);
  if (!r.ok) return r.message;
  if (!r.eligible) return r.reason;
  return `Gratuity: ${inr(r.amount)} for ${r.countedYears} years\nTax-free: ${inr(r.taxFree)}`;
}

/* ------------------------------------------------------------------ HRA */

/** Cities where 50% of salary counts towards the HRA exemption (from 1 April 2026). */
export const hraCities = ["Delhi", "Mumbai", "Kolkata", "Chennai", "Bengaluru", "Hyderabad", "Pune", "Ahmedabad"];

export type HraResult =
  | {
      ok: true;
      exempt: number;
      taxable: number;
      /** The three amounts; the smallest is exempt. */
      limits: { received: number; rentOverTenPercent: number; salaryShare: number };
    }
  | Fail;

/**
 * Old tax regime only. Yearly amounts: salary = basic + DA (and
 * turnover-based commission). Exempt = the least of the HRA received,
 * rent minus 10% of salary, and 50% (8 big cities) or 40% of salary.
 */
export function calculateHra({ salary, hra, rent, bigCity }: { salary: number; hra: number; rent: number; bigCity: boolean }): HraResult {
  if (!isAmount(salary) || salary === 0) return bad("Enter your yearly basic pay plus DA.");
  if (!isAmount(hra)) return bad("Enter the HRA you receive in a year.");
  if (!isAmount(rent)) return bad("Enter the rent you pay in a year.");
  const limits = {
    received: round2(hra),
    rentOverTenPercent: round2(Math.max(0, rent - salary * 0.1)),
    salaryShare: round2(salary * (bigCity ? 0.5 : 0.4)),
  };
  const exempt = Math.min(limits.received, limits.rentOverTenPercent, limits.salaryShare);
  return { ok: true, exempt, taxable: round2(hra - exempt), limits };
}

export function describeHra(input: Parameters<typeof calculateHra>[0]) {
  const r = calculateHra(input);
  if (!r.ok) return r.message;
  return `Exempt HRA: ${inr(r.exempt, true)} a year\nTaxable HRA: ${inr(r.taxable, true)} a year`;
}

export function describeCompound(principal: number, annualRate: number, months: number, compounding: Compounding, monthlyDeposit = 0) {
  const r = calculateCompound(principal, annualRate, months, compounding, monthlyDeposit);
  if (!r.ok) return r.message;
  return `Invested: ${inr(r.invested)}\nInterest earned: ${inr(r.interest)}\nFinal value: ${inr(r.maturity)}`;
}
