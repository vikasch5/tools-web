import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { toolDefinitions } from "./registry";
import { runEngine } from "./engine/run";
import { tools } from "~/data/tools";
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
      const entry = tools.find((t) => t.slug === def.slug);
      expect(entry, def.slug).toMatchObject({ category: def.category, status: "live" });
    }
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
