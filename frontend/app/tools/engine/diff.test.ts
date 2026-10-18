import { describe, expect, it } from "vitest";
import { diffLines, diffToText } from "./diff";

/** Applies the script to `a` and checks it reproduces `b`. */
function check(a: string[], b: string[]) {
  const r = diffLines(a.join("\n"), b.join("\n"));
  const rebuiltB = r.lines.filter((l) => l.type !== "remove").map((l) => l.text);
  const rebuiltA = r.lines.filter((l) => l.type !== "add").map((l) => l.text);
  expect(rebuiltB).toEqual(b);
  expect(rebuiltA).toEqual(a);
  return r;
}

describe("diffLines", () => {
  it("finds a minimal edit", () => {
    const r = check(["a", "b", "c", "d"], ["a", "x", "c", "d", "e"]);
    expect(r).toMatchObject({ added: 2, removed: 1, identical: false });
    expect(diffToText(r)).toBe("  a\n- b\n+ x\n  c\n  d\n+ e");
  });

  it("handles empty sides and random inputs", () => {
    check([], ["a", "b"]);
    check(["a", "b"], []);
    let seed = 7;
    const rand = () => (seed = (seed * 16807) % 2147483647) % 4;
    for (let t = 0; t < 200; t++) {
      const a = Array.from({ length: rand() * 3 }, () => String(rand()));
      const b = Array.from({ length: rand() * 3 }, () => String(rand()));
      check(a, b);
    }
  });

  it("can ignore whitespace and case", () => {
    const r = diffLines("Hello  world\nfoo", "hello world\nFOO ", {
      ignoreWhitespace: true,
      ignoreCase: true,
    });
    expect(r.identical).toBe(true);
  });

  it("numbers lines on both sides", () => {
    const r = diffLines("a\nb", "b\nc");
    expect(r.lines).toEqual([
      { type: "remove", text: "a", a: 1 },
      { type: "equal", text: "b", a: 2, b: 1 },
      { type: "add", text: "c", b: 2 },
    ]);
  });
});
