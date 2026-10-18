import { Link } from "react-router";
import { ArrowUpRight, Plus } from "lucide-react";
import type { ToolDefinition } from "~/tools/types";
import type { Tool } from "~/data/tools";
import { toolPath } from "~/data/tools";

function Block({
  id,
  index,
  title,
  children,
}: {
  id: string;
  index: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className="grid gap-4 border-t border-border pt-8 lg:grid-cols-[14rem_1fr] lg:gap-10"
    >
      <div>
        <p className="label-mono text-accent-fg">{index}</p>
        <h2
          id={id}
          className="mt-2 text-2xl font-semibold tracking-tight text-fg"
        >
          {title}
        </h2>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

/** Long-form help below the workspace: steps, examples, limits, FAQ. */
export function ToolContent({ tool }: { tool: ToolDefinition }) {
  return (
    <div className="space-y-12">
      <Block id="how-to" index="01" title={`How to use the ${tool.name}`}>
        <ol className="max-w-prose space-y-3">
          {tool.howTo.map((step, i) => (
            <li
              key={step}
              className="grid grid-cols-[1.75rem_1fr] gap-2 text-fg-muted"
            >
              <span className="font-mono text-sm leading-6 text-fg-subtle">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="leading-6">{step}</span>
            </li>
          ))}
        </ol>
      </Block>

      <Block id="examples" index="02" title="Examples">
        <div className="space-y-6">
          {tool.examples.map((example) => (
            <figure key={example.title}>
              <figcaption className="font-medium text-fg">
                {example.title}
              </figcaption>
              <div className="mt-3 grid gap-px overflow-hidden rounded-lg border border-border bg-border shadow-sm md:grid-cols-2">
                <div className="min-w-0 bg-surface">
                  <p className="label-mono border-b border-border px-3 py-2 text-fg-subtle">
                    Before
                  </p>
                  <pre className="overflow-x-auto p-3 font-mono text-[0.8125rem] leading-6 text-fg-muted">
                    <code>{example.input}</code>
                  </pre>
                </div>
                <div className="min-w-0 bg-surface">
                  <p className="label-mono border-b border-border px-3 py-2 text-fg-subtle">
                    After
                  </p>
                  <pre className="overflow-x-auto p-3 font-mono text-[0.8125rem] leading-6 whitespace-pre-wrap text-fg">
                    <code>{example.output}</code>
                  </pre>
                </div>
              </div>
            </figure>
          ))}
        </div>
      </Block>

      <Block id="limitations" index="03" title="Good to know">
        <ul className="max-w-prose space-y-3">
          {tool.limitations.map((item) => (
            <li key={item} className="flex gap-3 leading-6 text-fg-muted">
              <span
                aria-hidden
                className="mt-2.5 size-1.5 shrink-0 bg-accent"
              />
              {item}
            </li>
          ))}
        </ul>
      </Block>

      <Block id="faq" index="04" title="Questions">
        <div className="divide-y divide-border border-y border-border">
          {tool.faq.map((item) => (
            <details key={item.question} className="group">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 font-medium text-fg [&::-webkit-details-marker]:hidden">
                {item.question}
                <Plus
                  aria-hidden
                  size={18}
                  strokeWidth={1.5}
                  className="shrink-0 text-fg-subtle transition-transform group-open:rotate-45"
                />
              </summary>
              <p className="max-w-prose pb-5 leading-relaxed text-fg-muted">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </Block>
    </div>
  );
}

export function RelatedTools({ tools }: { tools: Tool[] }) {
  if (tools.length === 0) return null;
  return (
    <section aria-labelledby="related" className="border-t border-border pt-8">
      <p className="text-sm font-semibold text-accent-fg">Related</p>
      <h2
        id="related"
        className="mt-3 text-2xl font-semibold tracking-tight text-fg"
      >
        Keep going
      </h2>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <li key={tool.slug}>
            <Link
              to={toolPath(tool)}
              className="group flex h-full items-start justify-between gap-4 rounded-xl border border-border bg-surface p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong/60 hover:shadow-md"
            >
              <span>
                <span className="block font-semibold text-fg">{tool.name}</span>
                <span className="mt-1 block text-sm leading-relaxed text-fg-muted">
                  {tool.description}
                </span>
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
  );
}
