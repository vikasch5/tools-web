import { useEffect, useMemo, useRef, useState } from "react";
import {
  Braces,
  Brackets,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ChevronsDownUp,
  ChevronsUpDown,
  Copy,
  Search,
} from "lucide-react";
import { cn } from "~/lib/cn";
import { IconButton } from "~/components/ui/IconButton";
import {
  PAGE_SIZE,
  ROOT_ID,
  ancestorIds,
  childIndex,
  formatPath,
  idsToDepth,
  nodeId,
  searchTree,
  typeOf,
  visibleRows,
  type JsonValue,
  type NodeType,
  type PathSegment,
  type Row,
} from "./model";

const valueColor: Record<NodeType, string> = {
  string: "text-code-string",
  number: "text-code-number",
  boolean: "text-code-key",
  null: "text-fg-subtle italic",
  object: "text-fg-subtle",
  array: "text-fg-subtle",
};

function preview(row: Pick<Row, "type" | "value" | "childCount">) {
  switch (row.type) {
    case "object":
      return `{ ${row.childCount} ${row.childCount === 1 ? "key" : "keys"} }`;
    case "array":
      return `[ ${row.childCount} ${row.childCount === 1 ? "item" : "items"} ]`;
    case "string":
      return JSON.stringify(row.value);
    default:
      return String(row.value);
  }
}

/**
 * Collapsible, searchable tree view of a JSON document (ARIA tree pattern
 * with roving focus). Long containers render in pages to stay fast.
 */
