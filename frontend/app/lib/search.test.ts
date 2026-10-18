import { describe, expect, it } from "vitest";
import { searchTools } from "./search";
import { tools } from "~/data/tools";

const slugs = (q: string) => searchTools(q, tools).map((t) => t.slug);

describe("searchTools", () => {
  it("ranks name matches first", () => {
    expect(slugs("merge pdf")[0]).toBe("merge-pdf");
    expect(slugs("json")[0]).toBe("json-formatter");
    expect(slugs("CSS minifier")[0]).toBe("css-minifier");
  });

  it("finds tools by synonyms and partial words", () => {
    expect(slugs("guid")).toContain("uuid-generator");
    expect(slugs("jpg")).toEqual(expect.arrayContaining(["compress-image", "resize-image"]));
    expect(slugs("discou")).toContain("percentage-calculator");
    expect(slugs("Pásspört")[0]).toBe("passport-photo");
  });

  it("requires every word and returns everything for an empty query", () => {
    expect(slugs("pdf banana")).toEqual([]);
    expect(searchTools("  ", tools)).toHaveLength(tools.length);
  });
});
