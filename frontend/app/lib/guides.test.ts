import { describe, expect, it } from "vitest";
import { guidePath, guides } from "~/data/guides";
import { searchableTools } from "~/data/tools";
import { isPublicPath, noindexPaths, publicPaths, sitemapPaths } from "./pages";
import { loader as sitemap } from "~/routes/sitemap";

describe("guides", () => {
  it("have unique slugs and search-friendly titles and descriptions", () => {
    expect(new Set(guides.map((g) => g.slug)).size).toBe(guides.length);
    for (const g of guides) {
      expect(g.metaTitle.length, g.slug).toBeLessThanOrEqual(60);
      expect(g.description.length, g.slug).toBeGreaterThanOrEqual(120);
      expect(g.description.length, g.slug).toBeLessThanOrEqual(170);
      expect(g.updated, g.slug).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("are substantial, original articles", () => {
    for (const g of guides) {
      const words = [
        ...g.intro,
        ...g.sections.flatMap((s) =>
          s.blocks.flatMap((b) =>
            b.type === "list" ? b.items : b.type === "table" ? b.rows.flat() : [b.text],
          ),
        ),
      ]
        .join(" ")
        .split(/\s+/).length;
      expect(words, g.slug).toBeGreaterThanOrEqual(400);
      expect(g.sections.length, g.slug).toBeGreaterThanOrEqual(3);
    }
  });

  it("link only to tools that exist", () => {
    const slugs = new Set(searchableTools.map((t) => t.slug));
    for (const g of guides) for (const slug of g.tools) expect(slugs.has(slug), `${g.slug} → ${slug}`).toBe(true);
  });

  it("are prerendered and listed in the sitemap", async () => {
    const xml = await sitemap().text();
    for (const g of guides) {
      expect(isPublicPath(guidePath(g))).toBe(true);
      expect(xml).toContain(`${guidePath(g)}</loc>`);
    }
    expect(isPublicPath("/guides")).toBe(true);
    expect(isPublicPath("/guides/not-a-guide")).toBe(false);
  });
});

describe("noindex pages", () => {
  it("are still built but left out of the sitemap", () => {
    const built = new Set(publicPaths());
    const listed = new Set(sitemapPaths());
    for (const path of noindexPaths) {
      expect(built.has(path), path).toBe(true);
      expect(listed.has(path), path).toBe(false);
    }
  });
});
