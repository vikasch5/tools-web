import { useEffect, useRef, useState } from "react";
import { Ban, CircleCheck, Copy, Download, FilePlus2, FileSpreadsheet, MoreHorizontal, Pencil, Repeat, Search, Trash2, type LucideIcon } from "lucide-react";
import { TextField } from "~/components/ui/Field";
import { Badge, type BadgeTone } from "~/components/ui/Badge";
import { Button } from "~/components/ui/Button";
import { IconButton } from "~/components/ui/IconButton";
import { cn } from "~/lib/cn";
import {
  addDays,
  convertToInvoice,
  displayDate,
  docStatus,
  invoicesCsv,
  invoiceTotals,
  kindLabel,
  newId,
  nextNumber,
  type Business,
  type DocKind,
  type DocStatus,
  type InvoiceDoc,
} from "~/tools/engine/invoice";
import { downloadBlob, type StatusTone } from "../../Panel";
import { ConfirmDialog } from "./ConfirmDialog";
import { dueDays, makePdf, pdfName, todayIso } from "./Editor";
import type { InvoiceStore } from "./useInvoiceData";

export const rupees = (n: number) => `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const statusInfo: Record<DocStatus, { label: string; tone: BadgeTone }> = {
  paid: { label: "Paid", tone: "success" },
  partial: { label: "Part paid", tone: "warning" },
  unpaid: { label: "Unpaid", tone: "neutral" },
  overdue: { label: "Overdue", tone: "danger" },
  cancelled: { label: "Cancelled", tone: "neutral" },
  open: { label: "Open", tone: "accent" },
  converted: { label: "Invoiced", tone: "success" },
};

const filters: Record<"invoices" | "quotations", DocStatus[]> = {
  invoices: ["unpaid", "overdue", "partial", "paid", "cancelled"],
  quotations: ["open", "converted"],
};

type Notify = (tone: StatusTone, text: string) => void;
type MenuItem = { label: string; icon: LucideIcon; danger?: boolean; onSelect: () => void };

/** A row's secondary actions. Fixed position, so the table's rounded corners cannot clip it. */
function RowMenu({ label, items }: { label: string; items: MenuItem[] }) {
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const button = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);

  const close = (refocus = false) => {
    setPos(null);
    if (refocus) button.current?.focus();
  };

  useEffect(() => {
    if (!pos) return;
    menu.current?.querySelector("button")?.focus();
    const onPointer = (e: PointerEvent) => {
      if (!menu.current?.contains(e.target as Node) && !button.current?.contains(e.target as Node)) close();
    };
    const onScroll = () => close();
    document.addEventListener("pointerdown", onPointer);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [pos]);

  return (
    <>
      <button
        ref={button}
        type="button"
        aria-label={label}
        title={label}
        className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg focus-visible:outline-2 focus-visible:outline-ring pointer-coarse:size-11"
        aria-haspopup="menu"
        aria-expanded={!!pos}
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          // Opens upwards when there is no room below.
          const height = items.length * 40 + 8;
          const top = r.bottom + height + 8 > window.innerHeight ? r.top - height - 4 : r.bottom + 4;
          setPos(pos ? null : { top, right: window.innerWidth - r.right });
        }}
      >
        <MoreHorizontal aria-hidden size={16} strokeWidth={1.75} />
      </button>
      {pos && (
        <div
          ref={menu}
          role="menu"
          aria-label={label}
          style={{ top: pos.top, right: pos.right }}
          className="fixed z-popover min-w-44 rounded-lg border border-border bg-surface p-1 shadow-lg"
          onKeyDown={(e) => {
            const buttons = [...(menu.current?.querySelectorAll("button") ?? [])];
            const at = buttons.indexOf(document.activeElement as HTMLButtonElement);
            if (e.key === "Escape") close(true);
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
              e.preventDefault();
              buttons[(at + (e.key === "ArrowDown" ? 1 : -1) + buttons.length) % buttons.length]?.focus();
            }
          }}
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              onClick={() => {
                close();
                item.onSelect();
              }}
              className={cn(
                "flex h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-left text-sm font-medium hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-ring pointer-coarse:h-11",
                item.danger ? "text-danger" : "text-fg",
              )}
            >
              <item.icon aria-hidden size={16} strokeWidth={1.75} />
              {item.label}
            </button>
          ))}
        </div>
      )}
    </>
  );
}

export function Documents({
  store,
  business,
  section,
  onOpen,
  onCopy,
  onNew,
  notify,
}: {
  store: InvoiceStore;
  business: Business;
  section: "invoices" | "quotations";
  onOpen: (doc: InvoiceDoc) => void;
  onCopy: (draft: InvoiceDoc) => void;
  onNew: (kind: DocKind) => void;
  notify: Notify;
}) {
  const { documents } = store.data;
  const today = todayIso();
  const invoices = section === "invoices";
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"" | DocStatus>("");
  const [deleting, setDeleting] = useState<InvoiceDoc | null>(null);
  const [cancelling, setCancelling] = useState<InvoiceDoc | null>(null);

  const all = documents.filter((d) => (invoices ? d.kind === "invoice" : d.kind !== "invoice"));
  const q = query.trim().toLowerCase();
  const matching = all.filter((d) => !q || `${d.number} ${d.buyer.name} ${d.buyer.gstin}`.toLowerCase().includes(q));
  const shown = matching
    .filter((d) => !status || docStatus(d, today) === status)
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
  const countOf = (s: DocStatus) => matching.filter((d) => docStatus(d, today) === s).length;

  const numbersOf = (k: DocKind) => documents.filter((d) => d.kind === k).map((d) => d.number);
  const touch = (doc: InvoiceDoc, patch: Partial<InvoiceDoc>) => store.saveDocs([{ ...doc, ...patch, updatedAt: Date.now() }]);

  const copy = (doc: InvoiceDoc) => {
    const now = Date.now();
    onCopy({
      ...doc,
      id: newId(),
      number: nextNumber(business.prefixes[doc.kind], today, numbersOf(doc.kind)),
      date: today,
      dueDate: addDays(today, dueDays[doc.kind]),
      items: doc.items.map((i) => ({ ...i, id: newId() })),
      amountPaid: 0,
      cancelled: false,
      linkedId: undefined,
      createdAt: now,
      updatedAt: now,
    });
  };

  const convert = async (doc: InvoiceDoc) => {
    const inv = convertToInvoice(doc, nextNumber(business.prefixes.invoice, today, numbersOf("invoice")), today, Date.now());
    await store.saveDocs([inv, { ...doc, linkedId: inv.id, updatedAt: Date.now() }]);
    onOpen(inv);
    notify("success", `Made invoice ${inv.number} from ${doc.number}. Check it, then download the PDF.`);
  };

  const pdf = async (doc: InvoiceDoc) => {
    try {
      downloadBlob(await makePdf(doc, business), pdfName(doc));
    } catch (e) {
      notify("error", (e as Error).message);
    }
  };

  const markPaid = (doc: InvoiceDoc) => {
    void touch(doc, { amountPaid: invoiceTotals(doc).total });
    notify("success", `${doc.number} marked as paid.`);
  };

  const quickAction = (d: InvoiceDoc) => {
    const t = invoiceTotals(d);
    if (d.kind === "invoice" && !d.cancelled && t.balance > 0)
      return <IconButton icon={CircleCheck} size="sm" label={`Mark ${d.number} as paid`} onClick={() => markPaid(d)} />;
    if (d.kind !== "invoice" && !d.linkedId && !d.cancelled)
      return <IconButton icon={Repeat} size="sm" label={`Turn ${d.number} into an invoice`} onClick={() => convert(d)} />;
    return null;
  };

  const menuFor = (d: InvoiceDoc): MenuItem[] => [
    { label: "Edit", icon: Pencil, onSelect: () => onOpen(d) },
    { label: "Make a copy", icon: Copy, onSelect: () => copy(d) },
    ...(d.kind === "invoice" && !d.cancelled ? [{ label: "Cancel invoice", icon: Ban, onSelect: () => setCancelling(d) }] : []),
    { label: "Delete", icon: Trash2, danger: true, onSelect: () => setDeleting(d) },
  ];

  const actions = (d: InvoiceDoc) => (
    <div className="flex items-center justify-end gap-0.5">
      {quickAction(d)}
      <IconButton icon={Download} size="sm" label={`Download ${d.number} as PDF`} onClick={() => pdf(d)} />
      <RowMenu label={`More actions for ${d.number}`} items={menuFor(d)} />
    </div>
  );

  const label = (d: InvoiceDoc) => statusInfo[docStatus(d, today)];
  const noun = invoices ? "invoices" : "quotations";

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="relative md:w-80">
          <TextField label="Search" placeholder="Number, customer or GSTIN" type="search" value={query} onChange={(e) => setQuery(e.target.value)} />
          <Search aria-hidden size={15} className="pointer-events-none absolute right-3 bottom-3 text-fg-subtle" />
        </div>
        {invoices && (
          <Button
            icon={FileSpreadsheet}
            disabled={!shown.length}
            onClick={() => downloadBlob(new Blob([invoicesCsv(shown, today)], { type: "text/csv" }), `invoices-${today}.csv`)}
          >
            Export for accountant
          </Button>
        )}
      </div>

      {all.length > 0 && (
        <div role="group" aria-label="Filter by status" className="flex gap-1.5 overflow-x-auto pb-1">
          {[{ id: "" as const, name: "All", count: matching.length }, ...filters[section].map((id) => ({ id, name: statusInfo[id].label, count: countOf(id) }))].map((f) => (
            <button
              key={f.id || "all"}
              type="button"
              aria-pressed={status === f.id}
              onClick={() => setStatus(f.id)}
              className={cn(
                "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-ring pointer-coarse:h-11",
                status === f.id ? "border-fg bg-fg text-bg" : "border-border bg-surface text-fg-muted hover:border-border-strong hover:text-fg",
              )}
            >
              {f.name}
              <span className="font-mono text-xs tabular-nums opacity-70">{f.count}</span>
            </button>
          ))}
        </div>
      )}

      <div className="overflow-clip rounded-xl border border-border bg-surface shadow-md">
        {all.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-4 py-14 text-center">
            <p className="text-fg-muted">No {noun} yet. Everything you save appears here.</p>
            <Button variant="primary" icon={FilePlus2} onClick={() => onNew(invoices ? "invoice" : "quotation")}>
              {invoices ? "Create your first invoice" : "Create your first quotation"}
            </Button>
          </div>
        ) : shown.length === 0 ? (
          <p className="px-4 py-12 text-center text-fg-muted">Nothing matches this search or filter.</p>
        ) : (
          <>
            <table className="hidden w-full border-collapse text-left text-sm md:table">
              <caption className="sr-only">Your {noun}</caption>
              <thead>
                <tr className="border-b border-border bg-surface-2/60 text-xs font-medium text-fg-muted">
                  <th scope="col" className="px-4 py-2.5 font-medium">
                    Number
                  </th>
                  <th scope="col" className="px-3 py-2.5 font-medium">
                    Customer
                  </th>
                  <th scope="col" className="px-3 py-2.5 font-medium">
                    Date
                  </th>
                  <th scope="col" className="px-3 py-2.5 font-medium">
                    {invoices ? "Due" : "Valid until"}
                  </th>
                  <th scope="col" className="px-3 py-2.5 font-medium">
                    Status
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-right font-medium">
                    Amount
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-right font-medium">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {shown.map((d) => {
                  const t = invoiceTotals(d);
                  const s = label(d);
                  return (
                    <tr key={d.id} className="hover:bg-surface-2/50">
                      <td className="px-4 py-2">
                        <button type="button" onClick={() => onOpen(d)} className="font-mono font-semibold text-fg hover:underline focus-visible:outline-2 focus-visible:outline-ring">
                          {d.number}
                        </button>
                        {d.kind === "proforma" && <span className="ml-2 text-xs text-fg-subtle">Proforma</span>}
                      </td>
                      <td className="max-w-56 truncate px-3 py-2 text-fg">{d.buyer.name}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-fg-muted">{displayDate(d.date)}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-fg-muted">{d.dueDate ? displayDate(d.dueDate) : "–"}</td>
                      <td className="px-3 py-2">
                        <Badge tone={s.tone}>{s.label}</Badge>
                      </td>
                      <td className="px-3 py-2 text-right whitespace-nowrap tabular-nums">
                        <span className={cn("font-semibold", d.cancelled ? "text-fg-subtle line-through" : "text-fg")}>{rupees(t.total)}</span>
                        {d.kind === "invoice" && t.paid > 0 && t.balance > 0 && <span className="block text-xs text-fg-muted">{rupees(t.balance)} due</span>}
                      </td>
                      <td className="px-3 py-2">{actions(d)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <ul className="divide-y divide-border md:hidden">
              {shown.map((d) => {
                const t = invoiceTotals(d);
                const s = label(d);
                return (
                  <li key={d.id} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <button type="button" onClick={() => onOpen(d)} className="min-w-0 truncate font-mono text-sm font-semibold text-fg">
                        {d.number}
                      </button>
                      <Badge tone={s.tone}>{s.label}</Badge>
                    </div>
                    <p className="mt-1 truncate text-sm text-fg-muted">{d.buyer.name}</p>
                    <div className="mt-1 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className={cn("font-semibold tabular-nums", d.cancelled ? "text-fg-subtle line-through" : "text-fg")}>{rupees(t.total)}</p>
                        <p className="text-xs text-fg-muted">
                          {displayDate(d.date)}
                          {d.kind === "invoice" && t.paid > 0 && t.balance > 0 ? ` · ${rupees(t.balance)} due` : ""}
                        </p>
                      </div>
                      {actions(d)}
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      <ConfirmDialog
        open={!!deleting}
        danger
        title={`Delete ${deleting?.number ?? ""}?`}
        confirmLabel="Delete for good"
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) {
            void store.deleteDoc(deleting.id);
            notify("success", `${deleting.number} deleted.`);
          }
          setDeleting(null);
        }}
      >
        This cannot be undone. To keep your numbering complete, cancel an invoice instead of deleting it.
      </ConfirmDialog>
      <ConfirmDialog
        open={!!cancelling}
        title={`Cancel ${cancelling?.number ?? ""}?`}
        confirmLabel="Cancel invoice"
        cancelLabel="Keep it"
        onCancel={() => setCancelling(null)}
        onConfirm={() => {
          if (cancelling) {
            void touch(cancelling, { cancelled: true });
            notify("success", `${cancelling.number} cancelled. Its number stays in your series.`);
          }
          setCancelling(null);
        }}
      >
        It stays in your records, marked cancelled, and no longer counts towards your totals.
      </ConfirmDialog>
    </div>
  );
}

export const kindOf = (doc: InvoiceDoc) => kindLabel[doc.kind];
