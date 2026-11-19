import { describe, expect, it } from "vitest";
import { loanPages, manualEmi } from "./loan-pages";

describe("loan landing pages", () => {
  it("work the EMI formula by hand to the calculator's figure", () => {
    const car = manualEmi("8,00,000", "9", 5);
    expect(car.emi).toBe(16606.68);
    expect(car.steps[0]).toBe("Monthly rate r = 9% ÷ 12 ÷ 100 = 0.0075.");
    expect(car.steps.at(-1)).toContain("= ₹16,606.68.");
    expect(manualEmi("5,00,000", "12", 3).emi).toBe(16607.15);
    expect(manualEmi("50,00,000", "8.5", 20).emi).toBe(43391.16);
  });

  it("lead each page's FAQ with the manual calculation and link the other loan pages", () => {
    for (const page of loanPages) {
      expect(page.faq[0].question).toMatch(/^How do I calculate .+ EMI manually\?$/);
      expect(page.related).not.toContain(page.slug);
    }
  });
});

describe("related links", () => {
  it("resolve to a tool card, including landing pages", async () => {
    const { searchableTools } = await import("~/data/tools");
    const { toolDefinitions } = await import("../registry");
    for (const def of toolDefinitions)
      for (const slug of def.related) expect(searchableTools.some((t) => t.slug === slug), `${def.slug} → ${slug}`).toBe(true);
  });
});
