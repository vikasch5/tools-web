import { data, Link } from "react-router";
import type { Route } from "./+types/guide";
import { Container } from "~/components/layout/Container";
import { Breadcrumbs } from "~/components/layout/Breadcrumbs";
import { AdSlot } from "~/components/layout/AdSlot";
import { formatGuideDate, guidePath, guides, type GuideBlock } from "~/data/guides";
import { searchableTools, toolPath } from "~/data/tools";
import { absoluteUrl, breadcrumbJsonLd, buildMeta } from "~/lib/seo";
import { isPublicPath } from "~/lib/pages";
import { site } from "~/config/site";

export function loader({ params }: Route.LoaderArgs) {
  const guide = guides.find((g) => g.slug === params.slug);
  if (!guide) throw data(null, { status: 404 });
  const tools = guide.tools
    .map((slug) => searchableTools.find((t) => t.slug === slug))
    .filter((t) => t !== undefined)
    .map((t) => ({ name: t.name, description: t.description, path: toolPath(t) }));
  const more = guides
    .filter((g) => g.slug !== guide.slug)
    .sort((a, b) => Number(b.topic === guide.topic) - Number(a.topic === guide.topic))
    .slice(0, 3)
    .map((g) => ({ title: g.title, path: guidePath(g) }));
  return { guide, tools, more };
}

/** Same as tool pages: addresses that were never prerendered show "Page not found". */
export async function clientLoader({ request, serverLoader }: Route.ClientLoaderArgs) {
  if (!isPublicPath(new URL(request.url).pathname)) throw data(null, { status: 404 });
  return serverLoader();
}

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData) return [{ title: `Page not found – ${site.name}` }, { name: "robots", content: "noindex" }];
  const { guide } = loaderData;
  const path = guidePath(guide);
  return buildMeta({
    title: guide.metaTitle,
    description: guide.description,
    path,
    jsonLd: [
      breadcrumbJsonLd([
        { name: "Home", path: "/" },
        { name: "Guides", path: "/guides" },
        { name: guide.title, path },
      ]),
      {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: guide.title,
        description: guide.description,
        dateModified: guide.updated,
        mainEntityOfPage: absoluteUrl(path),
        author: { "@type": "Organization", name: site.name, url: site.url },
        publisher: { "@type": "Organization", name: site.name, url: site.url },
      },
    ],
  });
}

const proseClass =
  "space-y-4 leading-relaxed text-fg-muted [&_li]:pl-1 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5";

function Block({ block }: { block: GuideBlock }) {
  switch (block.type) {
    case "p":
      return <p>{block.text}</p>;
    case "list": {
      const List = block.ordered ? "ol" : "ul";
      return (
        <List>
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </List>
      );
    }
    case "note":
      return <p className="rounded-lg border border-border bg-surface px-4 py-3 text-sm text-fg">{block.text}</p>;
    case "table":
      return (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
            <caption className="border-b border-border bg-surface px-4 py-2.5 text-left text-xs font-medium text-fg-subtle">
              {block.caption}
            </caption>
            <thead>
              <tr>
                {block.head.map((cell, i) => (
                  <th key={i} scope="col" className="border-b border-border px-4 py-2.5 font-semibold text-fg">
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, r) => (
                <tr key={r} className="border-b border-border last:border-b-0">
                  {row.map((cell, c) =>
                    c === 0 ? (
                      <th key={c} scope="row" className="px-4 py-2.5 align-top font-medium text-fg">
                        {cell}
                      </th>
                    ) : (
                      <td key={c} className="px-4 py-2.5 align-top text-fg-muted">
                        {cell}
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
}

export default function GuidePage({ loaderData }: Route.ComponentProps) {
  const { guide, tools, more } = loaderData;
  const path = guidePath(guide);

  return (
    <article>
      <header className="border-b border-border">
        <Container className="pt-6 pb-10 sm:pt-8 sm:pb-12">
          <Breadcrumbs
            items={[
              { name: "Home", path: "/" },
              { name: "Guides", path: "/guides" },
              { name: guide.title, path },
            ]}
          />
          <p className="mt-6 text-xs font-medium tracking-wide text-fg-subtle uppercase">{guide.topic}</p>
          <h1 className="mt-2 max-w-3xl text-h1 font-bold text-fg">{guide.title}</h1>
          <p className="mt-4 text-sm text-fg-subtle">
            By the {site.name} team · Updated <time dateTime={guide.updated}>{formatGuideDate(guide.updated)}</time>
          </p>
        </Container>
      </header>

      <Container className="py-10 sm:py-14">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="max-w-3xl space-y-10">
            <div className={`${proseClass} text-lg`}>
              {guide.intro.map((text) => (
                <p key={text}>{text}</p>
              ))}
            </div>

            <nav aria-label="In this guide" className="rounded-xl border border-border bg-surface p-5">
              <h2 className="font-sans text-sm font-semibold text-fg">In this guide</h2>
              <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm">
                {guide.sections.map((s) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`} className="text-fg-muted underline-offset-4 hover:text-fg hover:underline">
                      {s.heading}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            {guide.sections.map((section, i) => (
              <section key={section.id} aria-labelledby={section.id} className="scroll-mt-24">
                <h2 id={section.id} className="text-2xl font-semibold tracking-tight text-fg">
                  {section.heading}
                </h2>
                <div className={`mt-4 ${proseClass}`}>
                  {section.blocks.map((block, b) => (
                    <Block key={b} block={block} />
                  ))}
                </div>
                {i === 1 && <AdSlot className="mt-10" />}
              </section>
            ))}
          </div>

          <aside className="space-y-8 lg:sticky lg:top-24 lg:self-start">
            {tools.length > 0 && (
              <section aria-labelledby="guide-tools">
                <h2 id="guide-tools" className="font-sans text-sm font-semibold text-fg">
                  Tools used in this guide
                </h2>
                <ul className="mt-3 space-y-2">
                  {tools.map((tool) => (
                    <li key={tool.path}>
                      <Link
                        to={tool.path}
                        className="block rounded-lg border border-border bg-bg px-4 py-3 transition-colors hover:border-border-strong/60 hover:bg-surface"
                      >
                        <span className="block text-sm font-semibold text-fg">{tool.name}</span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-fg-muted">{tool.description}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            <section aria-labelledby="more-guides">
              <h2 id="more-guides" className="font-sans text-sm font-semibold text-fg">
                More guides
              </h2>
              <ul className="mt-3 space-y-2 text-sm">
                {more.map((g) => (
                  <li key={g.path}>
                    <Link to={g.path} className="text-fg-muted underline-offset-4 hover:text-fg hover:underline">
                      {g.title}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link to="/guides" className="mt-3 inline-block text-sm font-medium text-fg underline underline-offset-4">
                All guides
              </Link>
            </section>
          </aside>
        </div>
      </Container>
    </article>
  );
}
