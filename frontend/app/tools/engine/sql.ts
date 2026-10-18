import type { EngineOptions, EngineResult } from "./types";

/** Formats SQL with sql-formatter, loading only the chosen dialect's rules. */
export async function runSql(
  input: string,
  options: EngineOptions,
): Promise<EngineResult> {
  const lib = await import("sql-formatter");
  const dialects = {
    sql: lib.sql,
    mysql: lib.mysql,
    postgresql: lib.postgresql,
    tsql: lib.transactsql,
    sqlite: lib.sqlite,
  };
  const dialect =
    dialects[String(options.dialect) as keyof typeof dialects] ?? lib.sql;
  try {
    const output = lib.formatDialect(input, {
      dialect,
      keywordCase:
        options.keywordCase === "lower"
          ? "lower"
          : options.keywordCase === "preserve"
            ? "preserve"
            : "upper",
      useTabs: options.indent === "tab",
      tabWidth: options.indent === "tab" ? 2 : Number(options.indent ?? 2),
    });
    return { ok: true, output: `${output}\n`, message: "Formatted" };
  } catch (error) {
    return { ok: false, error: sqlError(error) };
  }
}

/** sql-formatter errors carry "at line L column C" and a long grammar dump. */
function sqlError(error: unknown) {
  const first = String((error as Error)?.message ?? error).split("\n")[0];
  const at = first.match(/ at line (\d+) column (\d+)/);
  let message = first
    .replace(/ at line \d+ column \d+\.?$/, "")
    .replace(/^Parse error: /, "");
  if (/«EOF»/.test(message))
    message = "The query ended unexpectedly. Check for a missing closing bracket or quote.";
  else if (/^Parse error at token: (.+)$/.test(message))
    message = message.replace(/^Parse error at token: (.+)$/, "Unexpected $1");
  else message = `${message}.`.replace(/\.\.$/, ".");
  return at ? { message, line: +at[1], column: +at[2] } : { message };
}
