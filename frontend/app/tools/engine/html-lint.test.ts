import { describe, expect, it } from "vitest";
import { fixHtml, lintHtml } from "./html-lint";
import { runEngine } from "./run";

describe("html lint", () => {
  it("flags a space after < (reported case)", () => {
    const [warning] = lintHtml("<p>VIkas<     /p>");
    expect(warning).toMatchObject({ line: 1, column: 9 });
    expect(warning.message).toContain("Did you mean </p>?");
  });

  it("flags elements that are never closed", () => {
    expect(lintHtml("<section>\n  <div>text\n</section>")).toEqual([
      expect.objectContaining({
        line: 2,
        column: 3,
        message: expect.stringContaining("<div>"),
      }),
    ]);
    expect(lintHtml("<main>")).toHaveLength(1);
  });

  it("accepts valid markup, void elements, optional end tags and raw text", () => {
    const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>a < b</title>
<style>a > b { color: red }</style></head>
<body><!-- <div> --><ul><li>One<li>Two</ul><p>Para<img src="x.png" alt="1 > 0"><br/>
<script>if (a < b && c) { document.write("</div>") }</script></body></html>`;
    expect(lintHtml(html)).toEqual([]);
  });

  it("repairs the reported case by default and lists the fix", async () => {
    const result = await runEngine({
      engine: "prettier",
      action: "format",
      input: "<p>VIkas<     /p>",
      options: { parser: "html" },
    });
    expect(result).toMatchObject({
      ok: true,
      output: "<p>VIkas</p>\n",
      fixes: [expect.objectContaining({ line: 1, column: 9 })],
    });
    if (result.ok) expect(result.warnings).toBeUndefined();
  });

  it("only repairs real element names", () => {
    expect(fixHtml('if a < b and < div class="x">ok< /div>')).toMatchObject({
      fixed: 'if a < b and <div class="x">ok</div>',
      fixes: [expect.anything(), expect.anything()],
    });
    expect(fixHtml("1 < foo > 0").fixes).toEqual([]);
  });

  it("warns instead of fixing when auto-fix is off", async () => {
    const result = await runEngine({
      engine: "prettier",
      action: "format",
      input: "<p>VIkas<     /p>",
      options: { parser: "html", autoFix: false },
    });
    expect(result).toMatchObject({
      ok: true,
      warnings: [expect.objectContaining({ line: 1, column: 9 })],
    });
  });

  it("shortens parser errors for stray closing tags", async () => {
    const result = await runEngine({
      engine: "prettier",
      action: "format",
      input: "<div><span>a</div>",
      options: { parser: "html" },
    });
    expect(result).toMatchObject({
      ok: false,
      error: { line: 1, column: 13, message: 'Unexpected closing tag "div".' },
    });
  });
});
