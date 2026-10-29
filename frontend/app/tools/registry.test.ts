import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { toolDefinitions } from "./registry";
import { runEngine } from "./engine/run";
import { tools, toolVariants } from "~/data/tools";
import { targetBytes } from "./engine/image-target";
import { describePreset, formPresets } from "./engine/form-photo";
import type { TextToolDefinition, WidgetId } from "./types";
import { statsSummary, textStats } from "./engine/text-stats";
import { diffLines, diffToText } from "./engine/diff";
import { describeUuid } from "./engine/uuid";
import { gradientDeclaration, parseGradient } from "./engine/gradient";
import { calculatePercent, parseNumber, type PercentMode } from "./engine/percent";
import {
  limitLongEdge,
  mmToPx,
  passportPresets,
  resizeDimensions,
  sheetLayout,
} from "./engine/image-geometry";
import { mergePdfs, rotatePdf, splitPdf } from "./engine/pdf";
import { parsePageRanges } from "./engine/page-ranges";
import { describeConversion, targetFormats } from "./engine/image-format";
import { pageImageName, pageImageSize } from "./engine/pdf-image";
import { cases, convertCase } from "./engine/case";
import { passwordEntropy, strengthLabel } from "./engine/password";
import { describeQr, wifiPayload, type QrLevel } from "./engine/qr";
import { generateLorem } from "./engine/lorem";
import { describeAge } from "./engine/age";
import { describeBmi } from "./engine/bmi";
import { describeLoan } from "./engine/loan";
import { describeTimestamp } from "./engine/timestamp";
import { describeHash } from "./engine/hash";
import { describeColor } from "./engine/color";
import { describeLayout, type ImagesPdfOptions } from "./engine/images-pdf";
import { createRequire } from "node:module";
import { arrangePdf, pagesAfterDeleting, planPageNumbers, addWatermark, watermarkPlacements, type NumberFormat } from "./engine/pdf-pages";
import { describeLevel, type CompressLevel } from "./engine/pdf-compress";
import { protectPdf, setQpdfWasmLocation, unlockPdf } from "./engine/qpdf";
import { describeOutline, describeWordLayout, textToWordPages, type TextItem } from "./engine/pdf-word";

setQpdfWasmLocation(createRequire(import.meta.url).resolve("@neslinesli93/qpdf-wasm/dist/qpdf.wasm"));

/** Pages whose width is 100 + their 1-based number, so their order can be read back. */
async function numberedPdf(pages: number) {
  const doc = await PDFDocument.create();
  for (let i = 1; i <= pages; i++) doc.addPage([100 + i, 200]);
  return { name: "report.pdf", data: await doc.save() };
}
const pageNumbersOf = async (data: Uint8Array) =>
  (await PDFDocument.load(data)).getPages().map((p) => {
    const turn = p.getRotation().angle;
    return `${Math.round(p.getWidth()) - 100}${turn ? ` (${turn}°)` : ""}`;
  });
const tiny = Uint8Array.from(
  atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="),
  (c) => c.charCodeAt(0),
);

const defaults = (def: TextToolDefinition) => ({
  ...def.engineOptions,
  ...Object.fromEntries(def.options.map((o) => [o.id, o.default])),
});

const size = (text: string) => {
  const [, w, h] = text.match(/(\d+) × (\d+) px/)!;
  return { width: Number(w), height: Number(h) };
};

async function blankPdf(pages: number) {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pages; i++) doc.addPage([200, 200]);
  return doc.save();
}

/**
 * How each non-text tool turns a published example into its result, using
 * the same functions the tool's panel calls.
 */
