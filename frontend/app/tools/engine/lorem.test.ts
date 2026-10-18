import { describe, expect, it } from "vitest";
import { generateLorem, seededRandom } from "./lorem";

describe("generateLorem", () => {
  it("makes the requested number of words, opening with Lorem ipsum", () => {
    const out = generateLorem({ unit: "words", count: 12, startWithLorem: true, html: false }, seededRandom(1));
    expect(out.split(" ")).toHaveLength(12);
    expect(out.startsWith("Lorem ipsum dolor sit amet consectetur")).toBe(true);
    expect(generateLorem({ unit: "words", count: 3, startWithLorem: true, html: false })).toBe("Lorem ipsum dolor.");
  });

  it("makes paragraphs, as HTML when asked", () => {
    const out = generateLorem({ unit: "paragraphs", count: 3, startWithLorem: false, html: true }, seededRandom(2));
    expect(out.split("\n")).toHaveLength(3);
    expect(out).toMatch(/^<p>[A-Z]/);
    expect(out).not.toContain("Lorem ipsum dolor sit amet");
  });

  it("is repeatable with a seed", () => {
    const opts = { unit: "sentences" as const, count: 4, startWithLorem: true, html: false };
    expect(generateLorem(opts, seededRandom(9))).toBe(generateLorem(opts, seededRandom(9)));
  });
});
