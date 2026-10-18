import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { runEngine } from "./run";
import type { EngineRequest } from "./types";
import { decodeBase64 } from "./base64";
import { decodeJwt } from "./jwt";
import { detectDelimiter, parseCsv } from "./csv";
import { generateUuids, inspectUuid, uuidV4, uuidV7 } from "./uuid";
import { calculatePercent, formatNumber, parseNumber } from "./percent";
import { gradientCss, parseGradient } from "./gradient";
import { mergePdfs, splitPdf } from "./pdf";
import { parsePageRanges } from "./page-ranges";
import { crc32, createZip } from "./zip";
import { coverCrop, resizeDimensions, sheetLayout } from "./image-geometry";
import { textStats } from "./text-stats";

const run = (request: Partial<EngineRequest> & Pick<EngineRequest, "engine" | "input">) =>
  runEngine({ action: "format", options: {}, ...request });

describe("sql", () => {
  it("formats per dialect and keyword case", async () => {
    const r = await run({
      engine: "sql",
      input: "SELECT `id` FROM t",
      options: { dialect: "mysql", keywordCase: "lower" },
    });
    expect(r).toMatchObject({ ok: true, output: "select\n  `id`\nfrom\n  t\n" });
  });

  it("reports where parsing failed", async () => {
    const r = await run({ engine: "sql", input: "select (a\nfrom t" });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.line).toBe(2);
      expect(r.error.message).toMatch(/ended unexpectedly/);
    }
  });
});

describe("base64", () => {
  it("round-trips UTF-8 and accepts URL-safe input without padding", async () => {
    const enc = await run({ engine: "base64", action: "encode", input: "ü?>", options: { urlSafe: true } });
    expect(enc).toMatchObject({ ok: true, output: "w7w_Pg" });
    expect(decodeBase64("w7w_Pg")).toBe("ü?>");
    expect(decodeBase64("w7w/\nPg==")).toBe("ü?>");
  });

  it("explains invalid and binary input", async () => {
    const bad = await run({ engine: "base64", action: "decode", input: "abc$" });
    expect(bad).toMatchObject({ ok: false, error: { message: expect.stringContaining("position 4") } });
    expect(() => decodeBase64("/w==")).toThrow(/not UTF-8 text/);
  });
});

describe("jwt", () => {
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const token = (payload: object, header: object = { alg: "HS256" }) => `${b64(header)}.${b64(payload)}.sig`;

  it("decodes and flags expiry and unsigned tokens", () => {
    const r = decodeJwt(`Bearer ${token({ exp: 100 }, { alg: "none" })}`, 200_000);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(JSON.parse(r.output!)).toMatchObject({ header: { alg: "none" }, payload: { exp: 100 } });
      expect(r.warnings?.map((w) => w.message).join(" ")).toMatch(/expired.*unsigned/);
    }
  });

  it("rejects malformed tokens", () => {
    expect(decodeJwt("a.b")).toMatchObject({ ok: false });
    expect(decodeJwt("a.b.c.d.e")).toMatchObject({ ok: false, error: { message: expect.stringMatching(/JWE/) } });
    expect(decodeJwt("bm90IGpzb24.e30.x")).toMatchObject({ ok: false, error: { message: expect.stringMatching(/header/) } });
  });
});

describe("csv", () => {
  it("parses quotes, embedded newlines and CRLF", () => {
    expect(parseCsv('a,"b ""x""\nc"\r\n1,2\r\n', ",")).toEqual([
      ["a", 'b "x"\nc'],
      ["1", "2"],
    ]);
    expect(detectDelimiter("a;b;c\n1;2;3")).toBe(";");
    expect(detectDelimiter("a\tb")).toBe("\t");
  });

  it("names blank and duplicate headers and keeps risky numbers as text", async () => {
    const r = await run({ engine: "csv", action: "convert", input: "id,,id\n007,9007199254740993,1.5" });
    expect(r.ok).toBe(true);
    if (r.ok)
      expect(JSON.parse(r.output!)).toEqual([{ id: "007", column_2: "9007199254740993", id_2: 1.5 }]);
  });

  it("points at an unclosed quote", async () => {
    const r = await run({ engine: "csv", action: "convert", input: 'a,b\n1,"oops\n2,3' });
    expect(r).toMatchObject({ ok: false, error: { line: 2 } });
  });
});

