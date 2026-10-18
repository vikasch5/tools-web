import { describe, expect, it } from "vitest";
import { runYaml } from "./yaml";

describe("runYaml", () => {
  it("converts YAML with anchors to JSON", async () => {
    const yaml = `base: &b\n  retries: 3\nprod:\n  <<: *b\n  host: example.com\nempty: ~\n`;
    const result = await runYaml("to-json", yaml, { indent: "2" });
    expect(result.ok && JSON.parse(result.output!)).toEqual({
      base: { retries: 3 },
      prod: { retries: 3, host: "example.com" },
      empty: null,
    });
  });

  it("turns several documents into an array", async () => {
    const result = await runYaml("to-json", `a: 1\n---\na: 2\n`, {});
    expect(result).toMatchObject({ ok: true, message: "Converted 2 documents to a JSON array" });
  });

  it("reports YAML errors with a location", async () => {
    expect(await runYaml("to-json", `a:\n\t- b\n`, {})).toEqual({
      ok: false,
      error: { message: "Tabs are not allowed as indentation", line: 2, column: 1 },
    });
  });

  it("converts JSON to YAML and reports JSON errors", async () => {
    expect(await runYaml("to-yaml", `{"a":[1,"two"],"b":{"c":true}}`, { indent: "2" })).toMatchObject({
      ok: true,
      output: `a:\n  - 1\n  - two\nb:\n  c: true\n`,
    });
    const bad = await runYaml("to-yaml", `{"a":}`, {});
    expect(bad.ok).toBe(false);
  });

  it("stops alias bombs", async () => {
    const bomb = `a: &a ["x","x","x","x","x","x","x","x","x","x"]\nb: &b [*a,*a,*a,*a,*a,*a,*a,*a,*a,*a]\nc: &c [*b,*b,*b,*b,*b,*b,*b,*b,*b,*b]\nd: [*c,*c,*c,*c,*c,*c,*c,*c,*c,*c]\n`;
    await expect(runYaml("to-json", bomb, {})).rejects.toThrow(/alias/i);
  });
});
