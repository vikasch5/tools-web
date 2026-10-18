import type { Config } from "@react-router/dev/config";
import { categories } from "./app/data/categories";
import { liveTools, toolPath } from "./app/data/tools";

export default {
  // Server-side render by default; public pages are also prerendered to
  // static HTML at build time for fast, crawlable first loads.
  ssr: true,
  prerender: [
    "/",
    ...["/tools", "/about", "/help", "/contact", "/privacy", "/terms"],
    ...categories.map((c) => `/${c.slug}`),
    ...liveTools.map(toolPath),
  ],
} satisfies Config;
