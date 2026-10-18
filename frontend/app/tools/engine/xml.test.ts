import { describe, expect, it } from "vitest";
import { runXml } from "./xml";

const format = (input: string) => runXml("format", input, { indent: "2" });

describe("runXml", () => {
  it("formats nested elements and keeps text-only elements inline", () => {
    expect(format(`<?xml version="1.0"?><a x='1'><b>hi</b><c/><!-- note --></a>`)).toEqual({
      ok: true,
      output: `<?xml version="1.0"?>\n<a x='1'>\n  <b>hi</b>\n  <c/>\n  <!-- note -->\n</a>`,
      message: "Formatted",
    });
  });

  it("minifies and drops comments by default", () => {
    const result = runXml("minify", `<a>\n  <!-- x -->\n  <b> keep </b>\n</a>`, {});
    expect(result).toMatchObject({ ok: true, output: `<a><b> keep </b></a>` });
  });

  it.each([
    [`<a><b></a>`, "Expected </b> but found </a>.", 1, 7],
    [`<a>\n<b x=1/></a>`, "Attribute “x” needs a quoted value.", 2, 4],
    [`<a>Tom & Jerry</a>`, "“&” must be escaped as &amp;.", 1, 8],
    [`<a/><b/>`, "A document can only have one root element.", 1, 5],
    [`<a x="1" x="2"/>`, "Attribute “x” is repeated.", 1, 10],
    [`<a>`, "<a> is never closed.", 1, 1],
  ])("reports %s", (input, message, line, column) => {
    expect(runXml("validate", input, {})).toEqual({ ok: false, error: { message, line, column } });
  });

  it("accepts entities, CDATA and a DOCTYPE with an internal subset", () => {
    const input = `<!DOCTYPE note [<!ENTITY a "b">]><note>&amp; &#169; &a;<![CDATA[<raw>]]></note>`;
    expect(runXml("validate", input, {})).toMatchObject({ ok: true });
  });
});