const widgetExamples: Record<WidgetId, (input: string, title: string) => string | Promise<string>> = {
  "word-counter": (input) => statsSummary(textStats(input)),
  "diff-checker": (input) => {
    const [a, b] = input.split("\n---\n");
    return diffToText(diffLines(a, b));
  },
  "uuid-generator": (input) => describeUuid(input),
  "gradient-generator": (input) => {
    const g = parseGradient(input);
    if ("error" in g) throw new Error(g.error);
    return gradientDeclaration(g);
  },
  "percentage-calculator": (input) => {
    const patterns: [RegExp, PercentMode, (m: string[]) => [string, string]][] = [
      [/^What is (.+)% of (.+)\?$/, "of", (m) => [m[1], m[2]]],
      [/^(.+) is what percent of (.+)\?$/, "is-what", (m) => [m[1], m[2]]],
      [/^Percentage change from (.+) to (.+)$/, "change", (m) => [m[1], m[2]]],
      [/^(Increase|Decrease) (.+) by (.+)%$/, "adjust", (m) => [`${m[1] === "Decrease" ? "-" : ""}${m[3]}`, m[2]]],
    ];
    for (const [re, mode, args] of patterns) {
      const m = input.match(re);
      if (!m) continue;
      const [a, b] = args(m);
      const r = calculatePercent(mode, parseNumber(a), parseNumber(b));
      if (!r.ok) throw new Error(r.message);
      return `${r.text}\n${r.detail}`;
    }
    throw new Error(`Unrecognised example: ${input}`);
  },
  "compress-image": (input, title) => {
    const target = input.match(/(\d+) KB$/);
    if (target) return `at most ${targetBytes(Number(target[1])).toLocaleString("en-US")} bytes`;
    const max = Number(title.match(/Max size (\d+) px/)![1]);
    const out = limitLongEdge(size(input), max);
    return `${out.width} × ${out.height} px`;
  },
  "resize-image": (input) => {
    const source = size(input);
    const width = input.match(/width (\d+) px/);
    const percent = input.match(/→ (\d+)%/);
    const out = resizeDimensions(
      source,
      percent
        ? { mode: "percent", percent: Number(percent[1]) }
        : { mode: "pixels", width: Number(width![1]), keepRatio: true },
    );
    return `${out.width} × ${out.height} px`;
  },
  "passport-photo": (input) => {
    const preset = passportPresets.find((p) => p.label === input)!;
    const sheet = sheetLayout(preset, { width: 152.4, height: 101.6 });
    return `${mmToPx(preset.widthMm)} × ${mmToPx(preset.heightMm)} px at 300 DPI; ${sheet.positions.length} photos fit on a 6 × 4 in sheet`;
  },
  "rotate-pdf": async (input) => {
    const turns = input.replace("turn ", "").split(", ").map(Number);
    const r = await rotatePdf({ name: "report.pdf", data: await blankPdf(turns.length) }, turns);
    return `${r.name} with page rotations ${r.rotations.map((d) => `${d}°`).join(", ")}`;
  },
  "pdf-to-image": (input) => {
    const name = input.match(/^(.+), page (\d+) of (\d+), as (\w+)$/);
    if (name) return pageImageName(name[1], Number(name[2]), Number(name[3]), name[4].toLowerCase());
    const [, w, h, dpi] = input.match(/\(([\d.]+) × ([\d.]+) pt\) at (\d+) DPI/)!;
    const out = pageImageSize(Number(w), Number(h), Number(dpi));
    return `${out.width} × ${out.height} px`;
  },
  "case-converter": (input) => {
    const at = input.indexOf(": ");
    const id = cases.find((c) => c.label === input.slice(0, at))!.id;
    return convertCase(input.slice(at + 2), id);
  },
  "password-generator": (input) => {
    const length = Number(input.match(/^(\d+) characters/)![1]);
    const all = input.includes("all four sets");
    const options = {
      length,
      upper: all,
      lower: true,
      digits: true,
      symbols: all,
      avoidAmbiguous: input.includes("look-alikes"),
    };
    const bits = passwordEntropy(options);
    return `${strengthLabel(bits)} · ${bits} bits`;
  },
  "qr-code-generator": (input) => {
    const wifi = input.match(/^Wi-Fi: network (.+), password (.+), (WPA|WEP)$/);
    if (wifi) return wifiPayload(wifi[1], wifi[2], wifi[3] as "WPA");
    const [, text, level] = input.match(/^(.+) at level ([LMQH])$/)!;
    return describeQr(text, level as QrLevel);
  },
  "lorem-ipsum": (input) =>
    generateLorem({ unit: "words", count: Number(input.split(" ")[0]), startWithLorem: true, html: false }),
  "image-to-pdf": (input) => {
    const [, w, h, page, orientation, margin] = input.match(/^(\d+) × (\d+) px on (A4|Letter|image size), (\w+), (\w+) margin$/)!;
    const pageSize = ({ A4: "a4", Letter: "letter", "image size": "fit" } as const)[page as "A4"];
    return describeLayout({ width: Number(w), height: Number(h) }, { pageSize, orientation, margin } as ImagesPdfOptions);
  },
  "age-calculator": (input) => {
    const [, birth, on] = input.match(/^Born (\S+), on (\S+)$/)!;
    return describeAge(birth, on);
  },
  "bmi-calculator": (input) => {
    const metric = input.match(/^([\d.]+) kg, ([\d.]+) cm$/);
    if (metric) return describeBmi({ system: "metric", weightKg: Number(metric[1]), heightCm: Number(metric[2]) });
    const [, lb, ft, inch] = input.match(/^([\d.]+) lb, (\d+) ft (\d+) in$/)!;
    return describeBmi({ system: "imperial", weightLb: Number(lb), heightFt: Number(ft), heightIn: Number(inch) });
  },
  "loan-calculator": (input) => {
    const [, amount, rate, term, unit] = input.match(/^([\d,]+) at ([\d.]+)% for (\d+) (years|months)$/)!;
    return describeLoan({
      principal: parseNumber(amount),
      annualRate: Number(rate),
      months: Number(term) * (unit === "years" ? 12 : 1),
    });
  },
  "timestamp-converter": (input) => describeTimestamp(input),
  "hash-generator": (input) => describeHash(input),
  "color-converter": (input) => describeColor(input),
  "image-converter": (input) => {
    const [, name, label] = input.match(/^(.+) → (\w+)$/)!;
    return describeConversion(name, targetFormats.find((f) => f.label === label)!.value);
  },
  "organize-pdf": async (input) => {
    const plan = input
      .replace("order ", "")
      .split(", ")
      .map((part) => {
        const [, n, turn] = part.match(/^(\d+)(?: \(turn (-?\d+)\))?$/)!;
        return { index: Number(n) - 1, turn: Number(turn ?? 0) };
      });
    const r = await arrangePdf(await numberedPdf(4), plan);
    return `${r.name} with pages ${(await pageNumbersOf(r.data)).join(", ")}`;
  },
  "delete-pdf-pages": async (input) => {
    const [, ranges, total] = input.match(/^delete (.+) from (\d+) pages$/)!;
    const keep = pagesAfterDeleting(ranges, Number(total));
    const r = await arrangePdf(await numberedPdf(Number(total)), keep.map((index) => ({ index, turn: 0 })), "pages-removed");
    return `${r.name} with pages ${(await pageNumbersOf(r.data)).join(", ")}`;
  },
  "add-page-numbers": (input) => {
    const [, total, label, pages, start] = input.match(/^(\d+) pages, format (.+), pages (.+), start (\d+)$/)!;
    const format = ({ "1": "n", "Page 1": "page-n", "1 of 12": "n-of-total", "Page 1 of 12": "page-n-of-total" } as Record<string, NumberFormat>)[label];
    const plan = planPageNumbers(Number(total), { format, pages: pages === "all" ? "" : pages, start: Number(start) });
    const first = plan[0];
    const last = plan[plan.length - 1];
    return `${plan.length} numbered: page ${first.index + 1} shows “${first.label}”, page ${last.index + 1} shows “${last.label}”`;
  },
  "watermark-pdf": async (input) => {
    const pages = input.match(/^pages (.+) of (\d+)$/);
    if (pages) {
      const r = await addWatermark(
        await numberedPdf(Number(pages[2])),
        { data: tiny, type: "image/png", width: 1, height: 1 },
        { scale: 0.5, opacity: 0.25, angle: 45, layout: "center", pages: pages[1] },
      );
      return `${r.marked} pages watermarked`;
    }
    const [, w, h] = input.match(/^a (\d+) × (\d+) pt mark, flat, repeated on A4$/)!;
    const copies = watermarkPlacements({ width: 595.28, height: 841.89 }, { width: Number(w), height: Number(h) }, 0, "tile");
    return `${copies.length} copies on the page`;
  },
  "compress-pdf": (input) => {
    const level = ({ Lossless: "low", Recommended: "medium", Strong: "high" } as Record<string, CompressLevel>)[input];
    return describeLevel(level);
  },
  "protect-pdf": async (input) => {
    const r = await protectPdf(await numberedPdf(1), "abcd");
    await expect(PDFDocument.load(r.data)).rejects.toThrow(/encrypted/i);
    expect(input).toContain("4 characters or more");
    return `${r.name}, encrypted with AES-256`;
  },
  "unlock-pdf": async (input) => {
    const locked = await protectPdf(await numberedPdf(1), "abcd");
    const r = await unlockPdf({ name: input.split(" ")[0], data: locked.data }, "abcd");
    expect((await PDFDocument.load(r.data)).isEncrypted).toBe(false);
    return `${r.name}, opens without a password`;
  },
  "pdf-to-word": (input) => {
    let y = 720;
    const items: TextItem[] = [];
    for (const line of input.split("\n")) {
      if (!line) {
        y -= 20;
        continue;
      }
      const sized = line.match(/^\[(\d+)pt\] (.+)$/);
      const size = sized ? Number(sized[1]) : 11;
      const text = sized ? sized[2] : line;
      items.push({ text, x: 72, y, width: text.length * size * 0.5, size, bold: false, italic: false });
      y -= size * 1.3;
    }
    return describeOutline(textToWordPages([{ width: 612, height: 792, items }]));
  },
  "form-photo": (input) => describePreset(formPresets.find((p) => p.id === input)!),
  "word-to-pdf": (input) => describeWordLayout(!input.includes("no saved page layout")),
  "merge-pdf": async (input) => {
    const files = await Promise.all(
      input.split("\n").map(async (line) => {
        const [, name, pages] = line.match(/^(.+) \((\d+) pages\)$/)!;
        return { name, data: await blankPdf(Number(pages)) };
      }),
    );
    const r = await mergePdfs(files);
    return `merged.pdf (${r.pageCount} pages)`;
  },
  "split-pdf": async (input, title) => {
    const pages = Number(title.match(/(\d+)-page/)?.[1] ?? 12);
    const file = { name: "report.pdf", data: await blankPdf(pages) };
    const mode = title.startsWith("Extract") ? "extract" : "ranges";
    const r = await splitPdf(file, mode, input);
    const groups = parsePageRanges(input, pages);
    return mode === "extract"
      ? `${r.name} with pages ${groups.flat().map((p) => p + 1).join(", ")}`
      : `${r.name} with ${groups.map((g) => `report-pages-${g[0] + 1}-${g[g.length - 1] + 1}.pdf`).join(", ")}`;
  },
};

