import { Link } from "react-router";
import { ArrowRight, ArrowUpRight, Gauge, ShieldCheck, Sparkles } from "lucide-react";
import type { Route } from "./+types/home";
import { Container } from "~/components/layout/Container";
import { SectionHeading } from "~/components/layout/SectionHeading";
import { HeroSearch } from "~/components/home/HeroSearch";
import { HeroPreview } from "~/components/home/HeroPreview";
import { ButtonLink } from "~/components/ui/Button";
import { CategoryIcon } from "~/components/ui/CategoryIcon";
import { categories, categoryPath } from "~/data/categories";
import { tools, toolPath } from "~/data/tools";
import { site } from "~/config/site";
import { buildMeta } from "~/lib/seo";

export function meta({}: Route.MetaArgs) {
  return buildMeta({
    title: `${site.name} – Free online tools for developers, PDFs, images and text`,
    description:
      "Format code, merge and split PDFs, compress images, count words and more in one focused workspace. Runs in your browser. No account needed.",
    path: "/",
  });
}

const categoryBySlug = new Map(categories.map((c) => [c.slug, c]));
const popular = tools.filter((t) => t.popular && t.status === "live");

const stats = [
  { value: String(tools.filter((t) => t.status === "live").length), label: "Free tools" },
  { value: String(categories.length), label: "Categories" },
  { value: "0", label: "Files uploaded" },
  { value: "No", label: "Sign-up needed" },
];

const promises = [
  {
    icon: ShieldCheck,
    title: "Private by design",
    text: "Every tool runs entirely in your browser. Nothing you paste or open is uploaded or stored.",
  },
  {
    icon: Gauge,
    title: "Fast and focused",
    text: "No sign-up, no pop-ups. Open a tool, paste, and get the result.",
  },
  {
    icon: Sparkles,
    title: "Built on trusted libraries",
    text: "Processing uses open-source engines developers already rely on, like Prettier, Terser and pdf-lib.",
  },
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section aria-labelledby="hero-title" className="relative overflow-hidden">
        <div
          aria-hidden
          className="bg-dots absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)]"
        />
        <Container className="relative grid grid-cols-1 items-center gap-12 py-14 sm:py-20 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-16 lg:py-24">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 py-1 pr-3 pl-1 text-sm text-fg-muted shadow-sm backdrop-blur">
              <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-on-accent">
                Free
              </span>
              No sign-up. Works in your browser.
            </p>
            <h1 id="hero-title" className="mt-6 text-hero font-bold text-fg">
              Small tools for <span className="text-brand">serious work</span>.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-fg-muted">
              Format code, merge PDFs, compress images, count words and more.
              One clean workspace, no clutter.
            </p>
            <div className="mt-8 max-w-xl">
              <HeroSearch />
            </div>
          </div>
          <div className="hidden md:block lg:pl-6">
            <HeroPreview />
          </div>
        </Container>
      </section>

      {/* At a glance */}
      <section aria-label={`${site.name} at a glance`} className="border-y border-border bg-surface">
        <Container>
          <dl className="grid grid-cols-2 divide-border lg:grid-cols-4 lg:divide-x">
            {stats.map(({ value, label }) => (
              <div key={label} className="flex flex-col-reverse gap-1 py-6 lg:px-8 lg:first:pl-0">
                <dt className="text-sm text-fg-muted">{label}</dt>
                <dd className="font-display text-3xl font-bold tracking-tight text-fg">{value}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      {/* Categories */}
      <section aria-labelledby="categories-title">
        <Container className="py-16 sm:py-20">
          <SectionHeading
            id="categories-title"
            eyebrow="Categories"
            title="Everything in one place"
            description="Tools grouped by the job you need to get done."
            action={{ label: "Browse all tools", to: "/tools" }}
          />
          <ul className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => (
              <li key={category.slug}>
                <Link
                  to={categoryPath(category.slug)}
                  className="group flex h-full gap-4 rounded-xl border border-border bg-surface p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong/60 hover:shadow-md sm:flex-col"
                >
                  <CategoryIcon category={category} size="lg" />
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 font-display text-lg font-semibold tracking-tight text-fg">
                      {category.name}
                      <ArrowRight
                        aria-hidden
                        size={16}
                        strokeWidth={2}
                        className="-translate-x-1 text-fg-subtle opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100"
                      />
                    </span>
                    <span className="mt-1 block text-sm leading-relaxed text-fg-muted">
                      {category.description}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* Popular */}
      <section aria-labelledby="popular-title" className="border-y border-border bg-surface">
        <Container className="py-16 sm:py-20">
          <SectionHeading
            id="popular-title"
            eyebrow="Popular"
            title="The ones people reach for"
            action={{ label: "Developer tools", to: categoryPath("developer-tools") }}
          />
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {popular.map((tool) => {
              const category = categoryBySlug.get(tool.category);
              return (
                <li key={tool.slug}>
                  <Link
                    to={toolPath(tool)}
                    className="group flex h-full items-start gap-4 rounded-xl border border-border bg-bg p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong/60 hover:bg-surface hover:shadow-md"
                  >
                    {category && <CategoryIcon category={category} />}
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-fg">{tool.name}</span>
                      <span className="mt-1 block text-sm leading-relaxed text-fg-muted">
                        {tool.description}
                      </span>
                    </span>
                    <ArrowUpRight
                      aria-hidden
                      size={18}
                      strokeWidth={1.75}
                      className="shrink-0 text-fg-subtle transition-colors group-hover:text-accent-fg"
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </Container>
      </section>

      {/* Promises */}
      <section aria-labelledby="why-title">
        <Container className="py-16 sm:py-20">
          <SectionHeading id="why-title" eyebrow={`Why ${site.name}`} title="Simple tools, done properly" />
          <ul className="mt-10 grid gap-4 md:grid-cols-3">
            {promises.map(({ icon: Icon, title, text }) => (
              <li key={title} className="rounded-xl border border-border bg-surface p-6 shadow-sm">
                <span className="inline-flex size-11 items-center justify-center rounded-lg bg-brand text-white shadow-md">
                  <Icon aria-hidden size={20} strokeWidth={2} />
                </span>
                <h3 className="mt-5 text-lg font-semibold tracking-tight text-fg">{title}</h3>
                <p className="mt-2 leading-relaxed text-fg-muted">{text}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* Call-out */}
      <section aria-labelledby="cta-title">
        <Container className="pb-20 sm:pb-24">
          <div className="relative overflow-hidden rounded-xl bg-accent px-6 py-12 text-on-accent sm:px-12 sm:py-16">
            <div aria-hidden className="absolute -top-24 -right-24 size-72 rounded-full bg-brand opacity-50 blur-3xl" />
            <div aria-hidden className="absolute -bottom-32 left-1/3 size-72 rounded-full bg-brand opacity-25 blur-3xl" />
            <div className="relative max-w-xl">
              <h2 id="cta-title" className="text-h2 font-bold">
                Start with the JSON Formatter
              </h2>
              <p className="mt-3 text-lg text-on-accent/80">
                Paste messy JSON and get clean, validated output in a click,
                with errors pinpointed by line and column.
              </p>
              <ButtonLink
                to="/developer-tools/json-formatter"
                variant="secondary"
                size="lg"
                className="mt-8"
                icon={ArrowRight}
              >
                Open JSON Formatter
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
