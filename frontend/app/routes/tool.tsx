import { data } from "react-router";
import { ShieldCheck } from "lucide-react";
import type { Route } from "./+types/tool";
import { Container } from "~/components/layout/Container";
import { Breadcrumbs } from "~/components/layout/Breadcrumbs";
import { AdSlot } from "~/components/layout/AdSlot";
import { ToolWorkspace } from "~/components/tool/ToolWorkspace";
import { ToolWidget } from "~/components/tool/widgets";
import { RelatedTools, ToolContent } from "~/components/tool/ToolContent";
import { getToolDefinition } from "~/tools/registry";
import { categories, categoryPath } from "~/data/categories";
import { tools, toolPath } from "~/data/tools";
import { breadcrumbJsonLd, buildMeta, absoluteUrl } from "~/lib/seo";
import { site } from "~/config/site";

// schema.org application categories for the WebApplication JSON-LD.
const applicationCategories: Record<string, string> = {
  "developer-tools": "DeveloperApplication",
  "image-tools": "MultimediaApplication",
  "web-design-tools": "DesignApplication",
};

export function loader({ params }: Route.LoaderArgs) {
  const tool = getToolDefinition(params.category, params.tool);
  const category = categories.find((c) => c.slug === params.category);
  if (!tool || !category) throw data(null, { status: 404 });

  const related = tool.related
    .map((slug) => tools.find((t) => t.slug === slug))
    .filter((t) => t !== undefined);

  return {
    tool,
    category: { name: category.name, slug: category.slug },
    related,
  };
}

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData) return [{ title: `Page not found – ${site.name}` }];
  const { tool, category } = loaderData;
  const path = toolPath(tool);
  return buildMeta({
    title: tool.metaTitle,
    description: tool.description,
    path,
    jsonLd: [
      breadcrumbJsonLd([
        { name: "Home", path: "/" },
        { name: category.name, path: categoryPath(category.slug) },
        { name: tool.name, path },
      ]),
      {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: tool.name,
        description: tool.description,
        url: absoluteUrl(path),
        applicationCategory:
          applicationCategories[category.slug] ?? "UtilitiesApplication",
        operatingSystem: "Any (runs in the browser)",
        isAccessibleForFree: true,
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: tool.faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      },
    ],
  });
}

export default function ToolPage({ loaderData }: Route.ComponentProps) {
  const { tool, category, related } = loaderData;

  return (
    <article>
      <header className="border-b border-border">
        <Container className="py-4 sm:py-5">
          <Breadcrumbs
            items={[
              { name: "Home", path: "/" },
              { name: category.name, path: categoryPath(category.slug) },
              { name: tool.name, path: toolPath(tool) },
            ]}
          />
          <div className="mt-3 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
            <div className="min-w-0">
              <h1 className="font-display text-[clamp(1.5rem,1.2rem+1vw,2rem)] leading-tight font-bold tracking-tight text-fg">
                {tool.name}
              </h1>
              <p className="mt-1 max-w-3xl text-[0.9375rem] leading-relaxed text-fg-muted">{tool.description}</p>
            </div>
            <p className="inline-flex shrink-0 items-center gap-1.5 text-xs text-fg-subtle">
              <ShieldCheck aria-hidden size={14} strokeWidth={1.75} />
              Runs in your browser. Nothing is uploaded.
            </p>
          </div>
        </Container>
      </header>

      <Container className="py-4 sm:py-5">
        {tool.workspace === "text" ? (
          <ToolWorkspace
            tool={{
              slug: tool.slug,
              engine: tool.engine,
              actions: tool.actions,
              options: tool.options,
              engineOptions: tool.engineOptions,
              language: tool.language,
              accept: tool.accept,
              downloadExtension: tool.downloadExtension,
              sample: tool.sample,
              placeholder: tool.placeholder,
              tree: tool.tree,
            }}
          />
        ) : (
          <ToolWidget id={tool.workspace} />
        )}
      </Container>

      {/* Ads sit below the workspace with clear space around them, never
          beside tool controls, to avoid accidental clicks. */}
      <Container className="space-y-16 pt-8 pb-20 sm:pt-12">
        <AdSlot />
        <ToolContent tool={tool} />
        <AdSlot />
        <RelatedTools tools={related} />
      </Container>
    </article>
  );
}
