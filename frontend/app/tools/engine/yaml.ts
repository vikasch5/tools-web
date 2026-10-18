import { locateJsonError } from "./json";
import type { EngineAction, EngineError, EngineOptions, EngineResult } from "./types";

type YamlIssue = { message: string; linePos?: [{ line: number; col: number }, ...unknown[]] };

const toEngineError = (issue: YamlIssue): EngineError => ({
  // The library appends a code frame after the first line; the panes show the location.
  message: issue.message.split("\n")[0].replace(/ at line \d+, column \d+:?$/, ""),
  ...(issue.linePos ? { line: issue.linePos[0].line, column: issue.linePos[0].col } : {}),
});

/**
 * YAML 1.2 to JSON and back. Anchors and aliases are expanded (with the
 * library's alias limit, which stops "billion laughs" input); several
 * documents separated by "---" become a JSON array.
 */
export async function runYaml(
  action: EngineAction,
  input: string,
  options: EngineOptions,
): Promise<EngineResult> {
  const YAML = await import("yaml");
  const indent = Number(options.indent ?? 2);

  if (action === "to-yaml") {
    let value: unknown;
    try {
      value = JSON.parse(input);
    } catch (error) {
      return { ok: false, error: locateJsonError(input, String((error as Error).message)) };
    }
    return { ok: true, output: YAML.stringify(value, { indent, lineWidth: 0 }), message: "Converted to YAML" };
  }

  const docs = YAML.parseAllDocuments(input, { prettyErrors: true, merge: true });
  const list = Array.isArray(docs) ? docs : [docs];
  const warnings: EngineError[] = [];
  const values: unknown[] = [];
  for (const doc of list) {
    if (doc.errors.length) return { ok: false, error: toEngineError(doc.errors[0]) };
    warnings.push(...doc.warnings.map(toEngineError));
    values.push(doc.toJS({ maxAliasCount: 100 }));
  }
  const value = values.length === 1 ? values[0] : values;
  return {
    ok: true,
    output: JSON.stringify(value, null, indent) ?? "null",
    message: values.length > 1 ? `Converted ${values.length} documents to a JSON array` : "Converted to JSON",
    ...(warnings.length ? { warnings } : {}),
  };
}
