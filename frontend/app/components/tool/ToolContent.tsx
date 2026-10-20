import { Link } from "react-router";
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  CircleHelp,
  Info,
  LayoutGrid,
  ListOrdered,
  Mail,
  ShieldCheck,
  SquareCode,
  type LucideIcon,
} from "lucide-react";
import type { ToolDefinition } from "~/tools/types";
import type { Tool } from "~/data/tools";
import { ToolCard } from "./ToolCard";

type SectionId = "about" | "how-to" | "examples" | "limitations" | "faq";

function SectionTitle({ id, icon: Icon, title }: { id: SectionId | "related"; icon: LucideIcon; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent-fg">
        <Icon aria-hidden size={19} strokeWidth={1.75} />
      </span>
      <h2 id={id} className="text-2xl font-semibold tracking-tight text-fg">
        {title}
      </h2>
    </div>
  );
}

function Section({
  id,
  icon,
  title,
  children,
}: {
  id: SectionId;
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="scroll-mt-24">
      <SectionTitle id={id} icon={icon} title={title} />
      <div className="mt-6">{children}</div>
    </section>
  );
}

/** Window-style code panel used by the before/after examples. */
function CodeWindow({ label, tone, children }: { label: string; tone: "muted" | "accent"; children: string }) {
  return (
    <div className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
      <div className="flex items-center gap-3 border-b border-border bg-surface-2/60 px-3.5 py-2.5">
        <span aria-hidden className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-border-strong/40" />
          <span className="size-2.5 rounded-full bg-border-strong/40" />
          <span className="size-2.5 rounded-full bg-border-strong/40" />
        </span>
        <span
          className={
            tone === "accent"
              ? "rounded-full bg-success-soft px-2 py-0.5 text-xs font-medium text-success"
              : "rounded-full bg-surface px-2 py-0.5 text-xs font-medium text-fg-muted ring-1 ring-border"
          }
        >
          {label}
        </span>
      </div>
      <pre className="flex-1 overflow-x-auto p-4 font-mono text-[0.8125rem] leading-6 whitespace-pre-wrap text-fg [overflow-wrap:anywhere]">
        <code>{children}</code>
      </pre>
    </div>
  );
}

