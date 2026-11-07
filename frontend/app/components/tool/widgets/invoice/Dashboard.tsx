import { ArrowRight, CircleCheck, ReceiptText } from "lucide-react";
import { Badge } from "~/components/ui/Badge";
import { Button } from "~/components/ui/Button";
import { displayDate, docStatus, financialYear, invoiceTotals, monthlyInvoiced, needingAttention, summarise, type DocKind, type InvoiceDoc, type MonthTotal } from "~/tools/engine/invoice";
import { todayIso } from "./Editor";
import { kindOf, rupees, statusInfo } from "./Documents";
import type { InvoiceData } from "./useInvoiceData";

function Card({ title, action, children }: { title: string; action?: { label: string; onClick: () => void }; children: React.ReactNode }) {
  return (
    <section className="flex min-w-0 flex-col overflow-clip rounded-xl border border-border bg-surface shadow-md">
      <div className="flex min-h-12 items-center justify-between gap-3 border-b border-border px-4">
        <h2 className="text-sm font-semibold text-fg">{title}</h2>
        {action && (
          <button type="button" onClick={action.onClick} className="inline-flex items-center gap-1 text-sm font-medium text-accent-fg hover:underline focus-visible:outline-2 focus-visible:outline-ring">
            {action.label}
            <ArrowRight aria-hidden size={14} />
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-border bg-surface p-4 shadow-sm">
      <p className="text-sm text-fg-muted">{label}</p>
      <p className="mt-1 truncate font-display text-xl font-semibold text-fg tabular-nums sm:text-2xl">{value}</p>
      {note && <p className="mt-0.5 text-xs text-fg-subtle">{note}</p>}
    </div>
  );
}

/** One series over six months: thin bars from a shared baseline, value on hover or focus, table for screen readers. */
function MonthsChart({ months }: { months: MonthTotal[] }) {
  const peak = Math.max(...months.map((m) => m.invoiced));
  return (
    <div className="p-4">
      <table className="sr-only">
        <caption>Invoiced each month</caption>
        <tbody>
          {months.map((m) => (
            <tr key={m.month}>
              <th scope="row">{m.label}</th>
              <td>{rupees(m.invoiced)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div aria-hidden className="grid h-44 grid-cols-6 items-end gap-2 border-b border-border sm:gap-4">
        {months.map((m) => {
          const percent = peak > 0 ? (m.invoiced / peak) * 100 : 0;
          return (
            <div key={m.month} className="group relative flex h-full items-end justify-center">
              <span className="pointer-events-none absolute bottom-full z-10 mb-1 hidden rounded-md bg-fg px-2 py-1 text-xs font-medium whitespace-nowrap text-bg tabular-nums group-hover:block">
                {rupees(m.invoiced)}
              </span>
              <div className="w-full max-w-10 rounded-t-sm bg-accent" style={{ height: `${percent}%` }} />
            </div>
          );
        })}
      </div>
      <div aria-hidden className="mt-1.5 grid grid-cols-6 gap-2 text-center text-xs text-fg-muted sm:gap-4">
        {months.map((m) => (
          <span key={m.month}>{m.label}</span>
        ))}
      </div>
    </div>
  );
}

function DocRow({ doc, today, onOpen, detail }: { doc: InvoiceDoc; today: string; onOpen: (d: InvoiceDoc) => void; detail: string }) {
  const s = statusInfo[docStatus(doc, today)];
  const t = invoiceTotals(doc);
  return (
    <li>
      <button type="button" onClick={() => onOpen(doc)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-surface-2/60 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring">
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-fg">{doc.buyer.name}</span>
          <span className="block truncate text-xs text-fg-muted">
            {doc.number} · {detail}
          </span>
        </span>
        <span className="shrink-0 text-right">
          <span className="block text-sm font-semibold text-fg tabular-nums">{rupees(doc.kind === "invoice" ? t.balance || t.total : t.total)}</span>
          <Badge tone={s.tone}>{s.label}</Badge>
        </span>
      </button>
    </li>
  );
}

export function Dashboard({
  data,
  onOpen,
  onNew,
  onGo,
}: {
  data: InvoiceData;
  onOpen: (doc: InvoiceDoc) => void;
  onNew: (kind: DocKind) => void;
  onGo: (view: "invoices" | "quotations" | "settings") => void;
}) {
  const { documents } = data;
  const today = todayIso();
  const hasProfile = !!data.business?.name;
  const hasDocs = documents.length > 0;

  if (!hasProfile || !hasDocs) {
    const steps = [
      { done: hasProfile, title: "Add your business details", text: "Your name, GSTIN, bank details and logo. You only do this once.", action: () => onGo("settings"), label: "Add details" },
      { done: hasDocs, title: "Create your first invoice", text: "The next number, tax split and amount in words are worked out for you.", action: () => onNew("invoice"), label: "New invoice" },
    ];
    return (
      <Card title="Get started in two steps">
        <ol className="divide-y divide-border">
          {steps.map((step, i) => (
            <li key={step.title} className="flex flex-wrap items-center gap-3 px-4 py-4">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-2 text-sm font-semibold text-fg">
                {step.done ? <CircleCheck aria-label="Done" size={18} className="text-success" /> : i + 1}
              </span>
              <div className="min-w-0 flex-1 basis-48">
                <p className="font-medium text-fg">{step.title}</p>
                <p className="text-sm text-fg-muted">{step.text}</p>
              </div>
              {!step.done && (
                <Button variant={i === 0 || hasProfile ? "primary" : "secondary"} onClick={step.action}>
                  {step.label}
                </Button>
              )}
            </li>
          ))}
        </ol>
      </Card>
    );
  }

  const fy = financialYear(today);
  const start = Number(fy.slice(0, 4));
  const summary = summarise(documents, `${start}-04-01`, `${start + 1}-03-31`);
  const attention = needingAttention(documents, today);
  const overdue = attention.filter((d) => docStatus(d, today) === "overdue");
  const recent = [...documents].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-end gap-2">
        <Button icon={ReceiptText} onClick={() => onNew("quotation")}>
          New quotation
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat label="Invoiced" value={rupees(summary.invoiced)} note={`${summary.count} ${summary.count === 1 ? "invoice" : "invoices"} in FY ${fy}`} />
        <Stat label="Received" value={rupees(summary.received)} note={`FY ${fy}`} />
        <Stat label="Outstanding" value={rupees(summary.outstanding)} note={overdue.length ? `${overdue.length} overdue` : "Nothing overdue"} />
        <Stat label="GST charged" value={rupees(summary.gst)} note={`FY ${fy}`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Needs attention" action={{ label: "All invoices", onClick: () => onGo("invoices") }}>
          {attention.length ? (
            <ul className="divide-y divide-border">
              {attention.slice(0, 5).map((d) => (
                <DocRow key={d.id} doc={d} today={today} onOpen={onOpen} detail={`due ${displayDate(d.dueDate)}`} />
              ))}
            </ul>
          ) : (
            <p className="flex items-center gap-2 p-4 text-sm text-fg-muted">
              <CircleCheck aria-hidden size={16} className="text-success" />
              Nothing overdue or due in the next 7 days.
            </p>
          )}
        </Card>
        <Card title="Invoiced, last 6 months">
          <MonthsChart months={monthlyInvoiced(documents, today)} />
        </Card>
      </div>

      <Card title="Recent activity">
        <ul className="divide-y divide-border">
          {recent.map((d) => (
            <DocRow key={d.id} doc={d} today={today} onOpen={onOpen} detail={`${kindOf(d)} · ${displayDate(d.date)}`} />
          ))}
        </ul>
      </Card>

    </div>
  );
}
