import { Link, data } from "react-router";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import type { Route } from "./+types/category";
import { Container } from "~/components/layout/Container";
import { Breadcrumbs } from "~/components/layout/Breadcrumbs";
import { AdSlot } from "~/components/layout/AdSlot";
import { CategoryIcon } from "~/components/ui/CategoryIcon";
import { categories, categoryPath } from "~/data/categories";
import { searchableTools, toolPath, toolVariants, toolsInCategory } from "~/data/tools";
import { categoryContent } from "~/data/category-content";
import { breadcrumbJsonLd, buildMeta } from "~/lib/seo";
import { site } from "~/config/site";
import { isPublicPath, noindexPaths } from "~/lib/pages";

export function loader({ params }: Route.LoaderArgs) {
  const category = categories.find((c) => c.slug === params.category);
  if (!category) throw data(null, { status: 404 });
  const list = toolsInCategory(category.slug);
  return {
    category: {
      slug: category.slug,
      name: category.name,
      code: category.code,
      description: category.description,
    },
    live: list.filter((t) => t.status === "live"),
    soon: list.filter((t) => t.status === "soon"),
    // Landing pages (Home Loan EMI, Compress Image to 20 KB…) that search engines index.
    pages: toolVariants
      .filter((v) => v.category === category.slug && !noindexPaths.has(toolPath(v)))
      .map(({ slug, name, category, description }) => ({ slug, name, category, description })),
    content: (() => {
      const c = categoryContent[category.slug];
      if (!c) return undefined;
      const choose = c.choose.map(({ job, slug }) => {
        const tool = searchableTools.find((t) => t.slug === slug)!;
        return { job, name: tool.name, path: toolPath(tool) };
      });
      return { ...c, choose };
    })(),
  };
}

/**
 * The site is static: only prerendered pages have loader data. An address
 * that is not one of them (a mistyped link, say) shows "Page not found"
 * instead of failing to fetch data that was never built.
 */
export async function clientLoader({ request, serverLoader }: Route.ClientLoaderArgs) {
  if (!isPublicPath(new URL(request.url).pathname)) throw data(null, { status: 404 });
  return serverLoader();
}

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData) return [{ title: `Page not found – ${site.name}` }, { name: "robots", content: "noindex" }];
  const { category, live, content } = loaderData;
  const path = categoryPath(category.slug);
  const faqJsonLd = content && {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: content.faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
  return [
    ...buildMeta({
      title: `Free Online ${category.name} | ${site.name}`,
      description: category.description,
      path,
      jsonLd: [breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: category.name, path }]), ...(faqJsonLd ? [faqJsonLd] : [])],
    }),
    // Keep categories without working tools out of the index (no thin pages).
    ...(live.length === 0 ? [{ name: "robots", content: "noindex" }] : []),
  ];
}

