export type LoanInput = { principal: number; annualRate: number; months: number };

export type LoanYear = { year: number; principal: number; interest: number; balance: number };

export type LoanResult =
  | { ok: true; payment: number; totalPaid: number; totalInterest: number; schedule: LoanYear[] }
  | { ok: false; message: string };

const cents = (n: number) => Math.round(n * 100) / 100;

/**
 * Fixed-rate loan with equal monthly payments (an EMI): interest is charged
 * monthly at annualRate / 12 on the remaining balance.
 */
export function calculateLoan({ principal, annualRate, months }: LoanInput): LoanResult {
  if (!Number.isFinite(principal) || principal <= 0) return { ok: false, message: "Enter a loan amount above 0." };
  if (!Number.isFinite(annualRate) || annualRate < 0 || annualRate > 100)
    return { ok: false, message: "Enter an interest rate between 0% and 100%." };
  if (!Number.isInteger(months) || months < 1 || months > 600)
    return { ok: false, message: "Enter a term between 1 month and 50 years." };

  const r = annualRate / 100 / 12;
  const payment = r === 0 ? principal / months : (principal * r) / (1 - (1 + r) ** -months);

  const schedule: LoanYear[] = [];
  let balance = principal;
  let totalInterest = 0;
  for (let m = 1; m <= months; m++) {
    const interest = balance * r;
    // The last payment clears any rounding remainder.
    const towardsPrincipal = m === months ? balance : payment - interest;
    balance -= towardsPrincipal;
    totalInterest += interest;
    const year = Math.ceil(m / 12);
    const row = schedule[year - 1] ?? (schedule[year - 1] = { year, principal: 0, interest: 0, balance: 0 });
    row.principal += towardsPrincipal;
    row.interest += interest;
    row.balance = Math.max(balance, 0);
  }
  return {
    ok: true,
    payment: cents(payment),
    totalPaid: cents(principal + totalInterest),
    totalInterest: cents(totalInterest),
    schedule: schedule.map((y) => ({ year: y.year, principal: cents(y.principal), interest: cents(y.interest), balance: cents(y.balance) })),
  };
}

/** Two decimals with thousands separators; the currency is up to the reader. */
export const money = (n: number) => n.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function describeLoan(input: LoanInput) {
  const r = calculateLoan(input);
  if (!r.ok) return r.message;
  return `Monthly payment: ${money(r.payment)}\nTotal interest: ${money(r.totalInterest)}\nTotal paid: ${money(r.totalPaid)}`;
}

export type PrepaymentMode = "tenure" | "emi";

export type Prepayments = {
  /** Added to every monthly payment. */
  extraMonthly?: number;
  /** Paid once a year, at the end of every 12th month from `yearlyFromMonth`. */
  yearly?: number;
  yearlyFromMonth?: number;
  /** Paid once, at the end of `oneTimeMonth`. */
  oneTime?: number;
  oneTimeMonth?: number;
  /** "tenure": keep the EMI and finish early; "emi": keep the end date and lower the EMI. */
  mode?: PrepaymentMode;
};

export type LoanMonth = {
  month: number;
  emi: number;
  principal: number;
  interest: number;
  prepayment: number;
  balance: number;
};

export type PrepaymentResult =
  | {
      ok: true;
      /** EMI without prepayments. */
      payment: number;
      /** EMI after the last prepayment (lower in "emi" mode). */
      finalPayment: number;
      months: number;
      totalInterest: number;
      totalPaid: number;
      totalPrepaid: number;
      /** Against the same loan without prepayments. */
      interestSaved: number;
      monthsSaved: number;
      schedule: LoanMonth[];
      years: LoanYear[];
    }
  | { ok: false; message: string };

const emiFor = (balance: number, r: number, months: number) =>
  r === 0 ? balance / months : (balance * r) / (1 - (1 + r) ** -months);

/**
 * The same EMI loan with part-prepayments. Interest is charged monthly on
 * the balance; a prepayment is applied after that month's EMI.
 */
