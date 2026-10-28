import type { Config } from "@react-router/dev/config";
import { publicPaths } from "./app/lib/pages";

export default {
  // Server-side render by default; public pages are also prerendered to
  // static HTML at build time for fast, crawlable first loads.
  ssr: false,
  // scripts/deploy.sh builds into build-next/ and swaps it in only when it succeeds.
  buildDirectory: process.env.BUILD_DIR || "build",
  prerender: [...publicPaths(), "/sitemap.xml", "/robots.txt", "/ads.txt"],
} satisfies Config;
