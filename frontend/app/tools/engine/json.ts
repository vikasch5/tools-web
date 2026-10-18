import { findJsonErrorOffset } from "./json-scan";
import type {
  EngineAction,
  EngineError,
  EngineOptions,
  EngineResult,
} from "./types";

/** Converts a 0-based character offset into 1-based line/column. */
export function offsetToLineColumn(text: string, offset: number) {
  const before = text.slice(0, offset);
  const line = before.split("\n").length;
  const column = offset - before.lastIndexOf("\n");
  return { line, column };
}

/**
 * Browsers word JSON errors differently: V8 reports "position N" and newer
 * versions add "(line L column C)"; Firefox says "at line L column C".
 */
export function locateJsonError(input: string, message: string): EngineError {
  const text = cleanMessage(message);
  const lineCol = message.match(/line (\d+) column (\d+)/i);
  if (lineCol) {
    return { message: text, line: +lineCol[1], column: +lineCol[2] };
  }
  const position = message.match(/position (\d+)/i);
  if (position) {
    return { message: text, ...offsetToLineColumn(input, +position[1]) };
  }
  const offset = findJsonErrorOffset(input);
  if (offset >= 0) {
    return { message: text, ...offsetToLineColumn(input, offset) };
  }
  return { message: text };
}

function cleanMessage(message: string) {
  return message
    .replace(/^JSON\.parse: /, "")
    .replace(/, (\.\.\.)?"[^]*" is not valid JSON$/, "")
    .replace(/ in JSON at position \d+.*$/, "")
    .replace(/ at line \d+ column \d+ of the JSON data$/, "")
    .trim();
}

function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return Object.fromEntries(
      Object.keys(record)
        .sort()
        .map((key) => [key, sortKeysDeep(record[key])]),
    );
  }
  return value;
}

function indentFor(options: EngineOptions): string | number {
  return options.indent === "tab" ? "\t" : Number(options.indent ?? 2);
}

export function runJson(
  action: EngineAction,
  input: string,
  options: EngineOptions,
): EngineResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch (error) {
    return {
      ok: false,
      error: locateJsonError(input, (error as Error).message),
    };
  }
  if (options.sortKeys) parsed = sortKeysDeep(parsed);

  switch (action) {
    case "validate":
      return { ok: true, output: null, message: "Valid JSON" };
    case "minify":
      return { ok: true, output: JSON.stringify(parsed), message: "Minified" };
    case "format":
      return {
        ok: true,
        output: JSON.stringify(parsed, null, indentFor(options)),
        message: "Formatted",
      };
  }
}