export function calculatePrepayments(input: LoanInput & Prepayments): PrepaymentResult {
  const base = calculateLoan(input);
  if (!base.ok) return base;
  const { principal, annualRate, months } = input;
  const extra = Math.max(0, input.extraMonthly ?? 0);
  const yearly = Math.max(0, input.yearly ?? 0);
  const yearlyFrom = Math.max(1, Math.round(input.yearlyFromMonth ?? 12));
  const oneTime = Math.max(0, input.oneTime ?? 0);
  const oneTimeMonth = Math.max(1, Math.round(input.oneTimeMonth ?? 12));
  for (const v of [extra, yearly, oneTime])
    if (!Number.isFinite(v)) return { ok: false, message: "Enter prepayment amounts as numbers." };
  const mode = input.mode ?? "tenure";

  const r = annualRate / 100 / 12;
  let emi = emiFor(principal, r, months);
  let balance = principal;
  let totalInterest = 0;
  let totalPrepaid = 0;
  const schedule: LoanMonth[] = [];

  for (let m = 1; m <= months && balance > 0.005; m++) {
    const interest = balance * r;
    let towards = Math.min(balance, emi - interest);
    if (m === months) towards = balance;
    const paid = towards + interest;
    balance -= towards;

    let prepayment = extra;
    if (yearly && m >= yearlyFrom && (m - yearlyFrom) % 12 === 0) prepayment += yearly;
    if (oneTime && m === oneTimeMonth) prepayment += oneTime;
    prepayment = Math.min(prepayment, balance);
    balance -= prepayment;

    totalInterest += interest;
    totalPrepaid += prepayment;
    schedule.push({
      month: m,
      emi: cents(paid),
      principal: cents(towards),
      interest: cents(interest),
      prepayment: cents(prepayment),
      balance: cents(Math.max(balance, 0)),
    });
    // Lower the EMI so the loan still ends in the original month.
    if (mode === "emi" && prepayment > 0 && m < months && balance > 0) emi = emiFor(balance, r, months - m);
  }

  const years: LoanYear[] = [];
  for (const row of schedule) {
    const year = Math.ceil(row.month / 12);
    const y = years[year - 1] ?? (years[year - 1] = { year, principal: 0, interest: 0, balance: 0 });
    y.principal += row.principal + row.prepayment;
    y.interest += row.interest;
    y.balance = row.balance;
  }

  return {
    ok: true,
    payment: base.payment,
    finalPayment: cents(emi),
    months: schedule.length,
    totalInterest: cents(totalInterest),
    totalPaid: cents(principal + totalInterest),
    totalPrepaid: cents(totalPrepaid),
    interestSaved: cents(base.totalInterest - totalInterest),
    monthsSaved: months - schedule.length,
    schedule,
    years: years.map((y) => ({ year: y.year, principal: cents(y.principal), interest: cents(y.interest), balance: cents(y.balance) })),
  };
}

/** "3 years 4 months" */
export function formatMonths(n: number) {
  const y = Math.floor(n / 12);
  const m = n % 12;
  const parts = [y && `${y} ${y === 1 ? "year" : "years"}`, m && `${m} ${m === 1 ? "month" : "months"}`].filter(Boolean);
  return parts.length ? parts.join(" ") : "0 months";
}

export function scheduleCsv(rows: LoanMonth[]) {
  const lines = ["Month,EMI,Principal,Interest,Prepayment,Balance"];
  for (const r of rows)
    lines.push([String(r.month), ...[r.emi, r.principal, r.interest, r.prepayment, r.balance].map((n) => n.toFixed(2))].join(","));
  return lines.join("\n") + "\n";
}

export function describePrepayment(input: LoanInput & Prepayments) {
  const r = calculatePrepayments(input);
  if (!r.ok) return r.message;
  const emiLine = r.finalPayment < r.payment - 0.005 ? `EMI: ${money(r.payment)} → ${money(r.finalPayment)}` : `EMI: ${money(r.payment)}`;
  return `${emiLine}\nPaid off in: ${formatMonths(r.months)}\nInterest saved: ${money(r.interestSaved)}`;
}
