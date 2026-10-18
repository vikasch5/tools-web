export type PercentMode = "of" | "is-what" | "change" | "adjust";

export type PercentResult =
  | { ok: true; value: number; text: string; detail: string }
  | { ok: false; message: string };

/** Rounds away float noise (0.1 + 0.2) and trims trailing zeros. */
export function formatNumber(n: number, maxDecimals = 4) {
  if (!Number.isFinite(n)) return "—";
  const rounded = Number(n.toFixed(maxDecimals));
  return (Object.is(rounded, -0) ? 0 : rounded).toLocaleString("en", {
    maximumFractionDigits: maxDecimals,
  });
}

/**
 * The four everyday percentage questions:
 * of: a% of b · is-what: a is what % of b · change: from a to b · adjust: b ± a%.
 */
export function calculatePercent(mode: PercentMode, a: number, b: number): PercentResult {
  if (!Number.isFinite(a) || !Number.isFinite(b))
    return { ok: false, message: "Enter a number in both fields." };
  switch (mode) {
    case "of": {
      const value = (a / 100) * b;
      return { ok: true, value, text: formatNumber(value), detail: `${formatNumber(a)}% × ${formatNumber(b)} = ${formatNumber(value)}` };
    }
    case "is-what": {
      if (b === 0) return { ok: false, message: "The second number cannot be 0." };
      const value = (a / b) * 100;
      return { ok: true, value, text: `${formatNumber(value)}%`, detail: `${formatNumber(a)} ÷ ${formatNumber(b)} × 100 = ${formatNumber(value)}%` };
    }
    case "change": {
      if (a === 0) return { ok: false, message: "The starting value cannot be 0: any change from 0 is infinite." };
      const value = ((b - a) / Math.abs(a)) * 100;
      const word = value > 0 ? "increase" : value < 0 ? "decrease" : "no change";
      return {
        ok: true,
        value,
        text: `${value > 0 ? "+" : ""}${formatNumber(value)}%`,
        detail: `(${formatNumber(b)} − ${formatNumber(a)}) ÷ ${formatNumber(Math.abs(a))} × 100 = ${formatNumber(value)}% (${word})`,
      };
    }
    case "adjust": {
      const value = b * (1 + a / 100);
      return { ok: true, value, text: formatNumber(value), detail: `${formatNumber(b)} × (1 ${a < 0 ? "−" : "+"} ${formatNumber(Math.abs(a))}%) = ${formatNumber(value)}` };
    }
  }
}

/** Parses "1,234.5", "12%", " 7 " into a number (NaN when empty or invalid). */
export function parseNumber(input: string) {
  const s = input.trim().replace(/,/g, "").replace(/%$/, "");
  return s === "" || !/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(s) ? NaN : Number(s);
}
