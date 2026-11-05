// Relative imports: react-router.config.ts loads this file too.
import { categories } from "../data/categories";
import { liveTools, toolPath, toolVariants } from "../data/tools";

export const staticPaths = ["/tools", "/about", "/help", "/contact", "/privacy", "/terms"];

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
  ];
}

let publicPathSet: Set<string> | undefined;

/** Whether a URL path is one of the prerendered public pages. */
export function isPublicPath(pathname: string) {
  publicPathSet ??= new Set(publicPaths());
  return publicPathSet.has(pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname);
}
