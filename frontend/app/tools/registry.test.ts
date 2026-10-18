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
import { mergePdfs, splitPdf } from "./engine/pdf";
import { parsePageRanges } from "./engine/page-ranges";

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
});
