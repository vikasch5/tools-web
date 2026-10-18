import type { Config } from "@react-router/dev/config";
import { publicPaths } from "./app/lib/pages";

export default {
  // Server-side render by default; public pages are also prerendered to
  // static HTML at build time for fast, crawlable first loads.
  ssr: true,
  prerender: [...publicPaths(), "/sitemap.xml", "/robots.txt"],
} satisfies Config;