/** Long-form help below the workspace: steps, examples, limits, FAQ. */
export function ToolContent({ tool }: { tool: ToolDefinition }) {
  const sections: { id: SectionId; icon: LucideIcon; label: string; show: boolean }[] = [
    { id: "about", icon: BookOpen, label: "Overview", show: tool.overview.length > 0 },
    { id: "how-to", icon: ListOrdered, label: "How to use", show: tool.howTo.length > 0 },
    { id: "examples", icon: SquareCode, label: "Examples", show: tool.examples.length > 0 },
    { id: "limitations", icon: Info, label: "Good to know", show: tool.limitations.length > 0 },
    { id: "faq", icon: CircleHelp, label: "FAQ", show: tool.faq.length > 0 },
  ];
  const visible = sections.filter((s) => s.show);
  const iconFor = (id: SectionId) => sections.find((s) => s.id === id)!.icon;
  const [lead, ...rest] = tool.overview;

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-16">
      <div className="min-w-0 space-y-16">
        {lead && (
          <Section id="about" icon={iconFor("about")} title={`About the ${tool.name}`}>
            <div className="max-w-3xl space-y-4 leading-relaxed text-fg-muted">
              <p className="text-lg leading-relaxed text-fg">{lead}</p>
              {rest.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </Section>
        )}

        {tool.howTo.length > 0 && (
          <Section id="how-to" icon={iconFor("how-to")} title={`How to use the ${tool.name}`}>
            <ol className="relative max-w-3xl">
              {tool.howTo.map((step, i) => {
                const last = i === tool.howTo.length - 1;
                return (
                  <li key={step} className="relative flex gap-4 pb-6 last:pb-0">
                    {!last && (
                      <span aria-hidden className="absolute top-9 bottom-1 left-[1.0625rem] w-px bg-border" />
                    )}
                    <span className="relative inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-sm font-semibold text-fg shadow-sm">
                      {i + 1}
                    </span>
                    <p className="pt-1.5 leading-relaxed text-fg-muted">{step}</p>
                  </li>
                );
              })}
            </ol>
          </Section>
        )}

        {tool.examples.length > 0 && (
          <Section id="examples" icon={iconFor("examples")} title="Examples">
            <div className="space-y-10">
              {tool.examples.map((example, i) => (
                <figure key={example.title}>
                  <figcaption className="flex items-center gap-2.5 font-medium text-fg">
                    <span className="inline-flex size-6 items-center justify-center rounded-md bg-accent text-xs font-semibold text-on-accent">
                      {i + 1}
                    </span>
                    {example.title}
                  </figcaption>
                  <div className="relative mt-4 grid gap-4 md:grid-cols-2 md:gap-6">
                    <CodeWindow label="Before" tone="muted">
                      {example.input}
                    </CodeWindow>
                    <span
                      aria-hidden
                      className="absolute top-1/2 left-1/2 z-10 hidden size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface text-fg-muted shadow-md md:inline-flex"
                    >
                      <ArrowRight size={16} strokeWidth={2} />
                    </span>
                    <CodeWindow label="After" tone="accent">
                      {example.output}
                    </CodeWindow>
                  </div>
                </figure>
              ))}
            </div>
          </Section>
        )}

        {tool.limitations.length > 0 && (
          <Section id="limitations" icon={iconFor("limitations")} title="Good to know">
            <ul className="grid gap-3 sm:grid-cols-2">
              {tool.limitations.map((item) => (
                <li
                  key={item}
                  className="flex gap-3 rounded-xl border border-border bg-surface p-4 text-sm leading-relaxed text-fg-muted shadow-sm"
                >
                  <Info aria-hidden size={18} strokeWidth={1.75} className="mt-0.5 shrink-0 text-accent-fg" />
                  {item}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {tool.faq.length > 0 && (
          <Section id="faq" icon={iconFor("faq")} title="Frequently asked questions">
            <div className="space-y-3">
              {tool.faq.map((item) => (
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
          </Section>
        )}
      </div>

      <aside className="hidden lg:block">
        <div className="sticky top-24 space-y-4">
          <nav aria-label="On this page" className="rounded-xl border border-border bg-surface p-4 shadow-sm">
            <p className="px-2 text-sm font-semibold text-fg">On this page</p>
            <ul className="mt-2 space-y-0.5">
              {visible.map(({ id, icon: Icon, label }) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    className="flex items-center gap-2.5 rounded-md px-2 py-2 text-sm text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
                  >
                    <Icon aria-hidden size={16} strokeWidth={1.75} className="shrink-0 text-fg-subtle" />
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="relative overflow-hidden rounded-xl bg-accent p-5 text-on-accent">
            <div aria-hidden className="absolute -top-12 -right-12 size-32 rounded-full bg-brand opacity-40 blur-2xl" />
            <ShieldCheck aria-hidden size={22} strokeWidth={1.75} className="relative" />
            <p className="relative mt-3 font-semibold">Private by design</p>
            <p className="relative mt-1 text-sm leading-relaxed text-on-accent/80">
              Everything runs in your browser. Your data is never uploaded or stored.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
            <p className="font-semibold text-fg">Need a hand?</p>
            <p className="mt-1 text-sm leading-relaxed text-fg-muted">Read the help center or send us a message.</p>
            <div className="mt-4 flex flex-col gap-2">
              <Link
                to="/help"
                className="inline-flex items-center gap-2 text-sm font-medium text-fg hover:text-accent-fg"
              >
                <CircleHelp aria-hidden size={15} strokeWidth={1.75} />
                Help center
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 text-sm font-medium text-fg hover:text-accent-fg"
              >
                <Mail aria-hidden size={15} strokeWidth={1.75} />
                Contact us
              </Link>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

export function RelatedTools({ tools }: { tools: Tool[] }) {
  if (tools.length === 0) return null;
  return (
    <section
      aria-labelledby="related"
      className="rounded-xl border border-border bg-surface-2/50 p-6 sm:p-8 lg:p-10"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <SectionTitle id="related" icon={LayoutGrid} title="Related tools" />
          <p className="mt-3 text-fg-muted">More tools that pair well with this one.</p>
        </div>
        <Link
          to="/tools"
          className="group inline-flex h-10 shrink-0 items-center gap-1.5 self-start rounded-full border border-border bg-surface px-4 text-sm font-medium text-fg shadow-sm transition-colors hover:border-border-strong sm:self-auto"
        >
          Browse all tools
          <ArrowRight
            aria-hidden
            size={15}
            strokeWidth={2}
            className="transition-transform group-hover:translate-x-0.5"
          />
        </Link>
      </div>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <li key={tool.slug}>
            <ToolCard tool={tool} />
          </li>
        ))}
      </ul>
    </section>
  );
}
