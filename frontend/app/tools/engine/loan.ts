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