describe("uuid", () => {
  it("sets version and variant bits", () => {
    expect(uuidV4()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    const v7 = uuidV7(1_700_000_000_000);
    expect(inspectUuid(v7)).toMatchObject({ version: 7, timestamp: new Date(1_700_000_000_000).toISOString() });
  });

  it("generates sorted v7 lists in the chosen format", () => {
    const list = generateUuids(5, "v7", { uppercase: true, hyphens: false, braces: true });
    expect(list).toHaveLength(5);
    expect([...list].sort()).toEqual(list);
    expect(list[0]).toMatch(/^\{[0-9A-F]{32}\}$/);
    expect(generateUuids(5000, "v4")).toHaveLength(1000);
  });

  it("reads v1 timestamps and rejects junk", () => {
    expect(inspectUuid("c232ab00-9414-11ec-b3c8-9f6bdeced846")).toMatchObject({
      version: 1,
      timestamp: "2022-02-22T19:22:22.000Z",
    });
    expect(inspectUuid("not-a-uuid")).toMatchObject({ valid: false });
  });
});

describe("percent", () => {
  it("handles float noise, zero and parsing", () => {
    expect(formatNumber(0.1 + 0.2)).toBe("0.3");
    expect(calculatePercent("change", 0, 5)).toMatchObject({ ok: false });
    expect(calculatePercent("change", 80, 60)).toMatchObject({ ok: true, text: "-25%" });
    expect(parseNumber("1,250.5")).toBe(1250.5);
    expect(parseNumber("12abc")).toBeNaN();
  });
});

describe("gradient", () => {
  it("round-trips its own output and reads angles in turns", () => {
    const g = parseGradient("conic-gradient(from 0.25turn, #000 10%, #ffffff80 90%)");
    expect("error" in g).toBe(false);
    if (!("error" in g)) {
      expect(g.angle).toBe(90);
      expect(g.stops[1]).toEqual({ color: "#ffffff", opacity: 50, position: 90 });
      expect(parseGradient(gradientCss(g))).toEqual(g);
    }
    expect(parseGradient("red")).toHaveProperty("error");
  });
});

describe("pdf", () => {
  const make = async (pages: number) => {
    const doc = await PDFDocument.create();
    for (let i = 0; i < pages; i++) doc.addPage([100 + i, 100]);
    return { name: "doc.pdf", data: await doc.save() };
  };

  it("parses page ranges", () => {
    expect(parsePageRanges("1-2, 4, 6-", 7)).toEqual([[0, 1], [3], [5, 6]]);
    expect(() => parsePageRanges("9", 3)).toThrow(/has 3 pages/);
    expect(() => parsePageRanges("3-1", 3)).toThrow(/backwards/);
    expect(() => parsePageRanges("x", 3)).toThrow(/not a page/);
  });

  it("merges and splits, keeping page order", async () => {
    const merged = await mergePdfs([await make(2), await make(3)]);
    expect(merged.pageCount).toBe(5);
    const extract = await splitPdf({ name: "a.pdf", data: merged.data }, "extract", "5, 1");
    const doc = await PDFDocument.load(extract.data);
    expect(doc.getPages().map((p) => p.getWidth())).toEqual([102, 100]);
    const every = await splitPdf({ name: "a.pdf", data: merged.data }, "every", "");
    expect(every).toMatchObject({ name: "a-split.zip", files: 5, type: "application/zip" });
  });

  it("explains unreadable files", async () => {
    await expect(mergePdfs([{ name: "x.pdf", data: new Uint8Array([1, 2, 3]) }, await make(1)])).rejects.toThrow(
      /could not be read/,
    );
  });
});

describe("zip", () => {
  it("writes a valid stored archive", () => {
    expect(crc32(new TextEncoder().encode("123456789"))).toBe(0xcbf43926);
    const zip = createZip([{ name: "a.txt", data: new TextEncoder().encode("hi") }]);
    const view = new DataView(zip.buffer);
    expect(view.getUint32(0, true)).toBe(0x04034b50);
    expect(view.getUint32(zip.length - 22, true)).toBe(0x06054b50);
    expect(view.getUint16(zip.length - 12, true)).toBe(1); // entries in the archive
  });
});

describe("image geometry", () => {
  it("resizes within a box and by percent", () => {
    const src = { width: 4000, height: 3000 };
    expect(resizeDimensions(src, { mode: "pixels", width: 1000, height: 1000, keepRatio: true })).toEqual({ width: 1000, height: 750 });
    expect(resizeDimensions(src, { mode: "pixels", height: 300, keepRatio: true })).toEqual({ width: 400, height: 300 });
    expect(resizeDimensions(src, { mode: "pixels", width: 10, height: 10, keepRatio: false })).toEqual({ width: 10, height: 10 });
    expect(resizeDimensions(src, { mode: "percent", percent: 10 })).toEqual({ width: 400, height: 300 });
  });

  it("crops to the aspect ratio inside the image", () => {
    const crop = coverCrop({ width: 4000, height: 3000 }, 35 / 45, 2, 1, -1);
    expect(crop.width / crop.height).toBeCloseTo(35 / 45);
    expect(crop.y).toBe(0);
    expect(crop.x + crop.width).toBeCloseTo(4000);
  });

  it("lays out a print sheet that fits", () => {
    const layout = sheetLayout({ widthMm: 50, heightMm: 70 }, { width: 152.4, height: 101.6 });
    expect(layout.positions).toHaveLength(3);
    for (const p of layout.positions) {
      expect(p.x + layout.photo.width).toBeLessThanOrEqual(layout.sheet.width);
      expect(p.y + layout.photo.height).toBeLessThanOrEqual(layout.sheet.height);
    }
  });
});

describe("text stats", () => {
  it("counts graphemes, sentences and keywords", () => {
    const s = textStats("Café 👋🏽 rocks. Café again!\n\nCafé.");
    expect(s.words).toBe(5);
    expect(s.characters).toBe(32);
    expect(s.sentences).toBe(3);
    expect(s.paragraphs).toBe(2);
    expect(s.keywords[0]).toEqual({ word: "café", count: 3 });
    expect(textStats("")).toMatchObject({ words: 0, lines: 0, sentences: 0 });
  });
});
