/** Height conversions between feet + inches and centimetres (1 in = 2.54 cm exactly). */

export const CM_PER_INCH = 2.54;

const round1 = (v: number) => Math.round(v * 10) / 10;

export type FeetInches = { ft: number; in: number };

export type HeightResult =
  | { ok: true; cm: number; m: number; totalInches: number; feet: FeetInches }
  | { ok: false; message: string };

/** Whole feet and inches (to 0.1 in) from a number of inches, carrying 12 in to a foot. */
export function toFeetInches(totalInches: number): FeetInches {
  const rounded = round1(totalInches);
  const ft = Math.floor(rounded / 12 + 1e-9);
  return { ft, in: round1(rounded - ft * 12) };
}

function check(totalInches: number): HeightResult {
  if (!Number.isFinite(totalInches) || totalInches <= 0) return { ok: false, message: "Enter a height as a positive number." };
  if (totalInches > 120) return { ok: false, message: "That is over 10 feet. Check the numbers." };
  const cm = round1(totalInches * CM_PER_INCH);
  return { ok: true, cm, m: Math.round(totalInches * CM_PER_INCH) / 100, totalInches: round1(totalInches), feet: toFeetInches(totalInches) };
}

/** Feet and inches to cm. Decimal feet are allowed: 5.5 ft = 5 ft 6 in. */
export function feetToCm(ft: number, inches = 0): HeightResult {
  if (ft < 0 || inches < 0) return { ok: false, message: "Enter a height as a positive number." };
  return check(ft * 12 + inches);
}

export function cmToFeet(cm: number): HeightResult {
  return check(cm / CM_PER_INCH);
}

/**
 * "5.8" typed as feet is ambiguous: 5.8 decimal feet (5 ft 9.6 in) or the
 * common shorthand for 5 ft 8 in. Returns both readings when the digits after
 * the point could be inches (1–11).
 */
export function decimalFeetReadings(text: string) {
  const match = text.trim().match(/^(\d+)[.,](\d{1,2})$/);
  if (!match) return undefined;
  const [, whole, fraction] = match;
  const decimal = feetToCm(Number(`${whole}.${fraction}`));
  const inches = Number(fraction);
  const shorthand = inches >= 1 && inches <= 11 && !fraction.startsWith("0") ? feetToCm(Number(whole), inches) : undefined;
  if (!decimal.ok) return undefined;
  return { decimal, shorthand: shorthand?.ok ? { ...shorthand, inches } : undefined };
}

export function describeHeight(input: string) {
  const fi = input.match(/^(\d+) ft (\d+(?:\.\d+)?) in$/);
  if (fi) {
    const r = feetToCm(Number(fi[1]), Number(fi[2]));
    return r.ok ? `${r.cm} cm (${r.m} m)` : r.message;
  }
  const cm = input.match(/^([\d.]+) cm$/);
  if (cm) {
    const r = cmToFeet(Number(cm[1]));
    return r.ok ? `${r.feet.ft} ft ${r.feet.in} in (${r.totalInches} inches)` : r.message;
  }
  const dec = input.match(/^([\d.]+) ft$/);
  const readings = dec && decimalFeetReadings(dec[1]);
  if (!readings) return "Unrecognised example";
  const { decimal, shorthand } = readings;
  const lines = [`${dec![1]} ft (decimal) = ${decimal.feet.ft} ft ${decimal.feet.in} in = ${decimal.cm} cm`];
  if (shorthand) lines.push(`${shorthand.feet.ft} ft ${shorthand.inches} in = ${shorthand.cm} cm`);
  return lines.join("\n");
}

/** Every inch from 4 ft 6 in to 7 ft 0 in, for the reference chart. */
export function heightChart() {
  const rows: { ft: number; in: number; cm: number; m: number; decimalFeet: number }[] = [];
  for (let inches = 54; inches <= 84; inches++) {
    const r = feetToCm(0, inches);
    if (r.ok) rows.push({ ...r.feet, cm: r.cm, m: r.m, decimalFeet: Math.round((inches / 12) * 100) / 100 });
  }
  return rows;
}
