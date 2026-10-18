import { describe, expect, it } from "vitest";
import { crackTime, generatePassword, passwordEntropy, secureRandomInt, strengthLabel } from "./password";

const all = { length: 16, upper: true, lower: true, digits: true, symbols: true, avoidAmbiguous: false };

describe("passwords", () => {
  it("includes every chosen set and has the right length", () => {
    for (let i = 0; i < 50; i++) {
      const p = generatePassword({ ...all, length: 8 });
      expect(p).toHaveLength(8);
      expect(p).toMatch(/[A-Z]/);
      expect(p).toMatch(/[a-z]/);
      expect(p).toMatch(/\d/);
      expect(p).toMatch(/[^A-Za-z0-9]/);
    }
  });

  it("can avoid ambiguous characters", () => {
    const p = generatePassword({ ...all, length: 400, avoidAmbiguous: true });
    expect(p).not.toMatch(/[Il1O0o]/);
  });

  it("rejects an empty selection", () => {
    expect(() => generatePassword({ ...all, upper: false, lower: false, digits: false, symbols: false })).toThrow();
  });

  it("estimates strength", () => {
    expect(passwordEntropy(all)).toBe(Math.round(16 * Math.log2(87)));
    expect(strengthLabel(passwordEntropy({ ...all, length: 6, symbols: false, upper: false }))).toBe("Weak");
    expect(crackTime(30)).toBe("less than a minute");
  });

  it("draws uniform integers in range", () => {
    for (let i = 0; i < 200; i++) expect(secureRandomInt(7)).toBeLessThan(7);
  });
});
