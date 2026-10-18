import { Link } from "react-router";
import { ChevronRight } from "lucide-react";

export type Crumb = { name: string; path: string };

/** Visible breadcrumb trail; the last item is the current page. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-fg-subtle">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={item.path} className="inline-flex items-center gap-1">
              {last ? (
                <span aria-current="page" className="text-fg-muted">
                  {item.name}
                </span>
              ) : (
                <>
                  <Link to={item.path} className="hover:text-fg hover:underline">
                    {item.name}
                  </Link>
                  <ChevronRight aria-hidden size={14} strokeWidth={1.5} />
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
