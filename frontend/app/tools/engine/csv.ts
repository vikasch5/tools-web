import type { EngineOptions, EngineResult } from "./types";

const DELIMITERS = [",", ";", "\t", "|"] as const;

/** Picks the delimiter that occurs most often (outside quotes) on the first line. */
export function detectDelimiter(text: string) {
  const counts = new Map<string, number>(DELIMITERS.map((d) => [d, 0]));
  let quoted = false;
  for (const char of text) {
    if (char === '"') quoted = !quoted;
    else if (!quoted && (char === "\n" || char === "\r")) break;
    else if (!quoted && counts.has(char)) counts.set(char, counts.get(char)! + 1);
  }
  let best = ",";
  for (const [d, n] of counts) if (n > counts.get(best)!) best = d;
  return best;
}

export class CsvError extends Error {
  constructor(
    message: string,
    public line: number,
  ) {
    super(message);
  }
}

/** RFC 4180 parser: quoted fields, doubled quotes, CRLF/LF, newlines in quotes. */
export function parseCsv(text: string, delimiter: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  let line = 1;
  let quoteLine = 1;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else {
        if (char === "\n") line++;
        field += char;
      }
    } else if (char === '"' && field === "") {
      quoted = true;
      quoteLine = line;
    } else if (char === delimiter) {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      line++;
    } else field += char;
  }
  if (quoted)
    throw new CsvError("A quoted field is never closed. Add the missing \".", quoteLine);
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  // Blank lines carry no data.
  return rows.filter((r) => !(r.length === 1 && r[0] === ""));
}

function typed(value: string): unknown {
  const trimmed = value.trim();
  if (/^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?$/.test(trimmed)) {
    const n = Number(trimmed);
    // Keep IDs and long numbers that would lose precision as strings.
    if (Number.isSafeInteger(n) || !Number.isInteger(n)) return n;
  }
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (trimmed === "null") return null;
  return value;
}

/** Unique, non-empty keys: blanks become column_N, repeats get _2, _3… */
function headerKeys(header: string[]) {
  const seen = new Map<string, number>();
  return header.map((raw, i) => {
    const base = raw.trim() || `column_${i + 1}`;
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    return n === 1 ? base : `${base}_${n}`;
  });
}

export function csvToJson(input: string, options: EngineOptions): EngineResult {
  const delimiter =
    options.delimiter === "auto" || options.delimiter === undefined
      ? detectDelimiter(input)
      : options.delimiter === "tab"
        ? "\t"
        : String(options.delimiter);
  let rows: string[][];
  try {
    rows = parseCsv(input.replace(/^﻿/, ""), delimiter);
  } catch (error) {
    const e = error as CsvError;
    return { ok: false, error: { message: e.message, line: e.line } };
  }
  if (rows.length === 0)
    return { ok: false, error: { message: "No rows found." } };

  const convert = options.types !== false
    ? typed
    : (value: string) => value;
  let data: unknown[];
  if (options.header !== false) {
    const keys = headerKeys(rows[0]);
    data = rows.slice(1).map((row) => {
      const record: Record<string, unknown> = {};
      const width = Math.max(keys.length, row.length);
      for (let i = 0; i < width; i++)
        record[keys[i] ?? `column_${i + 1}`] = convert(row[i] ?? "");
      return record;
    });
  } else data = rows.map((row) => row.map(convert));

  const indent = options.indent === "tab" ? "\t" : Number(options.indent ?? 2);
  const name = { ",": "comma", ";": "semicolon", "\t": "tab", "|": "pipe" }[
    delimiter
  ];
  return {
    ok: true,
    output: JSON.stringify(data, null, indent),
    message: `Converted ${data.length.toLocaleString("en")} ${data.length === 1 ? "row" : "rows"}${name ? ` (${name}-separated)` : ""}`,
  };
}
