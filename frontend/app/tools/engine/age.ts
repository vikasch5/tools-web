import { formatNumber } from "./percent";

export type AgeResult =
  | {
      ok: true;
      years: number;
      months: number;
      days: number;
      totalMonths: number;
      totalWeeks: number;
      totalDays: number;
      /** Next birthday as YYYY-MM-DD, its weekday, and days until it (0 = today). */
      nextBirthday: { date: string; weekday: string; daysUntil: number; turning: number };
    }
  | { ok: false; message: string };

const DAY = 86_400_000;
const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Parses YYYY-MM-DD as a UTC calendar date (no time zone drift). */
export function parseDate(input: string) {
  const m = input.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === mo - 1 && date.getUTCDate() === d ? date : null;
}

const daysInMonth = (year: number, month: number) => new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
const iso = (d: Date) => d.toISOString().slice(0, 10);

/**
 * The birthday in a given year. A 29 February birthday falls on 28 February
 * in common years, the convention most countries use for legal age.
 */
function birthdayIn(year: number, birth: Date) {
  const month = birth.getUTCMonth();
  return new Date(Date.UTC(year, month, Math.min(birth.getUTCDate(), daysInMonth(year, month))));
}

/** Exact age in years, months and days, plus totals and the next birthday. */
export function calculateAge(birthInput: string, onInput: string): AgeResult {
  const birth = parseDate(birthInput);
  const on = parseDate(onInput);
  if (!birth || !on) return { ok: false, message: "Enter both dates as a valid day, month and year." };
  if (on < birth) return { ok: false, message: "The date of birth is after the date to calculate on." };

  let years = on.getUTCFullYear() - birth.getUTCFullYear();
  if (birthdayIn(on.getUTCFullYear(), birth) > on) years--;
  // Whole months after the last birthday, then the remaining days.
  let months = 0;
  let anchor = birthdayIn(birth.getUTCFullYear() + years, birth);
  for (;;) {
    const y = anchor.getUTCFullYear();
    const m = anchor.getUTCMonth() + 1;
    const next = new Date(Date.UTC(y + Math.floor(m / 12), m % 12, Math.min(birth.getUTCDate(), daysInMonth(y + Math.floor(m / 12), m % 12))));
    if (next > on) break;
    anchor = next;
    months++;
  }
  const days = Math.round((on.getTime() - anchor.getTime()) / DAY);
  const totalDays = Math.round((on.getTime() - birth.getTime()) / DAY);

  let next = birthdayIn(on.getUTCFullYear(), birth);
  if (next < on) next = birthdayIn(on.getUTCFullYear() + 1, birth);
  return {
    ok: true,
    years,
    months,
    days,
    totalMonths: years * 12 + months,
    totalWeeks: Math.floor(totalDays / 7),
    totalDays,
    nextBirthday: {
      date: iso(next),
      weekday: weekdays[next.getUTCDay()],
      daysUntil: Math.round((next.getTime() - on.getTime()) / DAY),
      turning: next.getUTCFullYear() - birth.getUTCFullYear(),
    },
  };
}

const plural = (n: number, word: string) => `${formatNumber(n)} ${word}${n === 1 ? "" : "s"}`;

/** One-line summary used by the published examples. */
export function describeAge(birth: string, on: string) {
  const r = calculateAge(birth, on);
  if (!r.ok) return r.message;
  const next = r.nextBirthday;
  return [
    `${plural(r.years, "year")}, ${plural(r.months, "month")}, ${plural(r.days, "day")}`,
    `${plural(r.totalDays, "day")} in total`,
    next.daysUntil === 0
      ? `Birthday today: turning ${next.turning}`
      : `Next birthday: ${next.weekday} ${next.date} (turning ${next.turning}, in ${plural(next.daysUntil, "day")})`,
  ].join("\n");
}
