/**
 * Everyday calculators: dates, discounts, gold jewellery, unit
 * conversion, character limits and typing speed. Pure functions.
 */

import { parseDate } from "./age";

/* ---------------------------------------------------------------- Dates */

const DAY = 86_400_000;
const fmt = (d: Date) =>
  d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const ymd = (y: number, m: number, d: number) => new Date(Date.UTC(y, m, d));
const daysIn = (y: number, m: number) => new Date(Date.UTC(y, m + 1, 0)).getUTCDate();

export type DateDiff =
  | {
      ok: true;
      years: number;
      months: number;
      days: number;
      totalDays: number;
      weeks: number;
      weekDays: number;
      /** Days that are not Saturday or Sunday. */
      workingDays: number;
      /** Days that are not Sunday (six-day week). */
      sixDayWorkingDays: number;
    }
  | { ok: false; message: string };

/**
 * Time between two dates (YYYY-MM-DD, calendar dates in UTC).
 * `includeEnd` counts the end date as a day, as for leave or a booking
 * ("1 to 3 March" = 3 days).
 */
export function dateDifference(startInput: string, endInput: string, includeEnd = false): DateDiff {
  let start = parseDate(startInput);
  let end = parseDate(endInput);
  if (!start || !end) return { ok: false, message: "Enter both dates." };
  if (end < start) [start, end] = [end, start];
  const last = includeEnd ? new Date(end.getTime() + DAY) : end;
  const totalDays = Math.round((last.getTime() - start.getTime()) / DAY);

  let years = last.getUTCFullYear() - start.getUTCFullYear();
  let months = last.getUTCMonth() - start.getUTCMonth();
  let days = last.getUTCDate() - start.getUTCDate();
  if (days < 0) {
    months--;
    days += daysIn(last.getUTCFullYear(), last.getUTCMonth() - 1);
  }
  if (months < 0) {
    years--;
    months += 12;
  }

  let workingDays = 0;
  let sixDayWorkingDays = 0;
  const startDay = start.getUTCDay();
  for (let i = 0; i < totalDays; i++) {
    const weekday = (startDay + i) % 7;
    if (weekday !== 0) sixDayWorkingDays++;
    if (weekday !== 0 && weekday !== 6) workingDays++;
  }
  return { ok: true, years, months, days, totalDays, weeks: Math.floor(totalDays / 7), weekDays: totalDays % 7, workingDays, sixDayWorkingDays };
}

export function addDays(startInput: string, amount: number, unit: "days" | "weeks" | "months" | "years" = "days") {
  const start = parseDate(startInput);
  if (!start || !Number.isFinite(amount)) return null;
  const y = start.getUTCFullYear();
  const m = start.getUTCMonth();
  const d = start.getUTCDate();
  if (unit === "days") return ymd(y, m, d + amount);
  if (unit === "weeks") return ymd(y, m, d + amount * 7);
  // 31 January + 1 month = 28/29 February, not 3 March.
  const target = ymd(y, m + (unit === "years" ? amount * 12 : amount), 1);
  return ymd(target.getUTCFullYear(), target.getUTCMonth(), Math.min(d, daysIn(target.getUTCFullYear(), target.getUTCMonth())));
}

export function describeDateDifference(start: string, end: string, includeEnd = false) {
  const r = dateDifference(start, end, includeEnd);
  if (!r.ok) return r.message;
  const parts = [r.years && `${r.years} ${r.years === 1 ? "year" : "years"}`, r.months && `${r.months} ${r.months === 1 ? "month" : "months"}`, `${r.days} ${r.days === 1 ? "day" : "days"}`].filter(Boolean);
  return `${parts.join(", ")}\n${r.totalDays.toLocaleString("en-IN")} days in total\n${r.workingDays.toLocaleString("en-IN")} working days (Mon–Fri)`;
}

export function describeAddDays(start: string, amount: number, unit: "days" | "weeks" | "months" | "years") {
  const d = addDays(start, amount, unit);
  return d ? fmt(d) : "Enter a valid date.";
}

export const formatLongDate = fmt;

/* ------------------------------------------------------------- Discount */

const r2 = (n: number) => Math.round(n * 100) / 100;

export type DiscountResult =
  | { ok: true; final: number; saved: number; effectivePercent: number }
  | { ok: false; message: string };

/** Price after one or more percentage discounts applied one after another ("20% + 10%"). */
export function applyDiscounts(price: number, percents: number[]): DiscountResult {
  if (!Number.isFinite(price) || price <= 0) return { ok: false, message: "Enter a price above 0." };
  if (percents.some((p) => !Number.isFinite(p) || p < 0 || p > 100)) return { ok: false, message: "Discounts must be between 0% and 100%." };
  const final = percents.reduce((value, p) => value * (1 - p / 100), price);
  return { ok: true, final: r2(final), saved: r2(price - final), effectivePercent: r2((1 - final / price) * 100) };
}

