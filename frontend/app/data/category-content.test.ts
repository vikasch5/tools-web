import { describe, expect, it } from "vitest";
import { categoryContent } from "./category-content";
import { categories } from "./categories";
import { liveTools, searchableTools } from "./tools";

describe("category content", () => {
  it("exists for every category with live tools, with enough words", () => {
    for (const category of categories.filter((c) => liveTools.some((t) => t.category === c.slug))) {
      const content = categoryContent[category.slug];
      expect(content, category.slug).toBeDefined();
      const words = [...content.about, ...content.faq.map((f) => f.answer)].join(" ").split(/\s+/).length;
      expect(words, category.slug).toBeGreaterThanOrEqual(220);
      expect(content.faq.length, category.slug).toBeGreaterThanOrEqual(3);
    }
  });

  it("only recommends live tools or landing pages", () => {
    for (const [slug, content] of Object.entries(categoryContent))
      for (const item of content.choose) expect(searchableTools.some((t) => t.slug === item.slug), `${slug} → ${item.slug}`).toBe(true);
  });
});
