import type {
  EngineError,
  EngineOptions,
  EngineRequest,
  EngineResult,
} from "./types";
import { runJson } from "./json";
import { fixHtml, lintHtml } from "./html-lint";
import { runSql } from "./sql";
import { runBase64 } from "./base64";
import { decodeJwt } from "./jwt";
import { csvToJson } from "./csv";

/**
 * Single entry point for all processing. Heavy libraries are imported on
 * demand so each tool only downloads the engine it uses. Runs inside the
 * engine worker in the browser, and directly in unit tests.
 */
export async function runEngine({
  engine,
  action,
  input,
  options,
}: EngineRequest): Promise<EngineResult> {
  if (!input.trim()) {
    return { ok: false, error: { message: "Input is empty." } };
  }

  try {
    switch (engine) {
      case "json":
        return runJson(action, input, options);
      case "prettier":
        return await runPrettier(input, options);
      case "terser":
        return await runTerser(input, options);
      case "csso":
        return await runCsso(input, options);
      case "sql":
        return await runSql(input, options);
      case "base64":
        return runBase64(action, input, options);
      case "jwt":
        return decodeJwt(input);
      case "csv":
        return csvToJson(input, options);
    }
  } catch (error) {
    return { ok: false, error: toEngineError(error) };
  }
}

async function runPrettier(
  input: string,
  options: EngineOptions,
): Promise<EngineResult> {
  const prettier = await import("prettier/standalone");
  const parser = String(options.parser ?? "babel");
  const plugins = await loadPrettierPlugins(parser);
  // HTML: repair tags broken by a space after "<" unless the user opted out.
  const { fixed: source, fixes } =
    parser === "html" && options.autoFix !== false
      ? fixHtml(input)
      : { fixed: input, fixes: [] };
  const output = await prettier.format(source, {
    parser,
    plugins,
    useTabs: options.indent === "tab",
    tabWidth: options.indent === "tab" ? 2 : Number(options.indent ?? 2),
    printWidth: Number(options.printWidth ?? 80),
    semi: options.semi !== false,
    singleQuote: options.singleQuote === true,
  });
  const warnings = parser === "html" ? lintHtml(source) : [];
  return {
    ok: true,
    output,
    message: "Formatted",
    ...(warnings.length ? { warnings } : {}),
    ...(fixes.length ? { fixes } : {}),
  };
}

async function loadPrettierPlugins(parser: string) {
  switch (parser) {
    case "css":
    case "scss":
    case "less":
      return [await import("prettier/plugins/postcss")];
    case "html":
      // Embedded <style> and <script> blocks need the CSS and JS plugins too.
      return Promise.all([
        import("prettier/plugins/html"),
        import("prettier/plugins/postcss"),
        import("prettier/plugins/babel"),
        import("prettier/plugins/estree"),
      ]);
    case "typescript":
      return Promise.all([
        import("prettier/plugins/typescript"),
        import("prettier/plugins/estree"),
      ]);
    default:
      return Promise.all([
        import("prettier/plugins/babel"),
        import("prettier/plugins/estree"),
      ]);
  }
}

async function runTerser(
  input: string,
  options: EngineOptions,
): Promise<EngineResult> {
  const { minify } = await import("terser");
  const result = await minify(input, {
    compress: options.compress !== false,
    mangle: options.mangle !== false,
    format: { comments: options.keepLicense ? "some" : false },
  });
  return { ok: true, output: result.code ?? "", message: "Minified" };
}

async function runCsso(
  input: string,
  options: EngineOptions,
): Promise<EngineResult> {
  const { minify } = await import("csso/dist/csso.esm");
  const result = minify(input, {
    restructure: options.restructure !== false,
    comments: options.keepLicense ? "exclamation" : false,
  });
  return { ok: true, output: result.css, message: "Minified" };
}

/** Normalises Prettier (loc.start), Terser (line/col) and generic errors. */
export function toEngineError(error: unknown): EngineError {
  const e = error as {
    message?: string;
    loc?: { start?: { line?: number; column?: number } };
    line?: number;
    col?: number;
  };
  const raw = String(e?.message ?? error);
  // Prettier appends a code frame after the first line; keep the summary.
  const message = raw
    .split("\n")[0]
    .replace(/\s*\(\d+:\d+\)$/, "")
    // Drop parser boilerplate after the first sentence of HTML errors.
    .replace(/(Unexpected closing tag "[^"]+"\.).*$/, "$1");
  if (e?.loc?.start?.line) {
    return { message, line: e.loc.start.line, column: e.loc.start.column };
  }
  if (typeof e?.line === "number") {
    return {
      message,
      line: e.line,
      column: typeof e.col === "number" ? e.col + 1 : undefined,
    };
  }
  return { message };
}
