// Relative imports: react-router.config.ts loads this file too.
import { categories } from "../data/categories";
import { liveTools, toolPath, toolVariants } from "../data/tools";
import { guidePath, guides } from "../data/guides";

export const staticPaths = ["/tools", "/about", "/help", "/contact", "/privacy", "/terms", "/guides"];

/**
 * Pages that stay usable but are kept out of search results and the sitemap:
 * KB targets that overlap closely with a neighbouring size page, so search
 * engines see one strong page per need instead of many near-copies.
 */
export const noindexPaths = new Set([
  "/image-tools/compress-image-to-10kb",
  "/image-tools/compress-image-to-30kb",
  "/image-tools/compress-image-to-500kb",
  "/pdf-tools/compress-pdf-to-500kb",
  "/pdf-tools/compress-pdf-to-1mb",
]);

/** Every public, indexable page: prerendered at build time and listed in the sitemap. */
export function publicPaths() {
  const categoriesWithLiveTools = categories.filter((category) =>
    liveTools.some((tool) => tool.category === category.slug),
  );

  return [
    "/",
    ...staticPaths,
    ...categoriesWithLiveTools.map((category) => `/${category.slug}`),
    ...liveTools.map(toolPath),
    ...toolVariants.map(toolPath),
    ...guides.map(guidePath),
  ];
}

/** Public pages that search engines should index: the sitemap. */
export function sitemapPaths() {
  return publicPaths().filter((path) => !noindexPaths.has(path));
}

let publicPathSet: Set<string> | undefined;

/** Whether a URL path is one of the prerendered public pages. */
export function isPublicPath(pathname: string) {
  publicPathSet ??= new Set(publicPaths());
  return publicPathSet.has(pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname);
}
