import { describe, expect, it } from "vitest";
import { toolDefinitions } from "./registry";
import { runEngine } from "./engine/run";
import { tools } from "~/data/tools";
import type { ToolDefinition } from "./types";

const defaults = (def: ToolDefinition) => ({
  ...def.engineOptions,
  ...Object.fromEntries(def.options.map((o) => [o.id, o.default])),
});

describe("tool definitions", () => {
  it.each(toolDefinitions.map((d) => [d.slug, d] as const))(
    "%s: published examples match real engine output",
    async (_slug, def) => {
      for (const example of def.examples) {
        if (example.output.startsWith("Error")) continue;
        const result = await runEngine({
          engine: def.engine,
          action: def.actions[0].id,
          input: example.input,
          options: defaults(def),
        });
        expect(result.ok).toBe(true);
        if (result.ok) expect(result.output?.trim()).toBe(example.output);
      }
    },
  );

  it.each(toolDefinitions.map((d) => [d.slug, d] as const))(
    "%s: sample input processes without errors",
    async (_slug, def) => {
      const result = await runEngine({
        engine: def.engine,
        action: def.actions[0].id,
        input: def.sample,
        options: defaults(def),
      });
      expect(result).toMatchObject({ ok: true });
    },
  );

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
      expect(def.metaTitle.length, def.slug).toBeLessThanOrEqual(65);
      expect(def.description.length, def.slug).toBeLessThanOrEqual(165);
    }
  });
});
