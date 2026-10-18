import { describe, expect, it } from "vitest";
import { runUrl } from "./url";

describe("runUrl", () => {
  it("encodes in each mode", () => {
    const text = "a b&c=d/é(1)";
    expect(runUrl("encode", text, { mode: "component" })).toMatchObject({ output: "a%20b%26c%3Dd%2F%C3%A9%281%29" });
    expect(runUrl("encode", text, { mode: "form" })).toMatchObject({ output: "a+b%26c%3Dd%2F%C3%A9%281%29" });
    expect(runUrl("encode", "https://x.com/a b?q=é", { mode: "uri" })).toMatchObject({ output: "https://x.com/a%20b?q=%C3%A9" });
  });

  it("decodes and reports bad escapes with their position", () => {
    expect(runUrl("decode", "a+b%20c", { mode: "form" })).toMatchObject({ output: "a b c" });
    expect(runUrl("decode", "a+b", { mode: "component" })).toMatchObject({ output: "a+b" });
    expect(runUrl("decode", "ok%2", {})).toMatchObject({ ok: false, error: { line: 1, column: 3 } });
    expect(runUrl("decode", "x%C3%28", {})).toMatchObject({ ok: false, error: { message: "These escapes are not valid UTF-8.", column: 2 } });
  });

  it("parses a URL into parts", () => {
    const result = runUrl("parse", "https://user:pw@shop.example.com:8080/caf%C3%A9?tag=a&tag=b&q=red+shoes#top", {});
    expect(result.ok && JSON.parse(result.output!)).toEqual({
      protocol: "https",
      username: "user",
      password: "(hidden)",
      host: "shop.example.com",
      port: "8080",
      path: "/café",
      query: { tag: ["a", "b"], q: "red shoes" },
      fragment: "top",
    });
    expect(runUrl("parse", "example.com", {})).toMatchObject({ ok: false });
  });
});
