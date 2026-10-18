import { describe, expect, it } from "vitest";
import { runEngine } from "./run";
import { locateJsonError } from "./json";
import type { EngineRequest } from "./types";

const run = (
  request: Partial<EngineRequest> & Pick<EngineRequest, "engine" | "input">,
) => runEngine({ action: "format", options: {}, ...request });

describe("json", () => {
  it("formats with the chosen indent", async () => {
    const r = await run({
      engine: "json",
      input: '{"a":1,"b":[1,2]}',
      options: { indent: 4 },
    });
    expect(r).toMatchObject({
      ok: true,
      output: '{\n    "a": 1,\n    "b": [\n        1,\n        2\n    ]\n}',
    });
  });

  it("minifies and sorts keys", async () => {
    const r = await run({
      engine: "json",
      action: "minify",
      input: '{ "b": 1, "a": { "d": 1, "c": 2 } }',
      options: { sortKeys: true },
    });
    expect(r).toMatchObject({ ok: true, output: '{"a":{"c":2,"d":1},"b":1}' });
  });

  it("validates without touching the output", async () => {
    const r = await run({
      engine: "json",
      action: "validate",
      input: "[1, 2]",
    });
    expect(r).toMatchObject({ ok: true, output: null, message: "Valid JSON" });
  });

  it("reports the line and column of a syntax error", async () => {
    const r = await run({ engine: "json", input: '{\n  "a": 1,\n  "b": x\n}' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatchObject({ line: 3, column: 8 });
  });

  it("parses Firefox and older V8 error formats", () => {
    const input = '{\n  "a": }';
    expect(
      locateJsonError(
        input,
        "JSON.parse: unexpected character at line 2 column 8 of the JSON data",
      ),
    ).toEqual({ message: "unexpected character", line: 2, column: 8 });
    expect(
      locateJsonError(input, "Unexpected token } in JSON at position 9"),
    ).toMatchObject({ line: 2, column: 8 });
  });

  it("cleans V8 messages that lack a position", async () => {
    const r = await run({ engine: "json", input: '{"a": tru }' });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.message).not.toMatch(/is not valid JSON/);
      expect(r.error).toMatchObject({ line: 1, column: 10 });
    }
  });

  it("rejects empty input", async () => {
    const r = await run({ engine: "json", input: "   " });
    expect(r).toMatchObject({
      ok: false,
      error: { message: "Input is empty." },
    });
  });
});

describe("prettier", () => {
  it("formats CSS", async () => {
    const r = await run({
      engine: "prettier",
      input: "a{color:red;margin:0}",
      options: { parser: "css" },
    });
    expect(r).toMatchObject({
      ok: true,
      output: "a {\n  color: red;\n  margin: 0;\n}\n",
    });
  });

  it("formats JavaScript with options", async () => {
    const r = await run({
      engine: "prettier",
      input: 'const a = "x"',
      options: { parser: "babel", semi: false, singleQuote: true },
    });
    expect(r).toMatchObject({ ok: true, output: "const a = 'x'\n" });
  });

  it("formats TypeScript and HTML", async () => {
    const ts = await run({
      engine: "prettier",
      input: "let n:number=1",
      options: { parser: "typescript" },
    });
    expect(ts).toMatchObject({ ok: true, output: "let n: number = 1;\n" });
    const html = await run({
      engine: "prettier",
      input: "<ul><li>a</li><li>b</li></ul>",
      options: { parser: "html", printWidth: 20 },
    });
    expect(html.ok).toBe(true);
  });

  it("locates syntax errors", async () => {
    const r = await run({
      engine: "prettier",
      input: "const a = ;",
      options: { parser: "babel" },
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.line).toBe(1);
  });
});

describe("minifiers", () => {
  it("minifies CSS with csso", async () => {
    const input = "/* note */\n.a {\n  color: #ff0000;\n  margin: 0px;\n}\n";
    const r = await run({ engine: "csso", action: "minify", input });
    expect(r).toMatchObject({ ok: true, output: ".a{color:red;margin:0}" });
  });

  it("minifies JavaScript with terser", async () => {
    const input =
      "function add(first, second) {\n  return first + second;\n}\nconsole.log(add(1, 2));";
    const r = await run({ engine: "terser", action: "minify", input });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.output!.length).toBeLessThan(input.length * 0.75);
  });

  it("locates terser syntax errors", async () => {
    const r = await run({
      engine: "terser",
      action: "minify",
      input: "let a = ;\n",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.line).toBe(1);
  });
});