describe("tool definitions", () => {
  it.each(toolDefinitions.map((d) => [d.slug, d] as const))(
    "%s: published examples match real output",
    async (_slug, def) => {
      expect(def.examples.length, def.slug).toBeGreaterThan(0);
      for (const example of def.examples) {
        if (example.output.startsWith("Error")) continue;
        if (def.workspace === "text") {
          const result = await runEngine({
            engine: def.engine,
            action: def.actions[0].id,
            input: example.input,
            options: defaults(def),
          });
          expect(result.ok, example.title).toBe(true);
          if (result.ok) expect(result.output?.trim(), example.title).toBe(example.output);
        } else {
          expect(await widgetExamples[def.workspace](example.input, example.title), example.title).toBe(
            example.output,
          );
        }
      }
    },
  );

  it.each(
    toolDefinitions
      .filter((d): d is TextToolDefinition => d.workspace === "text")
      .map((d) => [d.slug, d] as const),
  )("%s: sample input processes without errors", async (_slug, def) => {
    const result = await runEngine({
      engine: def.engine,
      action: def.actions[0].id,
      input: def.sample,
      options: defaults(def),
    });
    expect(result).toMatchObject({ ok: true });
  });

  it("every working tool is listed in the public registry", () => {
    for (const def of toolDefinitions) {
      const variant = toolVariants.find((v) => v.slug === def.slug);
      if (variant) {
        // A landing page opens its parent tool's widget with a preset.
        const parent = toolDefinitions.find((d) => d.slug === variant.variantOf);
        expect(variant.category, def.slug).toBe(def.category);
        expect(parent?.workspace, def.slug).toBe(def.workspace);
        expect(def.workspace !== "text" && def.preset, def.slug).toBeTruthy();
        continue;
      }
      const entry = tools.find((t) => t.slug === def.slug);
      expect(entry, def.slug).toMatchObject({ category: def.category, status: "live" });
    }
    for (const v of toolVariants) expect(toolDefinitions.some((d) => d.slug === v.slug), v.slug).toBe(true);
  });

  it("related links point to live tools and meta lengths are sensible", () => {
    const slugs = new Set(toolDefinitions.map((d) => d.slug));
    for (const def of toolDefinitions) {
      for (const slug of def.related) expect(slugs.has(slug), `${def.slug} → ${slug}`).toBe(true);
      expect(def.related, def.slug).not.toContain(def.slug);
      expect(def.metaTitle.length, def.slug).toBeLessThanOrEqual(65);
      expect(def.description.length, def.slug).toBeLessThanOrEqual(165);
    }
  });

  it("every tool page has enough original explanatory content", () => {
    for (const def of toolDefinitions) {
      const words = def.overview.join(" ").split(/\s+/).length;
      expect(def.overview.length, def.slug).toBeGreaterThanOrEqual(2);
      expect(words, def.slug).toBeGreaterThanOrEqual(80);
      expect(def.faq.length, def.slug).toBeGreaterThanOrEqual(3);
    }
  });
});