export default function CategoryPage({ loaderData }: Route.ComponentProps) {
  const { category, live, soon, pages, content } = loaderData;
  const icon = categories.find((c) => c.slug === category.slug);

  return (
    <>
      <header className="border-b border-border">
        <Container className="pt-6 pb-10 sm:pt-8 sm:pb-14">
          <Breadcrumbs
            items={[
              { name: "Home", path: "/" },
              { name: category.name, path: categoryPath(category.slug) },
            ]}
          />
          <div className="mt-8 flex items-center gap-4">
            {icon && <CategoryIcon category={icon} size="lg" />}
            <h1 className="text-h1 font-bold text-fg">{category.name}</h1>
          </div>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-fg-muted">{category.description}</p>
        </Container>
      </header>

      <Container className="py-12 sm:py-16">
        {live.length > 0 ? (
          <section aria-labelledby="live-title">
            <h2 id="live-title" className="font-sans text-sm font-medium text-fg-muted">
              {live.length} {live.length === 1 ? "tool" : "tools"}
            </h2>
            <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {live.map((tool) => (
                <li key={tool.slug}>
                  <Link
                    to={toolPath(tool)}
                    className="group flex h-full items-start justify-between gap-4 rounded-xl border border-border bg-surface p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong/60 hover:shadow-md sm:p-6"
                  >
                    <span>
                      <span className="block font-display text-lg font-semibold tracking-tight text-fg">
                        {tool.name}
                      </span>
                      <span className="mt-1 block text-sm leading-relaxed text-fg-muted">{tool.description}</span>
                    </span>
                    <ArrowUpRight
                      aria-hidden
                      size={18}
                      strokeWidth={1.5}
                      className="shrink-0 text-fg-subtle transition-colors group-hover:text-accent-fg"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <p className="max-w-xl text-fg-muted">
            Tools in this category are being built. In the meantime, try the{" "}
            <Link to={categoryPath("developer-tools")} className="font-medium text-fg underline underline-offset-4 hover:decoration-accent">
              developer tools
            </Link>
            .
          </p>
        )}

        {soon.length > 0 && (
          <section aria-labelledby="soon-title" className="mt-14">
            <h2 id="soon-title" className="label-mono text-fg-subtle">
              Coming soon · {soon.length}
            </h2>
            <ul className="mt-5 grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
              {soon.map((tool) => (
                <li key={tool.slug} className="flex items-start justify-between gap-4 border-b border-border py-4">
                  <span>
                    <span className="block font-medium text-fg-muted">{tool.name}</span>
                    <span className="mt-0.5 block text-sm text-fg-subtle">{tool.description}</span>
                  </span>
                  <span className="shrink-0 rounded-full bg-surface-2 px-2 py-0.5 text-xs font-medium text-fg-subtle">
                    Soon
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {pages.length > 0 && (
          <section aria-labelledby="pages-title" className="mt-14">
            <h2 id="pages-title" className="text-2xl font-semibold tracking-tight text-fg">
              Ready-made pages
            </h2>
            <p className="mt-2 max-w-2xl text-fg-muted">The same tools, already set up for a common job.</p>
            <ul className="mt-6 grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
              {pages.map((page) => (
                <li key={page.slug} className="border-b border-border py-3.5">
                  <Link to={toolPath(page)} className="group block">
                    <span className="font-medium text-fg underline-offset-4 group-hover:underline">{page.name}</span>
                    <span className="mt-0.5 block text-sm text-fg-muted">{page.description}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {live.length > 0 && <AdSlot className="mt-14" />}

        {content && (
          <div className="mt-16 grid gap-16 lg:grid-cols-2 lg:gap-12">
            <section aria-labelledby="choose-title">
              <h2 id="choose-title" className="text-2xl font-semibold tracking-tight text-fg">
                Which tool do I need?
              </h2>
              <ul className="mt-6 divide-y divide-border rounded-xl border border-border bg-surface shadow-sm">
                {content.choose.map((item) => (
                  <li key={item.job} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-3">
                    <span className="text-fg-muted">{item.job}</span>
                    <Link to={item.path} className="font-medium text-fg underline underline-offset-4 hover:decoration-accent">
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
            <section aria-labelledby="about-title">
              <h2 id="about-title" className="text-2xl font-semibold tracking-tight text-fg">
                About these {category.name.toLowerCase()}
              </h2>
              <div className="mt-6 space-y-4 leading-relaxed text-fg-muted">
                {content.about.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
            <section aria-labelledby="faq-title" className="lg:col-span-2">
              <h2 id="faq-title" className="text-2xl font-semibold tracking-tight text-fg">
                Frequently asked questions
              </h2>
              <div className="mt-6 space-y-3">
                {content.faq.map((item) => (
                  <details
                    key={item.question}
                    className="group rounded-xl border border-border bg-surface shadow-sm transition-colors open:border-border-strong/50"
                  >
                    <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 rounded-xl px-5 py-3.5 font-medium text-fg [&::-webkit-details-marker]:hidden">
                      {item.question}
                      <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-2 text-fg-muted transition-transform duration-200 group-open:rotate-180">
                        <ChevronDown aria-hidden size={16} strokeWidth={2} />
                      </span>
                    </summary>
                    <p className="max-w-3xl px-5 pb-5 leading-relaxed text-fg-muted">{item.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          </div>
        )}
      </Container>
    </>
  );
}
