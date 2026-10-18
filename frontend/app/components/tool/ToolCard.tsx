import { Link } from "react-router";
import { ArrowUpRight } from "lucide-react";
import { CategoryIcon } from "~/components/ui/CategoryIcon";
import { Badge } from "~/components/ui/Badge";
import { categories } from "~/data/categories";
import { toolPath, type Tool } from "~/data/tools";

const categoryBySlug = new Map(categories.map((c) => [c.slug, c]));

/** Linked card for a working tool, with its category tile and a New label. */
export function ToolCard({ tool }: { tool: Tool }) {
  const category = categoryBySlug.get(tool.category);
  return (
    <Link
      to={toolPath(tool)}
      className="group flex h-full items-start gap-4 rounded-xl border border-border bg-surface p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong/60 hover:shadow-md"
    >
      {category && <CategoryIcon category={category} />}
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2 font-semibold text-fg">
          {tool.name}
          {tool.isNew && <Badge tone="accent">New</Badge>}
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
  );
}
