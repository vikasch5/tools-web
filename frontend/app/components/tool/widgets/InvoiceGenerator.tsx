import { ArrowRight, Calculator, FileText, LayoutDashboard, ReceiptText, Users, type LucideIcon } from "lucide-react";
import { ButtonLink } from "~/components/ui/Button";
import type { WidgetProps } from "./index";

const features: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Calculator, title: "Tax worked out", text: "CGST + SGST or IGST, HSN summary and amount in words." },
  { icon: FileText, title: "Live A4 preview", text: "See the exact PDF as you type, with your logo and UPI QR." },
  { icon: ReceiptText, title: "Quotes to invoices", text: "Turn a quotation or proforma into an invoice in one click." },
  { icon: Users, title: "Track payments", text: "Saved customers and items, overdue invoices, CSV export." },
];

const kindNames: Record<string, string> = { invoice: "invoice", quotation: "quotation", proforma: "proforma invoice" };

/** Entry point on the public tool pages. The working panel is its own full-screen page. */
export function InvoiceGenerator({ preset }: WidgetProps) {
  const kind = typeof preset?.kind === "string" && preset.kind in kindNames ? preset.kind : "invoice";
  const gst = preset?.gst === "off" ? "&gst=off" : "";
  return (
    <section aria-label="Open the invoice panel" className="overflow-clip rounded-xl border border-border bg-surface shadow-md">
      <div className="border-b border-border p-5 sm:p-6">
        <h2 className="font-display text-xl font-semibold text-fg">Your free invoice panel</h2>
        <p className="mt-1 max-w-2xl text-fg-muted">No sign-up. Everything is saved in this browser on your device, and nothing you enter is uploaded.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <ButtonLink to={`/invoices?new=${kind}${gst}`} variant="primary" size="lg" icon={ArrowRight}>
            {`Create a ${kindNames[kind]}`}
          </ButtonLink>
          <ButtonLink to="/invoices" size="lg" icon={LayoutDashboard}>
            Open dashboard
          </ButtonLink>
        </div>
      </div>
      <ul className="grid gap-px bg-border sm:grid-cols-2">
        {features.map((f) => (
          <li key={f.title} className="flex gap-3 bg-surface p-4">
            <f.icon aria-hidden size={18} strokeWidth={1.75} className="mt-0.5 shrink-0 text-accent-fg" />
            <div>
              <p className="text-sm font-medium text-fg">{f.title}</p>
              <p className="text-sm text-fg-muted">{f.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
