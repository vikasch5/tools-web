import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router";
import {
  ArrowLeft,
  Building2,
  FilePlus2,
  FileText,
  LayoutDashboard,
  LoaderCircle,
  Package,
  ReceiptText,
  ShieldCheck,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "~/components/layout/Logo";
import { Button } from "~/components/ui/Button";
import { IconButton } from "~/components/ui/IconButton";
import { warmUpWorker } from "~/tools/engine/client";
import { emptyBusiness, kindLabel, type Business, type DocKind, type InvoiceDoc } from "~/tools/engine/invoice";
import { cn } from "~/lib/cn";
import { StatusMessage, type StatusTone } from "../../Panel";
import { Backup } from "./Backup";
import { BusinessForm } from "./BusinessForm";
import { Dashboard } from "./Dashboard";
import { Directory } from "./Directory";
import { Documents } from "./Documents";
import { Editor, newDraft } from "./Editor";
import { useInvoiceData } from "./useInvoiceData";

type View = "dashboard" | "invoices" | "quotations" | "customers" | "items" | "settings";

const nav: { id: View; label: string; short: string; icon: LucideIcon }[] = [
  { id: "dashboard", label: "Dashboard", short: "Home", icon: LayoutDashboard },
  { id: "invoices", label: "Invoices", short: "Invoices", icon: FileText },
  { id: "quotations", label: "Quotations", short: "Quotes", icon: ReceiptText },
  { id: "customers", label: "Customers", short: "Customers", icon: Users },
  { id: "items", label: "Items", short: "Items", icon: Package },
  { id: "settings", label: "Business settings", short: "Settings", icon: Building2 },
];

const isView = (v: string | null): v is View => nav.some((n) => n.id === v);
const isKind = (v: string | null): v is DocKind => v === "invoice" || v === "quotation" || v === "proforma";

export function InvoicePanel() {
  const store = useInvoiceData();
  const { data } = store;
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [notice, setNotice] = useState<{ tone: StatusTone; text: string } | null>(null);
  const draft = useRef<{ key: string; doc: InvoiceDoc } | null>(null);

  useEffect(() => warmUpWorker(), []);

  const view: View = isView(params.get("view")) ? (params.get("view") as View) : "dashboard";
  const editId = params.get("edit");
  const newParam = params.get("new");
  const newKind = isKind(newParam) ? newParam : null;
  const wantsEditor = !!editId || !!newKind;

  const business: Business = data.business ?? { ...emptyBusiness(), gstRegistered: params.get("gst") !== "off" };
  const needsProfile = !data.business?.name;

  const go = (next: View) => {
    setNotice(null);
    navigate({ search: next === "dashboard" ? "" : `?view=${next}` });
  };
  const open = (doc: InvoiceDoc) => {
    setNotice(null);
    navigate({ search: `?edit=${doc.id}` });
  };
  const startNew = (kind: DocKind) => {
    setNotice(null);
    navigate({ search: `?new=${kind}` });
  };
  const copy = (doc: InvoiceDoc) => {
    setNotice(null);
    navigate({ search: `?new=${doc.kind}` }, { state: { draft: doc } });
  };
  const notify = (tone: StatusTone, text: string) => setNotice({ tone, text });

  if (!data.ready) {
    return (
      <div aria-busy className="flex min-h-dvh items-center justify-center gap-2 bg-bg text-sm text-fg-subtle">
        <LoaderCircle aria-hidden size={16} className="animate-spin" />
        Opening your saved invoices…
      </div>
    );
  }

  // The document being edited comes straight from storage each time it opens, so
  // it can never be an older copy of something changed in a list.
  let editing: InvoiceDoc | undefined;
  if (editId) editing = data.documents.find((d) => d.id === editId);
  else if (newKind && !needsProfile) {
    if (draft.current?.key !== location.key) {
      const copied = (location.state as { draft?: InvoiceDoc } | null)?.draft;
      draft.current = { key: location.key, doc: copied ?? newDraft(newKind, business, data.documents) };
    }
    editing = draft.current.doc;
  }

  const isNew = !!editing && !data.documents.some((d) => d.id === editing.id);
  const listFor = (kind: DocKind): View => (kind === "invoice" ? "invoices" : "quotations");
  const showSettings = view === "settings" || (wantsEditor && needsProfile);
  const active: View = editing ? listFor(editing.kind) : showSettings ? "settings" : view;
  const title = editing
    ? isNew
      ? `New ${kindLabel[editing.kind].toLowerCase()}`
      : `Editing ${editing.number}`
    : wantsEditor && !needsProfile
      ? "Document not found"
      : (nav.find((n) => n.id === active)?.label ?? "Dashboard");

  return (
    <div className="flex min-h-dvh bg-bg">
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-border bg-surface lg:flex">
        <div className="flex h-14 items-center border-b border-border px-4">
          <Logo className="h-7" />
        </div>
        <div className="p-3">
          <Button variant="primary" icon={FilePlus2} className="w-full" onClick={() => startNew("invoice")}>
            New invoice
          </Button>
        </div>
        <nav aria-label="Invoice panel" className="flex-1 space-y-0.5 overflow-y-auto px-3">
          {nav.map((n) => {
            const count = n.id === "invoices" ? data.documents.filter((d) => d.kind === "invoice").length : n.id === "quotations" ? data.documents.filter((d) => d.kind !== "invoice").length : 0;
            return (
              <button
                key={n.id}
                type="button"
                aria-current={active === n.id ? "page" : undefined}
                onClick={() => go(n.id)}
                className={cn(
                  "flex h-10 w-full items-center gap-2.5 rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-ring",
                  active === n.id ? "bg-accent-soft text-accent-fg" : "text-fg-muted hover:bg-surface-2 hover:text-fg",
                )}
              >
                <n.icon aria-hidden size={17} strokeWidth={1.75} />
                <span className="flex-1 text-left">{n.label}</span>
                {count > 0 && <span className="font-mono text-xs tabular-nums opacity-70">{count}</span>}
              </button>
            );
          })}
        </nav>
        <div className="space-y-2 border-t border-border p-3">
          <p className="flex gap-2 text-xs text-fg-muted">
            <ShieldCheck aria-hidden size={15} className="mt-px shrink-0" />
            Saved in this browser only. Back up regularly from Business settings.
          </p>
          <Link to="/tools" className="inline-flex items-center gap-1.5 text-xs font-medium text-fg-muted hover:text-fg">
            <ArrowLeft aria-hidden size={13} />
            All tools
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-border bg-surface/95 px-4 backdrop-blur-sm lg:px-6">
          {editing && (
            <IconButton icon={ArrowLeft} label={`Back to ${listFor(editing.kind)}`} size="sm" onClick={() => go(listFor(editing.kind))} />
          )}
          <h1 className="min-w-0 flex-1 truncate font-display text-lg font-semibold text-fg">{title}</h1>
          {!editing && (
            <Button size="sm" variant="primary" icon={FilePlus2} className="lg:hidden" onClick={() => startNew("invoice")}>
              New
            </Button>
          )}
        </header>

        <div className={cn("mx-auto w-full max-w-7xl flex-1 space-y-4 p-4 lg:p-6", editing ? "pb-4" : "pb-24 lg:pb-6")}>
          {data.storageError && (
            <div className="rounded-lg border border-border bg-warning-soft/50 px-4 py-3 text-sm">
              <StatusMessage tone="warning">{data.storageError}</StatusMessage>
            </div>
          )}
          {notice && (
            <div role="status" className="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm shadow-sm">
              <span className="min-w-0 flex-1">
                <StatusMessage tone={notice.tone}>{notice.text}</StatusMessage>
              </span>
              <IconButton icon={X} size="sm" label="Dismiss this message" onClick={() => setNotice(null)} />
            </div>
          )}

          {editing ? (
            <Editor
              key={editing.id}
              store={store}
              business={business}
              initial={editing}
              isNew={isNew}
              onSaved={(doc) => {
                if (editId !== doc.id) navigate({ search: `?edit=${doc.id}` }, { replace: true });
              }}
              onNew={startNew}
            />
          ) : showSettings ? (
            <>
              {needsProfile && <p className="text-sm text-fg-muted">Add your business details once; they appear on every document.</p>}
              <div className="overflow-clip rounded-xl border border-border bg-surface shadow-md">
                <BusinessForm
                  initial={business}
                  onSave={(b) => {
                    void store.saveBusiness(b);
                    if (!wantsEditor) notify("success", "Business details saved. New documents will use them.");
                  }}
                />
              </div>
              <Backup store={store} business={business} />
            </>
          ) : wantsEditor ? (
            <div className="space-y-3 rounded-xl border border-border bg-surface p-6 text-center shadow-md">
              <p className="text-fg-muted">This document is not saved in this browser. It may have been deleted.</p>
              <Button onClick={() => go("invoices")}>Back to invoices</Button>
            </div>
          ) : view === "invoices" || view === "quotations" ? (
            <Documents key={view} store={store} business={business} section={view} onOpen={open} onCopy={copy} onNew={startNew} notify={notify} />
          ) : view === "customers" ? (
            <Directory store={store} kind="parties" />
          ) : view === "items" ? (
            <Directory store={store} kind="products" />
          ) : (
            <Dashboard data={data} onOpen={open} onNew={startNew} onGo={go} />
          )}
        </div>
      </div>

      {!editing && (
        <nav aria-label="Invoice panel" className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-6 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden">
          {nav.map((n) => (
            <button
              key={n.id}
              type="button"
              aria-current={active === n.id ? "page" : undefined}
              onClick={() => go(n.id)}
              className={cn(
                "flex h-14 min-w-0 flex-col items-center justify-center gap-0.5 text-[0.6875rem] font-medium focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
                active === n.id ? "text-accent-fg" : "text-fg-muted",
              )}
            >
              <n.icon aria-hidden size={19} strokeWidth={active === n.id ? 2.25 : 1.75} />
              {n.short}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}

