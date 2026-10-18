// Relative imports: react-router.config.ts loads this file too.
import { categories } from "../data/categories";
import { liveTools, toolPath } from "../data/tools";

export const staticPaths = ["/tools", "/about", "/help", "/contact", "/privacy", "/terms"];

/** Every public, indexable page: prerendered at build time and listed in the sitemap. */
export function publicPaths() {
  return ["/", ...staticPaths, ...categories.map((c) => `/${c.slug}`), ...liveTools.map(toolPath)];
}
