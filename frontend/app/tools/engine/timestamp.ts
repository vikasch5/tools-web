export type TimestampUnit = "seconds" | "milliseconds" | "microseconds" | "nanoseconds";

export type TimestampResult =
  | {
      ok: true;
      /** How the input was read, e.g. "Unix time in seconds" or "Date text". */
      readAs: string;
      ms: number;
      seconds: number;
      iso: string;
      utc: string;
      local: string;
      relative: string;
    }
  | { ok: false; message: string };

/**
 * Picks the unit of a bare number by its size: up to 11 digits are seconds
 * (dates up to the year 5138), up to 14 milliseconds, up to 17 microseconds,
 * and longer values nanoseconds, matching what APIs and databases emit.
 */
export function guessUnit(value: number): TimestampUnit {
  const abs = Math.abs(value);
  if (abs < 1e11) return "seconds";
  if (abs < 1e14) return "milliseconds";
  if (abs < 1e17) return "microseconds";
  return "nanoseconds";
}

const divisor: Record<TimestampUnit, number> = { seconds: 1e-3, milliseconds: 1, microseconds: 1e3, nanoseconds: 1e6 };

/** "3 days ago", "in 2 hours", "just now". */
export function relativeTime(ms: number, now: number) {
  const diff = ms - now;
  const abs = Math.abs(diff);
  if (abs < 45_000) return "just now";
  const steps: [number, Intl.RelativeTimeFormatUnit][] = [
    [60_000, "minute"],
    [3_600_000, "hour"],
    [86_400_000, "day"],
    [2_629_746_000, "month"],
    [31_556_952_000, "year"],
  ];
  let [size, unit] = steps[0];
  for (const step of steps) if (abs >= step[0] * 0.95) [size, unit] = step;
  return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(Math.round(diff / size), unit);
}

/**
 * Converts a Unix timestamp (any common unit) or a date string into every
 * common representation. timeZone controls the "local" line.
 */
export function convertTimestamp(
  input: string,
  { unit = "auto", now = Date.now(), timeZone }: { unit?: TimestampUnit | "auto"; now?: number; timeZone?: string } = {},
): TimestampResult {
  const text = input.trim();
  if (!text) return { ok: false, message: "Enter a Unix timestamp or a date." };

  let ms: number;
  let readAs: string;
  if (/^[-+]?\d+(\.\d+)?$/.test(text)) {
    const value = Number(text);
    const u = unit === "auto" ? guessUnit(value) : unit;
    ms = value / divisor[u];
    readAs = `Unix time in ${u}`;
  } else {
    ms = Date.parse(text);
    readAs = "Date text";
    if (Number.isNaN(ms))
      return { ok: false, message: "That is not a timestamp or a date this tool can read. Try 1700000000 or 2026-10-18T12:00:00Z." };
  }
  if (!Number.isFinite(ms) || Math.abs(ms) > 8.64e15) return { ok: false, message: "That date is outside the range JavaScript can represent." };

  const date = new Date(ms);
  const local = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "full",
    timeStyle: "long",
    timeZone,
  }).format(date);
  return {
    ok: true,
    readAs,
    ms: Math.round(ms),
    seconds: Math.floor(ms / 1000),
    iso: date.toISOString(),
    utc: date.toUTCString(),
    local,
    relative: relativeTime(ms, now),
  };
}

/** Summary used by the published examples (time-zone and clock independent). */
export function describeTimestamp(input: string) {
  const r = convertTimestamp(input, { timeZone: "UTC" });
  if (!r.ok) return r.message;
  return `${r.readAs}\nISO 8601: ${r.iso}\nUnix seconds: ${r.seconds}\nUnix milliseconds: ${r.ms}`;
}