export function JsonTree({ data }: { data: JsonValue }) {
  const [expanded, setExpanded] = useState(() => new Set(idsToDepth(data, 0)));
  const [pages, setPages] = useState(() => new Map<string, number>());
  const [selected, setSelected] = useState<string>(ROOT_ID);
  const [query, setQuery] = useState("");
  const [matchIndex, setMatchIndex] = useState(0);
  const [copied, setCopied] = useState<"path" | "value" | null>(null);
  const treeRef = useRef<HTMLDivElement>(null);
  const pendingFocus = useRef(false);

  // Reset when a new document arrives.
  useEffect(() => {
    setExpanded(new Set(idsToDepth(data, 0)));
    setPages(new Map());
    setSelected(ROOT_ID);
    setMatchIndex(0);
  }, [data]);

  const rows = useMemo(
    () => visibleRows(data, expanded, pages),
    [data, expanded, pages],
  );
  const matches = useMemo(() => searchTree(data, query), [data, query]);
  const matchIds = useMemo(() => new Set(matches.map(nodeId)), [matches]);
  const currentMatchId = matches.length
    ? nodeId(matches[matchIndex % matches.length])
    : null;
  const selectedRow = rows.find((r) => r.id === selected) ?? rows[0];

  // Move DOM focus / scroll after the rows for a selection have rendered.
  useEffect(() => {
    const el = treeRef.current?.querySelector<HTMLElement>(
      `[data-id="${CSS.escape(selected)}"]`,
    );
    if (!el) return;
    el.scrollIntoView({ block: "nearest" });
    if (pendingFocus.current) {
      el.focus({ preventScroll: true });
      pendingFocus.current = false;
    }
  }, [selected, rows]);

  const toggle = (id: string, open?: boolean) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      const shouldOpen = open ?? !next.has(id);
      if (shouldOpen) next.add(id);
      else next.delete(id);
      return next;
    });

  const reveal = (path: PathSegment[]) => {
    setExpanded((prev) => new Set([...prev, ...ancestorIds(path)]));
    setPages((prev) => {
      const next = new Map(prev);
      for (let i = 0; i < path.length; i++) {
        const parentId = nodeId(path.slice(0, i));
        const page =
          Math.floor(childIndex(data, path.slice(0, i + 1)) / PAGE_SIZE) + 1;
        if ((next.get(parentId) ?? 1) < page) next.set(parentId, page);
      }
      return next;
    });
    setSelected(nodeId(path));
  };

  const jump = (delta: number) => {
    if (!matches.length) return;
    const next = (matchIndex + delta + matches.length) % matches.length;
    setMatchIndex(next);
    reveal(matches[next]);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const index = rows.findIndex((r) => r.id === selected);
    const row = rows[index];
    if (!row) return;
    const go = (i: number) => {
      const target = rows[Math.max(0, Math.min(rows.length - 1, i))];
      if (target) {
        pendingFocus.current = true;
        setSelected(target.id);
      }
    };
    switch (event.key) {
      case "ArrowDown":
        go(index + 1);
        break;
      case "ArrowUp":
        go(index - 1);
        break;
      case "Home":
        go(0);
        break;
      case "End":
        go(rows.length - 1);
        break;
      case "ArrowRight":
        if (row.childCount > 0 && !row.expanded) toggle(row.id, true);
        else if (row.expanded) go(index + 1);
        break;
      case "ArrowLeft":
        if (row.expanded) toggle(row.id, false);
        else if (row.path.length > 0) {
          pendingFocus.current = true;
          setSelected(nodeId(row.path.slice(0, -1)));
        }
        break;
      case "Enter":
      case " ":
        if (row.more)
          setPages((p) =>
            new Map(p).set(
              row.more!.parentId,
              (p.get(row.more!.parentId) ?? 1) + 1,
            ),
          );
        else if (row.childCount > 0) toggle(row.id);
        break;
      default:
        return;
    }
    event.preventDefault();
  };

  const copy = async (kind: "path" | "value") => {
    if (!selectedRow) return;
    const text =
      kind === "path"
        ? formatPath(selectedRow.path)
        : selectedRow.type === "string"
          ? String(selectedRow.value)
          : JSON.stringify(selectedRow.value, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // Clipboard blocked; the value stays visible below for manual copy.
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Tree toolbar: search and expand controls */}
      <div className="flex shrink-0 items-center gap-1 border-b border-border px-2 py-1.5">
        <div className="flex h-8 min-w-0 flex-1 items-center gap-2 rounded-md border border-border bg-bg px-2.5 focus-within:border-accent pointer-coarse:h-10">
          <Search aria-hidden size={14} className="shrink-0 text-fg-subtle" />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setMatchIndex(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                jump(
                  e.shiftKey
                    ? -1
                    : matches.length && currentMatchId === selected
                      ? 1
                      : 0,
                );
              }
            }}
            placeholder="Search keys and values"
            aria-label="Search keys and values"
            className="h-full min-w-0 flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-fg-subtle [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <span
              className="shrink-0 font-mono text-[0.6875rem] text-fg-subtle tabular-nums"
              aria-live="polite"
            >
              {matches.length
                ? `${(matchIndex % matches.length) + 1}/${matches.length}`
                : "0 found"}
            </span>
          )}
        </div>
        <IconButton
          icon={ChevronUp}
          label="Previous match"
          size="sm"
          disabled={!matches.length}
          onClick={() => jump(-1)}
        />
        <IconButton
          icon={ChevronDown}
          label="Next match"
          size="sm"
          disabled={!matches.length}
          onClick={() => jump(1)}
        />
        <span aria-hidden className="mx-0.5 h-5 w-px bg-border" />
        <IconButton
          icon={ChevronsUpDown}
          label="Expand all"
          size="sm"
          onClick={() => setExpanded(new Set(idsToDepth(data, Infinity)))}
        />
        <IconButton
          icon={ChevronsDownUp}
          label="Collapse all"
          size="sm"
          onClick={() => {
            setExpanded(new Set([ROOT_ID]));
            setSelected(ROOT_ID);
          }}
        />
      </div>

      {/* Tree */}
      <div
        ref={treeRef}
        role="tree"
        aria-label="JSON tree"
        onKeyDown={onKeyDown}
        className="min-h-0 flex-1 overflow-auto py-1.5 font-mono text-[0.8125rem] leading-[1.75rem]"
      >
        {rows.map((row) =>
          row.more ? (
            <div
              key={row.id}
              role="none"
              style={{ paddingLeft: `${row.depth * 1.125 + 2}rem` }}
            >
              <button
                type="button"
                data-id={row.id}
                tabIndex={selected === row.id ? 0 : -1}
                onClick={() =>
                  setPages((p) =>
                    new Map(p).set(
                      row.more!.parentId,
                      (p.get(row.more!.parentId) ?? 1) + 1,
                    ),
                  )
                }
                className="my-0.5 rounded-sm px-2 font-sans text-xs font-medium text-accent-fg hover:underline"
              >
                Show {Math.min(PAGE_SIZE, row.more.remaining)} more of{" "}
                {row.more.remaining}
              </button>
            </div>
          ) : (
            <TreeRow
              key={row.id}
              row={row}
              selected={selected === row.id}
              match={matchIds.has(row.id)}
              current={currentMatchId === row.id}
              onSelect={() => setSelected(row.id)}
              onToggle={() => toggle(row.id)}
            />
          ),
        )}
      </div>

      {/* Selected node details */}
      {selectedRow && !selectedRow.more && (
        <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-t border-border bg-surface-2/50 px-3 py-2">
          <span className="rounded-sm bg-surface px-1.5 py-0.5 font-mono text-[0.6875rem] text-fg-muted ring-1 ring-border">
            {typeOf(selectedRow.value)}
          </span>
          <code
            className="min-w-0 flex-1 truncate font-mono text-xs text-fg"
            title={formatPath(selectedRow.path)}
          >
            {formatPath(selectedRow.path)}
          </code>
          <div className="flex items-center gap-0.5">
            <IconButton
              icon={copied === "path" ? Check : Copy}
              label={copied === "path" ? "Path copied" : "Copy path"}
              size="sm"
              onClick={() => copy("path")}
            />
            <button
              type="button"
              onClick={() => copy("value")}
              className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-fg-muted hover:bg-surface hover:text-fg pointer-coarse:h-11"
            >
              {copied === "value" ? (
                <Check aria-hidden size={14} />
              ) : (
                <Copy aria-hidden size={14} />
              )}
              {copied === "value" ? "Copied" : "Copy value"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function TreeRow({
  row,
  selected,
  match,
  current,
  onSelect,
  onToggle,
}: {
  row: Row;
  selected: boolean;
  match: boolean;
  current: boolean;
  onSelect: () => void;
  onToggle: () => void;
}) {
  const container = row.type === "object" || row.type === "array";
  const Icon = row.type === "array" ? Brackets : Braces;
  return (
    <div
      role="treeitem"
      data-id={row.id}
      aria-level={row.depth + 1}
      aria-expanded={row.childCount > 0 ? row.expanded : undefined}
      aria-selected={selected}
      tabIndex={selected ? 0 : -1}
      onClick={onSelect}
      onDoubleClick={row.childCount > 0 ? onToggle : undefined}
      className={cn(
        "group relative flex cursor-default items-center gap-1 pr-3 whitespace-nowrap outline-none",
        "hover:bg-surface-2/70 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
        selected && "bg-accent-soft hover:bg-accent-soft",
        match && !selected && "bg-warning-soft",
        current && "ring-1 ring-accent ring-inset",
      )}
      style={{ paddingLeft: `${row.depth * 1.125 + 0.5}rem` }}
    >
      {/* Indent guides */}
      {Array.from({ length: row.depth }, (_, i) => (
        <span
          key={i}
          aria-hidden
          className="absolute inset-y-0 w-px bg-border"
          style={{ left: `${i * 1.125 + 1.05}rem` }}
        />
      ))}
      {row.childCount > 0 ? (
        <button
          type="button"
          tabIndex={-1}
          aria-hidden
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
            onToggle();
          }}
          className="relative inline-flex size-5 shrink-0 items-center justify-center rounded-sm text-fg-subtle hover:bg-surface hover:text-fg"
        >
          {row.expanded ? (
            <ChevronDown size={14} strokeWidth={2} />
          ) : (
            <ChevronRight size={14} strokeWidth={2} />
          )}
        </button>
      ) : (
        <span
          aria-hidden
          className="inline-flex size-5 shrink-0 items-center justify-center"
        >
          <span className="size-1.5 rounded-full bg-border-strong/60" />
        </span>
      )}
      {container && (
        <Icon
          aria-hidden
          size={14}
          strokeWidth={2}
          className="shrink-0 text-accent-fg"
        />
      )}
      <span className="min-w-0 truncate">
        {row.name === undefined ? (
          <span className="font-semibold text-fg">JSON</span>
        ) : typeof row.name === "number" ? (
          <span className="text-fg-subtle">{row.name}</span>
        ) : (
          <span className="font-medium text-code-key">{row.name}</span>
        )}
        {(row.name !== undefined || container) && (
          <span className="text-code-punct">
            {row.name === undefined ? " " : ": "}
          </span>
        )}
        {(!container || !row.expanded) && (
          <span className={valueColor[row.type]}>{preview(row)}</span>
        )}
        {container && row.expanded && (
          <span className="text-fg-subtle">
            {row.type === "array"
              ? `[${row.childCount}]`
              : `{${row.childCount}}`}
          </span>
        )}
      </span>
    </div>
  );
}
