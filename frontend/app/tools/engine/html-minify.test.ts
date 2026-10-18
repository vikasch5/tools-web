import { describe, expect, it } from "vitest";
import { minifyHtml } from "./html-minify";

const run = async (input: string, options = {}) => {
  const result = await minifyHtml(input, options);
  if (!result.ok) throw new Error(result.error.message);
  return result;
};

describe("minifyHtml", () => {
  it("keeps pre content and quoted attribute values", async () => {
    const { output } = await run(`<div>\n  <pre>  a\n   b </pre>\n  <input data-x="a = b"   disabled />\n</div>`);
    expect(output).toBe(`<div><pre>  a\n   b </pre><input data-x="a = b" disabled/></div>`);
  });

  it("keeps conditional comments and can keep all comments", async () => {
    expect((await run(`<!--[if IE]><p>Old</p><![endif]--><!-- x -->`)).output).toBe(
      `<!--[if IE]><p>Old</p><![endif]-->`,
    );
    expect((await run(`<p>a</p><!-- x -->`, { removeComments: false })).output).toBe(`<p>a</p><!-- x -->`);
  });

  it("compacts JSON scripts and leaves broken scripts with a warning", async () => {
    expect((await run(`<script type="application/ld+json">\n{ "a": 1 }\n</script>`)).output).toBe(
      `<script type="application/ld+json">{"a":1}</script>`,
    );
    const broken = await run(`<script>if (</script>`);
    expect(broken.output).toBe(`<script>if (</script>`);
    expect(broken.warnings).toHaveLength(1);
  });

  it("does not rename top-level script names", async () => {
    const { output } = await run(`<script>\n  const greeting = "hi";\n</script>`);
    expect(output).toContain("greeting");
  });
});