/** Discount % between a marked price (MRP) and what you pay. */
export function discountPercent(mrp: number, paid: number) {
  if (!Number.isFinite(mrp) || mrp <= 0 || !Number.isFinite(paid) || paid < 0) return null;
  return r2(((mrp - paid) / mrp) * 100);
}

export function describeDiscount(price: number, percents: number[]) {
  const r = applyDiscounts(price, percents);
  if (!r.ok) return r.message;
  return `You pay: ₹${r.final.toLocaleString("en-IN")}\nYou save: ₹${r.saved.toLocaleString("en-IN")} (${r.effectivePercent}% off)`;
}

/* ----------------------------------------------------------------- Gold */

export const purities = [
  { karat: 24, fineness: 999, share: 0.999 },
  { karat: 22, fineness: 916, share: 0.916 },
  { karat: 18, fineness: 750, share: 0.75 },
  { karat: 14, fineness: 585, share: 0.585 },
] as const;

/** GST on gold, jewellery and making charges since 2017 (unchanged in the 2025 reform). */
export const GOLD_GST = 3;

export type GoldInput = {
  /** Today's price of 1 gram of 24K (999) gold. */
  rate24k: number;
  karat: 24 | 22 | 18 | 14;
  grams: number;
  /** Making charges, either a % of the gold value or ₹ per gram. */
  making: number;
  makingType: "percent" | "perGram";
  includeGst?: boolean;
};

export type GoldResult =
  | { ok: true; ratePerGram: number; goldValue: number; makingCharges: number; gst: number; total: number }
  | { ok: false; message: string };

export function calculateGold(input: GoldInput): GoldResult {
  const { rate24k, karat, grams, making, makingType, includeGst = true } = input;
  if (!Number.isFinite(rate24k) || rate24k <= 0) return { ok: false, message: "Enter today's 24K gold rate per gram." };
  if (!Number.isFinite(grams) || grams <= 0) return { ok: false, message: "Enter the weight in grams." };
  if (!Number.isFinite(making) || making < 0) return { ok: false, message: "Enter making charges as 0 or more." };
  const purity = purities.find((p) => p.karat === karat)!;
  // Jewellers price lower karats by fineness against 24K (999).
  const ratePerGram = r2((rate24k * purity.share) / 0.999);
  const goldValue = r2(ratePerGram * grams);
  const makingCharges = r2(makingType === "percent" ? (goldValue * making) / 100 : making * grams);
  const gst = includeGst ? r2(((goldValue + makingCharges) * GOLD_GST) / 100) : 0;
  return { ok: true, ratePerGram, goldValue, makingCharges, gst, total: r2(goldValue + makingCharges + gst) };
}

