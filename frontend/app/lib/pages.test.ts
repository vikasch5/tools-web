import { describe, expect, it } from "vitest";
import { isPublicPath, publicPaths } from "./pages";
import { loader as sitemap } from "~/routes/sitemap";
import { loader as robots } from "~/routes/robots";
import { liveTools } from "~/data/tools";

describe("sitemap and robots", () => {
  it("lists every public page once, with absolute URLs", async () => {
    const paths = publicPaths();
    expect(new Set(paths).size).toBe(paths.length);
    expect(paths.length).toBeGreaterThan(liveTools.length);
    const xml = await sitemap().text();
    expect(xml.match(/<loc>/g)).toHaveLength(paths.length);
    expect(xml).toMatch(/<loc>https?:\/\/[^<]+\/developer-tools\/json-formatter<\/loc>/);
  });

  it("points crawlers at the sitemap", async () => {
    expect(await robots().text()).toMatch(/^User-agent: \*\nAllow: \/\n\nSitemap: https?:\/\/.+\/sitemap\.xml\n$/);
  });
});

describe("isPublicPath", () => {
  it("accepts every prerendered page, with or without a trailing slash", () => {
    for (const path of publicPaths()) {
      expect(isPublicPath(path)).toBe(true);
      if (path !== "/") expect(isPublicPath(`${path}/`)).toBe(true);
    }
  });

  it("rejects addresses that were never built", () => {
    expect(isPublicPath("/compress-image-to-50kb")).toBe(false);
    expect(isPublicPath("/image-tools/not-a-tool")).toBe(false);
    expect(isPublicPath("/$")).toBe(false);
  });
});
