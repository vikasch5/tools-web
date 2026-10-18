import type { MetaDescriptor } from "react-router";
import { site } from "~/config/site";

export const absoluteUrl = (path: string) =>
  new URL(path, site.url).toString();

/**
 * Standard per-route meta: title, description, canonical, Open Graph and
 * Twitter tags, plus optional JSON-LD blocks.
 */
export function buildMeta({
  title,
  description,
  path,
  jsonLd = [],
}: {
  title: string;
  description: string;
  path: string;
  jsonLd?: object[];
}): MetaDescriptor[] {
  const url = absoluteUrl(path);
  return [
    { title },
    { name: "description", content: description },
    { tagName: "link", rel: "canonical", href: url },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: site.name },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: url },
    { name: "twitter:card", content: "summary" },
    ...jsonLd.map((data) => ({ "script:ld+json": data })),
  ];
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
