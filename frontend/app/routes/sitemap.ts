import { site } from "~/config/site";
import { publicPaths } from "~/lib/pages";

export function loader() {
  const urls = publicPaths()
    .map((path) => `  <url><loc>${new URL(path, site.url).href}</loc></url>`)
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