export function describeGold(input: GoldInput) {
  const r = calculateGold(input);
  if (!r.ok) return r.message;
  const rs = (n: number) => `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `Gold value: ${rs(r.goldValue)}\nMaking charges: ${rs(r.makingCharges)}\nGST (3%): ${rs(r.gst)}\nTotal: ${rs(r.total)}`;
}

/* ---------------------------------------------------------------- Units */

type Unit = { id: string; label: string; factor: number };
export type UnitGroup = { id: string; label: string; base: string; units: Unit[] };

/** Factors convert to the group's base unit. */
export const unitGroups: UnitGroup[] = [
  {
    id: "length",
    label: "Length",
    base: "m",
    units: [
      { id: "mm", label: "Millimetre (mm)", factor: 0.001 },
      { id: "cm", label: "Centimetre (cm)", factor: 0.01 },
      { id: "m", label: "Metre (m)", factor: 1 },
      { id: "km", label: "Kilometre (km)", factor: 1000 },
      { id: "in", label: "Inch (in)", factor: 0.0254 },
      { id: "ft", label: "Foot (ft)", factor: 0.3048 },
      { id: "yd", label: "Yard (yd)", factor: 0.9144 },
      { id: "mi", label: "Mile (mi)", factor: 1609.344 },
    ],
  },
  {
    id: "weight",
    label: "Weight",
    base: "kg",
    units: [
      { id: "mg", label: "Milligram (mg)", factor: 1e-6 },
      { id: "g", label: "Gram (g)", factor: 0.001 },
      { id: "kg", label: "Kilogram (kg)", factor: 1 },
      { id: "quintal", label: "Quintal (100 kg)", factor: 100 },
      { id: "t", label: "Tonne (t)", factor: 1000 },
      { id: "tola", label: "Tola (11.66 g)", factor: 0.0116638 },
      { id: "oz", label: "Ounce (oz)", factor: 0.028349523125 },
      { id: "lb", label: "Pound (lb)", factor: 0.45359237 },
    ],
  },
  {
    id: "area",
    label: "Area",
    base: "m2",
    units: [
      { id: "sqft", label: "Square foot (sq ft)", factor: 0.09290304 },
      { id: "m2", label: "Square metre (m²)", factor: 1 },
      { id: "gaj", label: "Square yard / gaj", factor: 0.83612736 },
      { id: "cent", label: "Cent (435.6 sq ft)", factor: 40.468564224 },
      { id: "guntha", label: "Guntha (1,089 sq ft)", factor: 101.17141056 },
      { id: "acre", label: "Acre", factor: 4046.8564224 },
      { id: "ha", label: "Hectare (ha)", factor: 10000 },
      { id: "km2", label: "Square kilometre (km²)", factor: 1e6 },
    ],
  },
  {
    id: "volume",
    label: "Volume",
    base: "l",
    units: [
      { id: "ml", label: "Millilitre (ml)", factor: 0.001 },
      { id: "l", label: "Litre (l)", factor: 1 },
      { id: "m3", label: "Cubic metre (m³)", factor: 1000 },
      { id: "cup", label: "Cup (US, 240 ml)", factor: 0.24 },
      { id: "floz", label: "Fluid ounce (US)", factor: 0.0295735295625 },
      { id: "gal", label: "Gallon (US)", factor: 3.785411784 },
      { id: "ukgal", label: "Gallon (UK)", factor: 4.54609 },
    ],
  },
  {
    id: "speed",
    label: "Speed",
    base: "mps",
    units: [
      { id: "kmh", label: "km per hour", factor: 1 / 3.6 },
      { id: "mph", label: "Miles per hour", factor: 0.44704 },
      { id: "mps", label: "Metres per second", factor: 1 },
      { id: "knot", label: "Knot", factor: 1852 / 3600 },
    ],
  },
  {
    id: "data",
    label: "Data",
    base: "B",
    units: [
      { id: "B", label: "Byte (B)", factor: 1 },
      { id: "KB", label: "Kilobyte (KB, 1,000 B)", factor: 1e3 },
      { id: "MB", label: "Megabyte (MB)", factor: 1e6 },
      { id: "GB", label: "Gigabyte (GB)", factor: 1e9 },
      { id: "TB", label: "Terabyte (TB)", factor: 1e12 },
      { id: "KiB", label: "Kibibyte (KiB, 1,024 B)", factor: 1024 },
      { id: "MiB", label: "Mebibyte (MiB)", factor: 1024 ** 2 },
      { id: "GiB", label: "Gibibyte (GiB)", factor: 1024 ** 3 },
    ],
  },
  {
    id: "temperature",
    label: "Temperature",
    base: "C",
    units: [
      { id: "C", label: "Celsius (°C)", factor: 1 },
      { id: "F", label: "Fahrenheit (°F)", factor: 1 },
      { id: "K", label: "Kelvin (K)", factor: 1 },
    ],
  },
];

const toCelsius = (v: number, u: string) => (u === "F" ? ((v - 32) * 5) / 9 : u === "K" ? v - 273.15 : v);
const fromCelsius = (v: number, u: string) => (u === "F" ? (v * 9) / 5 + 32 : u === "K" ? v + 273.15 : v);

export function convertUnit(value: number, group: string, from: string, to: string) {
  if (!Number.isFinite(value)) return NaN;
  if (group === "temperature") return fromCelsius(toCelsius(value, from), to);
  const g = unitGroups.find((x) => x.id === group)!;
  const a = g.units.find((u) => u.id === from)!;
  const b = g.units.find((u) => u.id === to)!;
  return (value * a.factor) / b.factor;
}

/** Up to 6 significant figures, without trailing zeros or scientific notation for everyday sizes. */
export function formatQuantity(n: number) {
  if (!Number.isFinite(n)) return "–";
  if (n === 0) return "0";
  const abs = Math.abs(n);
  if (abs >= 1e15 || abs < 1e-6) return n.toExponential(4);
  return Number(n.toPrecision(6)).toLocaleString("en-IN", { maximumFractionDigits: 6 });
}

/** "5 feet 8 inches" style, for heights. */
export function feetAndInches(metres: number) {
  const totalInches = metres / 0.0254;
  let feet = Math.floor(totalInches / 12);
  let inches = Math.round((totalInches - feet * 12) * 10) / 10;
  if (inches >= 12) {
    feet++;
    inches -= 12;
  }
  return `${feet} ft ${inches} in`;
}

export function describeConversion(value: number, group: string, from: string, to: string) {
  const g = unitGroups.find((x) => x.id === group)!;
  const label = (id: string) => g.units.find((u) => u.id === id)!.label.replace(/ \(.*\)$/, "");
  return `${formatQuantity(value)} ${label(from)} = ${formatQuantity(convertUnit(value, group, from, to))} ${label(to)}`;
}

/* ------------------------------------------------------ Character limits */

export const platformLimits = [
  { id: "x", label: "X (Twitter) post", limit: 280 },
  { id: "instagram-caption", label: "Instagram caption", limit: 2200 },
  { id: "instagram-bio", label: "Instagram bio", limit: 150 },
  { id: "linkedin-post", label: "LinkedIn post", limit: 3000 },
  { id: "youtube-title", label: "YouTube title", limit: 100 },
  { id: "youtube-description", label: "YouTube description", limit: 5000 },
  { id: "meta-title", label: "Google title (about)", limit: 60 },
  { id: "meta-description", label: "Meta description (about)", limit: 160 },
] as const;

/** Characters as people see them: an emoji or a Hindi conjunct counts once. */
export function visibleLength(text: string) {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    let n = 0;
    for (const _ of new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text)) n++;
    return n;
  }
  return Array.from(text).length;
}

/** The GSM 7-bit alphabet; any other character makes an SMS Unicode (70 per part). */
const gsm = /^[A-Za-z0-9@£$¥èéùìòÇØøÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&'()*+,\-./:;<=>?¡ÄÖÑÜ§¿äöñüà\n\r^{}\\[~\]|€]*$/;
const gsmDouble = /[\^{}\\[~\]|€]/g;

export function smsParts(text: string) {
  if (!text) return { unicode: false, length: 0, parts: 0, perPart: 160 };
  const unicode = !gsm.test(text);
  const length = unicode ? text.length : text.length + (text.match(gsmDouble)?.length ?? 0);
  const single = unicode ? 70 : 160;
  const multi = unicode ? 67 : 153;
  const parts = length <= single ? 1 : Math.ceil(length / multi);
  return { unicode, length, parts, perPart: parts === 1 ? single : multi };
}

export function describeLimits(text: string) {
  const n = visibleLength(text);
  const sms = smsParts(text);
  return `${n} characters\nX post: ${280 - n} left\nSMS: ${sms.parts} part${sms.parts === 1 ? "" : "s"}${sms.unicode ? " (Unicode)" : ""}`;
}

/* --------------------------------------------------------------- Typing */

export type TypingScore = { wpm: number; rawWpm: number; accuracy: number; correct: number; typed: number; errors: number };

/**
 * Standard typing-test maths: a "word" is 5 characters. Net WPM counts only
 * correctly typed characters; raw WPM counts everything typed.
 */
export function scoreTyping(target: string, typed: string, seconds: number): TypingScore {
  let correct = 0;
  for (let i = 0; i < typed.length; i++) if (typed[i] === target[i]) correct++;
  const minutes = Math.max(seconds, 1) / 60;
  return {
    wpm: Math.round(correct / 5 / minutes),
    rawWpm: Math.round(typed.length / 5 / minutes),
    accuracy: typed.length ? Math.round((correct / typed.length) * 1000) / 10 : 100,
    correct,
    typed: typed.length,
    errors: typed.length - correct,
  };
}

export function describeTyping(target: string, typed: string, seconds: number) {
  const s = scoreTyping(target, typed, seconds);
  return `${s.wpm} WPM, ${s.accuracy}% accuracy`;
}

export const typingPassages = [
  "India is a land of many languages, and its people are known for their warm welcome. From the snowy peaks of the Himalayas to the beaches of Kerala, every region has its own food, music and festivals. Trains carry millions of travellers every day, linking small towns with busy cities. Good typing is a useful skill for students and office workers alike, because so much work now happens on a computer. Practise a little every day, keep your eyes on the screen and let your fingers find the keys.",
  "The best way to improve your typing speed is to type accurately first. Speed grows on its own once your fingers learn where each key is. Sit up straight, keep your wrists level and rest your fingers on the home row: A, S, D and F for the left hand, and J, K, L and the semicolon for the right. Look at the screen, not the keyboard. If you make a mistake, carry on rather than stopping. Ten minutes of steady practice each day is better than one long session a week.",
  "Many government exams in India include a typing test, often asking for 35 words per minute in English or 30 words per minute in Hindi. Data entry jobs, court clerks and stenographers also need fast and accurate typing. The test usually lasts ten minutes and counts only the words you type correctly, so accuracy matters as much as speed. Before the exam, practise with passages of the same length and learn to type numbers, punctuation and capital letters without slowing down.",
];
